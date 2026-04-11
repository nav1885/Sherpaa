import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// Single SQLite connection shared across the app
const sqlite = SQLite.openDatabaseSync('sherpaa.db');

export const db = drizzle(sqlite, { schema });

export type DB = typeof db;
