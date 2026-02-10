import 'dotenv/config';
export const jwtConstants = {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_key',
};
