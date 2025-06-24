// 视频播放优化配置
export interface VideoQualityConfig {
  quality: string
  label: string
  bitrate: string
  resolution: string
  maxFileSize: number // MB
}

export interface NetworkConfig {
  fast: {
    preferredQuality: string
    preload: 'auto' | 'metadata' | 'none'
    bufferSize: number // KB
  }
  medium: {
    preferredQuality: string
    preload: 'auto' | 'metadata' | 'none'
    bufferSize: number // KB
  }
  slow: {
    preferredQuality: string
    preload: 'auto' | 'metadata' | 'none'
    bufferSize: number // KB
  }
}

// 视频质量配置 - 增加更多质量选项
export const VIDEO_QUALITIES: VideoQualityConfig[] = [
  {
    quality: '240p',
    label: '流畅 240P',
    bitrate: '400k',
    resolution: '426x240',
    maxFileSize: 20
  },
  {
    quality: '360p',
    label: '清晰 360P',
    bitrate: '800k',
    resolution: '640x360',
    maxFileSize: 35
  },
  {
    quality: '480p',
    label: '标清 480P',
    bitrate: '1200k',
    resolution: '854x480',
    maxFileSize: 50
  },
  {
    quality: '720p',
    label: '高清 720P',
    bitrate: '2000k',
    resolution: '1280x720',
    maxFileSize: 100
  }
]

// 网络状况配置 - 根据网络状况智能选择质量（优化后更保守）
export const NETWORK_CONFIG: NetworkConfig = {
  fast: {
    preferredQuality: '360p', // 快速网络优先使用360p，更稳定
    preload: 'metadata',
    bufferSize: 256 // 256KB缓冲区
  },
  medium: {
    preferredQuality: '360p', // 中等网络仍使用360p
    preload: 'metadata',
    bufferSize: 192 // 192KB
  },
  slow: {
    preferredQuality: '240p', // 慢速网络使用240p
    preload: 'none',
    bufferSize: 128 // 128KB
  }
}

// 视频播放器默认设置
export const DEFAULT_PLAYER_CONFIG = {
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 1000, // ms
  networkCheckInterval: 30000, // 30秒
  qualityChangeDelay: 500, // ms
  errorTimeout: 5000, // ms
  loadingTimeout: 15000, // 15秒
}

// 网络速度检测配置
export const NETWORK_DETECTION_CONFIG = {
  testUrl: '/api/health',
  timeout: 5000, // 5秒
  thresholds: {
    fast: 100, // ms
    medium: 300, // ms
    slow: 1000 // ms
  }
}

// 视频格式支持检测
export function detectVideoSupport(): { [format: string]: boolean } {
  const video = document.createElement('video')
  
  return {
    mp4: !!(video.canPlayType && video.canPlayType('video/mp4; codecs="avc1.42E01E"')),
    webm: !!(video.canPlayType && video.canPlayType('video/webm; codecs="vp8, vorbis"')),
    ogg: !!(video.canPlayType && video.canPlayType('video/ogg; codecs="theora"')),
    hls: !!(video.canPlayType && video.canPlayType('application/vnd.apple.mpegurl')),
  }
}

// 获取推荐的视频质量
export function getRecommendedQuality(
  networkSpeed: 'fast' | 'medium' | 'slow',
  availableQualities: string[]
): string {
  const config = NETWORK_CONFIG[networkSpeed]
  const preferred = config.preferredQuality
  
  // 如果首选质量可用，返回首选质量
  if (availableQualities.includes(preferred)) {
    return preferred
  }
  
  // 否则选择最接近的质量
  const qualityOrder = ['720p', '480p', '360p', '240p']
  const preferredIndex = qualityOrder.indexOf(preferred)
  
  // 向下查找（降低质量）
  for (let i = preferredIndex; i < qualityOrder.length; i++) {
    if (availableQualities.includes(qualityOrder[i])) {
      return qualityOrder[i]
    }
  }
  
  // 向上查找（提高质量）
  for (let i = preferredIndex - 1; i >= 0; i--) {
    if (availableQualities.includes(qualityOrder[i])) {
      return qualityOrder[i]
    }
  }
  
  // 返回第一个可用的质量，默认360p
  return availableQualities[0] || '360p'
}

// 计算缓冲区大小
export function calculateBufferSize(quality: string, networkSpeed: 'fast' | 'medium' | 'slow'): number {
  const baseSize = NETWORK_CONFIG[networkSpeed].bufferSize
  const qualityMultiplier = {
    '240p': 0.5,
    '360p': 0.75,
    '480p': 1,
    '720p': 1.5
  }
  
  return baseSize * (qualityMultiplier[quality as keyof typeof qualityMultiplier] || 1)
} 