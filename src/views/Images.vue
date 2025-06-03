<template>
  <div class="images-gallery">
    <div class="header">
      <h1>图片集合</h1>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索图片..."
          prefix-icon="Search"
          class="search-input"
        />
        <el-button @click="loadPhotos" :loading="loading" type="primary">
          刷新
        </el-button>
      </div>
    </div>

    <div class="stats">
      <el-tag>总共 {{ photos.length }} 张图片</el-tag>
      <el-tag v-if="searchQuery" type="info">
        搜索结果: {{ filteredPhotos.length }} 张
      </el-tag>
    </div>

    <div v-if="loading" class="loading-container">
      <el-loading-directive>
        <div style="height: 200px;">加载中...</div>
      </el-loading-directive>
    </div>

    <div v-else-if="error" class="error-container">
      <el-alert
        title="加载失败"
        :description="error"
        type="error"
        show-icon
        @close="error = ''"
      />
    </div>

    <div v-else-if="photos.length === 0" class="empty-container">
      <el-empty description="暂无图片">
        <el-button type="primary" @click="loadPhotos">重新加载</el-button>
      </el-empty>
    </div>

    <div v-else class="image-grid">
      <div v-for="photo in filteredPhotos" :key="photo.id" class="image-item">
        <el-image
          :src="getPhotoUrl(photo.url)"
          :alt="photo.name"
          fit="cover"
          loading="lazy"
          :preview-src-list="previewList"
          :initial-index="getPhotoIndex(photo.id)"
        >
          <template #placeholder>
            <div class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
          <template #error>
            <div class="image-error">
              <el-icon><Picture /></el-icon>
              <span>加载失败</span>
            </div>
          </template>
        </el-image>
        <div class="image-info">
          <h3>{{ photo.name }}</h3>
          <div class="image-meta">
            <el-tag size="small">{{ formatFileSize(photo.size) }}</el-tag>
            <el-tag size="small" type="info">{{ getFileExtension(photo.name).toUpperCase() }}</el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElImage, ElInput, ElButton, ElTag, ElAlert, ElEmpty, ElIcon } from 'element-plus'
import { Picture, Search } from '@element-plus/icons-vue'
import { apiService, type MediaFile, formatFileSize, getFileExtension } from '../api'

// 响应式数据
const photos = ref<MediaFile[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')

// 计算属性
const filteredPhotos = computed(() => {
  if (!searchQuery.value) return photos.value
  
  const query = searchQuery.value.toLowerCase()
  return photos.value.filter(photo => 
    photo.name.toLowerCase().includes(query)
  )
})

const previewList = computed(() => 
  filteredPhotos.value.map(photo => getPhotoUrl(photo.url))
)

// 方法
const loadPhotos = async () => {
  loading.value = true
  error.value = ''
  
  try {
    photos.value = await apiService.getPhotos()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载照片失败'
    console.error('加载照片失败:', err)
  } finally {
    loading.value = false
  }
}

const getPhotoUrl = (url: string) => {
  return apiService.getMediaUrl(url)
}

const getPhotoIndex = (photoId: string) => {
  return filteredPhotos.value.findIndex(photo => photo.id === photoId)
}

// 生命周期
onMounted(() => {
  loadPhotos()
})
</script>

<style scoped lang="scss">
.images-gallery {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    h1 {
      margin: 0;
      color: #2c3e50;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;

      .search-input {
        width: 300px;
      }
    }
  }

  .stats {
    margin-bottom: 2rem;
    display: flex;
    gap: 1rem;
  }

  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;

    .image-item {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }
      
      .el-image {
        width: 100%;
        height: 300px;
        border-radius: 12px 12px 0 0;
      }

      .image-placeholder,
      .image-error {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        background: #f8f9fa;
        color: #6c757d;
        
        .el-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        span {
          font-size: 0.9rem;
        }
      }

      .image-info {
        padding: 1.5rem;

        h3 {
          margin: 0 0 1rem;
          font-size: 1.1rem;
          color: #2c3e50;
          word-break: break-word;
        }

        .image-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .images-gallery {
    padding: 1rem;

    .header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;

      .header-actions {
        flex-direction: column;

        .search-input {
          width: 100%;
        }
      }
    }

    .image-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
  }
}
</style> 