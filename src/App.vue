<script setup lang="ts">
import { ElContainer, ElHeader, ElMain, ElFooter, ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { ref, onMounted } from 'vue'
import { apiService, type PhotoCategory } from './api'

const categories = ref<PhotoCategory[]>([])

const loadCategories = async () => {
  try {
    categories.value = await apiService.getPhotoCategories()
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<template>
  <el-container class="app-container">
    <el-header>
      <nav class="nav-menu">
        <router-link to="/" class="logo">
          VisionPro
        </router-link>
        <div class="nav-links">
          <el-dropdown trigger="hover">
            <span class="nav-item">
              图片
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <router-link to="/images">
                  <el-dropdown-item>所有分类</el-dropdown-item>
                </router-link>
                <el-dropdown-item divided v-for="category in categories" :key="category.id">
                  <router-link :to="`/images/${category.id}`">
                    {{ category.name }}
                  </router-link>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <router-link to="/videos">视频</router-link>
        </div>
      </nav>
    </el-header>

    <el-main>
      <router-view></router-view>
    </el-main>

    <el-footer>
      <p>&copy; 2024 PhotoPro. All rights reserved.</p>
    </el-footer>
  </el-container>
</template>

<style>
@import 'element-plus/dist/index.css';

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

#app {
  min-height: 100vh;
}

.app-container {
 width: 100%;
 height: 100%;
}

.el-header {
  padding: 0;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-menu {
  margin: 0 auto;
  padding: 0 1rem;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .logo {
    font-size: 1.5rem;
    font-weight: bold;
    text-decoration: none;
    color: #409EFF;
  }

  .nav-links {
    display: flex;
    gap: 2rem;
    align-items: center;

    .nav-item {
      color: #606266;
      font-weight: 500;
      cursor: pointer;
      transition: color 0.3s;
      display: flex;
      align-items: center;

      &:hover {
        color: #409EFF;
      }
    }

    a {
      text-decoration: none;
      color: #606266;
      font-weight: 500;
      transition: color 0.3s;

      &:hover, &.router-link-active {
        color: #409EFF;
      }
    }

    .el-dropdown-menu {
      a {
        display: block;
        width: 100%;
        color: inherit;
      }
    }
  }
}

.el-main {
  padding: 0;
  background: #f5f7fa;
  overflow-y: hidden;
}

.el-footer {
  text-align: center;
  color: #909399;
  padding: 2rem;
}
</style>
