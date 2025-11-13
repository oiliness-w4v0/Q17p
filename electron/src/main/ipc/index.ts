import { registerUserHandlers } from './user';
import { registerFeedHandlers } from './feed';
import { registerArticleHandlers } from './article';

export function registerIpcHandlers() {
  registerUserHandlers();
  registerFeedHandlers();
  registerArticleHandlers();
  console.log('✅ All IPC handlers registered');
}
