<template>
  <div :class="playerClasses" ref="playerContainer">
    <video
      ref="videoElement"
      :src="currentVideoUrl"
      :poster="posterUrl"
      :data-aspect-ratio="videoOrientation"
      controls
      :preload="preloadStrategy"
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
        <div class="loading-progress" v-if="loadingProgress > 0">
          <el-progress :percentage="loadingProgress" :show-text="false" />
          <span class="progress-text">{{ loadingProgress.toFixed(1) }}%</span>
        </div>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="hasError" class="error-overlay">
      <div class="error-content">
        <el-icon><Warning /></el-icon>
        <span>视频加载失败</span>
        <el-button size="small" @click="retryLoad">重试</el-button>
        <el-button size="small" @click="tryLowerQuality" v-if="canDowngrade">
          尝试低画质
        </el-button>
      </div>
    </div>
    
    <!-- 播放质量选择 -->
    <div v-if="showQualitySelector && availableQualities.length > 0" class="quality-selector">
      <el-select v-model="selectedQuality" @change="changeQuality" size="small">
        <el-option label="240P 流畅" value="240p" />
        <el-option label="360P 清晰" value="360p" />
        <el-option label="480P 标清" value="480p" />
        <el-option label="720P 高清" value="720p" />
        <el-option label="自动选择" value="auto" />
      </el-select>
    </div>

    <!-- 网络状态指示器 -->
    <div v-if="showNetworkStatus" class="network-status" :class="networkStatusClass">
      <el-icon><Connection /></el-icon>
      <span>{{ networkStatusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElIcon, ElButton, ElSelect, ElOption, ElProgress } from 'element-plus'
import { Loading, Warning, Connection } from '@element-plus/icons-vue'
import { apiService } from '../api'
import { 
  NETWORK_CONFIG, 
  DEFAULT_PLAYER_CONFIG, 
  NETWORK_DETECTION_CONFIG,
  getRecommendedQuality,
  calculateBufferSize 
} from '../config/video'

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
  enableAutoQuality?: boolean
  category?: string
  filename?: string
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false,
  muted: false,
  loop: false,
  width: '100%',
  height: 'auto',
  enableQualitySelector: true,
  enableAutoQuality: true
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
  qualityChanged: [quality: string]
}>()

// 响应式数据
const videoElement = ref<HTMLVideoElement>()
const playerContainer = ref<HTMLDivElement>()
const isLoading = ref(true)
const hasError = ref(false)
const selectedQuality = ref('360p') // 默认使用240p，更稳定
const availableQualities = ref<string[]>([])
const showQualitySelector = ref(props.enableQualitySelector)
const loadingProgress = ref(0)
const networkSpeed = ref(0)
const showNetworkStatus = ref(false)
const retryCount = ref(0)
const maxRetries = DEFAULT_PLAYER_CONFIG.maxRetries
const videoAspectRatio = ref<number>(16/9) // 默认16:9比例
const isVerticalVideo = ref(false) // 是否为竖屏视频

// 网络状态
const networkStatus = ref<'fast' | 'medium' | 'slow' | 'offline'>('medium')

// 计算属性
const currentVideoUrl = computed(() => {
  if (!props.category || !props.filename) {
    return apiService.getMediaUrl(props.videoUrl)
  }

  // 根据选择的质量和网络状况决定使用哪个视频
  let targetQuality = selectedQuality.value
  
  if (targetQuality === 'auto') {
    targetQuality = getAutoQuality()
  }

  console.log(`🎬 选择的质量: ${selectedQuality.value}, 目标质量: ${targetQuality}`)

  // 优先使用优化版本，如果存在的话
  if (targetQuality && targetQuality !== 'auto') {
    const optimizedUrl = `/api/optimized/${props.category}/${props.filename}?quality=${targetQuality}`
    console.log(`🎯 使用优化视频: ${optimizedUrl}`)
    return apiService.getMediaUrl(optimizedUrl)
  }

  // 回退到流媒体接口
  const streamUrl = `/api/stream/${props.category}/${props.filename}`
  console.log(`🔄 回退到流媒体: ${streamUrl}`)
  return apiService.getMediaUrl(streamUrl)
})

const preloadStrategy = computed(() => {
  // 根据网络状况调整预加载策略
  switch (networkStatus.value) {
    case 'fast':
      return 'auto'
    case 'medium':
      return 'metadata'
    case 'slow':
      return 'none'
    default:
      return 'metadata'
  }
})

