/**
 * 场景 1: 无效正则表达式
 *
 * BUG: 正则表达式括号未闭合，会在运行时抛出 SyntaxError
 * 预期: 修复后应记录为 rule trigger (检测 new RegExp 的模式)
 */

export function validateEmail(email: string): boolean {
  // BUG: 括号未闭合 - "(unclosed" 是无效正则
  const pattern = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|org|net");
  return pattern.test(email);
}

export function extractNumbers(text: string): string[] {
  // 这个是正确的，用于对比
  const pattern = /\d+/g;
  return text.match(pattern) || [];
}
