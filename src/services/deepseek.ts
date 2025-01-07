import axios, { AxiosInstance } from 'axios';
import { ApiData, DeepSeekResponse } from '../types';
import { config } from '../config';

export class DeepSeekService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.deepseek.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.deepseek.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // 添加请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        console.warn('Request error:', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // 避免修改错误对象的只读属性
        const errorInfo = {
          status: error?.response?.status,
          message: error?.message,
          data: error?.response?.data
        };
        console.warn('Response error:', errorInfo);
        return Promise.reject(errorInfo);
      }
    );
  }

  async generateInterface(apiData: ApiData): Promise<string> {
    try {
      const template = localStorage.getItem('requestTemplate') || '';

      const response = await this.client.post<DeepSeekResponse>('', {
        model: config.deepseek.model,
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
     * 其他所有内容（包括请求对象名称）必须与模板保持完全一致`
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
4. 请求方式必须与模板保持一致（如get、post等）`
          }
        ],
        temperature: 0,
        max_tokens: 5000
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.warn('Generate interface error:', error);
      throw error;
    }
  }
}

export const deepSeekService = new DeepSeekService();

