<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <!-- 装饰性背景 -->
      <div class="modal-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
      </div>
      
      <div class="modal-header">
        <div class="header-content">
          <div class="header-icon">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="header-text">
            <h3>联系我们</h3>
            <p>我们很乐意为您提供帮助</p>
          </div>
        </div>
        <button class="close-btn" @click="closeModal" aria-label="关闭">
          <el-icon><Close /></el-icon>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="welcome-section">
          <div class="welcome-icon">
            <el-icon><Star /></el-icon>
          </div>
          <p class="welcome-text">
            感谢您对<span class="brand-name">香柏光影</span>的关注！<br>
            请留下您的联系方式，我们会在24小时内与您取得联系。
          </p>
        </div>
        
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="contact-form"
          label-position="left"
          label-width="100px"
        >
          <div class="form-group">
            <el-form-item label="邮箱地址" prop="email">
              <el-input
                v-model="form.email"
                type="email"
                placeholder="请输入您的邮箱地址"
                clearable
                size="large"
                class="form-input"
                style="width: 250px !important;"
              />
            </el-form-item>
            
            <el-form-item label="电话号码" prop="phone">
              <el-input
                v-model="form.phone"
                type="tel"
                placeholder="请输入您的电话号码"
                clearable
                size="large"
                class="form-input"
                style="width: 250px !important;"
              />
            </el-form-item>
          </div>
          
          <el-form-item label="咨询内容" prop="message">
            <el-input
              v-model="form.message"
              type="textarea"
              :rows="4"
              placeholder="请告诉我们您的需求或问题，我们会为您提供专业的解答..."
              maxlength="500"
              
              resize="none"
              class="form-textarea"
              style="width: 250px !important;"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <div class="modal-footer">
        <el-button 
          @click="closeModal" 
          size="large" 
          class="cancel-btn"
        >
          取消
        </el-button>
        <el-button 
          type="primary" 
          @click="submitForm" 
          :loading="submitting"
          size="large"
          class="submit-btn"
        >
          <el-icon v-if="!submitting"><Position /></el-icon>
          {{ submitting ? '提交中...' : '立即提交' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElForm, ElFormItem, ElInput, ElButton, ElIcon, ElMessage } from 'element-plus'
import { 
  Close, 
  Message, 
  Phone, 
  ChatDotRound, 
  Star, 
  Position 
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const isMobile = ref(false)

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 表单数据
const form = reactive({
  email: '',
  phone: '',
  message: ''
})

// 表单验证规则
const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
  ],
  phone: [
    { required: true, message: '请输入电话号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: ['blur', 'change'] }
  ]
}

// 关闭弹窗
const closeModal = () => {
  emit('close')
}

// 点击遮罩层关闭弹窗
const handleOverlayClick = () => {
  closeModal()
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 这里可以添加实际的提交逻辑，比如发送到后端API
    console.log('提交的联系信息:', form)
    
    ElMessage.success({
      message: '您的信息已提交成功！我们会尽快与您联系 ✨',
      duration: 3000,
      showClose: true
    })
    
    // 重置表单
    formRef.value.resetFields()
    
    // 关闭弹窗
    closeModal()
    
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

// 监听弹窗显示状态，处理焦点
watch(() => props.visible, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      // 弹窗显示时，聚焦到第一个输入框
      const firstInput = document.querySelector('.contact-form .el-input__inner') as HTMLInputElement
      if (firstInput && !isMobile.value) {
        firstInput.focus()
      }
    })
  } else {
    document.body.style.overflow = ''
  }
})

// 监听键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal()
  }
}

// 监听窗口大小变化
const handleResize = () => {
  checkMobile()
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
  if (props.visible) {
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// 在组件挂载时添加键盘事件监听
watch(() => props.visible, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(103, 194, 58, 0.1));
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 1rem;
}

.modal-content {
  position: relative;
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 8px 25px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.modal-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(64, 158, 255, 0.1), rgba(103, 194, 58, 0.1));
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 100px;
  height: 100px;
  top: -50px;
  right: -50px;
  animation-delay: 0s;
}

.circle-2 {
  width: 60px;
  height: 60px;
  bottom: -30px;
  left: -30px;
  animation-delay: 2s;
}

