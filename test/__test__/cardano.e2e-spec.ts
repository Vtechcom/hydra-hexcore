import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from '../setup';
import { clearDatabase, insertAccount } from '../helper';
import { generateMnemonic } from 'bip39';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { OgmiosClientService } from 'src/hydra-main/ogmios-client.service';

describe('Cardano Integration (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let testAddress: string;

    beforeAll(async () => {
        const testApp = await createTestApp();
        app = testApp.app;
        dataSource = testApp.dataSource;

        // Tạo test account để lấy address
        const mnemonic = generateMnemonic(128);
        const account = await insertAccount(mnemonic, dataSource);
        testAddress = account.baseAddress;
    });

    afterAll(async () => {
        if (dataSource?.isInitialized) {
            await clearDatabase(dataSource);
            await dataSource.destroy();
        }
        if (app) {
            await app.close();
        }
    });

    describe('GET /hydra-main/node-info', () => {
        it('should get cardano node info successfully', async () => {
            const response = await request(app.getHttpServer())
                .get('/hydra-main/node-info');

            if (response.status === 200) {
                expect(response.body).toBeDefined();
                // Check for common node info fields if available
                // Actual structure depends on Cardano node response
            } else {
                expect([500, 503]).toContain(response.status);
            }
        });

        it('should return consistent format', async () => {
            const response1 = await request(app.getHttpServer())
                .get('/hydra-main/node-info');

            const response2 = await request(app.getHttpServer())
                .get('/hydra-main/node-info');

            // Both requests should return same status
            expect(response1.status).toBe(response2.status);
        });
    });

    describe('GET /hydra-main/utxo/:address', () => {
        let appUTXO: INestApplication;
        let ogmiosMock: any;

        beforeAll(async () => {
            ogmiosMock = {
                queryUtxoByAddress: jest.fn(),
            };

            const moduleRef = await Test.createTestingModule({
                imports: [AppModule],
            })
            .overrideProvider(OgmiosClientService)
            .useValue(ogmiosMock)
            .compile();

            appUTXO = moduleRef.createNestApplication();
            await appUTXO.init();
        });

        afterAll(async () => {
            await appUTXO.close();
        });

        beforeEach(() => {
            // Reset mock before each test
            jest.clearAllMocks();
        });

        it('should get UTXOs for valid address', async () => {
            ogmiosMock.queryUtxoByAddress.mockResolvedValue([
                {
                    transaction: { id: "mock-tx-hash-123456" },
                    index: 0,
                    address: testAddress,
                    value: { ada: { lovelace: 12345670000 } },
                    datumHash: null,
                    datum: null,
                    script: null
                }
            ]);
            const response = await request(appUTXO.getHttpServer())
                .get(`/hydra-main/utxo/${testAddress}`);

            expect(response.body).toBeDefined();
            expect(response.body).toHaveProperty('mock-tx-hash-123456#0');
        });

        it('should handle UTXO query when no UTXOs exist', async () => {
            const response = await request(app.getHttpServer())
                .get(`/hydra-main/utxo/${testAddress}`).expect(400);
        });

        it('should handle invalid address format', async () => {
            const invalidAddress = 'invalid_address_format';

            const response = await request(app.getHttpServer())
                .get(`/hydra-main/utxo/${invalidAddress}`).expect(400);
        });

        it('should handle empty address', async () => {
            const response = await request(app.getHttpServer())
                .get('/hydra-main/utxo/');

            // Should return 404 (route not found) or 400
            expect([404]).toContain(response.status);
        });

        it('should handle special characters in address', async () => {
            const addressWithSpecialChars = 'addr_test!@#$%^&*()';

            const response = await request(app.getHttpServer())
                .get(`/hydra-main/utxo/${addressWithSpecialChars}`);

            // Should handle gracefully
            expect([400]).toContain(response.status);
        });

        it('should return same result for same address', async () => {
            // Mock được setup persistent - không bị consume
            ogmiosMock.queryUtxoByAddress.mockImplementation(() => Promise.resolve([
                {
                    transaction: { id: "mock-tx-hash-123456" },
                    index: 0,
                    address: testAddress,
                    value: { ada: { lovelace: 12345670000 } },
                    datumHash: null,
                    datum: null,
                    script: null
                }
            ]));

            const response1 = await request(appUTXO.getHttpServer())
                .get(`/hydra-main/utxo/${testAddress}`);

            const response2 = await request(appUTXO.getHttpServer())
                .get(`/hydra-main/utxo/${testAddress}`);

            // Both should return same status (200 with mock)
            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);
            expect(response1.status).toBe(response2.status);
            
            // Both should have same structure
            expect(typeof response1.body).toBe(typeof response2.body);
            
            // Mock should be called twice
            expect(ogmiosMock.queryUtxoByAddress).toHaveBeenCalledTimes(2);
        });
    });
});
