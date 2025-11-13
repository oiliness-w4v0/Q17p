import { ipcMain } from 'electron';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { NewUser, User } from '../db/schema';

// 创建用户
ipcMain.handle('user:create', async (_, data: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const [user] = await db.insert(users).values(data).returning();
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 获取所有用户
ipcMain.handle('user:getAll', async () => {
  try {
    const allUsers = await db.select().from(users);
    return { success: true, data: allUsers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 根据 ID 获取用户
ipcMain.handle('user:getById', async (_, userId: string) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 更新用户
ipcMain.handle('user:update', async (_, userId: string, data: Partial<User>) => {
  try {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// 删除用户
ipcMain.handle('user:delete', async (_, userId: string) => {
  try {
    await db.delete(users).where(eq(users.id, userId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

export const registerUserHandlers = () => {
  console.log('✓ User IPC handlers registered');
};
