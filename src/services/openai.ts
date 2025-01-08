import { ApiData } from '../types';
import { config } from '../config';

export class OpenAIService {
  private client: any;

  constructor() {
    // 延迟初始化
    this.initClient();
  }

  private async initClient() {
    try {
      const OpenAI = await import('openai');
      this.client = new OpenAI.default({
        apiKey: config.openai.apiKey,
        baseURL: config.openai.baseUrl,
        dangerouslyAllowBrowser: true
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
      throw new Error('Failed to initialize OpenAI client');
    }
  }

  async generateInterface(apiData: ApiData, onProgress?: (chunk: string) => void): Promise<string> {
    // 确保客户端已初始化
    if (!this.client) {
      await this.initClient();
    }

    try {
      const template = localStorage.getItem('requestTemplate') || '';
      let fullContent = '';

      const stream = await this.client.chat.completions.create({
        model: config.openai.model,
        temperature: config.openai.temperature,
        max_tokens: config.openai.maxTokens,
        stream: true,
        messages: [
          {
            role: 'system',
            content: `你是一个TypeScript接口生成助手。你的任务是根据Swagger API文档生成TypeScript接口定义。
请严格遵循以下规则：
1. 只输出TypeScript代码，不要包含任何其他解释性文字
2. 不要使用\`\`\`typescript这样的标记
3. 生成三个部分：
   - [接口名]Request：请求参数接口
   - [中间的所有相关接口]：如果有嵌套类型，需要定义为独立接口
   - [接口名]Response：响应数据接口
   - 最后生成request函数：必须完全按照提供的模板格式生成，特别注意：
     * 分析模板中使用的请求对象名称和方法（如Api.get、mapi.post等），在生成代码时使用相同的对象和方法
     * 必须保持与模板完全相同的格式，包括空格、换行、缩进等
     * 只替换以下内容：
       - 函数名：使用驼峰命名
       - 参数类型：使用对应的Request接口
       - 返回值泛型：使用对应的Response类型
       - URL路径：使用实际的API路径
     * 其他所有内容（包括请求对象名称）必须与模板保持完全一致
4. 代码格式要求：
   - 使用大驼峰命名法
   - 每个接口和字段都必须有完整的JSDoc注释，包括：
     * 接口注释：说明该接口的用途
     * 字段注释：说明字段的含义、类型、是否必填等信息
     * 使用 @description 标记详细描述
     * 使用 @example 标记示例值（如果有）
     * 使用 @default 标记默认值（如果有）
     * 使用 @required 标记必填字段
   - 标记可选字段（使用?:）
   - 嵌套对象使用独立的类型定义
   - 数组类型使用Array<T>形式
   - 使用2个空格缩进
   - request函数必须与模板完全一致，使用模板中指定的请求对象和方法`
          },
          {
            role: 'user',
            content: `根据以下Swagger API文档生成TypeScript接口定义：

文档内容：
${apiData.documentation}

请求函数模板（分析并使用此模板中的请求对象和方法）：
${template}

注意：
1. 分析模板中的请求对象名称（如Api、mapi等），在生成的代码中使用相同的对象名称
2. 必须严格按照模板格式，保持完全一致的结构和风格
3. 只替换函数名、类型和URL路径
4. 请求方式必须与模板保持一致（如get、post等）
5. 确保生成的每个接口和字段都有完整的JSDoc注释`
          }
        ]
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;

        // 如果提供了进度回调，则调用它
        if (onProgress && content) {
          onProgress(content);
        }
      }

      return fullContent;
    } catch (error) {
      console.warn('Generate interface error:', error);
      throw error;
    }
  }
}

export const openAIService = new OpenAIService();
