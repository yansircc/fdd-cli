/**
 * 场景 3: 类型变更没跑 typecheck
 *
 * BUG: 修改了类型定义但没有运行 typecheck
 * 预期: 应创建 change trigger，当此文件变更时 must_run typecheck
 *
 * 测试方法:
 * 1. 修改下面的 User 接口
 * 2. stop hook 触发
 * 3. 记录时应识别为 change trigger
 */

export interface User {
  id: number;
  name: string;
  email: string;
  // BUG: 添加了新字段但其他地方没有更新
  // age?: number;  // 取消注释来模拟变更
}

export function createUser(data: User): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
  };
}

export function validateUser(user: User): boolean {
  return user.id > 0 && user.name.length > 0 && user.email.includes("@");
}
