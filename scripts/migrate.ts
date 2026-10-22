import 'dotenv/config';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { getDatabase } from '../src/db';

await migrate(getDatabase(), { migrationsFolder: './drizzle' });
console.log('Database migrations applied.');
