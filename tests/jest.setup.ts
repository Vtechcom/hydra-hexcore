import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test file before running tests
config({ path: resolve(__dirname, '../.env.test') });

console.log('✓ Test environment loaded from .env.test');
console.log(
    `  DB: ${process.env.DB_USERNAME}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
);
