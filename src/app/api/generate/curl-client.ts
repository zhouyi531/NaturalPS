import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * 使用curl直接调用Google Gemini API
 * 作为后备解决方案
 */
export async function generateWithCurl(
  apiKey: string, 
  prompt: string, 
  imageParts: any[] = []
): Promise<{text: string, tempFile?: string}> {
  return new Promise((resolve, reject) => {
    try {
      console.log('使用curl客户端调用Gemini API...');
      
      // 准备请求数据
      const requestData = {
        contents: [
          {
            parts: [
              { text: prompt },
              ...imageParts
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        }
      };
      
      // 构建curl命令，使用--insecure忽略SSL证书验证
      // 这只影响curl进程，不会影响整个Node.js环境
      const curlCommand = `curl --insecure -X POST \
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}" \
        -H "Content-Type: application/json" \
        -d '${JSON.stringify(requestData)}'`;
      
      console.log('执行curl请求...');
      
      // 执行curl命令
      exec(curlCommand, async (error, stdout, stderr) => {
        if (error) {
          console.error('执行curl时出错:', error);
          return reject(error);
        }
        
        // 检查stderr是否包含有用信息
        if (stderr && !stderr.includes('% Total')) {
          console.warn('curl警告或信息:', stderr);
        }
        
        if (!stdout || stdout.trim() === '') {
          console.error('curl没有返回任何数据');
          return reject(new Error('API没有返回数据'));
        }
        
        try {
          // 解析响应
          const response = JSON.parse(stdout);
          
          // 提取文本响应
          if (response.candidates && response.candidates.length > 0) {
            const text = response.candidates[0].content.parts[0].text;
            console.log('成功获取响应');
            
            // 创建临时文件存储响应
            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) {
              fs.mkdirSync(tmpDir, { recursive: true });
            }
            
            const tempPath = path.join(tmpDir, `${uuidv4()}.txt`);
            fs.writeFileSync(tempPath, text);
            
            // 返回响应和临时文件路径
            return resolve({
              text: text,
              tempFile: tempPath
            });
          } else {
            console.error('API响应没有候选项:', JSON.stringify(response));
            return reject(new Error('API返回的响应中没有候选项'));
          }
        } catch (parseError) {
          console.error('解析API响应时出错:', parseError);
          console.error('原始响应:', stdout);
          return reject(parseError);
        }
      });
    } catch (execError) {
      console.error('执行curl命令时出错:', execError);
      return reject(execError);
    }
  });
} 