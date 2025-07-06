<template>
  <div class="videos-gallery">
    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>
          <router-link to="/">首页</router-link>
        </el-breadcrumb-item>
        <el-breadcrumb-item>
          <router-link to="/videos">视频分类</router-link>
        </el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentCategory">
          {{ getCategoryName(currentCategory) }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="header">
      <h1>
        {{ currentCategory ? getCategoryName(currentCategory) : '所有视频' }}
      </h1>
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
        <el-button v-if="currentCategory" @click="goBack" type="default">
          返回分类
        </el-button>
      </div>
    </div>

    <div class="stats">
      <el-tag>总共 {{ videos.length }} 个视频</el-tag>
      <el-tag v-if="searchQuery" type="info">
        搜索结果: {{ filteredVideos.length }} 个
      </el-tag>
      <el-tag v-if="currentCategory" type="success">
        分类: {{ getCategoryName(currentCategory) }}
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
      <VideoCard
        v-for="video in filteredVideos"
        :key="video.id"
        :video="video"
        :show-info-button="true"
        :lazy-load="true"
        @play="playVideo"
        @download="downloadVideo"
        @info="showVideoInfo"
      />
    </div>

    <!-- 全屏视频播放器 -->
    <div 
      v-if="dialogVisible" 
      class="fullscreen-video-overlay"
      @click.self="closeVideoDialog"
    >
      <div class="fullscreen-video-container">
        <VideoPlayer
          v-if="currentVideo"
          :video-url="currentVideo.url"
          :category="currentVideo.category"
          :filename="currentVideo.name"
          :autoplay="true"
          :enable-quality-selector="true"
          :enable-auto-quality="true"
          @ended="closeVideoDialog"
          @qualityChanged="(quality) => console.log('质量已切换至:', quality)"
        />
        <!-- 关闭按钮 -->
        <button class="close-button" @click="closeVideoDialog">
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElInput, ElButton, ElTag, ElAlert, ElEmpty, ElIcon, ElBreadcrumb, ElBreadcrumbItem } from 'element-plus'
import { VideoPlay, Download, Search } from '@element-plus/icons-vue'
import { apiService, type MediaFile, formatFileSize, getFileExtension } from '../api'
import VideoPlayer from '../components/VideoPlayer.vue'
import VideoCard from '../components/VideoCard.vue'

// 路由
const router = useRouter()
const route = useRoute()

// Props
const props = defineProps<{
  category?: string
}>()

// 响应式数据
const videos = ref<MediaFile[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const dialogVisible = ref(false)
const currentVideo = ref<MediaFile | null>(null)
const currentCategory = ref<string | undefined>(props.category)

// 分类名称映射
const categoryNames = {
  'activity': '活动',
  'TVC': '宣传片',
  'short_video': '短视频'
}

// 计算属性
const filteredVideos = computed(() => {
  if (!searchQuery.value) return videos.value
  
  const query = searchQuery.value.toLowerCase()
  return videos.value.filter(video => 
    video.name.toLowerCase().includes(query)
  )
})

// 方法
const getCategoryName = (categoryId: string) => {
  return categoryNames[categoryId as keyof typeof categoryNames] || categoryId
}

const loadVideos = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (currentCategory.value) {
      // 加载特定分类的视频
      videos.value = await apiService.getVideosByCategory(currentCategory.value)
    } else {
      // 加载所有视频
      videos.value = await apiService.getVideos()
    }
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
  // 添加 ESC 键监听
  document.addEventListener('keydown', handleKeyDown)
}

const closeVideoDialog = () => {
  dialogVisible.value = false
  currentVideo.value = null
  // 移除 ESC 键监听
  document.removeEventListener('keydown', handleKeyDown)
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && dialogVisible.value) {
    closeVideoDialog()
  }
}

const downloadVideo = (video: MediaFile) => {
  const link = document.createElement('a')
  link.href = getVideoUrl(video.url)
  link.download = video.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const goBack = () => {
  router.push('/videos')
}

const onVideoLoaded = (video: MediaFile, duration?: number) => {
  console.log('视频加载完成', video.name, duration)
}

const onVideoError = (video: MediaFile, error?: any) => {
  console.error('视频加载失败', video.name, error)
}

const showVideoInfo = (video: MediaFile) => {
  console.log('显示视频详情:', video.name)
  // 这里可以实现显示视频详细信息的逻辑
}

// 监听路由参数变化
watch(() => route.params.category, (newCategory) => {
  currentCategory.value = newCategory as string | undefined
  loadVideos()
}, { immediate: false })

// 生命周期
onMounted(() => {
  currentCategory.value = route.params.category as string | undefined
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
  }

  .fullscreen-video-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #000;
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    
    // 确保视频控制条始终在最上层
    video {
      position: relative;
      z-index: 1;
    }
    
    // 防止任何元素遮挡控制条
    * {
      pointer-events: auto;
    }
  }

  .fullscreen-video-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 40px; // 为控制条预留空间
    box-sizing: border-box;

    :deep(video) {
      max-width: 100%;
      max-height: calc(100vh - 120px); // 为退出按钮和控制条留出空间
      width: auto;
      height: auto;
      object-fit: contain; // 保持宽高比，完整显示视频
      
      // 针对竖屏视频的特殊处理
      &[data-aspect-ratio="portrait"] {
        height: calc(100vh - 120px); // 为控制条预留更多空间
        width: auto;
        max-width: 100%;
        
        // 确保控制条不被遮挡
        &::-webkit-media-controls-panel {
          position: relative !important;
          bottom: 0 !important;
          background: rgba(0, 0, 0, 0.8) !important;
        }
      }
      
      // 针对横屏视频的特殊处理
      &[data-aspect-ratio="landscape"] {
        width: 100%;
        height: auto;
        max-height: calc(100vh - 120px);
      }
      
      // 正方形视频
      &[data-aspect-ratio="square"] {
        max-width: min(100vw, calc(100vh - 120px));
        max-height: min(100vw, calc(100vh - 120px));
        width: auto;
        height: auto;
      }
      
      // 通用控制条样式优化
      &::-webkit-media-controls {
        position: relative !important;
        bottom: 0 !important;
        z-index: 10001 !important;
      }
      
      &::-webkit-media-controls-panel {
        background: rgba(0, 0, 0, 0.8) !important;
        border-radius: 0 !important;
      }
      
      // Firefox 控制条样式
      &::-moz-media-controls {
        position: relative !important;
        bottom: 0 !important;
        z-index: 10001 !important;
        background: rgba(0, 0, 0, 0.8) !important;
      }
    }

    .close-button {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: background-color 0.3s;
      z-index: 10000;

      &:hover {
        background: rgba(0, 0, 0, 0.9);
      }
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

    // 移动端全屏视频优化
    .fullscreen-video-container {
      padding-bottom: 60px; // 移动端需要更多空间

      :deep(video) {
        max-height: calc(100vh - 140px); // 移动端预留更多空间

        &[data-aspect-ratio="portrait"] {
          height: calc(100vh - 140px);
          max-width: 90%; // 移动端竖屏视频稍微缩小一点
        }

        // 移动端控制条优化
        &::-webkit-media-controls-panel {
          height: 50px !important; // 确保控制条有足够高度
          background: rgba(0, 0, 0, 0.9) !important;
        }
      }

      .close-button {
        top: 10px;
        right: 10px;
        width: 35px;
        height: 35px;
        font-size: 20px;
      }
    }
  }
}
</style> 