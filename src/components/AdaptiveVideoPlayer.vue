<template>
  <div class="adaptive-video-player" ref="playerContainer">
    <!-- 主视频播放器 -->
    <video
      ref="videoElement"
      :src="currentVideoUrl"
      :poster="posterUrl"
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
      @stalled="onStalled"
      @suspend="onSuspend"
    >
      您的浏览器不支持视频播放
    </video>
    
    <!-- 智能加载指示器 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <el-icon class="is-loading"><Loading /></el-icon>
        <div class="loading-info">
          <span class="loading-text">{{ loadingText }}</span>
          <div class="loading-progress" v-if="loadingProgress > 0">
            <el-progress :percentage="loadingProgress" :show-text="false" />
            <span class="progress-text">{{ loadingProgress.toFixed(1) }}%</span>
          </div>
          <div class="network-info" v-if="networkInfo">
            <span class="network-speed">{{ networkInfo.speed }}</span>
            <span class="network-quality">{{ networkInfo.quality }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 错误提示和自动修复 -->
    <div v-if="hasError" class="error-overlay">
      <div class="error-content">
        <el-icon><Warning /></el-icon>
        <span class="error-message">{{ errorMessage }}</span>
        <div class="error-actions">
          <el-button size="small" @click="retryLoad" :loading="isRetrying">
            重试 ({{ retryCount }}/{{ maxRetries }})
          </el-button>
          <el-button size="small" @click="tryLowerQuality" v-if="canDowngrade">
            降低画质
          </el-button>
          <el-button size="small" @click="forceReload">
            强制刷新
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 智能质量控制 -->
    <div v-if="showControls" class="video-controls">
      <div class="quality-control">
        <el-select 
          v-model="selectedQuality" 
          @change="changeQuality" 
          size="small"
          :disabled="isChangingQuality"
        >
          <el-option label="自动选择" value="auto" />
          <el-option 
            v-for="quality in availableQualities" 
            :key="quality"
            :label="getQualityLabel(quality)" 
            :value="quality" 
          />
        </el-select>
        <span class="current-quality" v-if="currentQuality">
          {{ getQualityLabel(currentQuality) }}
        </span>
      </div>
      
      <div class="network-indicator" :class="networkStatusClass">
        <el-icon><Connection /></el-icon>
        <span>{{ networkStatusText }}</span>
        <span class="speed-indicator" v-if="networkSpeed > 0">
          {{ formatSpeed(networkSpeed) }}
        </span>
      </div>
      
      <div class="adaptive-status" v-if="adaptiveMode">
        <el-icon><Magic /></el-icon>
        <span>智能适配</span>
      </div>
    </div>
    
    <!-- 缓冲健康度指示器 -->
    <div v-if="showBufferHealth" class="buffer-health" :class="bufferHealthClass">
      <div class="buffer-bar">
        <div class="buffer-fill" :style="{ width: bufferHealthPercentage + '%' }"></div>
      </div>
      <span class="buffer-text">缓冲: {{ bufferHealth.toFixed(1) }}s</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElIcon, ElButton, ElSelect, ElOption, ElProgress } from 'element-plus'
import { Loading, Warning, Connection, Magic } from '@element-plus/icons-vue'
import { apiService } from '../api'

// Props
interface Props {
  videoUrl: string
  posterUrl?: string
  category?: string
  filename?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  adaptiveMode?: boolean
  showControls?: boolean
  showBufferHealth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false,
  muted: false,
  loop: false,
  adaptiveMode: true,
  showControls: true,
  showBufferHealth: true
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
  networkChanged: [networkStatus: string]
}>()

// 响应式数据
const videoElement = ref<HTMLVideoElement>()
const playerContainer = ref<HTMLDivElement>()
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const selectedQuality = ref('auto')
const currentQuality = ref('480p')
const availableQualities = ref<string[]>(['240p', '360p', '480p', '720p'])
const loadingProgress = ref(0)
const networkSpeed = ref(0)
const networkStatus = ref<'fast' | 'medium' | 'slow' | 'offline'>('medium')
const retryCount = ref(0)
const maxRetries = 3
const isRetrying = ref(false)
const isChangingQuality = ref(false)
const bufferHealth = ref(0)
const networkInfo = ref<any>(null)
const loadingText = ref('视频加载中...')

