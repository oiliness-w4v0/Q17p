import { build } from 'bun';
import { rmSync, cpSync, existsSync } from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

// 清理 dist 目录
try {
  rmSync('dist', { recursive: true, force: true });
  console.log('✓ 清理 dist 目录');
} catch (error) {
  // 目录不存在，忽略错误
}

// 构建主进程
await build({
  entrypoints: ['./src/main/index.ts'],
  outdir: './dist/main',
  target: 'node',
  format: 'cjs',
  minify: false,
  sourcemap: 'external',
  external: ['electron'],
});
console.log('✓ 主进程构建完成');

// 构建 preload
await build({
  entrypoints: ['./src/preload/index.ts'],
  outdir: './dist/preload',
  target: 'node',
  format: 'cjs',
  minify: false,
  sourcemap: 'external',
  external: ['electron'],
});
console.log('✓ Preload 构建完成');

// 生产模式：复制 web 构建结果
if (!isDev) {
  const webDistPath = path.resolve(__dirname, '../web/dist');
  const targetPath = path.resolve(__dirname, './dist/web-dist');
  
  if (existsSync(webDistPath)) {
    cpSync(webDistPath, targetPath, { recursive: true });
    console.log('✓ Web 构建结果复制完成');
  } else {
    console.warn('⚠ Web 构建结果不存在，请先构建 web 项目');
  }
}

console.log('\n构建完成！');