.circle-3 {
  width: 80px;
  height: 80px;
  top: 50%;
  right: -40px;
  animation-delay: 4s;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem 2.5rem 1rem;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  position: relative;
  z-index: 1;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 50px;
  height: 50px;
  border-radius: 15px;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.header-text h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.header-text p {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

.close-btn {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    transform: scale(1.05);
  }
}

.modal-body {
  padding: 1.5rem 2.5rem;
  position: relative;
  z-index: 1;
}

.welcome-section {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05), rgba(103, 194, 58, 0.05));
  border-radius: 16px;
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.welcome-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.welcome-text {
  color: #374151;
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.brand-name {
  color: #409EFF;
  font-weight: 700;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.contact-form {
  width: 100%;
  .form-group {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  /* 强制设置所有输入框为250px宽度 */
  .el-input, .el-textarea {
    width: 250px !important;
  }
  
  /* 更具体的选择器覆盖Element Plus默认样式 */
  :deep(.el-input) {
    width: 250px !important;
    min-width: 250px !important;
    max-width: 250px !important;
  }
  
  :deep(.el-textarea) {
    width: 250px !important;
    min-width: 250px !important;
    max-width: 250px !important;
  }
  
  /* 最强优先级的样式覆盖 */
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    width: 250px !important;
    min-width: 250px !important;
    max-width: 250px !important;
  }
  
  :deep(.el-input__inner) {
    width: 250px !important;
    min-width: 250px !important;
    max-width: 250px !important;
  }
  
  .el-form-item {
    width: 100% !important;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 18px;
    margin-bottom: 1rem;
    
    :deep(.el-form-item__label) {
      font-weight: 600;
      color: #374151;
      font-size: 0.9rem;
      margin-bottom: 0;
      margin-right: 12px;
      width: 100px;
      text-align: right;
      flex-shrink: 0;
    }
    
    :deep(.el-form-item__error) {
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .el-form-item__content {
      width: 250px !important;
    }
  }
  
  .form-input {
    width: 250px !important;
    
    :deep(.el-input__wrapper) {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(229, 231, 235, 0.8);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      width: 250px !important;
      
      &:hover {
        border-color: #409EFF;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
      }
      
      &.is-focus {
        border-color: #409EFF;
        box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
      }
    }
    
    :deep(.el-input__inner) {
      font-size: 0.95rem;
      font-weight: 500;
      width: 250px !important;
    }
    
    :deep(.el-input__prefix-inner) {
      color: #409EFF;
    }
  }
  
  .form-textarea {
    width: 250px !important;
    
    :deep(.el-textarea__inner) {
      border-radius: 12px;
      border: 1px solid rgba(229, 231, 235, 0.8);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.95rem;
      font-weight: 500;
      line-height: 1.6;
      width: 250px !important;
      
      &:hover {
        border-color: #409EFF;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
      }
      
      &:focus {
        border-color: #409EFF;
        box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
      }
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2.5rem 2rem;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-top: 1px solid rgba(229, 231, 235, 0.5);
  position: relative;
  z-index: 1;
}

.cancel-btn {
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.2);
  color: #6b7280;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: rgba(107, 114, 128, 0.15);
    transform: translateY(-1px);
  }
}

.submit-btn {
  background: linear-gradient(135deg, #409EFF, #67C23A);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: linear-gradient(135deg, #337ecc, #529b2e);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-content {
    max-width: 100%;
    border-radius: 16px;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1.5rem 1.5rem 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    
    .header-content {
      width: 100%;
    }
    
    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 36px;
      height: 36px;
    }
  }
  
  .modal-body {
    padding: 1rem 1.5rem;
  }
  
  .welcome-section {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1rem;
  }
  
  .contact-form {
    :deep(.el-form-item__label) {
      font-size: 0.9rem;
    }
  }
  
  .modal-footer {
    padding: 1rem 1.5rem 1.5rem;
    flex-direction: column;
    gap: 0.75rem;
    
    .el-button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.25rem;
  }
  
  .modal-content {
    border-radius: 12px;
  }
  
  .header-text h3 {
    font-size: 1.25rem;
  }
  
  .welcome-section {
    padding: 0.75rem;
  }
  
  .modal-body {
    padding: 0.75rem 1rem;
  }
  
  .modal-footer {
    padding: 0.75rem 1rem 1rem;
  }
}

/* 全局强制覆盖：针对这个组件内的所有输入框 */
.contact-form :deep(.el-input),
.contact-form :deep(.el-textarea),
.contact-form :deep(.el-input__wrapper),
.contact-form :deep(.el-textarea__inner),
.contact-form :deep(.el-input__inner) {
  width: 250px !important;
  min-width: 250px !important;
  max-width: 250px !important;
}

.contact-form .form-input,
.contact-form .form-textarea {
  width: 250px !important;
  min-width: 250px !important;
  max-width: 250px !important;
}
</style> 