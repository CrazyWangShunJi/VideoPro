<template>
  <div class="images-gallery">
    <div class="header">
      <h1>Image Gallery</h1>
      <el-input
        v-model="searchQuery"
        placeholder="Search images..."
        prefix-icon="Search"
        class="search-input"
      />
    </div>

    <div class="filters">
      <el-select v-model="selectedCategory" placeholder="Category" clearable>
        <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
      </el-select>
    </div>

    <div class="image-grid">
      <div v-for="image in filteredImages" :key="image.id" class="image-item">
        <el-image
          :src="image.url"
          :alt="image.title"
          fit="cover"
          loading="lazy"
          :preview-src-list="[image.url]"
        >
          <template #placeholder>
            <div class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
        <div class="image-info">
          <h3>{{ image.title }}</h3>
          <p>{{ image.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElImage, ElInput, ElSelect, ElOption } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'

interface Image {
  id: number
  url: string
  title: string
  description: string
  category: string
}

// Mock data - replace with real API calls
const categories = ['Nature', 'Architecture', 'People', 'Travel', 'Abstract']
const images = ref<Image[]>([
  {
    id: 1,
    url: '/sample1.jpg',
    title: 'Mountain Landscape',
    description: 'Beautiful mountain view at sunset',
    category: 'Nature'
  },
  // Add more sample images here
])

const searchQuery = ref('')
const selectedCategory = ref('')

const filteredImages = computed(() => {
  return images.value.filter(image => {
    const matchesSearch = image.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         image.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = !selectedCategory.value || image.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})
</script>

<style scoped lang="scss">
.images-gallery {
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

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;

    .image-item {
      break-inside: avoid;
      margin-bottom: 2rem;
      
      .el-image {
        width: 100%;
        height: 300px;
        border-radius: 8px;
        overflow: hidden;
      }

      .image-placeholder {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        background: #f5f7fa;
        
        .el-icon {
          font-size: 2rem;
          color: #909399;
        }
      }

      .image-info {
        padding: 1rem 0;

        h3 {
          margin: 0 0 0.5rem;
          font-size: 1.2rem;
        }

        p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
      }
    }
  }
}
</style> 