import { createApp } from 'vue'
import './style.css'
import router from './router'
import App from './App.vue'

// 按需引入Element Plus组件，减少包大小
import {
  ElButton,
  ElIcon,
  ElCard,
  ElRow,
  ElCol,
  ElImage,
  ElProgress,
  ElSelect,
  ElOption,
  ElLoading,
  ElMessage
} from 'element-plus'

// 只引入必要的图标
import {
  Loading,
  Warning,
  Connection,
  VideoPlay,
  Picture,
  Folder
} from '@element-plus/icons-vue'

const app = createApp(App)

// 只注册需要的组件
app.component('ElButton', ElButton)
app.component('ElIcon', ElIcon)
app.component('ElCard', ElCard)
app.component('ElRow', ElRow)
app.component('ElCol', ElCol)
app.component('ElImage', ElImage)
app.component('ElProgress', ElProgress)
app.component('ElSelect', ElSelect)
app.component('ElOption', ElOption)

// 只注册需要的图标
app.component('Loading', Loading)
app.component('Warning', Warning)
app.component('Connection', Connection)
app.component('VideoPlay', VideoPlay)
app.component('Picture', Picture)
app.component('Folder', Folder)

// 注册全局方法
app.config.globalProperties.$loading = ElLoading.service
app.config.globalProperties.$message = ElMessage

app.use(router)
app.mount('#app')
