<template>
  <div class="images-gallery">
    <!-- 分类视图 -->
    <div v-if="!currentCategory" class="categories-view">
      <div class="header">
        <h1>图片分类</h1>
        <div class="header-actions">
          <el-button @click="loadCategories" :loading="loading" type="primary">
            刷新
          </el-button>
        </div>
      </div>

      <div class="stats">
        <el-tag>共 {{ categories.length }} 个分类</el-tag>
        <el-tag type="info">总计 {{ totalPhotos }} 张图片</el-tag>
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

      <div v-else-if="categories.length === 0" class="empty-container">
        <el-empty description="暂无分类">
          <el-button type="primary" @click="loadCategories">重新加载</el-button>
        </el-empty>
      </div>

      <div v-else class="categories-grid">
        <div 
          v-for="category in categories" 
          :key="category.id" 
          class="category-item"
          @click="navigateToCategory(category)"
        >
          <div class="category-cover">
            <el-image 
              v-if="category.coverImage"
              :src="getCoverUrl(category.coverImage.url)"
              :alt="category.name"
              fit="cover"
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
            <div v-else class="empty-cover">
              <el-icon><Picture /></el-icon>
              <span>暂无图片</span>
            </div>
            <div class="category-overlay">
              <div class="category-info">
                <h3>{{ category.name }}</h3>
                <p>{{ category.photoCount }} 张图片</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分类详情视图 -->
    <div v-else class="category-detail-view">
      <div class="header">
        <div class="breadcrumb">
          <router-link to="/images" class="back-link">
            <el-button 
              type="text" 
              :icon="ArrowLeft"
              size="large"
            >
              返回分类
            </el-button>
          </router-link>
          <span class="separator">/</span>
          <h1>{{ currentCategory.name }}</h1>
        </div>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索图片..."
            prefix-icon="Search"
            class="search-input"
          />
          <el-button @click="loadCategoryPhotos" :loading="photosLoading" type="primary">
            刷新
          </el-button>
        </div>
      </div>

      <div class="stats">
        <el-tag>{{ currentCategory.name }} - 共 {{ photos.length }} 张图片</el-tag>
        <el-tag v-if="searchQuery" type="info">
          搜索结果: {{ filteredPhotos.length }} 张
        </el-tag>
      </div>

      <div v-if="photosLoading" class="loading-container">
        <el-loading-directive>
          <div style="height: 200px;">加载中...</div>
        </el-loading-directive>
      </div>

      <div v-else-if="photoError" class="error-container">
        <el-alert
          title="加载失败"
          :description="photoError"
          type="error"
          show-icon
          @close="photoError = ''"
        />
      </div>

      <div v-else-if="photos.length === 0" class="empty-container">
        <el-empty description="该分类暂无图片">
          <el-button type="primary" @click="loadCategoryPhotos">重新加载</el-button>
        </el-empty>
      </div>

      <div v-else class="image-grid">
        <div v-for="(photo, index) in filteredPhotos" :key="photo.id" class="image-item">
          <div class="image-container" @click="openImageViewer(index)">
            <el-image
              :src="getPhotoUrl(photo.url)"
              :alt="photo.name"
              fit="cover"
              loading="lazy"
              class="clickable-image"
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
            <div class="image-overlay">
              <el-icon class="view-icon"><ZoomIn /></el-icon>
            </div>
          </div>
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

    <!-- 全屏图片查看器 -->
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="imageViewerUrls"
      :initial-index="currentImageIndex"
      @close="closeImageViewer"
      :zoom-rate="1.2"
      :max-scale="7"
      :min-scale="0.2"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElImage, ElInput, ElButton, ElTag, ElAlert, ElEmpty, ElIcon, ElImageViewer } from 'element-plus'
import { Picture, Search, ArrowLeft, ZoomIn } from '@element-plus/icons-vue'
import { apiService, type MediaFile, type PhotoCategory, formatFileSize, getFileExtension } from '../api'

// 路由相关
const route = useRoute()
const router = useRouter()

// Props（从路由参数接收）
const props = defineProps<{
  category?: string
}>()

// 响应式数据
const categories = ref<PhotoCategory[]>([])
const photos = ref<MediaFile[]>([])
const currentCategory = ref<PhotoCategory | null>(null)
const loading = ref(false)
const photosLoading = ref(false)
const error = ref('')
const photoError = ref('')
const searchQuery = ref('')

// 图片查看器相关
const showImageViewer = ref(false)
const currentImageIndex = ref(0)

// 计算属性
const totalPhotos = computed(() => {
  return categories.value.reduce((total, category) => total + category.photoCount, 0)
})

