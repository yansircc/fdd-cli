/**
 * 场景 6: 缺少环境变量检查
 *
 * BUG: 直接使用环境变量而没有检查是否存在
 * 预期: 应创建 dynamic trigger，运行时检查必要的环境变量
 *
 * 测试方法:
 * 1. 修复此文件，添加环境变量检查
 * 2. stop hook 触发
 * 3. 记录时应识别为 dynamic trigger (shell 检查)
 */

// 通用的安全环境变量获取函数
export function safeGetEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// 已修复：使用 safeGetEnv 检查 API_KEY 是否存在
export function getApiKey(): string {
  return safeGetEnv('API_KEY');
}

// 已修复：使用 safeGetEnv 检查 DATABASE_URL 是否存在
export function getDatabaseUrl(): string {
  return safeGetEnv('DATABASE_URL');
}
