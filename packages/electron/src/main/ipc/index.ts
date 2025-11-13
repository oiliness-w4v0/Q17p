import { registerUserHandlers } from './user';
import { registerFeedHandlers } from './feed';
import { registerArticleHandlers } from './article';
import { setupEmailIpc } from './email';
import { registerStatsHandlers } from './stats';

export function registerIpcHandlers() {
  registerUserHandlers();
  registerFeedHandlers();
  registerArticleHandlers();
  setupEmailIpc();
  registerStatsHandlers();
  console.log('✅ All IPC handlers registered');
}
