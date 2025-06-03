<template>
  <div class="videos-gallery">
    <div class="header">
      <h1>视频集合</h1>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索视频..."
          prefix-icon="Search"
          class="search-input"
        />
        <el-button @click="loadVideos" :loading="loading" type="primary">
          刷新
        </el-button>
      </div>
    </div>

    <div class="stats">
      <el-tag>总共 {{ videos.length }} 个视频</el-tag>
      <el-tag v-if="searchQuery" type="info">
        搜索结果: {{ filteredVideos.length }} 个
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

    <div v-else-if="videos.length === 0" class="empty-container">
      <el-empty description="暂无视频">
        <el-button type="primary" @click="loadVideos">重新加载</el-button>
      </el-empty>
    </div>

    <div v-else class="video-grid">
      <div v-for="video in filteredVideos" :key="video.id" class="video-item">
        <div class="video-container">
          <video
            :src="getVideoUrl(video.url)"
            :poster="getVideoPoster(video)"
            controls
            preload="metadata"
            @loadedmetadata="onVideoLoaded"
            @error="onVideoError"
          >
            您的浏览器不支持视频播放
          </video>
          <div class="video-overlay" @click="playVideo(video)">
            <el-icon class="play-icon"><VideoPlay /></el-icon>
          </div>
        </div>
        <div class="video-info">
          <h3>{{ video.name }}</h3>
          <div class="video-meta">
            <el-tag size="small">{{ formatFileSize(video.size) }}</el-tag>
            <el-tag size="small" type="info">{{ getFileExtension(video.name).toUpperCase() }}</el-tag>
          </div>
          <div class="video-actions">
            <el-button size="small" @click="playVideo(video)" type="primary">
              <el-icon><VideoPlay /></el-icon>
              播放
            </el-button>
            <el-button size="small" @click="downloadVideo(video)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频播放对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="currentVideo?.name"
      width="80%"
      top="5vh"
      @close="closeVideoDialog"
    >
      <div class="video-dialog-container">
        <video
          v-if="currentVideo"
          :src="getVideoUrl(currentVideo.url)"
          controls
          autoplay
          width="100%"
          @ended="closeVideoDialog"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElInput, ElButton, ElTag, ElAlert, ElEmpty, ElIcon, ElDialog } from 'element-plus'
import { VideoPlay, Download, Search } from '@element-plus/icons-vue'
import { apiService, type MediaFile, formatFileSize, getFileExtension } from '../api'

// 响应式数据
const videos = ref<MediaFile[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const dialogVisible = ref(false)
const currentVideo = ref<MediaFile | null>(null)

// 计算属性
const filteredVideos = computed(() => {
  if (!searchQuery.value) return videos.value
  
  const query = searchQuery.value.toLowerCase()
  return videos.value.filter(video => 
    video.name.toLowerCase().includes(query)
  )
})

// 方法
const loadVideos = async () => {
  loading.value = true
  error.value = ''
  
  try {
    videos.value = await apiService.getVideos()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载视频失败'
    console.error('加载视频失败:', err)
  } finally {
    loading.value = false
  }
}

const getVideoUrl = (url: string) => {
  return apiService.getMediaUrl(url)
}

const getVideoPoster = (video: MediaFile) => {
  // 这里可以实现视频封面的生成或获取逻辑
  return ''
}

const playVideo = (video: MediaFile) => {
  currentVideo.value = video
  dialogVisible.value = true
}

const closeVideoDialog = () => {
  dialogVisible.value = false
  currentVideo.value = null
}

const downloadVideo = (video: MediaFile) => {
  const link = document.createElement('a')
  link.href = getVideoUrl(video.url)
  link.download = video.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const onVideoLoaded = (event: Event) => {
  console.log('视频加载完成', event)
}

const onVideoError = (event: Event) => {
  console.error('视频加载失败', event)
}

// 生命周期
onMounted(() => {
  loadVideos()
})
</script>

<style scoped lang="scss">
.videos-gallery {
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

  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;

    .video-item {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

        .video-overlay {
          opacity: 1;
        }
      }

      .video-container {
        position: relative;
        width: 100%;
        height: 240px;
        background: #000;
        border-radius: 12px 12px 0 0;
        overflow: hidden;

        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          cursor: pointer;

          .play-icon {
            font-size: 4rem;
            color: white;
          }
        }
      }

      .video-info {
        padding: 1.5rem;

        h3 {
          margin: 0 0 1rem;
          font-size: 1.1rem;
          color: #2c3e50;
          word-break: break-word;
        }

        .video-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .video-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      }
    }
  }

  .video-dialog-container {
    text-align: center;

    video {
      max-height: 70vh;
      border-radius: 8px;
    }
  }
}

@media (max-width: 768px) {
  .videos-gallery {
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

    .video-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;

      .video-item {
        .video-container {
          height: 200px;
        }

        .video-info {
          padding: 1rem;

          .video-actions {
            .el-button {
              flex: 1;
            }
          }
        }
      }
    }
  }
}

// Element Plus 对话框样式覆盖
:deep(.el-dialog) {
  .el-dialog__body {
    padding: 1rem;
  }
}
</style> 