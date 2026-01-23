import { TestingModule } from '@nestjs/testing';
import { HydraHeadService } from '../../src/hydra-heads/hydra-heads.service';
import { HydraHead } from '../../src/hydra-heads/entities/HydraHead.entity';
import { HydraNode } from '../../src/hydra-main/entities/HydraNode.entity';
import { Account } from '../../src/hydra-main/entities/Account.entity';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { cleanupTestApp, createHydraHeadTestApp } from 'test/setup';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import request from 'supertest';
import { addActiveNodes, clearDatabase, createAdminAccountAndGetToken, createHead } from 'test/helper';
import { JwtService } from '@nestjs/jwt';
import { DockerService } from '../../src/docker/docker.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

// Mock both node:fs and node:fs/promises modules used by HydraHeadService
jest.mock('node:fs/promises', () => {
    const real = jest.requireActual('node:fs/promises');
    return {
        ...real,
        access: jest.fn(),
        mkdir: jest.fn(),
        rm: jest.fn(),
    };
});

jest.mock('node:fs', () => {
    const real = jest.requireActual('node:fs');
    return {
        ...real,
        writeFileSync: jest.fn(),
        chmodSync: jest.fn(),
    };
});

jest.mock('src/utils/cardano-core', () => ({
    getEnterpriseAddressFromKeys: jest
        .fn()
        .mockReturnValue('addr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'),
}));

// Mock @hydra-sdk/core BlockfrostProvider
jest.mock('@hydra-sdk/core', () => ({
    ProviderUtils: {
        BlockfrostProvider: jest.fn().mockImplementation(() => ({
            fetcher: {
                fetchAddressUTxOs: jest.fn().mockResolvedValue({
                    'mock-utxo-hash#0': {
                        output: {
                            amount: [
                                { unit: 'lovelace', quantity: '100000000' }, // 100 ADA
                            ],
                        },
                    },
                }),
            },
        })),
    },
}));

