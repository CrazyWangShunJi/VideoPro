<template>
  <div class="videos-gallery">
    <div class="header">
      <h1>Video Gallery</h1>
      <el-input
        v-model="searchQuery"
        placeholder="Search videos..."
        prefix-icon="Search"
        class="search-input"
      />
    </div>

    <div class="filters">
      <el-select v-model="selectedCategory" placeholder="Category" clearable>
        <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
      </el-select>
    </div>

    <div class="video-grid">
      <div v-for="video in filteredVideos" :key="video.id" class="video-item">
        <div class="video-container">
          <video
            :src="video.url"
            :poster="video.thumbnail"
            controls
            preload="none"
          ></video>
        </div>
        <div class="video-info">
          <h3>{{ video.title }}</h3>
          <p>{{ video.description }}</p>
          <div class="video-meta">
            <span>{{ video.duration }}</span>
            <span>{{ video.category }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElInput, ElSelect, ElOption } from 'element-plus'

interface Video {
  id: number
  url: string
  thumbnail: string
  title: string
  description: string
  duration: string
  category: string
}

const categories = ['Nature', 'Documentary', 'Events', 'Travel', 'Art']
const videos = ref<Video[]>([
  {
    id: 1,
    url: '/sample-video.mp4',
    thumbnail: '/video-thumb.jpg',
    title: 'Mountain Sunrise',
    description: 'Beautiful timelapse of sunrise in the mountains',
    duration: '2:30',
    category: 'Nature'
  },
  // Add more sample videos here
])

const searchQuery = ref('')
const selectedCategory = ref('')

const filteredVideos = computed(() => {
  return videos.value.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || video.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})
</script>

<style scoped lang="scss">
.videos-gallery {
  padding: 2rem;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    .search-input {
      width: 300px;
    }
  }

  .filters {
    margin-bottom: 2rem;
  }

  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 2rem;

    .video-item {
      break-inside: avoid;
      margin-bottom: 2rem;
      
      .video-container {
        position: relative;
        width: 100%;
        padding-top: 56.25%; // 16:9 aspect ratio
        
        video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          background: #000;
        }
      }

      .video-info {
        padding: 1rem 0;

        h3 {
          margin: 0 0 0.5rem;
          font-size: 1.2rem;
        }

        p {
          margin: 0 0 0.5rem;
          color: #666;
          font-size: 0.9rem;
        }

        .video-meta {
          display: flex;
          gap: 1rem;
          color: #909399;
          font-size: 0.8rem;
        }
      }
    }
  }
}
</style> 