<template>
  <div class="enhanced-video-player">
    <video
      ref="videoElement"
      :src="currentVideoUrl"
      :poster="posterUrl"
      controls
      :preload="preloadStrategy"
      playsinline
      webkit-playsinline
      @loadstart="onLoadStart"
      @canplay="onCanPlay"
      @error="onError"
      @waiting="onWaiting"
      @playing="onPlaying"
      @stalled="onStalled"
      @progress="onProgress"
    >
      您的浏览器不支持视频播放
    </video>
    
    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-overlay">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>{{ loadingText }}</span>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="hasError" class="error-overlay">
      <el-icon><Warning /></el-icon>
      <span>{{ errorMessage }}</span>
      <el-button size="small" @click="retryLoad">重试</el-button>
      <el-button size="small" @click="tryLowerQuality" v-if="canDowngrade">
        降低画质
      </el-button>
    </div>
    
    <!-- 质量控制 -->
    <div class="quality-controls">
      <el-select v-model="selectedQuality" @change="changeQuality" size="small">
        <el-option label="自动" value="auto" />
        <el-option label="240P" value="240p" />
        <el-option label="360P" value="360p" />
        <el-option label="480P" value="480p" />
      </el-select>
      <span class="network-status" :class="networkStatusClass">
        {{ networkStatusText }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElIcon, ElButton, ElSelect, ElOption } from 'element-plus'
import { Loading, Warning } from '@element-plus/icons-vue'
import { apiService } from '../api'

interface Props {
  videoUrl: string
  posterUrl?: string
  category?: string
  filename?: string
}

const props = defineProps<Props>()

const videoElement = ref<HTMLVideoElement>()
const isLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const selectedQuality = ref('auto')
const networkStatus = ref<'fast' | 'medium' | 'slow'>('medium')
const loadingText = ref('加载中...')
const stallCount = ref(0)

const currentVideoUrl = computed(() => {
  if (!props.category || !props.filename) {
    return apiService.getMediaUrl(props.videoUrl)
  }

  let quality = selectedQuality.value
  if (quality === 'auto') {
    quality = getAutoQuality()
  }

  return apiService.getMediaUrl(`/api/stream/${props.category}/${props.filename}?quality=${quality}`)
})

const preloadStrategy = computed(() => {
  return networkStatus.value === 'slow' ? 'none' : 'metadata'
})

const canDowngrade = computed(() => {
  const qualities = ['480p', '360p', '240p']
  const currentIndex = qualities.indexOf(selectedQuality.value)
  return currentIndex < qualities.length - 1
})

const networkStatusClass = computed(() => `network-${networkStatus.value}`)

const networkStatusText = computed(() => {
  const texts = {
    fast: '网络良好',
    medium: '网络一般',
    slow: '网络较慢'
  }
  return texts[networkStatus.value]
})

const getAutoQuality = () => {
  const qualityMap = {
    fast: '480p',
    medium: '360p', 
    slow: '240p'
  }
  return stallCount.value > 2 ? '240p' : qualityMap[networkStatus.value]
}

const detectNetwork = async () => {
  try {
    const start = Date.now()
    await fetch(apiService.getMediaUrl('/api/health'))
    const duration = Date.now() - start
    
    if (duration < 200) networkStatus.value = 'fast'
    else if (duration < 500) networkStatus.value = 'medium'
    else networkStatus.value = 'slow'
  } catch {
    networkStatus.value = 'slow'
  }
}

const changeQuality = (quality: string) => {
  const currentTime = videoElement.value?.currentTime || 0
  const wasPlaying = !videoElement.value?.paused
  
  selectedQuality.value = quality
  
  setTimeout(() => {
    if (videoElement.value) {
      videoElement.value.currentTime = currentTime
      if (wasPlaying) videoElement.value.play()
    }
  }, 100)
}

const retryLoad = () => {
  hasError.value = false
  if (videoElement.value) {
    videoElement.value.load()
  }
}

const tryLowerQuality = () => {
  const qualities = ['480p', '360p', '240p']
  const currentIndex = qualities.indexOf(selectedQuality.value)
  if (currentIndex < qualities.length - 1) {
    changeQuality(qualities[currentIndex + 1])
  }
}

const onLoadStart = () => {
  isLoading.value = true
  hasError.value = false
}

const onCanPlay = () => {
  isLoading.value = false
}

const onError = () => {
  isLoading.value = false
  hasError.value = true
  errorMessage.value = '视频加载失败'
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
  if (stallCount.value > 3 && selectedQuality.value === 'auto') {
    tryLowerQuality()
  }
}

const onProgress = () => {
  // 处理进度更新
}

onMounted(() => {
  detectNetwork()
})
</script>

<style scoped>
.enhanced-video-player {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

video {
  width: 100%;
  height: auto;
}

.loading-overlay, .error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  gap: 12px;
}

.quality-controls {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-size: 12px;
}

.network-status {
  &.network-fast { color: #67c23a; }
  &.network-medium { color: #e6a23c; }
  &.network-slow { color: #f56c6c; }
}
</style> 