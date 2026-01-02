/**
 * 场景 5: 修改敏感文件需要提醒
 *
 * 背景: 这个文件之前出过问题，修改时需要特别注意
 * 预期: 应创建 ai-context trigger，当修改此文件时注入上下文提醒
 *
 * 历史问题:
 * - 曾经因为修改 hook 逻辑导致无限循环
 * - 曾经因为忘记处理边界情况导致崩溃
 *
 * 测试方法:
 * 1. 修改此文件
 * 2. stop hook 触发
 * 3. 由于不能设计确定的 trigger，应记录为 ai-context
 */

export interface Hook {
  name: string;
  execute: () => void;
}

// 注意：修改此函数时要考虑边界情况
export function runHooks(hooks: Hook[]): void {
  for (const hook of hooks) {
    try {
      hook.execute();
    } catch (error) {
      console.error(`Hook ${hook.name} failed:`, error);
      // BUG: 应该继续执行其他 hooks 还是停止？
    }
  }
}

// 注意：这个函数曾经导致无限循环
export function createHook(name: string, fn: () => void): Hook {
  return {
    name,
    execute: fn,
  };
}
