// API基础配置 - 开发环境使用代理，生产环境通过nginx代理
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '' : '')

// 媒体文件接口类型定义
export interface MediaFile {
  id: string
  name: string
  url: string
  size: number
  type: 'image' | 'video'
  category?: string
  categoryName?: string
}

// 图片分类接口类型定义
export interface PhotoCategory {
  id: string
  name: string
  englishName: string
  photoCount: number
  coverImage: {
    name: string
    url: string
  } | null
}

// 视频分类接口类型定义
export interface VideoCategory {
  id: string
  name: string
  englishName: string
  videoCount: number
  coverVideo: {
    name: string
    url: string
  } | null
}

// API响应包装器
class ApiService {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
    console.log('API Base URL:', this.baseURL) // 添加调试日志
  }

  private async request<T>(endpoint: string): Promise<T> {
    const fullUrl = `${this.baseURL}${endpoint}`
    console.log('API请求URL:', fullUrl) // 添加调试日志
    
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // 添加超时设置
        signal: AbortSignal.timeout(10000) // 10秒超时
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`API请求失败 [${endpoint}]:`, error)
      throw error
    }
  }

  // 获取图片分类列表
  async getPhotoCategories(): Promise<PhotoCategory[]> {
    return this.request<PhotoCategory[]>('/api/photo-categories')
  }

  // 获取视频分类列表
  async getVideoCategories(): Promise<VideoCategory[]> {
    return this.request<VideoCategory[]>('/api/video-categories')
  }

  // 获取某个分类下的所有图片
  async getPhotosByCategory(category: string): Promise<MediaFile[]> {
    return this.request<MediaFile[]>(`/api/photos/${category}`)
  }

  // 获取某个分类下的所有视频
  async getVideosByCategory(category: string): Promise<MediaFile[]> {
    return this.request<MediaFile[]>(`/api/videos/${category}`)
  }

  // 获取所有照片
  async getPhotos(): Promise<MediaFile[]> {
    return this.request<MediaFile[]>('/api/photos')
  }

  // 获取所有视频
  async getVideos(): Promise<MediaFile[]> {
    return this.request<MediaFile[]>('/api/videos')
  }

  // 获取所有媒体文件
  async getAllMedia(): Promise<MediaFile[]> {
    return this.request<MediaFile[]>('/api/media')
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; message: string; timestamp: string }> {
    return this.request('/api/health')
  }

  // 获取视频信息
  async getVideoInfo(category: string, filename: string): Promise<any> {
    return this.request(`/api/video-info/${category}/${filename}`)
  }

  // 获取视频流媒体URL
  getStreamUrl(category: string, filename: string): string {
    return `${this.baseURL}/api/stream/${category}/${filename}`
  }

  // 获取完整的媒体文件URL
  getMediaUrl(url: string): string {
    return `${this.baseURL}${url}`
  }
}

// 创建API服务实例
export const apiService = new ApiService(API_BASE_URL)

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 获取文件扩展名
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

// 检查是否为图片文件
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
  return imageExtensions.includes(getFileExtension(filename))
}

// 检查是否为视频文件
export function isVideoFile(filename: string): boolean {
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
  return videoExtensions.includes(getFileExtension(filename))
} 