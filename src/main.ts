import { createApp } from 'vue'
import App from './App.vue'

// 过滤特定的错误消息
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
console.error = (...args: any[]) => {
  const errorMessage = args.join(' ')
  if (
    errorMessage.includes('MonacoEnvironment') ||
    errorMessage.includes('toUrl') ||
    errorMessage.includes('Could not create web worker') ||
    errorMessage.includes('Cannot read properties of undefined')
  ) {
    return // 忽略特定的错误
  }
  originalConsoleError.apply(console, args)
}

console.warn = (...args: any[]) => {
  const warnMessage = args.join(' ')
  if (
    warnMessage.includes('MonacoEnvironment') ||
    warnMessage.includes('Could not create web worker')
  ) {
    return // 忽略特定的警告
  }
  originalConsoleWarn.apply(console, args)
}

// 全局错误处理
window.addEventListener('error', (event) => {
  if (
    event.message.includes('toUrl') ||
    event.message.includes('Cannot read properties of undefined')
  ) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
}, true)

// 全局 Promise 错误处理
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('toUrl') ||
    event.reason?.message?.includes('Cannot read properties of undefined')
  ) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
})

// 等待页面完全加载
function init() {
  // 检查是否已经存在应用实例
  const existingApp = document.getElementById('swagger-helper-app')
  if (existingApp) {
    return
  }

  // 创建容器元素
  const container = document.createElement('div')
  container.id = 'swagger-helper-app'
  document.body.appendChild(container)

  // 创建Vue应用
  const app = createApp(App)
  app.mount('#swagger-helper-app')
}

// 使用 MutationObserver 确保在 DOM 变化时只初始化一次
let initialized = false
const observer = new MutationObserver((mutations, obs) => {
  if (!initialized && document.body) {
    initialized = true
    init()
    obs.disconnect()
  }
})

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
})
