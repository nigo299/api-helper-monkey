// API 参数类型
export interface ApiParameter {
  name: string;
  description: string;
  type: string;
  required: boolean;
  dataType: string;
}

// API 数据类型
export interface ApiData {
  documentation: string;  // 完整的文档内容
  rawHtml: string;       // 原始HTML内容，包含格式信息
  title: string;         // 接口标题
}

// DeepSeek API 响应类型
export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// 编辑器配置类型
export interface EditorConfig {
  content: string;
  language: string;
  readOnly: boolean;
}

// Swagger 数据类型
export interface SwaggerDefinition {
  type: string;
  properties?: Record<string, any>;
  items?: any;
  $ref?: string;
  originalRef?: string;
  required?: string[];
  description?: string;
  additionalProperties?: any;
}

export interface SwaggerParameter {
  name: string;
  description?: string;
  required?: boolean;
  type?: string;
  schema?: SwaggerDefinition;
  items?: any;
  format?: string;
}

export interface SwaggerPathInfo {
  parameters?: SwaggerParameter[];
  responses?: {
    '200'?: {
      schema?: SwaggerDefinition;
    };
  };
  summary?: string;
}

export interface SwaggerData {
  paths?: Record<string, Record<string, SwaggerPathInfo>>;
  definitions?: Record<string, SwaggerDefinition>;
}
