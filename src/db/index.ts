import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './migrations/schema';

// Conexão segura que funciona em Serverless (Vercel)
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });