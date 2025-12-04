import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from '../setup';
import { clearDatabase, generateAdminTest, insertAdminAccount } from '../helper';
import { generateMnemonic } from 'bip39';

describe('Account Management (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let adminToken: string;

    beforeAll(async () => {
        const testApp = await createTestApp();
        app = testApp.app;
        dataSource = testApp.dataSource;

        // Tạo admin và lấy token để dùng cho các tests
        const adminDto = await generateAdminTest();
        await insertAdminAccount(adminDto, dataSource);

        const loginResponse = await request(app.getHttpServer())
            .post('/hydra-main/login')
            .send(adminDto)
            .expect(201);

        adminToken = loginResponse.body.accessToken;
    });

    afterAll(async () => {
        if (dataSource?.isInitialized) {
            await clearDatabase(dataSource);
        }
        if (app) {
            await app.close();
        }
    });

    describe('POST /hydra-main/create-account', () => {
        it('should create account successfully with valid mnemonic', async () => {
            const validMnemonic = generateMnemonic(128);

            const response = await request(app.getHttpServer())
                .post('/hydra-main/create-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ mnemonic: validMnemonic })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('baseAddress');
            expect(response.body).toHaveProperty('pointerAddress');
            expect(response.body).toHaveProperty('createdAt');
            expect(response.body).not.toHaveProperty('mnemonic'); // Mnemonic should be excluded

            // Cardano addresses should start with 'addr' for mainnet or specific prefixes
            expect(response.body.baseAddress).toMatch(/^addr/);
            expect(response.body.pointerAddress).toMatch(/^addr/);

            // Ensure mnemonic is excluded from response
            expect(response.body.mnemonic).toBeUndefined();
            expect(JSON.stringify(response.body)).not.toContain(validMnemonic);
        });

        it('should create account with 256-bit mnemonic', async () => {
            const validMnemonic = generateMnemonic(256);

            const response = await request(app.getHttpServer())
                .post('/hydra-main/create-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ mnemonic: validMnemonic })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('baseAddress');
        });

        it('should fail to create account with invalid mnemonic', async () => {
            const invalidMnemonic = 'invalid mnemonic phrase that is not valid';

            await request(app.getHttpServer())
                .post('/hydra-main/create-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ mnemonic: invalidMnemonic })
                .expect(400);
        });

        it('should fail to create account with empty mnemonic', async () => {
            await request(app.getHttpServer())
                .post('/hydra-main/create-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ mnemonic: '' })
                .expect(400);
        });

        it('should fail to create account with missing mnemonic', async () => {
            await request(app.getHttpServer())
                .post('/hydra-main/create-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(400);
        });

        it('should fail to create account without authentication', async () => {
            const validMnemonic = generateMnemonic(128);

            await request(app.getHttpServer())
                .post('/hydra-main/create-account')
                .send({ mnemonic: validMnemonic })
                .expect(401);
        });

        it('should fail to create account with invalid token', async () => {
            const validMnemonic = generateMnemonic(128);

            await request(app.getHttpServer())
                .post('/hydra-main/create-account')
                .set('Authorization', 'Bearer invalid_token_xyz')
                .send({ mnemonic: validMnemonic })
                .expect(401);
        });

        it('should create multiple accounts with different mnemonics', async () => {
            const mnemonic1 = generateMnemonic(128);
            const mnemonic2 = generateMnemonic(128);

            const response1 = await request(app.getHttpServer())
                .post('/hydra-main/create-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ mnemonic: mnemonic1 })
                .expect(201);

            const response2 = await request(app.getHttpServer())
                .post('/hydra-main/create-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ mnemonic: mnemonic2 })
                .expect(201);

            expect(response1.body.id).not.toBe(response2.body.id);
            expect(response1.body.baseAddress).not.toBe(response2.body.baseAddress);
        });
    });

    describe('GET /hydra-main/list-account', () => {
        let createdAccountCount = 0;

        beforeEach(async () => {
            await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
            const accountRepository = dataSource.getRepository('Account');
            await accountRepository.clear();
            await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

            const mnemonics = [
                generateMnemonic(128),
                generateMnemonic(128),
                generateMnemonic(128),
            ];

            createdAccountCount = mnemonics.length;

            for (const mnemonic of mnemonics) {
                await request(app.getHttpServer())
                    .post('/hydra-main/create-account')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ mnemonic })
                    .expect(201);
            }
        });

        it('should list all accounts successfully', async () => {
            const response = await request(app.getHttpServer())
                .get('/hydra-main/list-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(createdAccountCount);

            response.body.forEach((account: any) => {
                expect(account).toHaveProperty('id');
                expect(account).toHaveProperty('baseAddress');
                expect(account).toHaveProperty('pointerAddress');
                expect(account).toHaveProperty('createdAt');
                expect(account).not.toHaveProperty('mnemonic'); // Mnemonic should be excluded
            });

            response.body.forEach((account: any) => {
                expect(account.mnemonic).toBeUndefined();
            });
        });

        it('should return empty array when no accounts exist', async () => {
            // Clear all accounts first with FK checks disabled
            await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
            const accountRepository = dataSource.getRepository('Account');
            await accountRepository.clear();
            await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

            const response = await request(app.getHttpServer())
                .get('/hydra-main/list-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(0);
        });

        it('should fail to list accounts without authentication', async () => {
            await request(app.getHttpServer())
                .get('/hydra-main/list-account')
                .expect(401);
        });

        it('should fail to list accounts with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/hydra-main/list-account')
                .set('Authorization', 'Bearer invalid_token_abc')
                .expect(401);
        });

        it('should fail to list accounts with consumer token', async () => {
            // Consumer không được phép access admin endpoints
            const { generateConsumerTest, insertConsumerAccount, StatusConsumerType } = await import('../helper');
            
            // Tạo consumer với unique address để tránh duplicate
            const consumerDto = {
                address: `consumer_account_test_${Date.now()}`,
                password: 'StrongPassword123!',
            };
            
            await insertConsumerAccount(
                {
                    ...consumerDto,
                    status: StatusConsumerType.ACTIVE,
                },
                dataSource
            );

            const consumerLoginResponse = await request(app.getHttpServer())
                .post('/hydra-consumer/consumer/login')
                .send(consumerDto)
                .expect(201);

            const consumerToken = consumerLoginResponse.body.accessToken;

            await request(app.getHttpServer())
                .get('/hydra-main/list-account')
                .set('Authorization', `Bearer ${consumerToken}`)
                .expect(401);
        });
    });
});
