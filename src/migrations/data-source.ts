import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'mysql',
    password: process.env.DB_PASSWORD || 'mysql',
    database: process.env.DB_DATABASE || 'hexcore',
    entities: ['src/**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: false,
});