// 自适应监控
const adaptiveMonitor = ref<NodeJS.Timeout>()
const networkMonitor = ref<NodeJS.Timeout>()
const stallCount = ref(0)
const lastStallTime = ref(0)

// 计算属性
const currentVideoUrl = computed(() => {
  if (!props.category || !props.filename) {
    return apiService.getMediaUrl(props.videoUrl)
  }

  let targetQuality = selectedQuality.value
  
  if (targetQuality === 'auto') {
    targetQuality = getAutoQuality()
  }

  console.log(`🎬 自适应播放器 - 选择质量: ${targetQuality}, 网络: ${networkStatus.value}`)

  // 优先使用优化版本
  if (targetQuality && targetQuality !== 'auto') {
    const optimizedUrl = `/api/optimized/${props.category}/${props.filename}?quality=${targetQuality}`
    return apiService.getMediaUrl(optimizedUrl)
  }

  // 回退到流媒体接口
  const streamUrl = `/api/stream/${props.category}/${props.filename}?quality=${targetQuality || '480p'}`
  return apiService.getMediaUrl(streamUrl)
})

const preloadStrategy = computed(() => {
  switch (networkStatus.value) {
    case 'fast':
      return 'metadata'
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
  const currentIndex = qualityOrder.indexOf(currentQuality.value)
  return currentIndex < qualityOrder.length - 1
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

const bufferHealthClass = computed(() => {
  if (bufferHealth.value > 10) return 'buffer-healthy'
  if (bufferHealth.value > 5) return 'buffer-medium'
  if (bufferHealth.value > 2) return 'buffer-low'
  return 'buffer-critical'
})

const bufferHealthPercentage = computed(() => {
  return Math.min(100, (bufferHealth.value / 10) * 100)
})

// 方法
const getAutoQuality = () => {
  // 根据网络状况和历史性能选择质量
  const networkQualityMap = {
    'fast': '480p',
    'medium': '360p',
    'slow': '240p',
    'offline': '240p'
  }
  
  let recommendedQuality = networkQualityMap[networkStatus.value]
  
  // 如果最近有卡顿，降低质量
  if (stallCount.value > 2) {
    const qualityOrder = ['720p', '480p', '360p', '240p']
    const currentIndex = qualityOrder.indexOf(recommendedQuality)
    if (currentIndex < qualityOrder.length - 1) {
      recommendedQuality = qualityOrder[currentIndex + 1]
    }
  }
  
  return recommendedQuality
}

const detectNetworkQuality = async () => {
  try {
    loadingText.value = '检测网络状况...'
    const startTime = Date.now()
    const response = await fetch(apiService.getMediaUrl('/api/network-quality'), {
      cache: 'no-cache'
    })
    const endTime = Date.now()
    const duration = endTime - startTime
    
    if (response.ok) {
      const data = await response.json()
      networkStatus.value = data.networkSpeed || 'medium'
      networkSpeed.value = 1000 / duration // 简单的速度估算
      networkInfo.value = {
        speed: `${duration}ms`,
        quality: data.networkSpeed
      }
      
      if (props.adaptiveMode && selectedQuality.value === 'auto') {
        const newQuality = data.recommendedQuality || getAutoQuality()
        if (newQuality !== currentQuality.value) {
          console.log(`🔄 自适应切换质量: ${currentQuality.value} -> ${newQuality}`)
          await changeQuality(newQuality, false)
        }
      }
    }
  } catch (error) {
    console.warn('网络检测失败:', error)
    networkStatus.value = 'offline'
  }
}

const loadAvailableQualities = async () => {
  if (!props.category || !props.filename) return

  try {
    const videoInfo = await apiService.getVideoInfo(props.category, props.filename)
    if (videoInfo.availableQualities) {
      availableQualities.value = videoInfo.availableQualities
    }
  } catch (error) {
    console.warn('获取视频质量信息失败:', error)
  }
}

const changeQuality = async (quality: string, userInitiated = true) => {
  if (isChangingQuality.value) return
  
  isChangingQuality.value = true
  loadingText.value = `切换到${getQualityLabel(quality)}...`
  
  try {
    const currentTime = videoElement.value?.currentTime || 0
    const wasPlaying = videoElement.value && !videoElement.value.paused
    
    // 更新质量
    if (userInitiated) {
      selectedQuality.value = quality
    }
    currentQuality.value = quality === 'auto' ? getAutoQuality() : quality
    
    // 等待视频加载
    await nextTick()
    
    // 恢复播放位置
    if (videoElement.value) {
      videoElement.value.currentTime = currentTime
      if (wasPlaying) {
        await videoElement.value.play()
      }
    }
    
    emit('qualityChanged', quality)
  } catch (error) {
    console.error('切换质量失败:', error)
  } finally {
    isChangingQuality.value = false
  }
}

const retryLoad = async () => {
  if (retryCount.value >= maxRetries || isRetrying.value) return
  
  isRetrying.value = true
  retryCount.value++
  hasError.value = false
  loadingText.value = `重试加载 (${retryCount.value}/${maxRetries})...`
  
  try {
    if (videoElement.value) {
      videoElement.value.load()
    }
  } catch (error) {
    console.error('重试失败:', error)
  } finally {
    setTimeout(() => {
      isRetrying.value = false
    }, 2000)
  }
}

const tryLowerQuality = async () => {
  if (!canDowngrade.value) return
  
  const qualityOrder = ['720p', '480p', '360p', '240p']
  const currentIndex = qualityOrder.indexOf(currentQuality.value)
  const lowerQuality = qualityOrder[currentIndex + 1]
  
  console.log(`📉 降低画质: ${currentQuality.value} -> ${lowerQuality}`)
  await changeQuality(lowerQuality)
}

const forceReload = () => {
  retryCount.value = 0
  hasError.value = false
  stallCount.value = 0
  if (videoElement.value) {
    videoElement.value.load()
  }
}

const getQualityLabel = (quality: string) => {
  const labels = {
    '240p': '流畅 240P',
    '360p': '清晰 360P', 
    '480p': '标清 480P',
    '720p': '高清 720P',
    'auto': '自动选择'
  }
  return labels[quality as keyof typeof labels] || quality
}

const formatSpeed = (speed: number) => {
  if (speed > 1000) {
    return `${(speed / 1000).toFixed(1)}MB/s`
  }
  return `${speed.toFixed(0)}KB/s`
}

const updateBufferHealth = () => {
  const video = videoElement.value
  if (!video || !video.buffered.length) return
  
  const currentTime = video.currentTime
  const buffered = video.buffered
  
  // 计算当前位置后的缓冲时长
  let bufferEnd = 0
  for (let i = 0; i < buffered.length; i++) {
    if (buffered.start(i) <= currentTime && buffered.end(i) > currentTime) {
      bufferEnd = buffered.end(i)
      break
    }
  }
  
  bufferHealth.value = Math.max(0, bufferEnd - currentTime)
}

const startAdaptiveMonitoring = () => {
  // 每5秒检查一次播放状况
  adaptiveMonitor.value = setInterval(() => {
    updateBufferHealth()
    
    // 如果缓冲健康度过低且处于自动模式，考虑降低质量
    if (props.adaptiveMode && selectedQuality.value === 'auto' && bufferHealth.value < 2) {
      tryLowerQuality()
    }
  }, 5000)
  
  // 每30秒检查一次网络状况
  networkMonitor.value = setInterval(() => {
    detectNetworkQuality()
  }, 30000)
}

const stopAdaptiveMonitoring = () => {
  if (adaptiveMonitor.value) {
    clearInterval(adaptiveMonitor.value)
  }
  if (networkMonitor.value) {
    clearInterval(networkMonitor.value)
  }
}

// 事件处理
const onLoadStart = () => {
  isLoading.value = true
  hasError.value = false
  loadingText.value = '开始加载视频...'
  emit('loadstart')
}

const onLoadedMetadata = () => {
  const video = videoElement.value
  if (video) {
    loadingText.value = '视频信息已加载...'
    emit('loadedmetadata', video.duration)
  }
}

const onLoadedData = () => {
  isLoading.value = false
  loadingText.value = '视频数据已加载'
}

const onCanPlay = () => {
  isLoading.value = false
  emit('canplay')
}

const onCanPlayThrough = () => {
  isLoading.value = false
  retryCount.value = 0 // 重置重试计数
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
  errorMessage.value = '视频加载失败，请检查网络连接'
  
  console.error('视频播放错误:', event)
  emit('error', event)
  
  // 自动重试
  if (retryCount.value < maxRetries) {
    setTimeout(() => {
      retryLoad()
    }, 2000)
  }
}

const onWaiting = () => {
  isLoading.value = true
  loadingText.value = '缓冲中...'
}

const onPlaying = () => {
  isLoading.value = false
}

const onStalled = () => {
  stallCount.value++
  lastStallTime.value = Date.now()
  loadingText.value = '网络卡顿，正在缓冲...'
  
  console.warn(`🐌 视频卡顿 (第${stallCount.value}次)`)
  
  // 如果卡顿过于频繁，自动降低质量
  if (stallCount.value > 3 && props.adaptiveMode) {
    tryLowerQuality()
  }
}

const onSuspend = () => {
  console.log('视频加载暂停')
}

const onTimeUpdate = () => {
  const video = videoElement.value
  if (video) {
    updateBufferHealth()
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

// 生命周期
onMounted(async () => {
  await detectNetworkQuality()
  await loadAvailableQualities()
  
  if (props.adaptiveMode) {
    startAdaptiveMonitoring()
  }
})

onUnmounted(() => {
  stopAdaptiveMonitoring()
})

// 监听器
watch(() => props.adaptiveMode, (newValue) => {
  if (newValue) {
    startAdaptiveMonitoring()
  } else {
    stopAdaptiveMonitoring()
  }
})

// 暴露方法
defineExpose({
  play: () => videoElement.value?.play(),
  pause: () => videoElement.value?.pause(),
  setCurrentTime: (time: number) => {
    if (videoElement.value) {
      videoElement.value.currentTime = time
    }
  },
  changeQuality,
  retryLoad,
  getNetworkStatus: () => networkStatus.value,
  getBufferHealth: () => bufferHealth.value
})
</script>

<style scoped lang="scss">
.adaptive-video-player {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;

  video {
    width: 100%;
    height: auto;
    display: block;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;

    .loading-spinner {
      text-align: center;
      color: white;

      .loading-info {
        margin-top: 16px;

        .loading-text {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .loading-progress {
          margin: 8px 0;
          
          .progress-text {
            margin-left: 8px;
            font-size: 12px;
            opacity: 0.8;
          }
        }

        .network-info {
          font-size: 12px;
          opacity: 0.7;
          
          .network-speed {
            margin-right: 8px;
          }
        }
      }
    }
  }

  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;

    .error-content {
      text-align: center;
      color: white;
      padding: 24px;

      .error-message {
        display: block;
        margin: 16px 0;
        font-size: 14px;
      }

      .error-actions {
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
      }
    }
  }

  .video-controls {
    position: absolute;
    bottom: 8px;
    right: 8px;
    display: flex;
    gap: 12px;
    align-items: center;
    background: rgba(0, 0, 0, 0.7);
    padding: 8px 12px;
    border-radius: 6px;
    color: white;
    font-size: 12px;

    .quality-control {
      display: flex;
      align-items: center;
      gap: 8px;

      .current-quality {
        font-weight: 500;
      }
    }

    .network-indicator {
      display: flex;
      align-items: center;
      gap: 4px;

      &.network-fast {
        color: #67c23a;
      }

      &.network-medium {
        color: #e6a23c;
      }

      &.network-slow {
        color: #f56c6c;
      }

      &.network-offline {
        color: #909399;
      }

      .speed-indicator {
        font-weight: 500;
      }
    }

    .adaptive-status {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #409eff;
      font-weight: 500;
    }
  }

  .buffer-health {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;

    .buffer-bar {
      height: 100%;
      position: relative;

      .buffer-fill {
        height: 100%;
        transition: width 0.3s ease;
      }
    }

    .buffer-text {
      position: absolute;
      top: 6px;
      left: 0;
      font-size: 10px;
      color: white;
      background: rgba(0, 0, 0, 0.5);
      padding: 2px 6px;
      border-radius: 3px;
    }

    &.buffer-healthy .buffer-fill {
      background: #67c23a;
    }

    &.buffer-medium .buffer-fill {
      background: #e6a23c;
    }

    &.buffer-low .buffer-fill {
      background: #f56c6c;
    }

    &.buffer-critical .buffer-fill {
      background: #f56c6c;
      animation: pulse 1s infinite;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style> 