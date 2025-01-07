import { EditorConfig } from './types'

export const createEditor = (
  container: HTMLElement,
  config: EditorConfig
) => {
  try {
    // 创建编辑器容器
    const editorContainer = document.createElement('div')
    editorContainer.style.position = 'relative'
    editorContainer.style.width = '100%'
    editorContainer.style.height = '100%'
    editorContainer.style.backgroundColor = '#ffffff'

    // 创建 textarea
    const textarea = document.createElement('textarea')
    textarea.value = config.content
    textarea.readOnly = config.readOnly
    textarea.style.width = '100%'
    textarea.style.height = '100%'
    textarea.style.padding = '15px'
    textarea.style.border = 'none'
    textarea.style.outline = 'none'
    textarea.style.resize = 'none'
    textarea.style.backgroundColor = '#ffffff'
    textarea.style.color = '#333333'
    textarea.style.fontFamily = 'Menlo, Monaco, Courier New, monospace'
    textarea.style.fontSize = '14px'
    textarea.style.lineHeight = '1.6'
    textarea.style.boxSizing = 'border-box'
    textarea.style.overflowY = 'auto'

    // 添加滚动条样式
    const style = document.createElement('style')
    style.textContent = `
      textarea::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      textarea::-webkit-scrollbar-track {
        background: #f5f5f5;
        border-radius: 4px;
      }
      textarea::-webkit-scrollbar-thumb {
        background: rgba(0, 135, 127, 0.3);
        border-radius: 4px;
        border: 2px solid #f5f5f5;
      }
      textarea::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 135, 127, 0.5);
      }
      textarea::-webkit-scrollbar-corner {
        background: #f5f5f5;
      }
      textarea:focus {
        box-shadow: 0 0 0 2px rgba(0, 135, 127, 0.2);
      }
      textarea::selection {
        background: rgba(0, 135, 127, 0.1);
      }
    `
    document.head.appendChild(style)

    // 添加元素到容器
    container.innerHTML = ''
    container.appendChild(textarea)

    return {
      getValue: () => textarea.value,
      setValue: (content: string) => {
        textarea.value = content
      },
      destroy: () => {
        container.removeChild(textarea)
        document.head.removeChild(style)
      }
    }
  } catch (error) {
    console.error('Failed to create editor:', error)
    return null
  }
}
