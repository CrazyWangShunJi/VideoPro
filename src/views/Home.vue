<template>
  <div class="home">
    <div class="hero">
      <h1>欢迎来到VisionPro</h1>
      <p>发掘独一无二的视觉作品集</p>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-number">{{ mediaStats.photos }}</span>
          <span class="stat-label">张照片</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ mediaStats.videos }}</span>
          <span class="stat-label">个视频</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ mediaStats.total }}</span>
          <span class="stat-label">总文件数</span>
        </div>
      </div>
    </div>
    
    <div class="categories">
      <router-link to="/images" class="category">
        <el-card class="photo-card" shadow="hover">
          <div class="card-content">
            <el-icon class="card-icon"><Picture /></el-icon>
            <h2>图片合集</h2>
            <p>浏览我们的精美图集，感受视觉之美</p>
            <el-tag>{{ mediaStats.photos }} 张图片</el-tag>
          </div>
        </el-card>
      </router-link>
      
      <router-link to="/videos" class="category">
        <el-card class="video-card" shadow="hover">
          <div class="card-content">
            <el-icon class="card-icon"><VideoPlay /></el-icon>
            <h2>视频合集</h2>
            <p>观看我们的精选视频，体验动态魅力</p>
            <el-tag>{{ mediaStats.videos }} 个视频</el-tag>
          </div>
        </el-card>
      </router-link>
    </div>

    <!-- 最新内容展示 -->
    <div class="recent-content" v-if="recentMedia.length > 0">
      <h2>最新内容</h2>
      <div class="recent-grid">
        <div 
          v-for="(item, index) in recentMedia.slice(0, 6)" 
          :key="item.id" 
          class="recent-item"
          @click="handleMediaClick(item, index)"
        >
          <div class="media-preview" @click.stop="handleMediaClick(item, index)">
            <el-image 
              v-if="item.type === 'image'"
              :src="getMediaUrl(item.url)"
              :alt="item.name"
              fit="cover"
              loading="lazy"
            >
              <template #placeholder>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-if="item.type === 'image'" class="image-overlay">
              <el-icon><ZoomIn /></el-icon>
            </div>
            <div v-else class="video-preview">
              <video :src="getMediaUrl(item.url)" preload="metadata" muted>
                您的浏览器不支持视频播放
              </video>
              <div class="video-overlay">
                <el-icon><VideoPlay /></el-icon>
              </div>
            </div>
          </div>
          <div class="media-info">
            <h4>{{ item.name }}</h4>
            <div class="media-meta">
              <el-tag size="small" :type="item.type === 'image' ? 'success' : 'primary'">
                {{ item.type === 'image' ? '图片' : '视频' }}
              </el-tag>
              <span class="file-size">{{ formatFileSize(item.size) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="view-more">
        <el-button type="primary" @click="$router.push('/images')">查看所有图片</el-button>
        <el-button type="primary" @click="$router.push('/videos')">查看所有视频</el-button>
      </div>
    </div>

    <!-- 全屏图片查看器 -->
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="recentImageUrls"
      :initial-index="currentImageIndex"
      @close="closeImageViewer"
      :zoom-rate="1.2"
      :max-scale="7"
      :min-scale="0.2"
    />

    <!-- 功能特性 -->
    <div class="features">
      <h2>平台特性</h2>
      <div class="features-grid">
        <div class="feature-item">
          <el-icon class="feature-icon"><View /></el-icon>
          <h3>高清预览</h3>
          <p>支持多种格式的高清图片和视频预览</p>
        </div>
        <div class="feature-item">
          <el-icon class="feature-icon"><Search /></el-icon>
          <h3>智能搜索</h3>
          <p>快速搜索并找到您需要的媒体文件</p>
        </div>
        <div class="feature-item">
          <el-icon class="feature-icon"><Download /></el-icon>
          <h3>便捷下载</h3>
          <p>一键下载原始文件到本地设备</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElCard, ElIcon, ElTag, ElImage, ElButton, ElImageViewer } from 'element-plus'
import { Picture, VideoPlay, View, Search, Download, ZoomIn } from '@element-plus/icons-vue'
import { apiService, type MediaFile, formatFileSize } from '../api'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const mediaStats = reactive({
  photos: 0,
  videos: 0,
  total: 0
})
const recentMedia = ref<MediaFile[]>([])
const showImageViewer = ref(false)
const currentImageIndex = ref(0)
const recentImageUrls = ref<string[]>([])

// 方法
const loadMediaStats = async () => {
  try {
    const [categories, videos] = await Promise.all([
      apiService.getPhotoCategories(),
      apiService.getVideos()
    ])
    
    // 计算总图片数量
    const totalPhotos = categories.reduce((total, category) => total + category.photoCount, 0)
    
    mediaStats.photos = totalPhotos
    mediaStats.videos = videos.length
    mediaStats.total = totalPhotos + videos.length
    
    // 获取最新媒体文件（从分类中获取图片）
    const allPhotos = []
    for (const category of categories) {
      try {
        const categoryPhotos = await apiService.getPhotosByCategory(category.id)
        allPhotos.push(...categoryPhotos)
      } catch (error) {
        console.error(`获取分类 ${category.name} 的图片失败:`, error)
      }
    }
    
    const allMedia = [...allPhotos, ...videos].sort(() => Math.random() - 0.5)
    recentMedia.value = allMedia.slice(0, 8)
  } catch (error) {
    console.error('加载媒体统计信息失败:', error)
  }
}

const getMediaUrl = (url: string) => {
  return apiService.getMediaUrl(url)
}

const viewMedia = (item: MediaFile) => {
  if (item.type === 'image' && item.category) {
    router.push(`/images/${item.category}`)
  } else if (item.type === 'image') {
    router.push('/images')
  } else {
    router.push('/videos')
  }
}

const handleMediaClick = (item: MediaFile, index: number) => {
  if (item.type === 'image') {
    currentImageIndex.value = 0
    recentImageUrls.value = [getMediaUrl(item.url)]
    showImageViewer.value = true
  } else {
    viewMedia(item)
  }
}

const closeImageViewer = () => {
  showImageViewer.value = false
}

// 生命周期
onMounted(() => {
  loadMediaStats()
})
</script>

<style scoped lang="scss">
.home {
  .hero {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1;
    }
    
    > * {
      position: relative;
      z-index: 2;
    }
    
    h1 {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }
    
    p {
      font-size: 1.5rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .hero-stats {
      display: flex;
      gap: 3rem;
      margin-top: 2rem;

      .stat-item {
        text-align: center;

        .stat-number {
          display: block;
          font-size: 2.5rem;
          font-weight: bold;
          color: #fff;
        }

        .stat-label {
          display: block;
          font-size: 1rem;
          opacity: 0.8;
          margin-top: 0.5rem;
        }
      }
    }
  }
  
  .categories {
    padding: 4rem 2rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 3rem;
    max-width: 1200px;
    margin: 0 auto;
    
    .category {
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-8px);
      }
      
      .el-card {
        height: 100%;
        border-radius: 16px;
        border: none;
        overflow: hidden;
        
        :deep(.el-card__body) {
          padding: 0;
        }
      }

      .card-content {
        padding: 3rem 2rem;
        text-align: center;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        .card-icon {
          font-size: 4rem;
          color: #409EFF;
          margin-bottom: 1.5rem;
        }

        h2 {
          margin: 0 0 1rem;
          color: #2c3e50;
          font-size: 1.8rem;
        }

        p {
          margin: 0 0 1.5rem;
          color: #666;
          font-size: 1rem;
          line-height: 1.6;
        }
      }

      .photo-card .card-content {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
      }

      .video-card .card-content {
        background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
      }
    }
  }

  .recent-content {
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;

    h2 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 3rem;
      font-size: 2.5rem;
    }

    .recent-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;

      .recent-item {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
        cursor: pointer;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .media-preview {
          position: relative;
          height: 150px;
          overflow: hidden;

          &:hover .video-overlay,
          &:hover .image-overlay {
            opacity: 1;
          }

          .el-image {
            width: 100%;
            height: 100%;
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

            .el-icon {
              font-size: 2rem;
              color: white;
              background: rgba(0, 0, 0, 0.6);
              border-radius: 50%;
              padding: 0.5rem;
            }
          }

          .image-placeholder {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            background: #f5f7fa;
            color: #909399;

            .el-icon {
              font-size: 2rem;
            }
          }

          .video-preview {
            position: relative;
            width: 100%;
            height: 100%;
            background: #000;

            video {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .video-overlay {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: white;
              font-size: 2rem;
              background: rgba(0, 0, 0, 0.6);
              border-radius: 50%;
              padding: 0.5rem;
              opacity: 0.8;
              transition: opacity 0.3s ease;
            }
          }
        }

        .media-info {
          padding: 1rem;

          h4 {
            margin: 0 0 0.5rem;
            font-size: 0.9rem;
            color: #2c3e50;
            word-break: break-word;
          }

          .media-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;

            .file-size {
              color: #909399;
            }
          }
        }
      }
    }

    .view-more {
      text-align: center;
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
  }

  .features {
    background: #f8f9fa;
    padding: 4rem 2rem;

    h2 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 3rem;
      font-size: 2.5rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      max-width: 1000px;
      margin: 0 auto;

      .feature-item {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        .feature-icon {
          font-size: 3rem;
          color: #409EFF;
          margin-bottom: 1rem;
        }

        h3 {
          margin: 0 0 1rem;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        p {
          margin: 0;
          color: #666;
          line-height: 1.6;
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
  .home {
    .hero {
      min-height: 50vh;
      padding: 2rem 1rem;

      h1 {
        font-size: 2.5rem;
      }

      p {
        font-size: 1.2rem;
      }

      .hero-stats {
        flex-direction: column;
        gap: 1rem;

        .stat-item {
          .stat-number {
            font-size: 2rem;
          }
        }
      }
    }

    .categories {
      padding: 2rem 1rem;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .recent-content {
      padding: 2rem 1rem;

      .recent-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
      }

      .view-more {
        flex-direction: column;
        align-items: center;
      }
    }

    .features {
      padding: 2rem 1rem;

      .features-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }
  }
}
</style> 