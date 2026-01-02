/**
 * 场景 2: 忘记 build 就 publish
 *
 * BUG: 直接运行 npm publish 而没有先 build
 * 预期: 应创建 command trigger 拦截 "npm publish"
 *
 * 测试方法:
 * 1. 修改此文件（模拟开发）
 * 2. 尝试运行 npm publish
 * 3. 应该被 command trigger 拦截
 */

export function getVersion(): string {
  return "1.0.0";
}

// 发布检查清单（应该在 publish 前完成）
export const publishChecklist = [
  "Run build",
  "Run tests",
  "Update version",
  "Update changelog",
];
