<template>
  <div class="swagger-helper">
    <div class="status-bar" :class="{ active: hasApiData }">
      {{ statusMessage }}
    </div>
    <div class="swagger-buttons">
      <button @click="debouncedGenerateInterface" class="swagger-btn" :disabled="!hasApiData || isLoading" :class="{ loading: isLoading }">
        <span class="loading-spinner" v-if="isLoading"></span>
        <span>{{ isLoading ? '生成中...' : '生成接口' }}</span>
      </button>
      <button @click="showTemplateConfig" class="swagger-btn config-btn">配置模板</button>
    </div>
    <div class="code-modal" v-if="showCodeModal">
      <div class="code-modal-content">
        <div class="code-modal-header">
          <h3>{{ modalTitle }}</h3>
          <div class="modal-actions">
            <button class="action-btn" @click="copyCode" :class="{ 'copied': isCopied }">
              {{ isCopied ? '已复制' : '复制代码' }}
            </button>
            <button class="close-btn" @click="closeModal">
              <span class="close-icon">×</span>
            </button>
          </div>
        </div>
        <div class="code-content">
          <div ref="editorContainer" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
    </div>
    <div class="code-modal" v-if="showTemplateModal">
      <div class="code-modal-content">
        <div class="code-modal-header">
          <h3>配置请求模板</h3>
          <div class="modal-actions">
            <button class="action-btn" @click="saveTemplate">保存配置</button>
            <button class="close-btn" @click="closeTemplateModal">
              <span class="close-icon">×</span>
            </button>
          </div>
        </div>
        <div class="code-content">
          <div ref="templateEditorContainer" style="width: 100%; height: 100%;"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createEditor } from '../editor-config'
import { deepSeekService } from '../services/deepseek'
import type { ApiData } from '../types'

const hasApiData = ref(false)
const statusMessage = ref('等待获取接口数据...')
const apiData = ref<ApiData | null>(null)
const showCodeModal = ref(false)
const modalTitle = ref('')
const generatedCode = ref('')
const isCopied = ref(false)
const editorContainer = ref<HTMLElement | null>(null)
let editor: any = null
const showTemplateModal = ref(false)
const templateEditorContainer = ref<HTMLElement | null>(null)
let templateEditor: any = null
const isLoading = ref(false)
const defaultTemplate = `export async function getHomePagemanege() {
  const response = await Api.get<{
    flag: boolean
  }>('/homepage/manegflag')
  return response.data
}`

// 添加缓存相关的状态
const lastGeneratedCode = ref<string>('')
const lastApiData = ref<string>('')
const lastTemplate = ref<string>('')

const showModal = (title: string, code: string) => {
  modalTitle.value = title
  generatedCode.value = code
  showCodeModal.value = true

  // 确保在下一个tick中处理编辑器
  setTimeout(() => {
    if (editorContainer.value) {
      // 每次都销毁并重新创建编辑器
      if (editor) {
        editor.destroy()
        editor = null
      }
      editor = createEditor(editorContainer.value, {
        content: code,
        language: 'javascript',
        readOnly: true
      })
      if (!editor) {
        console.error('Failed to create code editor')
        statusMessage.value = '编辑器初始化失败'
      }
    }
  }, 0)
}

const closeModal = () => {
  showCodeModal.value = false
  if (editor) {
    editor.destroy()
    editor = null
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

// 从页面提取API文档数据
const extractApiData = (copyButton: HTMLElement): ApiData | null => {
  if (!copyButton || !copyButton.id || !copyButton.id.startsWith('copyDocHref')) {
    console.log('Invalid copy button:', copyButton)
    return null
  }

  const tabId = copyButton.id.replace('copyDocHref', 'HomeDoc')
  const activeTab = document.getElementById(tabId)

  if (!activeTab) {
    console.log('No tab found for id:', tabId)
    return null
  }

  // 获取完整的文档内容
  const docContent = activeTab.innerText
  if (!docContent) {
    console.log('No content found in tab')
    return null
  }

  // 提取接口标题（第一个非空行）
  const lines = docContent.split('\n')
  let title = '未命名接口'

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('**') && !trimmed.startsWith('#')) {
      title = trimmed
      break
    }
  }

  // 构建API数据
  const data: ApiData = {
    documentation: docContent,
    rawHtml: activeTab.innerHTML,
    title
  }

  return data
}

// 监听复制按钮点击
const setupCopyButtonListener = () => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target.tagName === 'A' && target.id && target.id.startsWith('copyDocHref')) {
      event.preventDefault()

      setTimeout(() => {
        const data = extractApiData(target)
        if (data) {
          apiData.value = data
          hasApiData.value = true
          statusMessage.value = `已获取接口数据: ${data.title}`
        } else {
          statusMessage.value = '获取接口数据失败，请重试'
        }
      }, 100)
    }
  })
}

