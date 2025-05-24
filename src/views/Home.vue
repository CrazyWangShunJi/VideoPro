<template>
  <div class="home">
    <div class="hero">
      <h1>欢迎来到PhotoPro</h1>
      <p>发掘国内独一无二的视觉作品集</p>
    </div>
    
    <div class="categories">
      <router-link to="/images" class="category">
        <el-card>
          <h2>图片合集</h2>
          <p>浏览我们的精美图集</p>
        </el-card>
      </router-link>
      
      <router-link to="/videos" class="category">
        <el-card>
          <h2>视频合集</h2>
          <p>观看我们的精选视频</p>
        </el-card>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElCard } from 'element-plus'
</script>

<style scoped lang="scss">
.home {
  .hero {
    height: 60vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/hero-bg.jpg');
    background-size: cover;
    background-position: center;
    color: white;
    text-align: center;
    
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    p {
      font-size: 1.5rem;
    }
  }
  
  .categories {
    padding: 2rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    
    .category {
      text-decoration: none;
      color: inherit;
      transition: transform 0.3s;
      
      &:hover {
        transform: translateY(-5px);
      }
      
      .el-card {
        height: 100%;
        text-align: center;
        padding: 2rem;
      }
    }
  }
}
</style> 