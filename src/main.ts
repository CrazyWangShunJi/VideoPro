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
  ElMessage,
  ElContainer,
  ElHeader,
  ElMain,
  ElFooter,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem
} from 'element-plus'

// 按需引入Element Plus CSS样式
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/row/style/css'
import 'element-plus/es/components/col/style/css'
import 'element-plus/es/components/image/style/css'
import 'element-plus/es/components/progress/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/container/style/css'
import 'element-plus/es/components/header/style/css'
import 'element-plus/es/components/main/style/css'
import 'element-plus/es/components/footer/style/css'
import 'element-plus/es/components/dropdown/style/css'
import 'element-plus/es/components/dropdown-menu/style/css'
import 'element-plus/es/components/dropdown-item/style/css'

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
app.component('ElContainer', ElContainer)
app.component('ElHeader', ElHeader)
app.component('ElMain', ElMain)
app.component('ElFooter', ElFooter)
app.component('ElDropdown', ElDropdown)
app.component('ElDropdownMenu', ElDropdownMenu)
app.component('ElDropdownItem', ElDropdownItem)

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
