import { ipcMain } from 'electron';
import { shareArticleByEmail } from '../services/email';

export function setupEmailIpc() {
  // 分享文章到邮箱
  ipcMain.handle('email:share-article', async (_event, data: {
    to: string;
    article: {
      title: string;
      link: string;
      author?: string;
      pubDate?: string;
      description?: string;
    };
    userId?: string;
    articleId?: string;
  }) => {
    try {
      const success = await shareArticleByEmail(
        data.to,
        data.article,
        data.userId,
        data.articleId
      );
      return {
        success,
        error: success ? null : '发送邮件失败',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '发送邮件失败',
      };
    }
  });
}