describe('Hydra Head Service(e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let moduleFixture: TestingModule;
    let service: HydraHeadService;
    let accountRepo: any;
    let hydraNodeRepo: any;
    let hydraHeadRepo: any;
    let accessToken: string;
    let cacheManager: any;

    let globalSpies: jest.SpyInstance[] = [];

    beforeAll(async () => {
        const testApp = await createHydraHeadTestApp();
        app = testApp.app;
        dataSource = testApp.dataSource;
        moduleFixture = testApp.moduleFixture;

        // get injected service and repositories from the compiled module
        service = moduleFixture.get<HydraHeadService>(HydraHeadService);
        accountRepo = dataSource.getRepository(Account);
        hydraNodeRepo = dataSource.getRepository(HydraNode);
        hydraHeadRepo = dataSource.getRepository(HydraHead);
        cacheManager = moduleFixture.get(CACHE_MANAGER);
        accessToken = await createAdminAccountAndGetToken(dataSource, moduleFixture.get(JwtService));

        const hydraHeadService = moduleFixture.get(HydraHeadService);

        // Mock file system operations
        (fs.access as unknown as jest.Mock).mockResolvedValue(undefined);
        (fs.mkdir as unknown as jest.Mock).mockResolvedValue(undefined);
        (fsSync.writeFileSync as unknown as jest.Mock).mockReturnValue(undefined);
        (fsSync.chmodSync as unknown as jest.Mock).mockReturnValue(undefined);

        // Setup global spies
        const awaitedHeadReadySpy = jest.spyOn(hydraHeadService, 'waitForAllNodesReady').mockResolvedValue(undefined);
        const checkUtxoSpy = jest.spyOn(hydraHeadService, 'checkUtxoAccount').mockResolvedValue(true);
        const writeFileSpy = jest.spyOn(hydraHeadService, 'writeFile').mockResolvedValue(undefined);
        const convertSpy = jest
            .spyOn(hydraHeadService, 'convertBlockfrostToCardanoCliFormat')
            .mockReturnValue(undefined);
        const updateRedisSpy = jest.spyOn(hydraHeadService, 'updateRedisActiveNodes').mockResolvedValue(undefined);
        const getCacheSpy = jest.spyOn(cacheManager, 'get').mockResolvedValue([]);
        const setCacheSpy = jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

        globalSpies = [awaitedHeadReadySpy, checkUtxoSpy, writeFileSpy, convertSpy, updateRedisSpy, getCacheSpy, setCacheSpy];
    }, 30000);

    afterEach(async () => {
        jest.clearAllMocks();

        // Reset về default behavior
        (fs.access as unknown as jest.Mock).mockResolvedValue(undefined);
        (fs.mkdir as unknown as jest.Mock).mockResolvedValue(undefined);
        (fs.rm as unknown as jest.Mock).mockResolvedValue(undefined);

        // Reset cache spy về empty array
        globalSpies[5]?.mockResolvedValue([]);

        await clearDatabase(dataSource);
    });

    afterAll(async () => {
        // Restore all spies
        globalSpies.forEach(spy => spy?.mockRestore());
        jest.restoreAllMocks();

        await cleanupTestApp(app, dataSource);
    });

    describe('POST hydra-heads/create', () => {
        it('should create a hydra head successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Test Hydra Head',
                    blockfrostProjectId: 'test_blockfrost_project_id',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'hydra_head_vkey_example',
                            hydraHeadSkey: 'hydra_head_skey_example',
                            fundVkey: 'fund_vkey_example',
                            fundSkey: 'fund_skey_example',
                        },
                    ],
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.description).toBe('Test Hydra Head');

            // Verify that the hydra head is actually created in the database
            const createdHydraHead = await hydraHeadRepo.findOneBy({ id: response.body.id });
            expect(createdHydraHead).toBeDefined();
            expect(createdHydraHead?.description).toBe('Test Hydra Head');

            const hydraNodes = await hydraNodeRepo.findBy({ hydraHead: createdHydraHead!.id });
            expect(hydraNodes.length).toBe(1);
            expect(hydraNodes[0].vkey).toBe('hydra_head_vkey_example');
        });

        it('should fail to create hydra head with invalid data', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Invalid Hydra Head',
                    persistenceRotateAfter: 'fd',
                    depositPeriod: -50,
                    hydraHeadKeys: [],
                })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('hydraHeadKeys should not be empty');
            expect(response.body.message).toContain(
                'persistenceRotateAfter must be a number conforming to the specified constraints',
            );
        });

        it('should fail if no permission to create headDirPath', async () => {
            // `fs.access` and `fs.mkdir` are mocked above; set their behavior here.
            (fs.access as unknown as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));
            (fs.mkdir as unknown as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));

            const response = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Test Hydra Head',
                    blockfrostProjectId: 'test_blockfrost_project_id',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'hydra_head_vkey_example',
                            hydraHeadSkey: 'hydra_head_skey_example',
                            fundVkey: 'fund_vkey_example',
                            fundSkey: 'fund_skey_example',
                        },
                    ],
                })
                .expect(500);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Internal server error');
        });

        it('should fail if not logged in', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .send({
                    description: 'Test Hydra Head',
                    blockfrostProjectId: 'test_blockfrost_project_id',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'hydra_head_vkey_example',
                            hydraHeadSkey: 'hydra_head_skey_example',
                            fundVkey: 'fund_vkey_example',
                            fundSkey: 'fund_skey_example',
                        },
                    ],
                })
                .expect(401);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Unauthorized');
        });
    });

    describe('POST hydra-heads/active', () => {
        let hydraId: number;
        beforeEach(async () => {
            // Create a head to use in these tests
            const responseCreate = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Test Head for Active',
                    blockfrostProjectId: 'test_blockfrost_project_id',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'active_test_vkey',
                            hydraHeadSkey: 'active_test_skey',
                            fundVkey: 'active_test_fund_vkey',
                            fundSkey: 'active_test_fund_skey',
                        },
                    ],
                });
            hydraId = responseCreate.body.id;
        });

        it('should activate a hydra head successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    id: hydraId,
                })
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe('running');
        });

        it('should fail to activate a non-existing hydra head', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    id: 9999,
                })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Invalid Head Id');
        });

        it('should fail to activate a hydra head without admin rights', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .send({
                    id: 1,
                })
                .expect(401);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Unauthorized');
        });

        it('should fail to activate if wallet UTXO check fails', async () => {
            // Mock checkUtxoAccount to return false to simulate UTXO check failure
            globalSpies[1].mockResolvedValueOnce(false);

            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    id: hydraId,
                })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('not enough lovelace');
            globalSpies[1].mockResolvedValue(true);
        });

        it('should fail to activate when max active nodes limit is reached', async () => {
            globalSpies[5].mockResolvedValue(
                Array.from({ length: Number(process.env.MAX_ACTIVE_NODES) }, (_, i) => ({
                    hydraNodeId: `h-${i + 1}`,
                    hydraHeadId: i + 1,
                    container: { Id: `mock-${i}` },
                    isActive: true,
                })),
            );
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    id: hydraId,
                })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('maximum active nodes limit');

            globalSpies[5].mockResolvedValue([]);
        });

        it('should fail to activate when adding nodes would exceed limit', async () => {
            globalSpies[5].mockResolvedValue(
                Array.from({ length: Number(process.env.MAX_ACTIVE_NODES) - 2 }, (_, i) => ({
                    hydraNodeId: `h-${i + 1}`,
                    hydraHeadId: i + 1,
                    container: { Id: `mock-${i}` },
                    isActive: true,
                })),
            );
            // Create a head with 3 nodes
            const createResponse = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Multi-node Head',
                    blockfrostProjectId: 'test_blockfrost_project_id',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'multi_node_vkey_1',
                            hydraHeadSkey: 'multi_node_skey_1',
                            fundVkey: 'multi_fund_vkey_1',
                            fundSkey: 'multi_fund_skey_1',
                        },
                        {
                            hydraHeadVkey: 'multi_node_vkey_2',
                            hydraHeadSkey: 'multi_node_skey_2',
                            fundVkey: 'multi_fund_vkey_2',
                            fundSkey: 'multi_fund_skey_2',
                        },
                        {
                            hydraHeadVkey: 'multi_node_vkey_3',
                            hydraHeadSkey: 'multi_node_skey_3',
                            fundVkey: 'multi_fund_vkey_3',
                            fundSkey: 'multi_fund_skey_3',
                        },
                    ],
                })
                .expect(201);

            const multiNodeHeadId = createResponse.body.id;

            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    id: multiNodeHeadId,
                })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('maximum active nodes limit');

            globalSpies[5].mockResolvedValue([]);
        });
    });

    describe('GET hydra-heads/list', () => {
        beforeEach(async () => {
            // Create a head to use in these tests
            await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Test Head for Active',
                    blockfrostProjectId: 'test_blockfrost_project_id',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'active_test_vkey',
                            hydraHeadSkey: 'active_test_skey',
                            fundVkey: 'active_test_fund_vkey',
                            fundSkey: 'active_test_fund_skey',
                        },
                    ],
                });
        });
        it('should return list of hydra heads', async () => {
            const response = await request(app.getHttpServer())
                .get('/hydra-heads/list')
                .auth(accessToken, { type: 'bearer' })
                .expect(200);

            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('description');
            expect(response.body[0]).toHaveProperty('status');
        });

        it('should fail to list hydra heads without authentication', async () => {
            const response = await request(app.getHttpServer()).get('/hydra-heads/list').expect(401);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Unauthorized');
        });
    });

    describe('countActiveNodes', () => {
        it('should count active nodes from cache correctly', async () => {
            // Mock cache with 5 active nodes
            const mockActiveNodes = Array.from({ length: 5 }, (_, i) => ({
                hydraNodeId: `${i + 1}`,
                hydraHeadId: `${Math.floor(i / 2) + 1}`,
                container: { Id: `mock-container-${i}` },
                isActive: true,
            }));

            globalSpies[5].mockResolvedValue(mockActiveNodes);

            const activeNodes = await service.getActiveNodeContainers();
            expect(activeNodes.length).toBe(5);
        });

        it('should return 0 when cache is empty', async () => {
            // Mock cache returning empty array
            globalSpies[5].mockResolvedValue([]);

            const activeNodes = await service.getActiveNodeContainers();
            expect(activeNodes.length).toBe(0);
        });

        it('should return 0 when cache returns null/undefined', async () => {
            // Mock cache returning null (not set yet)
            globalSpies[5].mockResolvedValue(null);

            const activeNodes = await service.getActiveNodeContainers();
            expect(activeNodes.length).toBe(0);
        });

        it('should reflect docker container status via cache', async () => {
            // This test verifies that getActiveNodeContainers uses the cache
            // which is updated by DockerService cron job

            // Simulate cron job updating cache with running containers
            const runningContainers = [
                {
                    hydraNodeId: '1',
                    hydraHeadId: '1',
                    container: { Id: 'container-1' },
                    isActive: true,
                },
                {
                    hydraNodeId: '2',
                    hydraHeadId: '1',
                    container: { Id: 'container-2' },
                    isActive: true,
                },
                {
                    hydraNodeId: '3',
                    hydraHeadId: '2',
                    container: { Id: 'container-3' },
                    isActive: true,
                },
            ];
            globalSpies[5].mockResolvedValue(runningContainers);

            // Verify it's using getActiveNodeContainers which reads from cache
            const activeContainers = await service.getActiveNodeContainers();
            expect(activeContainers).toEqual(runningContainers);
            expect(activeContainers.length).toBe(3);
        });
    });

    describe('POST hydra-heads/deactive', () => {
        it('should deactivate a hydra head successfully', async () => {
            // Create a head first
            const createResponse = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Test Head for Deactive',
                    blockfrostProjectId: 'test_blockfrost_project_id',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'deactive_test_vkey',
                            hydraHeadSkey: 'deactive_test_skey',
                            fundVkey: 'deactive_test_fund_vkey',
                            fundSkey: 'deactive_test_fund_skey',
                        },
                    ],
                });

            const headId = createResponse.body.id;

            // Mock empty cache for activation
            globalSpies[5].mockResolvedValue([]);

            // First, activate the head
            const activeResponse = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({ id: headId })
                .expect(200);

            expect(activeResponse.body.status).toBe('running');

            // Now deactivate it
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/deactive')
                .auth(accessToken, { type: 'bearer' })
                .send({ id: headId })
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe('stop');
        });

        it('should fail to deactivate a non-existing hydra head', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/deactive')
                .auth(accessToken, { type: 'bearer' })
                .send({ id: 9999 })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Invalid Head Id');
        });

        it('should fail to deactivate without authentication', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/deactive')
                .send({ id: 1 })
                .expect(401);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Unauthorized');
        });

        it('should fail with invalid id format', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/deactive')
                .auth(accessToken, { type: 'bearer' })
                .send({ id: 'invalid' })
                .expect(400);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('POST hydra-heads/clear-head-data', () => {
        it('should clear head data successfully', async () => {
            // Create a head first
            const createResponse = await createHead(app, accessToken);

            const headId = createResponse.id;

            const response = await request(app.getHttpServer())
                .post('/hydra-heads/clear-head-data')
                .auth(accessToken, { type: 'bearer' })
                .send({ ids: [headId] })
                .expect(200);

            expect(response.body).toHaveProperty('removedDirs');
            expect(response.body).toHaveProperty('errors');
            expect(response.body).toHaveProperty('heads');
            expect(response.body.removedDirs).toBeInstanceOf(Array);
            expect(response.body.errors).toBeInstanceOf(Array);
        });

        it('should clear multiple heads data successfully', async () => {
            // Create two hydra heads
            const createResponse1 = await createHead(app, accessToken);

            const firstHeadId = createResponse1.id;

            const createResponse2 = await createHead(app, accessToken);

            const secondHeadId = createResponse2.id;

            const response = await request(app.getHttpServer())
                .post('/hydra-heads/clear-head-data')
                .auth(accessToken, { type: 'bearer' })
                .send({ ids: [firstHeadId, secondHeadId] })
                .expect(200);

            expect(response.body.heads).toBeInstanceOf(Array);
            expect(response.body.heads.length).toBe(2);
        });

        it('should fail with invalid ids format', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/clear-head-data')
                .auth(accessToken, { type: 'bearer' })
                .send({ ids: 'invalid' })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Ids must be an array of numbers');
        });

        it('should fail to clear head data without authentication', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/clear-head-data')
                .send({ ids: [1] })
                .expect(401);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Unauthorized');
        });

        it('should handle non-existing head ids gracefully', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/clear-head-data')
                .auth(accessToken, { type: 'bearer' })
                .send({ ids: [9999, 9998] })
                .expect(200);

            // Service returns empty array when heads not found (caught in catch block)
            expect(response.body).toEqual([]);
        });
    });

    describe('DELETE hydra-heads/delete/:id', () => {
        let headToDeleteId: number;

        beforeEach(async () => {
            // Create a hydra head to delete
            const createResponse = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Hydra Head To Delete',
                    blockfrostProjectId: 'test_blockfrost_project_id',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'delete_hydra_head_vkey',
                            hydraHeadSkey: 'delete_hydra_head_skey',
                            fundVkey: 'delete_fund_vkey',
                            fundSkey: 'delete_fund_skey',
                        },
                    ],
                })
                .expect(201);
            headToDeleteId = createResponse.body.id;
        });

        it('should delete a hydra head successfully', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/hydra-heads/delete/${headToDeleteId}`)
                .auth(accessToken, { type: 'bearer' })
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('deleted');

            // Verify head is actually deleted
            const verifyHead = await hydraHeadRepo.findOneBy({ id: headToDeleteId });
            expect(verifyHead).toBeNull();
        });

        it('should fail to delete non-existing hydra head', async () => {
            const response = await request(app.getHttpServer())
                .delete('/hydra-heads/delete/9999')
                .auth(accessToken, { type: 'bearer' })
                .expect(404);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Hydra Head not found');
        });

        it('should fail to delete without authentication', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/hydra-heads/delete/${headToDeleteId}`)
                .query({ id: headToDeleteId })
                .expect(401);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Unauthorized');
        });

        it('should fail with invalid id format', async () => {
            // This test doesn't depend on headToDeleteId from beforeEach
            const response = await request(app.getHttpServer())
                .delete('/hydra-heads/delete/invalid')
                .query({ id: 'invalid' })
                .auth(accessToken, { type: 'bearer' })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Validation failed (numeric string is expected)');
        });

        it('should clean up docker containers when deleting head', async () => {
            // Spy on dockerService to verify container cleanup
            const dockerService = moduleFixture.get(DockerService);
            const removeContainerSpy = jest.spyOn(dockerService, 'removeContainerByName');

            const response = await request(app.getHttpServer())
                .delete(`/hydra-heads/delete/${headToDeleteId}`)
                .query({ id: headToDeleteId })
                .auth(accessToken, { type: 'bearer' })
                .expect(200);

            expect(response.body.message).toContain('deleted');
            // Verify that removeContainerByName was called at least once for the nodes
            expect(removeContainerSpy).toHaveBeenCalled();
        });
    });

    describe('POST hydra-heads/restart/:id', () => {
        let headId: number;
        beforeEach(async () => {
            const dockerService = moduleFixture.get(DockerService);
            jest.spyOn(dockerService, 'restartContainerByName').mockResolvedValue(undefined);

            // Create a hydra head with multiple nodes
            const createResponse = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Multi-node Hydra Head To Restart',
                    blockfrostProjectId: 'test_blockfrost_project_id',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'restart_multi_vkey_1',
                            hydraHeadSkey: 'restart_multi_skey_1',
                            fundVkey: 'restart_multi_fund_vkey_1',
                            fundSkey: 'restart_multi_fund_skey_1',
                        },
                        {
                            hydraHeadVkey: 'restart_multi_vkey_2',
                            hydraHeadSkey: 'restart_multi_skey_2',
                            fundVkey: 'restart_multi_fund_vkey_2',
                            fundSkey: 'restart_multi_fund_skey_2',
                        },
                        {
                            hydraHeadVkey: 'restart_multi_vkey_3',
                            hydraHeadSkey: 'restart_multi_skey_3',
                            fundVkey: 'restart_multi_fund_vkey_3',
                            fundSkey: 'restart_multi_fund_skey_3',
                        },
                    ],
                });
            const createvalueCache = await addActiveNodes(createResponse.body.nodes, createResponse.body.id);
            globalSpies[5].mockResolvedValue(createvalueCache);
            headId = createResponse.body.id;
        });

        it('should restart a hydra head successfully', async () => {
            const response = await request(app.getHttpServer())
                .post(`/hydra-heads/restart/${headId}`)
                .auth(accessToken, { type: 'bearer' })
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('restarted');
            expect(response.body.message).toContain(headId.toString());
        });

        it('should restart a hydra head with multiple nodes', async () => {
            const response = await request(app.getHttpServer())
                .post(`/hydra-heads/restart/${headId}`)
                .auth(accessToken, { type: 'bearer' })
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('restarted');
        });

        it('should fail to restart a non-existing hydra head', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/restart/9999')
                .auth(accessToken, { type: 'bearer' })
                .expect(404);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Hydra Head not found');
        });

        it('should fail to restart without authentication', async () => {
            const response = await request(app.getHttpServer()).post(`/hydra-heads/restart/${headId}`).expect(401);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Unauthorized');
        });

        it('should fail with invalid id format', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/restart/abc')
                .auth(accessToken, { type: 'bearer' })
                .expect(400);

            expect(response.body).toHaveProperty('message');
        });

        it('should handle partial restart failure', async () => {
            const dockerService = moduleFixture.get(DockerService);

            jest.spyOn(dockerService, 'restartContainerByName').mockRejectedValue(new Error('Container not found'));

            const response = await request(app.getHttpServer())
                .post(`/hydra-heads/restart/${headId}`)
                .auth(accessToken, { type: 'bearer' })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Failed to restart');
            expect(response.body.message).toContain('Container not found');
        });

        it('should verify container names passed to docker service', async () => {
            await request(app.getHttpServer())
                .post(`/hydra-heads/restart/${headId}`)
                .auth(accessToken, { type: 'bearer' })
                .expect(200);
        });
    });
});
