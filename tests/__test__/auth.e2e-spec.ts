import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from '../setup';
import {
    clearDatabase,
    generateAdminTest,
    generateConsumerTest,
    insertAdminAccount,
    insertConsumerAccount,
    StatusConsumerType,
} from '../helper';

describe('Authentication (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    beforeAll(async () => {
        const testApp = await createTestApp();
        app = testApp.app;
        dataSource = testApp.dataSource;
    });

    beforeEach(async () => {
        // Clean database before each test to avoid duplicates
        if (dataSource?.isInitialized) {
            await clearDatabase(dataSource);
        }
    });

    afterAll(async () => {
        if (dataSource?.isInitialized) {
            await clearDatabase(dataSource);
        }
        if (app) {
            await app.close();
        }
    });

    // ========== ADMIN AUTHENTICATION ==========
    describe('Admin Authentication', () => {
        describe('POST /login (Admin)', () => {
            it('should login admin successfully with valid credentials', async () => {
                const adminDto = await generateAdminTest();
                await insertAdminAccount(adminDto, dataSource);

                const response = await request(app.getHttpServer())
                    .post('/hydra-main/login')
                    .send(adminDto)
                    .expect(201);

                // Handle both wrapped and unwrapped response
                const loginData = response.body.data || response.body;
                expect(loginData).toHaveProperty('accessToken');
                expect(loginData).not.toHaveProperty('user'); // API chỉ trả về accessToken
            });

            it('should fail login with wrong password', async () => {
                const adminDto = await generateAdminTest();
                await insertAdminAccount(adminDto, dataSource);

                await request(app.getHttpServer())
                    .post('/hydra-main/login')
                    .send({
                        username: adminDto.username,
                        password: 'wrong_password',
                    })
                    .expect(401);
            });

            it('should fail login with non-existent username', async () => {
                await request(app.getHttpServer())
                    .post('/hydra-main/login')
                    .send({
                        username: 'nonexistent_admin',
                        password: 'some_password',
                    })
                    .expect(401);
            });

            it('should fail login with empty username', async () => {
                await request(app.getHttpServer())
                    .post('/hydra-main/login')
                    .send({
                        username: '',
                        password: 'some_password',
                    })
                    .expect(400);
            });

            it('should fail login with empty password', async () => {
                await request(app.getHttpServer())
                    .post('/hydra-main/login')
                    .send({
                        username: 'admin_test',
                        password: '',
                    })
                    .expect(400);
            });

            it('should fail login with missing credentials', async () => {
                await request(app.getHttpServer()).post('/hydra-main/login').send({}).expect(400);
            });
        });

        describe('GET /auth (Admin Authorization)', () => {
            it('should authorize admin successfully with valid token', async () => {
                const adminDto = await generateAdminTest();
                await insertAdminAccount(adminDto, dataSource);

                const loginResponse = await request(app.getHttpServer())
                    .post('/hydra-main/login')
                    .send(adminDto)
                    .expect(201);

                const accessToken = loginResponse.body.data?.accessToken || loginResponse.body.accessToken;

                const response = await request(app.getHttpServer())
                    .get('/hydra-main/auth')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .expect(200);

                // Handle both wrapped and unwrapped response
                const authData = response.body.data || response.body;
                expect(authData).toHaveProperty('id');
                expect(authData).toHaveProperty('username', adminDto.username);
            });

            it('should fail authorization without token', async () => {
                await request(app.getHttpServer()).get('/hydra-main/auth').expect(401);
            });

            it('should fail authorization with invalid token', async () => {
                await request(app.getHttpServer())
                    .get('/hydra-main/auth')
                    .set('Authorization', 'Bearer invalid_token_12345')
                    .expect(401);
            });

            it('should fail authorization with malformed token', async () => {
                await request(app.getHttpServer())
                    .get('/hydra-main/auth')
                    .set('Authorization', 'InvalidFormat')
                    .expect(401);
            });

            it('should fail authorization with expired token', async () => {
                // Token đã hết hạn (expired in 2020)
                const expiredToken =
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWQiOjEsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxNjA5NDU5MjAxfQ.invalidSignature';

                await request(app.getHttpServer())
                    .get('/hydra-main/auth')
                    .set('Authorization', `Bearer ${expiredToken}`)
                    .expect(401);
            });
        });
    });
});
