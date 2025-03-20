import axios from 'axios';

// 创建一个使用axios的自定义客户端
export async function generateWithGemini(apiKey: string, prompt: string, imageParts: any[] = []) {
  try {
    console.log('使用自定义Axios客户端连接到Google Gemini API');
    
    // 构建请求数据
    const requestData = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...imageParts.map(part => part)
          ]
        }
      ]
    };
    
    // 设置API端点
    // 使用gemini-1.5-pro代替gemini-2.0-flash-exp-image-generation
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
    
    // 设置axios选项，禁用SSL验证
    const axiosOptions = {
      headers: {
        'Content-Type': 'application/json'
      },
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false
      })
    };
    
    // 发送请求
    console.log('发送请求到API...');
    const response = await axios.post(apiUrl, requestData, axiosOptions);
    
    // 返回响应数据
    return response.data;
  } catch (error) {
    console.error('自定义客户端请求失败:', error);
    
    // 详细输出错误信息
    if (axios.isAxiosError(error)) {
      console.error('错误状态:', error.response?.status);
      console.error('错误数据:', error.response?.data);
      console.error('错误配置:', error.config);
    }
    
    throw error;
  }
} 