// 防抖函数
const debounce = (fn: Function, delay: number) => {
  let timer: NodeJS.Timeout | null = null
  return (...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(null, args)
    }, delay)
  }
}

// 防抖处理的生成接口函数
const debouncedGenerateInterface = debounce(async () => {
  if (!apiData.value || isLoading.value) {
    return
  }

  try {
    isLoading.value = true
    const currentApiData = JSON.stringify(apiData.value)
    const currentTemplate = localStorage.getItem('requestTemplate') || ''

    // 只有当API数据和模板都没有变化时，才使用缓存
    if (currentApiData === lastApiData.value &&
        currentTemplate === lastTemplate.value &&
        lastGeneratedCode.value) {
      showModal('生成的接口定义', lastGeneratedCode.value)
      return
    }

    statusMessage.value = '正在生成接口定义...'
    const code = await deepSeekService.generateInterface(apiData.value)

    // 保存生成的内容、API数据和模板
    lastGeneratedCode.value = code
    lastApiData.value = currentApiData
    lastTemplate.value = currentTemplate

    showModal('生成的接口定义', code)
    statusMessage.value = '接口定义生成成功'
  } catch (error) {
    console.error('生成接口定义失败:', error)
    statusMessage.value = '生成接口定义失败，请检查配置或网络连接'
  } finally {
    isLoading.value = false
  }
}, 300)

// 显示模板配置
const showTemplateConfig = () => {
  showTemplateModal.value = true
  setTimeout(() => {
    if (templateEditorContainer.value) {
      if (templateEditor) {
        templateEditor.destroy()
        templateEditor = null
      }
      templateEditor = createEditor(templateEditorContainer.value, {
        content: localStorage.getItem('requestTemplate') || defaultTemplate,
        language: 'javascript',
        readOnly: false
      })
      if (!templateEditor) {
        console.error('Failed to create template editor')
        statusMessage.value = '模板编辑器初始化失败'
        showTemplateModal.value = false
      }
    }
  }, 0)
}

// 关闭模板配置
const closeTemplateModal = () => {
  showTemplateModal.value = false
  if (templateEditor) {
    templateEditor.destroy()
    templateEditor = null
  }
}

// 保存模板配置
const saveTemplate = () => {
  if (templateEditor) {
    const template = templateEditor.getValue()
    localStorage.setItem('requestTemplate', template)
    statusMessage.value = '模板配置已保存'
    closeTemplateModal()
  }
}

onMounted(() => {
  setupCopyButtonListener()
})

onUnmounted(() => {
  if (editor) {
    editor.destroy()
    editor = null
  }
  if (templateEditor) {
    templateEditor.destroy()
    templateEditor = null
  }
  document.removeEventListener('click', setupCopyButtonListener)
})
</script>

<style scoped>
.swagger-helper {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.status-bar {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.status-bar.active {
  background-color: #49cc90;
  color: white;
}

.swagger-buttons {
  display: flex;
  gap: 10px;
}

.swagger-btn {
  padding: 8px 16px;
  background-color: #49cc90;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  min-width: 100px;

  &:hover:not(:disabled) {
    background-color: #3bb37c;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  &.loading {
    background-color: #3bb37c;
    cursor: wait;
  }
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.code-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
}

.code-modal-content {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 24px rgba(0, 135, 127, 0.15);
  border: 1px solid #00877f;
}

.code-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(0, 135, 127, 0.2);
}

.code-modal-header h3 {
  margin: 0;
  color: #00877f;
  font-size: 18px;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-btn {
  padding: 8px 16px;
  background-color: #ffffff;
  color: #00877f;
  border: 1px solid #00877f;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn:hover {
  background-color: rgba(0, 135, 127, 0.1);
}

.action-btn.copied {
  background-color: #00877f;
  border-color: #00877f;
  color: #ffffff;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  border-radius: 4px;
}

.close-btn:hover {
  color: #00877f;
  background-color: rgba(0, 135, 127, 0.1);
}

.close-icon {
  line-height: 1;
}

.code-content {
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  flex-grow: 1;
  height: calc(100% - 60px);
  border: 1px solid rgba(0, 135, 127, 0.2);
}

.code-content > div {
  height: 100%;
}

:deep(.cm-editor) {
  height: 100%;
}

:deep(.cm-scroller) {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 135, 127, 0.3);
    border-radius: 4px;
    border: 2px solid #f5f5f5;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 135, 127, 0.5);
  }

  &::-webkit-scrollbar-corner {
    background: #f5f5f5;
  }
}

.config-btn {
  background-color: #ffffff;
  color: #00877f;
  border: 1px solid #00877f;

  &:hover:not(:disabled) {
    background-color: rgba(0, 135, 127, 0.1);
  }
}
</style>
