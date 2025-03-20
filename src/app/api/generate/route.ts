import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import https from 'https';
// 导入curl客户端作为后备方案
import { generateWithCurl } from './curl-client';

/**
 * API 路由用于生成图像和文本
 * 
 * 使用方法：
 * 1. 发送POST请求到 /api/generate
 * 2. 请求体应该是FormData格式
 * 3. 表单字段:
 *    - description: 文本描述 (必须)
 *    - image0, image1, image2: 最多3个图像文件
 *    
 * 重要: 对于多图上传，前端必须使用不同的字段名 (image0, image1, image2)
 * 例如:
 * ```
 * const formData = new FormData();
 * formData.append('description', '描述文本');
 * formData.append('image0', file1);
 * formData.append('image1', file2);
 * ```
 */

// 创建自定义HTTPS代理，指定TLS版本
const customHttpsAgent = new https.Agent({ 
  minVersion: 'TLSv1.2',
  rejectUnauthorized: false // 在测试环境中禁用证书验证
});

// 解决Node.js环境中的fetch问题
// @ts-ignore
import fetch from 'node-fetch';
// @ts-ignore
if (!global.fetch) {
  // 使用自定义fetch函数，指定HTTPS代理
  // @ts-ignore
  global.fetch = (url, options = {}) => {
    // @ts-ignore
    return fetch(url, { 
      ...options, 
      // @ts-ignore
      agent: customHttpsAgent
    });
  };
  // @ts-ignore
  global.Headers = fetch.Headers;
  // @ts-ignore
  global.Request = fetch.Request;
  // @ts-ignore
  global.Response = fetch.Response;
}

// 导入和配置Axios
import axios from 'axios';
// 创建一个带有自定义HTTPS配置的axios实例
const customAxios = axios.create({
  httpsAgent: customHttpsAgent,
  timeout: 60000 // 60秒超时
});

// 创建一个fetch兼容的接口，使用axios
const axiosFetch = async (url: string, options: any = {}) => {
  try {
    const method = options.method || 'GET';
    const body = options.body;
    const headers = options.headers || {};
    
    const response = await customAxios({
      url,
      method,
      data: body,
      headers,
      responseType: 'arraybuffer'
    });
    
    // 创建类似fetch的Response对象
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      text: async () => Buffer.from(response.data).toString(),
      json: async () => JSON.parse(Buffer.from(response.data).toString()),
      arrayBuffer: async () => response.data,
      buffer: async () => Buffer.from(response.data)
    };
  } catch (error) {
    console.error('Axios请求失败:', error);
    throw error;
  }
};

// Config for App Router
export const dynamic = 'force-dynamic';

// Initialize Google AI client with custom axios-based fetch implementation
// @ts-ignore - 忽略参数数量错误
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '', {
  // @ts-ignore
  transport: {
    // @ts-ignore
    fetch: axiosFetch
  }
});

// Helper function to convert file to base64
async function fileToGenerativePart(file: string, mimeType: string): Promise<any> {
  const data = await fs.promises.readFile(file);
  return {
    inlineData: {
      // @ts-ignore - Buffer type error
      data: Buffer.from(data).toString('base64'),
      mimeType,
    },
  };
}

// Helper function to ensure directory exists with proper permissions
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
    } catch (error) {
      console.error(`Failed to create directory ${dirPath}:`, error);
      throw error;
    }
  }
}

// Parse form with files
async function parseForm(req: NextRequest) {
  const data = await req.formData();
  const description = data.get('description') as string;
  const files = [];
  
  // Get all form data keys in a way that works with the current TypeScript config
  const formKeys: string[] = [];
  data.forEach((_, key) => formKeys.push(key));
  console.log('开始处理表单数据，获取到的字段：', formKeys);
  
  // Get uploaded files
  for (let i = 0; i < 3; i++) {
    const fieldName = `image${i}`;
    const file = data.get(fieldName) as File;
    if (file) {
      console.log(`处理上传的图像 ${fieldName}:`, file.name, file.type, file.size);
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Create tmp directory if it doesn't exist
      const tmpDir = path.join(process.cwd(), 'tmp');
      ensureDirectoryExists(tmpDir);
      
      // Save file temporarily with timestamp for uniqueness
      const timestamp = Date.now();
      const fileId = uuidv4();
      const tempPath = path.join(tmpDir, `${timestamp}-${fileId}-${file.name}`);
      
      console.log(`保存临时文件到: ${tempPath}`);
      
      // @ts-ignore - Buffer type error
      await fs.promises.writeFile(tempPath, buffer);
      
      files.push({
        path: tempPath,
        type: file.type,
        name: file.name,
        fieldName // Keep track of which field this came from
      });
    } else {
      console.log(`未找到图像字段 ${fieldName}`);
    }
  }
  
  console.log(`总共处理了 ${files.length} 个文件`);
  return { description, files };
}

// Save image to local storage
async function saveImageLocally(filePath: string, contentType: string): Promise<string> {
  // Create a public directory if it doesn't exist
  const publicDir = path.join(process.cwd(), 'public', 'temp-images');
  ensureDirectoryExists(publicDir);
  
  // Generate a more unique filename with timestamp and UUID
  const timestamp = Date.now();
  const fileId = uuidv4();
  const fileExtension = path.extname(filePath);
  const publicFilename = `${timestamp}-${fileId}${fileExtension}`;
  const publicPath = path.join(publicDir, publicFilename);
  
  console.log(`将文件从 ${filePath} 复制到 ${publicPath}`);
  
  try {
    fs.copyFileSync(filePath, publicPath);
    return `/temp-images/${publicFilename}`;
  } catch (copyError) {
    console.error('Failed to save image locally:', copyError);
    throw new Error('Unable to store image locally');
  }
}