const canDowngrade = computed(() => {
  const qualityOrder = ['720p', '480p', '360p', '240p']
  const currentIndex = qualityOrder.indexOf(selectedQuality.value)
  return currentIndex < qualityOrder.length - 1 || selectedQuality.value !== '240p'
})

const networkStatusClass = computed(() => {
  return `network-${networkStatus.value}`
})

const networkStatusText = computed(() => {
  const statusMap = {
    fast: '网络良好',
    medium: '网络一般',
    slow: '网络较慢',
    offline: '网络断开'
  }
  return statusMap[networkStatus.value]
})

// 视频方向检测
const videoOrientation = computed(() => {
  if (videoAspectRatio.value > 1.2) {
    return 'landscape' // 横屏
  } else if (videoAspectRatio.value < 0.8) {
    return 'portrait'  // 竖屏
  } else {
    return 'square'    // 正方形
  }
})

const playerClasses = computed(() => {
  return {
    'video-player': true,
    'vertical-video': isVerticalVideo.value,
    'horizontal-video': !isVerticalVideo.value
  }
})

// 方法
const getAutoQuality = () => {
  const validNetworkStatus = networkStatus.value === 'offline' ? 'slow' : networkStatus.value
  return getRecommendedQuality(validNetworkStatus, availableQualities.value)
}

const detectNetworkSpeed = async () => {
  try {
    const startTime = Date.now()
    const response = await fetch(apiService.getMediaUrl(NETWORK_DETECTION_CONFIG.testUrl), {
      cache: 'no-cache'
    })
    const endTime = Date.now()
    const duration = endTime - startTime
    
    const thresholds = NETWORK_DETECTION_CONFIG.thresholds
    if (duration < thresholds.fast) {
      networkStatus.value = 'fast'
    } else if (duration < thresholds.medium) {
      networkStatus.value = 'medium'
    } else {
      networkStatus.value = 'slow'
    }
    
    console.log(`网络检测: ${duration}ms, 状态: ${networkStatus.value}`)
  } catch (error) {
    networkStatus.value = 'offline'
    console.error('网络检测失败:', error)
  }
}

const loadAvailableQualities = async () => {
  if (!props.category || !props.filename) {
    return
  }

  try {
    const videoInfo = await apiService.getVideoInfo(props.category, props.filename)
    if (videoInfo.availableQualities) {
      availableQualities.value = videoInfo.availableQualities
    }
  } catch (error) {
    console.warn('获取视频质量信息失败:', error)
    // 设置默认质量选项
    availableQualities.value = ['480p', '720p', '1080p']
  }
}

const onLoadStart = () => {
  isLoading.value = true
  hasError.value = false
  emit('loadstart')
}

