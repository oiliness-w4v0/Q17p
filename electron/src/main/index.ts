import { app, BrowserWindow } from 'electron';
import path from 'path';
import { runMigrations } from './db/migrate';
import { registerIpcHandlers } from './ipc';

const isDev = process.env.NODE_ENV === 'development';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: '烟熏三文鱼的阅读神器',
    webPreferences: {
      preload: path.join(__dirname, '../../dist/preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    // 开发模式：加载 web 开发服务器
    mainWindow.loadURL(WEB_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载 web 构建结果
    mainWindow.loadFile(path.join(__dirname, '../../web-dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // 运行数据库迁移
  await runMigrations();
  
  // 注册 IPC 处理程序
  registerIpcHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
