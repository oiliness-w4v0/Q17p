import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { app } from 'electron';
import path from 'path';
import * as schema from './schema';

const isDev = process.env.NODE_ENV === 'development';

// 数据库文件路径
const dbPath = isDev
  ? path.join(process.cwd(), 'local.db') // 开发模式：项目根目录
  : path.join(app.getPath('userData'), 'app.db'); // 生产模式：用户数据目录

// 创建 libsql 客户端
const client = createClient({
  url: `file:${dbPath}`,
});

// 创建 Drizzle 实例
export const db = drizzle(client, { schema });

// 导出 schema 供其他模块使用
export { schema };

// 日志
console.log(`📦 Database initialized at: ${dbPath}`);