// Generate image with Google AI
async function generateImage(description: string, imageParts: any[] = []): Promise<{textContent?: string, imageUrl?: string}> {
  try {
    console.log('开始处理图像生成请求...');
    
    // 尝试使用官方API客户端
    try {
      // 使用gemini-2.0-flash-exp-image-generation模型生成图像
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp-image-generation",
        generationConfig: {
            // @ts-ignore - responseModalities在TypeScript类型中不存在，但在API中有效
            responseModalities: ['Text', 'Image']
        },
      });
      
      let response;
      try {
        if (imageParts.length > 0) {
          // 如果提供了图像，构建内容数组
          console.log('使用上传的图像和描述生成内容...');
          response = await model.generateContent([
            description,
            ...imageParts
          ]);
        } else {
          // 否则只使用文本描述
          console.log('仅使用文本描述生成图像...');
          response = await model.generateContent(description);
        }
      } catch (apiError) {
        console.error('调用Gemini API时出错:', apiError);
        throw apiError;
      }
      
      const result = {
        textContent: undefined,
        imageUrl: undefined
      };
      
      // 处理响应中的不同部分
      if (response.response.candidates[0]?.content?.parts) {
        for (const part of response.response.candidates[0].content.parts) {
          // 处理文本部分
          if (part.text) {
            console.log('收到文本响应');
            result.textContent = part.text;
          } 
          // 处理图像部分
          else if (part.inlineData) {
            console.log('收到图像响应');
            const imageData = part.inlineData.data;
            
            try {
              // 创建临时目录
              const tmpDir = path.join(process.cwd(), 'tmp');
              ensureDirectoryExists(tmpDir);
              
              // 保存图像到临时文件，使用时间戳确保唯一性
              const timestamp = Date.now();
              const fileId = uuidv4();
              const tempPath = path.join(tmpDir, `${timestamp}-${fileId}.png`);
              // @ts-ignore - Buffer type error
              await fs.promises.writeFile(tempPath, Buffer.from(imageData, 'base64'));
              
              try {
                // 保存图像到本地存储
                result.imageUrl = await saveImageLocally(tempPath, 'image/png');
              } catch (saveError) {
                console.error('保存图像到本地存储时出错:', saveError);
              }
              
              // 清理临时文件
              try {
                await fs.promises.unlink(tempPath);
              } catch (e) {
                console.warn('清理临时图像文件失败:', e);
              }
            } catch (imageProcessError) {
              console.error('处理图像数据时出错:', imageProcessError);
              // 不抛出错误，继续处理
            }
          }
        }
      }
      
      return result;
    } catch (officialApiError) {
      // 如果官方API客户端失败，使用curl后备方案
      console.warn('官方API客户端失败，尝试使用curl后备方案:', officialApiError);
      
      // 准备一个简化的提示，因为我们不能在curl客户端中使用图像生成
      const formattedPrompt = description + " Please provide a detailed description for this request.";
      
      // 调用curl客户端
      const curlResult = await generateWithCurl(
        process.env.GOOGLE_API_KEY || '',
        formattedPrompt,
        [] // 不传递图像部分
      );
      
      return { 
        textContent: curlResult.text,
        imageUrl: undefined // curl方法不支持图像生成
      };
    }
  } catch (error) {
    console.error('处理图像生成请求时出错:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { description, files } = await parseForm(req);
    
    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    
    // Save original images to local storage
    const uploadedImages = [];
    for (const file of files) {
      try {
        const imageUrl = await saveImageLocally(file.path, file.type);
        uploadedImages.push(imageUrl);
        console.log(`成功保存图像 ${file.fieldName}(${file.name}): ${imageUrl}`);
      } catch (saveError) {
        console.error(`保存原始图像时出错 ${file.fieldName}(${file.name}):`, saveError);
        // 如果保存失败，跳过这个图像
      }
    }
    
    console.log('所有上传的图像:', uploadedImages);
    
    // Convert images to Google AI format
    const imageParts = [];
    try {
      if (files.length > 0) {
        imageParts.push(...await Promise.all(
          files.map(file => fileToGenerativePart(file.path, file.type))
        ));
      }
    } catch (conversionError) {
      console.error('转换图像格式时出错:', conversionError);
      // 继续处理，即使转换失败
    }
    
    // Generate content
    const generated = await generateImage(description, imageParts);
    
    // Clean up temporary files
    for (const file of files) {
      try {
        await fs.promises.unlink(file.path);
      } catch (e) {
        console.warn('清理临时文件失败:', e);
      }
    }
    
    // 确保至少有文本或图像响应
    if (!generated.textContent && !generated.imageUrl) {
      throw new Error('未能生成任何内容');
    }
    
    return NextResponse.json({
      success: true,
      originalImages: uploadedImages,
      generatedText: generated.textContent,
      generatedImage: generated.imageUrl
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process the request', details: error.message },
      { status: 500 }
    );
  }
} 