const onLoadedMetadata = () => {
  const video = videoElement.value
  if (video) {
    // 检测视频宽高比
    videoAspectRatio.value = video.videoWidth / video.videoHeight
    isVerticalVideo.value = videoAspectRatio.value < 1 // 宽高比小于1表示竖屏视频
    
    console.log(`📹 视频信息: ${video.videoWidth}x${video.videoHeight}, 宽高比: ${videoAspectRatio.value.toFixed(2)}, 方向: ${videoOrientation.value}`)
    
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
  const video = videoElement.value
  if (video && video.buffered.length > 0) {
    const bufferedEnd = video.buffered.end(video.buffered.length - 1)
    const duration = video.duration
    if (duration > 0) {
      loadingProgress.value = (bufferedEnd / duration) * 100
    }
  }
}

const onVolumeChange = () => {
  // 可以在这里处理音量变化
}

const retryLoad = () => {
  if (retryCount.value >= maxRetries) {
    console.log('已达到最大重试次数')
    return
  }
  
  retryCount.value++
  hasError.value = false
  isLoading.value = true
  loadingProgress.value = 0
  
  console.log(`重试加载视频 (${retryCount.value}/${maxRetries})`)
  
  if (videoElement.value) {
    videoElement.value.load()
  }
}

const changeQuality = async (quality: string) => {
  console.log('切换视频质量:', quality)
  
  const currentTime = videoElement.value?.currentTime || 0
  const wasPlaying = videoElement.value && !videoElement.value.paused
  
  // 切换质量
  selectedQuality.value = quality
  
  // 等待视频加载
  await nextTick()
  
  // 恢复播放位置
  if (videoElement.value) {
    videoElement.value.currentTime = currentTime
    if (wasPlaying) {
      videoElement.value.play()
    }
  }
  
  emit('qualityChanged', quality)
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

const tryLowerQuality = () => {
  const qualityOrder = ['720p', '480p', '360p', '240p']
  const currentIndex = qualityOrder.indexOf(selectedQuality.value)
  let targetQuality = '240p' // 默认最低质量
  
  if (currentIndex >= 0 && currentIndex < qualityOrder.length - 1) {
    // 选择下一个更低的质量
    targetQuality = qualityOrder[currentIndex + 1]
  } else if (selectedQuality.value !== '240p') {
    targetQuality = '240p'
  }
  
  console.log(`尝试低画质: ${selectedQuality.value} -> ${targetQuality}`)
  changeQuality(targetQuality)
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
onMounted(async () => {
  // 加载可用质量选项
  await loadAvailableQualities()
  
  // 初始化网络检测
  await detectNetworkSpeed()
  
  // 确保默认质量为360p（更适合网络播放）
  if (!selectedQuality.value || selectedQuality.value === 'auto') {
    selectedQuality.value = '360p'
  }
  
  console.log(`🎯 初始化质量设置: ${selectedQuality.value}`)
  
  // 设置视频元素的初始属性
  nextTick(() => {
    if (videoElement.value) {
      videoElement.value.muted = props.muted
      videoElement.value.loop = props.loop
      
      // 移动端优化
      videoElement.value.setAttribute('playsinline', 'true')
      videoElement.value.setAttribute('webkit-playsinline', 'true')
      
      if (props.autoplay) {
        videoElement.value.autoplay = true
      }
    }
  })
  
  // 定期检测网络状态
  const networkCheckInterval = setInterval(detectNetworkSpeed, DEFAULT_PLAYER_CONFIG.networkCheckInterval)
  
  onUnmounted(() => {
    clearInterval(networkCheckInterval)
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
  display: flex;
  justify-content: center;
  align-items: center;

  video {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    display: block;
    outline: none;
    
    // 保持视频原始宽高比，不拉伸
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

  // 竖屏视频特殊样式
  &.vertical-video {
    width: auto;
    height: 80vh; // 设置固定高度
    max-width: 45vh; // 9:16比例，45vh对应80vh的高度
    margin: 0 auto; // 居中显示
    
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  
  &.horizontal-video {
    width: 100%;
    height: auto;
    
    video {
      width: 100%;
      height: auto;
      max-height: 70vh; // 限制最大高度
    }
  }

  // 移动端优化
  @media (max-width: 768px) {
    .quality-selector {
      top: 5px;
      right: 5px;
    }
    
    // 移动端竖屏视频适配
    &.vertical-video {
      width: 100vw;
      height: 70vh; // 设置固定高度
      max-width: 39.375vh; // 9:16比例对应70vh
      
      video {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }
}

// 全屏模式优化
.video-player:fullscreen {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  max-width: 100vw;
  max-height: 100vh;
  
  video {
    max-width: 100vw;
    max-height: 100vh;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  
  // 全屏模式下的竖屏视频
  &.vertical-video {
    width: 56.25vh; // 9:16比例的宽度
    height: 100vh;
    
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  
  // 全屏模式下的横屏视频  
  &.horizontal-video {
    width: 100vw;
    height: 100vh;
    
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

.video-player:-webkit-full-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  max-width: 100vw;
  max-height: 100vh;
  
  video {
    max-width: 100vw;
    max-height: 100vh;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  
  // 全屏模式下的竖屏视频
  &.vertical-video {
    width: 56.25vh; // 9:16比例的宽度
    height: 100vh;
    
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  
  // 全屏模式下的横屏视频  
  &.horizontal-video {
    width: 100vw;
    height: 100vh;
    
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

.video-player:-moz-full-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  max-width: 100vw;
  max-height: 100vh;
  
  video {
    max-width: 100vw;
    max-height: 100vh;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  
  // 全屏模式下的竖屏视频
  &.vertical-video {
    width: 56.25vh; // 9:16比例的宽度
    height: 100vh;
    
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  
  // 全屏模式下的横屏视频  
  &.horizontal-video {
    width: 100vw;
    height: 100vh;
    
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}

.network-status {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
  padding: 5px 10px;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 5px;

  .el-icon {
    font-size: 1.5rem;
  }

  span {
    color: white;
    font-size: 1rem;
  }

  &.network-fast {
    background-color: #409EFF;
  }

  &.network-medium {
    background-color: #E6A23C;
  }

  &.network-slow {
    background-color: #F56C6C;
  }

  &.network-offline {
    background-color: #909399;
  }
}
</style> 