# VideoPro Frontend

一个现代化的Vue 3 + TypeScript应用程序，用于展示摄影师的图片和视频作品。使用Element Plus构建美观且响应式的用户界面。

## 功能特性

### 图片功能
- 图片分类展示（纪实、风景、会议、人物、婚礼）
- 瀑布流布局的图片画廊
- 图片搜索和筛选功能
- 全屏图片查看器

### 视频功能
- 视频分类展示（活动、宣传片、短视频）
- 视频分类页面，显示各类别封面和统计信息
- 分类视频列表页面，支持视频播放和下载
- 视频搜索和筛选功能
- 响应式视频播放器

### 通用功能
- 响应式设计，支持移动端和桌面端
- 现代化UI设计，使用Element Plus组件
- 面包屑导航
- 文件大小格式化显示
- 错误处理和加载状态

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd photopro
```

2. Install dependencies:
```bash
npm install
```

## Development

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be available in the `dist` directory.

## 项目结构

```
src/
├── assets/        # 静态资源文件
├── api/           # API服务和类型定义
├── components/    # 可复用的Vue组件
├── router/        # Vue Router路由配置
├── views/         # 页面组件
│   ├── Home.vue           # 首页
│   ├── Images.vue         # 图片展示页面
│   ├── Videos.vue         # 视频列表页面
│   └── VideoCategories.vue # 视频分类页面
├── App.vue        # 根组件
└── main.ts        # 应用程序入口点
```

## 页面路由

- `/` - 首页，展示项目概览和最新内容
- `/images` - 图片分类页面
- `/images/:category` - 特定分类的图片列表
- `/videos` - 视频分类页面
- `/videos/:category` - 特定分类的视频列表

## API接口

### 图片相关
- `GET /api/photo-categories` - 获取图片分类列表
- `GET /api/photos/:category` - 获取指定分类的图片

### 视频相关
- `GET /api/video-categories` - 获取视频分类列表
- `GET /api/videos/:category` - 获取指定分类的视频

### 媒体文件访问
- `/assets/photo/:category/:filename` - 访问图片文件
- `/assets/video/:category/:filename` - 访问视频文件

## Technologies Used

- Vue 3
- TypeScript
- Vite
- Element Plus
- Vue Router
- Sass

## License

MIT
