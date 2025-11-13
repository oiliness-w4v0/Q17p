import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './index';
import path from 'path';

export async function runMigrations() {
  try {
    console.log('🔄 Running migrations...');
    
    await migrate(db, {
      migrationsFolder: path.join(__dirname, 'db', 'migrations'),
    });
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
