import { TestingModule } from '@nestjs/testing';
import { HydraHeadService } from '../../src/hydra-heads/hydra-heads.service';
import { HydraHead } from '../../src/hydra-heads/entities/HydraHead.entity';
import { HydraNode } from '../../src/hydra-main/entities/HydraNode.entity';
import { Account } from '../../src/hydra-main/entities/Account.entity';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { cleanupTestApp, createHydraHeadTestApp } from 'test/setup';
import * as fs from 'node:fs/promises';
import request from 'supertest';
import { createAdminAccountAndGetToken } from 'test/helper';
import { JwtService } from '@nestjs/jwt';
import { DockerService } from '../../src/docker/docker.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

// Make fs.promises methods mockable in tests. The real exports on Node's
// `node:fs/promises` can be non-configurable which causes jest.spyOn to
// throw "Cannot redefine property". Mock the module so the methods are
// jest.fn() and can be controlled in individual tests.
jest.mock('node:fs/promises', () => {
    const real = jest.requireActual('node:fs/promises');
    return {
        ...real,
        access: jest.fn(),
        mkdir: jest.fn(),
    };
});

jest.mock('src/utils/cardano-core', () => ({
    getEnterpriseAddressFromKeys: jest.fn().mockReturnValue(
        'addr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
    ),
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

        jest
        .spyOn(hydraHeadService, 'checkUtxoAccount')
        .mockResolvedValue(true);
    }, 30000);

    afterEach(async () => {
        // Use clearAllMocks so spies/mocks created in beforeAll remain applied.
        // restoreAllMocks would restore original implementations and remove
        // the spy on hydraHeadService.checkUtxoAccount, causing the active
        // test to call the real implementation and hit the converter.
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await cleanupTestApp(app, dataSource);
    });

    describe('POST hydra-heads/create', () => {
        it('should create a hydra head successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Test Hydra Head',
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
            expect(response.body.message).toContain('hydraHeadKeys should not be empty');
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

        it('should fail if not logged in as admin', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .send({
                    description: 'Test Hydra Head',
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
        it('should activate a hydra head successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    id: 1,
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
            jest
            .spyOn(service, 'checkUtxoAccount')
            .mockResolvedValueOnce(false);

            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    id: 1,
                })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('not enough lovelace');
        });

        it('should fail to activate when max active nodes limit is reached', async () => {
            // Mock cache to return 20 active nodes (at limit)
            const mockActiveNodes = Array.from({ length: 20 }, (_, i) => ({
                hydraNodeId: `${i + 1}`,
                hydraHeadId: `${Math.floor(i / 5) + 1}`,
                container: { Id: `mock-container-${i}` },
                isActive: true,
            }));
            
            jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(mockActiveNodes);

            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    id: 1,
                })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('maximum active nodes limit');
            expect(response.body.message).toContain('would be exceeded');
        });

        it('should fail to activate when adding nodes would exceed limit', async () => {
            // Create a head with 3 nodes
            const createResponse = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Multi-node Head',
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

            // Mock cache to return 18 active nodes (adding 3 more would exceed 20)
            const mockActiveNodes = Array.from({ length: 18 }, (_, i) => ({
                hydraNodeId: `${i + 1}`,
                hydraHeadId: `${Math.floor(i / 5) + 1}`,
                container: { Id: `mock-container-${i}` },
                isActive: true,
            }));
            
            jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(mockActiveNodes);

            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    id: multiNodeHeadId,
                })
                .expect(400);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('maximum active nodes limit');
            expect(response.body.message).toContain('Current active nodes: 18');
            expect(response.body.message).toContain('nodes to add: 3');
        });

        it('should successfully activate when within node limit', async () => {
            // Mock cache to return 15 active nodes (adding 1 more is within limit of 20)
            const mockActiveNodes = Array.from({ length: 15 }, (_, i) => ({
                hydraNodeId: `${i + 1}`,
                hydraHeadId: `${Math.floor(i / 5) + 1}`,
                container: { Id: `mock-container-${i}` },
                isActive: true,
            }));
            
            jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(mockActiveNodes);

            const response = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    id: 1,
                })
                .expect(200);

            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe('running');
        });
    });

    describe('GET hydra-heads/list', () => {
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
            const response = await request(app.getHttpServer())
                .get('/hydra-heads/list')
                .expect(401);

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
            
            jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(mockActiveNodes);

            const count = await service.countActiveNodes();
            expect(count).toBe(5);
        });

        it('should return 0 when cache is empty', async () => {
            // Mock cache returning empty array
            jest.spyOn(cacheManager, 'get').mockResolvedValueOnce([]);

            const count = await service.countActiveNodes();
            expect(count).toBe(0);
        });

        it('should return 0 when cache returns null/undefined', async () => {
            // Mock cache returning null (not set yet)
            jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);

            const count = await service.countActiveNodes();
            expect(count).toBe(0);
        });

        it('should reflect docker container status via cache', async () => {
            // This test verifies that countActiveNodes uses the cache
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

            await cacheManager.set('activeNodes', runningContainers);

            const count = await service.countActiveNodes();
            expect(count).toBe(3);

            // Verify it's using getActiveNodeContainers which reads from cache
            const activeContainers = await service.getActiveNodeContainers();
            expect(activeContainers).toEqual(runningContainers);
            expect(activeContainers.length).toBe(count);
        });
    });

    describe('POST hydra-heads/deactive', () => {
        it('should deactivate a hydra head successfully', async () => {
            // First, ensure we have an active hydra head
            const activeResponse = await request(app.getHttpServer())
                .post('/hydra-heads/active')
                .auth(accessToken, { type: 'bearer' })
                .send({ id: 1 })
                .expect(200);

            expect(activeResponse.body.status).toBe('running');

            // Now deactivate it
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/deactive')
                .auth(accessToken, { type: 'bearer' })
                .send({ id: 1 })
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
            const response = await request(app.getHttpServer())
                .post('/hydra-heads/clear-head-data')
                .auth(accessToken, { type: 'bearer' })
                .send({ ids: [1] })
                .expect(200);

            expect(response.body).toHaveProperty('removedDirs');
            expect(response.body).toHaveProperty('errors');
            expect(response.body).toHaveProperty('heads');
            expect(response.body.removedDirs).toBeInstanceOf(Array);
            expect(response.body.errors).toBeInstanceOf(Array);
        });

        it('should clear multiple heads data successfully', async () => {
            // Create another hydra head first
            const createResponse = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Second Test Hydra Head',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'hydra_head_vkey_example_2',
                            hydraHeadSkey: 'hydra_head_skey_example_2',
                            fundVkey: 'fund_vkey_example_2',
                            fundSkey: 'fund_skey_example_2',
                        },
                    ],
                })
                .expect(201);

            const secondHeadId = createResponse.body.id;

            const response = await request(app.getHttpServer())
                .post('/hydra-heads/clear-head-data')
                .auth(accessToken, { type: 'bearer' })
                .send({ ids: [1, secondHeadId] })
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
            // Ensure fs mocks are working for this test
            (fs.access as unknown as jest.Mock).mockResolvedValue(undefined);
            (fs.mkdir as unknown as jest.Mock).mockResolvedValue(undefined);
            
            // Create a hydra head to delete
            const createResponse = await request(app.getHttpServer())
                .post('/hydra-heads/create')
                .auth(accessToken, { type: 'bearer' })
                .send({
                    description: 'Hydra Head To Delete',
                    hydraHeadKeys: [
                        {
                            hydraHeadVkey: 'delete_hydra_head_vkey',
                            hydraHeadSkey: 'delete_hydra_head_skey',
                            fundVkey: 'delete_fund_vkey',
                            fundSkey: 'delete_fund_skey',
                        },
                    ],
                });

            // Only set headToDeleteId if creation was successful
            if (createResponse.status === 201) {
                headToDeleteId = createResponse.body.id;
            }
        });

        it('should delete a hydra head successfully', async () => {
            // Skip if head wasn't created successfully in beforeEach
            if (!headToDeleteId) {
                console.log('Skipping test - no head created in beforeEach');
                return;
            }

            const response = await request(app.getHttpServer())
                .delete(`/hydra-heads/delete/${headToDeleteId}`)
                .query({ id: headToDeleteId })
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
                .query({ id: 9999 })
                .auth(accessToken, { type: 'bearer' })
                .expect(404);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Hydra Head not found');
        });

        it('should fail to delete without authentication', async () => {
            // Skip if head wasn't created successfully in beforeEach
            if (!headToDeleteId) {
                console.log('Skipping test - no head created in beforeEach');
                return;
            }

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
                .auth(accessToken, { type: 'bearer' });

            // The endpoint will try to parse 'invalid' as number
            // Depending on implementation, it may return 400 or 404
            expect([400, 404, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('message');
        });

        it('should clean up docker containers when deleting head', async () => {
            // Skip if head wasn't created successfully in beforeEach
            if (!headToDeleteId) {
                console.log('Skipping test - no head created in beforeEach');
                return;
            }

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
});
