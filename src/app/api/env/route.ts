import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 检查必要的环境变量
  const requiredEnvVars = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
    'GOOGLE_API_KEY'
  ];
  
  const envStatus: Record<string, {exists: boolean, preview: string | null}> = {};
  
  requiredEnvVars.forEach(varName => {
    // 只返回变量是否存在，而不返回具体的值（出于安全考虑）
    envStatus[varName] = {
      exists: !!process.env[varName],
      // 如果变量存在，只显示前几个字符，其余用星号代替
      preview: process.env[varName] 
        ? `${process.env[varName].substring(0, 3)}${'*'.repeat(5)}` 
        : null
    };
  });
  
  return NextResponse.json({
    message: 'Environment variables status',
    envStatus,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
} 