const filteredPhotos = computed(() => {
  if (!searchQuery.value) return photos.value
  
  const query = searchQuery.value.toLowerCase()
  return photos.value.filter(photo => 
    photo.name.toLowerCase().includes(query)
  )
})

const imageViewerUrls = computed(() => 
  filteredPhotos.value.map(photo => getPhotoUrl(photo.url))
)

// 方法
const loadCategories = async () => {
  loading.value = true
  error.value = ''
  
  try {
    categories.value = await apiService.getPhotoCategories()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载分类失败'
    console.error('加载分类失败:', err)
  } finally {
    loading.value = false
  }
}

const navigateToCategory = (category: PhotoCategory) => {
  router.push(`/images/${category.id}`)
}

const loadCategoryPhotos = async () => {
  if (!currentCategory.value) return
  
  photosLoading.value = true
  photoError.value = ''
  
  try {
    photos.value = await apiService.getPhotosByCategory(currentCategory.value.id)
  } catch (err) {
    photoError.value = err instanceof Error ? err.message : '加载图片失败'
    console.error('加载图片失败:', err)
  } finally {
    photosLoading.value = false
  }
}

const findCategoryById = (categoryId: string): PhotoCategory | undefined => {
  return categories.value.find(cat => cat.id === categoryId)
}

const handleRouteChange = async () => {
  const categoryParam = props.category || route.params.category as string
  
  if (categoryParam) {
    // 如果分类还没加载，先加载分类
    if (categories.value.length === 0) {
      await loadCategories()
    }
    
    const category = findCategoryById(categoryParam)
    if (category) {
      currentCategory.value = category
      searchQuery.value = ''
      loadCategoryPhotos()
    } else {
      // 分类不存在，跳转回分类列表
      router.push('/images')
    }
  } else {
    currentCategory.value = null
    photos.value = []
    searchQuery.value = ''
    photoError.value = ''
  }
}

const getCoverUrl = (url: string) => {
  return apiService.getMediaUrl(url)
}

const getPhotoUrl = (url: string) => {
  return apiService.getMediaUrl(url)
}

// 图片查看器方法
const openImageViewer = (index: number) => {
  currentImageIndex.value = index
  showImageViewer.value = true
}

const closeImageViewer = () => {
  showImageViewer.value = false
  currentImageIndex.value = 0
}

// 监听路由变化
watch(() => route.params.category, handleRouteChange, { immediate: true })

// 生命周期
onMounted(async () => {
  await loadCategories()
  // 初始化时处理路由
  handleRouteChange()
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

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 1rem;

      .back-link {
        text-decoration: none;
        color: inherit;
      }

      .separator {
        color: #909399;
        font-size: 1.2rem;
      }

      h1 {
        margin: 0;
      }
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

  // 分类网格样式
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;

    .category-item {
      cursor: pointer;
      transition: transform 0.3s ease;

      &:hover {
        transform: translateY(-4px);
      }

      .category-cover {
        position: relative;
        height: 240px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

        .el-image {
          width: 100%;
          height: 100%;
        }

        .empty-cover {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #f5f7fa;
          color: #909399;

          .el-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          span {
            font-size: 1rem;
          }
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

        .category-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
          padding: 2rem 1.5rem 1.5rem;
          color: white;

          .category-info {
            h3 {
              margin: 0 0 0.5rem;
              font-size: 1.5rem;
              font-weight: 600;
            }

            p {
              margin: 0;
              font-size: 1rem;
              opacity: 0.9;
            }
          }
        }
      }
    }
  }

  // 图片网格样式
  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;

    .image-item {
      position: relative;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

        .image-overlay {
          opacity: 1;
        }
      }
      
      .image-container {
        position: relative;
        width: 100%;
        height: 300px;
        border-radius: 12px 12px 0 0;
        overflow: hidden;
        cursor: pointer;

        .clickable-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
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

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1;

          .view-icon {
            font-size: 3rem;
            color: white;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 50%;
            padding: 1rem;
          }
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

// 全屏图片查看器样式覆盖
:deep(.el-image-viewer__mask) {
  background-color: rgba(0, 0, 0, 0.9);
}

:deep(.el-image-viewer__btn) {
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
}

:deep(.el-image-viewer__close) {
  font-size: 1.5rem;
}

:deep(.el-image-viewer__prev),
:deep(.el-image-viewer__next) {
  font-size: 1.5rem;
}

@media (max-width: 768px) {
  .images-gallery {
    padding: 1rem;

    .header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;

      .breadcrumb {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;

        .separator {
          display: none;
        }
      }

      .header-actions {
        flex-direction: column;

        .search-input {
          width: 100%;
        }
      }
    }

    .categories-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;

      .category-item .category-cover {
        height: 200px;
      }
    }

    .image-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
  }
}
</style> 