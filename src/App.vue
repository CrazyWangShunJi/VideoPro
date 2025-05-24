<script setup lang="ts">
import { ElContainer, ElHeader, ElMain, ElFooter } from 'element-plus'
</script>

<template>
  <el-container class="app-container">
    <el-header>
      <nav class="nav-menu">
        <router-link to="/" class="logo">
          PhotoPro
        </router-link>
        <div class="nav-links">
          <router-link to="/images">图片</router-link>
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

    a {
      text-decoration: none;
      color: #606266;
      font-weight: 500;
      transition: color 0.3s;

      &:hover, &.router-link-active {
        color: #409EFF;
      }
    }
  }
}

.el-main {
  padding: 0;
  background: #f5f7fa;
}

.el-footer {
  text-align: center;
  color: #909399;
  padding: 2rem;
}
</style>
