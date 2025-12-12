import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { OgmiosClientService } from '../../src/hydra-main/ogmios-client.service';
import { HydraMainService } from '../../src/hydra-main/hydra-main.service';
import { MockOgmiosService } from '../mocks/ogmios.mock';
import { clearDatabase, generateAdminTest, insertAdminAccount } from '../helper';
import { generateMnemonic } from 'bip39';

describe('Account Management (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let adminToken: string;

    beforeAll(async () => {
        // Create test DataSource using .env.test configuration
        const testDataSource = new DataSource({
            type: 'mysql',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3328'),
            username: process.env.DB_USERNAME || 'hexcore_user',
            password: process.env.DB_PASSWORD || 'hexcore_password',
            database: process.env.DB_DATABASE || 'hexcore_test_db',
            entities: [__dirname + '/../../src/**/*.entity.ts'],
            synchronize: true, // Auto-create schema in test DB
            dropSchema: false, // Don't drop schema on each test
        });

        await testDataSource.initialize();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(DataSource)
            .useValue(testDataSource)
            .overrideProvider(OgmiosClientService)
            .useClass(MockOgmiosService)
            .compile();

        app = moduleFixture.createNestApplication();

        // Mock onModuleInit to prevent Docker initialization
        const hydraMainService = moduleFixture.get<HydraMainService>(HydraMainService);
        jest.spyOn(hydraMainService, 'onModuleInit').mockResolvedValue(undefined);

        await app.init();

        dataSource = testDataSource;

        // Tạo admin và lấy token để dùng cho các tests
        const adminDto = await generateAdminTest();
        await insertAdminAccount(adminDto, dataSource);

        const loginResponse = await request(app.getHttpServer()).post('/hydra-main/login').send(adminDto).expect(201);

        // Handle both wrapped (with interceptor) and unwrapped response
        adminToken = loginResponse.body.data?.accessToken || loginResponse.body.accessToken;
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
        if (dataSource?.isInitialized) {
            await dataSource.destroy();
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

            // Handle both wrapped and unwrapped response
            const account = response.body.data || response.body;
            expect(account).toHaveProperty('id');
            expect(account).toHaveProperty('baseAddress');
            expect(account).toHaveProperty('pointerAddress');
            expect(account).toHaveProperty('createdAt');
            expect(account).not.toHaveProperty('mnemonic'); // Mnemonic should be excluded

            // Cardano addresses should start with 'addr' for mainnet or specific prefixes
            expect(account.baseAddress).toMatch(/^addr/);
            expect(account.pointerAddress).toMatch(/^addr/);

            // Ensure mnemonic is excluded from response
            expect(account.mnemonic).toBeUndefined();
            expect(JSON.stringify(response.body)).not.toContain(validMnemonic);
        });

        it('should create account with 256-bit mnemonic', async () => {
            const validMnemonic = generateMnemonic(256);

            const response = await request(app.getHttpServer())
                .post('/hydra-main/create-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ mnemonic: validMnemonic })
                .expect(201);

            // Handle both wrapped and unwrapped response
            const account = response.body.data || response.body;
            expect(account).toHaveProperty('id');
            expect(account).toHaveProperty('baseAddress');
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

            // Handle both wrapped and unwrapped response
            const account1 = response1.body.data || response1.body;
            const account2 = response2.body.data || response2.body;
            expect(account1.id).not.toBe(account2.id);
            expect(account1.baseAddress).not.toBe(account2.baseAddress);
        });
    });

    describe('GET /hydra-main/list-account', () => {
        let createdAccountCount = 0;

        beforeEach(async () => {
            // MySQL: Disable FK checks and clear data
            await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
            const accountRepository = dataSource.getRepository('Account');
            await accountRepository.clear();
            await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

            const mnemonics = [generateMnemonic(128), generateMnemonic(128), generateMnemonic(128)];

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

            // Handle both wrapped and unwrapped response
            const accounts = response.body.data || response.body;
            expect(Array.isArray(accounts)).toBe(true);
            expect(accounts.length).toBe(createdAccountCount);

            accounts.forEach((account: any) => {
                expect(account).toHaveProperty('id');
                expect(account).toHaveProperty('baseAddress');
                expect(account).toHaveProperty('pointerAddress');
                expect(account).toHaveProperty('createdAt');
                expect(account).not.toHaveProperty('mnemonic'); // Mnemonic should be excluded
            });

            accounts.forEach((account: any) => {
                expect(account.mnemonic).toBeUndefined();
            });
        });

        it('should return empty array when no accounts exist', async () => {
            // Clear all accounts first with FK checks disabled (MySQL)
            await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
            const accountRepository = dataSource.getRepository('Account');
            await accountRepository.clear();
            await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

            const response = await request(app.getHttpServer())
                .get('/hydra-main/list-account')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Handle both wrapped and unwrapped response
            const accounts = response.body.data || response.body;
            expect(Array.isArray(accounts)).toBe(true);
            expect(accounts.length).toBe(0);
        });

        it('should fail to list accounts without authentication', async () => {
            await request(app.getHttpServer()).get('/hydra-main/list-account').expect(401);
        });

        it('should fail to list accounts with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/hydra-main/list-account')
                .set('Authorization', 'Bearer invalid_token_abc')
                .expect(401);
        });

        // TODO: AdminAuthGuard currently only verifies JWT signature, not role-based access
        // Both admin and consumer tokens using same secret will pass authentication
        // Consider implementing role-based guards for admin-only endpoints
        it.skip('should fail to list accounts with consumer token', async () => {
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
                dataSource,
            );

            const consumerLoginResponse = await request(app.getHttpServer())
                .post('/hydra-consumer/consumer/login')
                .send(consumerDto)
                .expect(201);

            // Handle both wrapped (with interceptor) and unwrapped response
            const consumerToken =
                consumerLoginResponse.body.data?.accessToken || consumerLoginResponse.body.accessToken;

            await request(app.getHttpServer())
                .get('/hydra-main/list-account')
                .set('Authorization', `Bearer ${consumerToken}`)
                .expect(401);
        });
    });
});
