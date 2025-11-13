import { ipcMain } from 'electron';
import {
  getEmailLogs,
  getDailyStats,
  getOverallStats,
} from '../services/stats';

export function registerStatsHandlers() {
  // 获取邮件发送历史
  ipcMain.handle('stats:get-email-logs', async (_, userId: string, limit?: number) => {
    try {
      const logs = await getEmailLogs(userId, limit);
      return { success: true, data: logs };
    } catch (error: any) {
      console.error('获取邮件日志失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取近N天的阅读统计
  ipcMain.handle('stats:get-daily-stats', async (_, userId: string, days?: number) => {
    try {
      const stats = await getDailyStats(userId, days);
      return { success: true, data: stats };
    } catch (error: any) {
      console.error('获取每日统计失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取总体统计
  ipcMain.handle('stats:get-overall-stats', async (_, userId: string) => {
    try {
      const stats = await getOverallStats(userId);
      return { success: true, data: stats };
    } catch (error: any) {
      console.error('获取总体统计失败:', error);
      return { success: false, error: error.message };
    }
  });
}
