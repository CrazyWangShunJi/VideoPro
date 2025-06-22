<template>
  <div class="video-categories">
    <div class="header">
      <h1>视频分类</h1>
      <p class="subtitle">选择您想要浏览的视频类型</p>
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
      <el-empty description="暂无视频分类">
        <el-button type="primary" @click="loadCategories">重新加载</el-button>
      </el-empty>
    </div>

    <div v-else class="categories-grid">
      <div 
        v-for="category in categories" 
        :key="category.id" 
        class="category-card"
        @click="goToCategory(category)"
      >
        <div class="category-cover">
          <div v-if="category.coverVideo" class="video-preview">
            <video
              :src="getVideoUrl(category.coverVideo.url)"
              :poster="getVideoPoster(category.coverVideo)"
              muted
              preload="metadata"
              @mouseenter="playPreview"
              @mouseleave="pausePreview"
            >
              您的浏览器不支持视频播放
            </video>
            <div class="video-overlay">
              <el-icon class="play-icon"><VideoPlay /></el-icon>
            </div>
          </div>
          <div v-else class="no-video-placeholder">
            <el-icon class="placeholder-icon"><VideoCamera /></el-icon>
            <span>暂无视频</span>
          </div>
        </div>
        
        <div class="category-info">
          <h3 class="category-title">{{ category.name }}</h3>
          <div class="category-stats">
            <el-tag size="small" type="info">
              {{ category.videoCount }} 个视频
            </el-tag>
          </div>
          <p class="category-description">
            {{ getCategoryDescription(category.id) }}
          </p>
        </div>

        <div class="category-actions">
          <el-button type="primary" @click.stop="goToCategory(category)">
            <el-icon><VideoPlay /></el-icon>
            浏览视频
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElTag, ElAlert, ElEmpty, ElIcon } from 'element-plus'
import { VideoPlay, VideoCamera } from '@element-plus/icons-vue'
import { apiService, type VideoCategory } from '../api'

// 路由
const router = useRouter()

// 响应式数据
const categories = ref<VideoCategory[]>([])
const loading = ref(false)
const error = ref('')

// 分类描述映射
const categoryDescriptions = {
  'activity': '记录精彩活动瞬间，展现活动现场的热烈氛围',
  'TVC': '专业制作的宣传片，传达品牌价值和企业形象',
  'short_video': '创意短视频内容，快速传达核心信息'
}

// 方法
const loadCategories = async () => {
  loading.value = true
  error.value = ''
  
  try {
    categories.value = await apiService.getVideoCategories()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载视频分类失败'
    console.error('加载视频分类失败:', err)
  } finally {
    loading.value = false
  }
}

const getVideoUrl = (url: string) => {
  return apiService.getMediaUrl(url)
}

const getVideoPoster = (video: { name: string; url: string }) => {
  // 这里可以实现视频封面的生成或获取逻辑
  return ''
}

const getCategoryDescription = (categoryId: string) => {
  return categoryDescriptions[categoryId as keyof typeof categoryDescriptions] || '精彩视频内容'
}

const goToCategory = (category: VideoCategory) => {
  router.push({
    name: 'videos-category',
    params: { category: category.id }
  })
}

const playPreview = (event: Event) => {
  const video = event.target as HTMLVideoElement
  if (video && video.tagName === 'VIDEO') {
    video.play().catch(() => {
      // 忽略自动播放失败的错误
    })
  }
}

const pausePreview = (event: Event) => {
  const video = event.target as HTMLVideoElement
  if (video && video.tagName === 'VIDEO') {
    video.pause()
    video.currentTime = 0
  }
}

// 生命周期
onMounted(() => {
  loadCategories()
})
</script>

<style scoped lang="scss">
.video-categories {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;

  .header {
    text-align: center;
    margin-bottom: 3rem;

    h1 {
      font-size: 2.5rem;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      font-size: 1.1rem;
      color: #7f8c8d;
      margin: 0;
    }
  }

  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  .category-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .category-cover {
      position: relative;
      height: 200px;
      overflow: hidden;

      .video-preview {
        position: relative;
        width: 100%;
        height: 100%;

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
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;

          .play-icon {
            font-size: 3rem;
            color: white;
          }
        }

        &:hover .video-overlay {
          opacity: 1;
        }
      }

      .no-video-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: #f5f7fa;
        color: #909399;

        .placeholder-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        span {
          font-size: 1rem;
        }
      }
    }

    .category-info {
      padding: 1.5rem;

      .category-title {
        font-size: 1.5rem;
        color: #2c3e50;
        margin: 0 0 1rem 0;
      }

      .category-stats {
        margin-bottom: 1rem;
      }

      .category-description {
        color: #7f8c8d;
        line-height: 1.6;
        margin: 0;
        font-size: 0.95rem;
      }
    }

    .category-actions {
      padding: 0 1.5rem 1.5rem;

      .el-button {
        width: 100%;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .video-categories {
    padding: 1rem;

    .header h1 {
      font-size: 2rem;
    }

    .categories-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .category-card .category-cover {
      height: 180px;
    }
  }
}
</style> 