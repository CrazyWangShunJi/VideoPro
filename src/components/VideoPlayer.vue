<template>
  <div class="video-player" ref="playerContainer">
    <video
      ref="videoElement"
      :src="streamUrl"
      :poster="posterUrl"
      controls
      preload="metadata"
      playsinline
      webkit-playsinline
      @loadstart="onLoadStart"
      @loadedmetadata="onLoadedMetadata"
      @loadeddata="onLoadedData"
      @canplay="onCanPlay"
      @canplaythrough="onCanPlayThrough"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @error="onError"
      @waiting="onWaiting"
      @playing="onPlaying"
      @timeupdate="onTimeUpdate"
      @progress="onProgress"
      @volumechange="onVolumeChange"
    >
      您的浏览器不支持视频播放
    </video>
    
    <!-- 自定义加载指示器 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>视频加载中...</span>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="hasError" class="error-overlay">
      <div class="error-content">
        <el-icon><Warning /></el-icon>
        <span>视频加载失败</span>
        <el-button size="small" @click="retryLoad">重试</el-button>
      </div>
    </div>
    
    <!-- 播放质量选择 -->
    <div v-if="showQualitySelector" class="quality-selector">
      <el-select v-model="selectedQuality" @change="changeQuality" size="small">
        <el-option label="自动" value="auto" />
        <el-option label="1080p" value="1080p" />
        <el-option label="720p" value="720p" />
        <el-option label="480p" value="480p" />
        <el-option label="360p" value="360p" />
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElIcon, ElButton, ElSelect, ElOption } from 'element-plus'
import { Loading, Warning } from '@element-plus/icons-vue'
import { apiService } from '../api'

// Props
interface Props {
  videoUrl: string
  posterUrl?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  width?: string | number
  height?: string | number
  enableQualitySelector?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false,
  muted: false,
  loop: false,
  width: '100%',
  height: 'auto',
  enableQualitySelector: false
})

// Emits
const emit = defineEmits<{
  loadstart: []
  loadedmetadata: [duration: number]
  canplay: []
  play: []
  pause: []
  ended: []
  error: [error: any]
  timeupdate: [currentTime: number, duration: number]
}>()

// 响应式数据
const videoElement = ref<HTMLVideoElement>()
const playerContainer = ref<HTMLDivElement>()
const isLoading = ref(true)
const hasError = ref(false)
const selectedQuality = ref('auto')
const showQualitySelector = ref(props.enableQualitySelector)

// 计算属性
const streamUrl = computed(() => {
  // 解析视频URL，优先使用流媒体接口
  const url = props.videoUrl
  if (url.includes('/assets/video/')) {
    const pathParts = url.split('/assets/video/')[1].split('/')
    if (pathParts.length >= 2) {
      const category = pathParts[0]
      const filename = pathParts[1]
      return apiService.getMediaUrl(`/api/stream/${category}/${filename}`)
    }
  }
  return apiService.getMediaUrl(url)
})

// 方法
const onLoadStart = () => {
  isLoading.value = true
  hasError.value = false
  emit('loadstart')
}

const onLoadedMetadata = () => {
  const video = videoElement.value
  if (video) {
    emit('loadedmetadata', video.duration)
  }
}

const onLoadedData = () => {
  isLoading.value = false
}

const onCanPlay = () => {
  isLoading.value = false
  emit('canplay')
}

const onCanPlayThrough = () => {
  isLoading.value = false
}

const onPlay = () => {
  emit('play')
}

const onPause = () => {
  emit('pause')
}

const onEnded = () => {
  emit('ended')
}

const onError = (event: Event) => {
  isLoading.value = false
  hasError.value = true
  console.error('视频播放错误:', event)
  emit('error', event)
}

const onWaiting = () => {
  isLoading.value = true
}

const onPlaying = () => {
  isLoading.value = false
}

const onTimeUpdate = () => {
  const video = videoElement.value
  if (video) {
    emit('timeupdate', video.currentTime, video.duration)
  }
}

const onProgress = () => {
  // 可以在这里处理缓冲进度
}

const onVolumeChange = () => {
  // 可以在这里处理音量变化
}

const retryLoad = () => {
  hasError.value = false
  isLoading.value = true
  if (videoElement.value) {
    videoElement.value.load()
  }
}

const changeQuality = (quality: string) => {
  // 这里可以实现质量切换逻辑
  console.log('切换视频质量:', quality)
  // 在实际应用中，这里需要根据质量设置不同的视频源
}

const play = () => {
  return videoElement.value?.play()
}

const pause = () => {
  videoElement.value?.pause()
}

const setCurrentTime = (time: number) => {
  if (videoElement.value) {
    videoElement.value.currentTime = time
  }
}

const setVolume = (volume: number) => {
  if (videoElement.value) {
    videoElement.value.volume = Math.max(0, Math.min(1, volume))
  }
}

// 暴露方法给父组件
defineExpose({
  play,
  pause,
  setCurrentTime,
  setVolume,
  videoElement
})

// 生命周期
onMounted(() => {
  // 设置视频元素的初始属性
  nextTick(() => {
    if (videoElement.value) {
      videoElement.value.muted = props.muted
      videoElement.value.loop = props.loop
      
      // 预加载优化
      videoElement.value.preload = 'metadata'
      
      // 移动端优化
      videoElement.value.setAttribute('playsinline', 'true')
      videoElement.value.setAttribute('webkit-playsinline', 'true')
      
      if (props.autoplay) {
        videoElement.value.autoplay = true
      }
    }
  })
})

onUnmounted(() => {
  // 清理资源
  if (videoElement.value) {
    videoElement.value.pause()
    videoElement.value.src = ''
    videoElement.value.load()
  }
})

// 监听URL变化
watch(() => props.videoUrl, () => {
  hasError.value = false
  isLoading.value = true
  if (videoElement.value) {
    videoElement.value.load()
  }
})
</script>

<style scoped lang="scss">
.video-player {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;

  video {
    width: 100%;
    height: 100%;
    display: block;
    outline: none;
    
    // 优化视频渲染
    object-fit: contain;
    
    // 硬件加速
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }

  .loading-overlay,
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    z-index: 10;
  }

  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    .el-icon {
      font-size: 2rem;
    }
  }

  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    .el-icon {
      font-size: 2rem;
      color: #f56c6c;
    }
  }

  .quality-selector {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 20;
  }

  // 移动端优化
  @media (max-width: 768px) {
    .quality-selector {
      top: 5px;
      right: 5px;
    }
  }
}

// 全屏模式优化
.video-player:fullscreen {
  video {
    object-fit: contain;
  }
}

.video-player:-webkit-full-screen {
  video {
    object-fit: contain;
  }
}

.video-player:-moz-full-screen {
  video {
    object-fit: contain;
  }
}
</style> 