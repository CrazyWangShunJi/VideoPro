<template>
  <div class="video-card" @click="$emit('play', video)">
    <div class="video-thumbnail">
      <!-- 视频缩略图 -->
      <img 
        v-if="thumbnailUrl" 
        :src="thumbnailUrl" 
        :alt="video.name"
        class="thumbnail-image"
        @error="onThumbnailError"
      />
      <!-- 默认占位符 -->
      <div v-else class="thumbnail-placeholder">
        <el-icon class="placeholder-icon"><VideoCamera /></el-icon>
        <span class="placeholder-text">{{ getFileExtension(video.name).toUpperCase() }}</span>
      </div>
      
      <!-- 播放按钮覆盖层 -->
      <div class="play-overlay">
        <el-icon class="play-icon"><VideoPlay /></el-icon>
      </div>
      
      <!-- 视频时长标签 -->
      <div v-if="duration" class="duration-badge">
        {{ formatDuration(duration) }}
      </div>
      
      <!-- 质量标签 -->
      <div v-if="availableQualities.length > 0" class="quality-badge">
        {{ getHighestQuality() }}
      </div>
    </div>
    
    <div class="video-info">
      <h3 class="video-title" :title="video.name">{{ video.name }}</h3>
      <div class="video-meta">
        <el-tag size="small" type="info">{{ formatFileSize(video.size) }}</el-tag>
        <el-tag v-if="video.categoryName" size="small" type="success">
          {{ video.categoryName }}
        </el-tag>
        <el-tag v-if="optimizedSize" size="small" type="warning">
          优化: {{ formatFileSize(optimizedSize) }}
        </el-tag>
      </div>
      <div class="video-actions" @click.stop>
        <el-button size="small" @click="$emit('play', video)" type="primary">
          <el-icon><VideoPlay /></el-icon>
          播放
        </el-button>
        <el-button size="small" @click="$emit('download', video)">
          <el-icon><Download /></el-icon>
          下载
        </el-button>
        <el-button size="small" @click="showVideoInfo" v-if="showInfoButton">
          <el-icon><InfoFilled /></el-icon>
          详情
        </el-button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElIcon, ElButton, ElTag } from 'element-plus'
import { VideoPlay, Download, VideoCamera, InfoFilled, Loading } from '@element-plus/icons-vue'
import { apiService, type MediaFile, formatFileSize, getFileExtension } from '../api'

// Props
interface Props {
  video: MediaFile
  showInfoButton?: boolean
  lazyLoad?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showInfoButton: false,
  lazyLoad: true
})

// Emits
const emit = defineEmits<{
  play: [video: MediaFile]
  download: [video: MediaFile]
  info: [video: MediaFile]
}>()

// 响应式数据
const loading = ref(false)
const thumbnailUrl = ref<string>('')
const duration = ref<number>(0)
const availableQualities = ref<string[]>([])
const optimizedSize = ref<number>(0)
const thumbnailError = ref(false)

// 计算属性
const videoInfo = computed(() => {
  return {
    category: props.video.category,
    filename: props.video.name
  }
})

// 方法
const loadVideoInfo = async () => {
  if (!props.video.category || loading.value) return
  
  loading.value = true
  try {
    const info = await apiService.getVideoInfo(props.video.category, props.video.name)
    
    // 设置缩略图URL
    if (info.thumbnailUrl) {
      thumbnailUrl.value = apiService.getMediaUrl(info.thumbnailUrl)
    }
    
    // 设置可用质量
    if (info.availableQualities) {
      availableQualities.value = info.availableQualities
    }
    
    // 计算优化后的文件大小（选择最小的优化版本）
    if (info.optimizedUrls && Object.keys(info.optimizedUrls).length > 0) {
      // 这里可以根据需要选择特定质量的大小，暂时使用原始大小的估算
      const compressionRatio = 0.3 // 假设压缩率为70%
      optimizedSize.value = Math.round(props.video.size * compressionRatio)
    }
    
  } catch (error) {
    console.warn('获取视频信息失败:', error)
    // 失败时使用默认值
  } finally {
    loading.value = false
  }
}

const onThumbnailError = () => {
  thumbnailError.value = true
  thumbnailUrl.value = ''
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getHighestQuality = (): string => {
  if (availableQualities.value.includes('1080p')) return '1080P'
  if (availableQualities.value.includes('720p')) return '720P'
  if (availableQualities.value.includes('480p')) return '480P'
  return 'SD'
}

const showVideoInfo = () => {
  emit('info', props.video)
}

// 生命周期
onMounted(() => {
  if (!props.lazyLoad) {
    loadVideoInfo()
  }
})

// 暴露方法给父组件
defineExpose({
  loadVideoInfo
})
</script>

<style scoped lang="scss">
.video-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

    .play-overlay {
      opacity: 1;
    }

    .thumbnail-image {
      transform: scale(1.05);
    }
  }

  .video-thumbnail {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: #f5f5f5;

    .thumbnail-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .thumbnail-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;

      .placeholder-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }

      .placeholder-text {
        font-size: 1rem;
        font-weight: bold;
      }
    }

    .play-overlay {
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

      .play-icon {
        font-size: 4rem;
        color: white;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }
    }

    .duration-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
    }

    .quality-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #409eff;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
    }
  }

  .video-info {
    padding: 1rem;

    .video-title {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      color: #2c3e50;
      font-weight: 600;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .video-meta {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .video-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;

      .el-button {
        flex: 1;
        min-width: 0;
      }
    }
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;

    .el-icon {
      font-size: 2rem;
      color: #409eff;
    }
  }
}

@media (max-width: 768px) {
  .video-card {
    .video-thumbnail {
      height: 160px;
    }

    .video-info {
      padding: 0.75rem;

      .video-actions {
        .el-button {
          font-size: 0.75rem;
          padding: 4px 8px;
        }
      }
    }
  }
}
</style> 