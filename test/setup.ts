import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { DockerService } from 'src/docker/docker.service';
import { OgmiosClientService } from 'src/hydra-main/ogmios-client.service';

/**
 * Setup shared test application (Full App)
 * Tạo NestJS app instance với validation pipes
 * Sử dụng database test riêng biệt
 */
export async function createTestApp(): Promise<{
    app: INestApplication;
    dataSource: DataSource;
    moduleFixture: TestingModule;
}> {
    // Override environment variables để sử dụng test database
    process.env.DB_PORT = process.env.DB_PORT_TEST || '3328';
    process.env.DB_USERNAME = process.env.DB_USERNAME_TEST || 'hexcore_user';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD_TEST || 'hexcore_password';
    process.env.DB_DATABASE = process.env.DB_NAME_TEST || 'hexcore_test_db';
    process.env.DB_SYNCHRONIZE = 'true'; // Auto sync schema cho test

    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

    // Apply global pipes (giống main.ts)
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    await app.init();

    // Get DataSource để có thể truy cập database
    const dataSource = moduleFixture.get<DataSource>(DataSource);

    // Disable foreign key constraints for testing (MySQL)
    // This allows tests to create entities in any order without constraint violations
    if (dataSource.isInitialized) {
        await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
    }

    return { app, dataSource, moduleFixture };
}

export async function createHydraHeadTestApp(): Promise<{
    app: INestApplication;
    dataSource: DataSource;
    moduleFixture: TestingModule;
}> {
    // Ensure test DB env vars are set like createTestApp so the full AppModule
    // (and its TypeORM config) connects to the test database.
    process.env.DB_PORT = process.env.DB_PORT_TEST || '3328';
    process.env.DB_USERNAME = process.env.DB_USERNAME_TEST || 'hexcore_user';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD_TEST || 'hexcore_password';
    process.env.DB_DATABASE = process.env.DB_NAME_TEST || 'hexcore_test_db';
    process.env.DB_SYNCHRONIZE = 'true';

    // Build the full application module (AppModule) so all entities/providers
    // are available to tests, then override only the external-service providers.
    const moduleBuilder = Test.createTestingModule({
        imports: [AppModule],
    });

    // Apply global mocks early so AppModule and related providers (which are
    // imported below) don't touch disk, Docker or Cardano binaries.
    // These mocks run before AppModule is loaded because `createHydraHeadTestApp`
    // is imported by test files at the top-level.
    try {
        // cardanocli-js used inside some services
        jest.mock('cardanocli-js', () => {
            return jest.fn().mockImplementation(() => ({
                runCommand: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify({ protocol: 'params' }))),
            }));
        });
    } catch (e) {
        // jest may not be available in some contexts — ignore
    }

    try {
        jest.mock('node:fs/promises', () => ({
            access: jest.fn().mockResolvedValue(undefined),
            mkdir: jest.fn().mockResolvedValue(undefined),
            rm: jest.fn().mockResolvedValue(undefined),
        }));

        // Mock the sync FS APIs and provide `constants` so code that reads
        // `fs.constants.R_OK` doesn't throw when `fs` is replaced by the mock.
        jest.mock('node:fs', () => ({
            writeFileSync: jest.fn().mockResolvedValue(undefined),
            chmodSync: jest.fn().mockResolvedValue(undefined),
            constants: { R_OK: 4, W_OK: 2 },
        }));
    } catch (e) {
        // ignore
    }

    // Provide lightweight mocks for DockerService and OgmiosClientService so
    // tests don't require docker/ogmios to be running.
    const mockDockerService = {
        ensureHydraNetwork: jest.fn(),
        removeContainerByName: jest.fn(),
        createContainer: jest.fn(),
        updateHydraContainerStatus: jest.fn(),
        handleDockerContainerExist: jest.fn(),
        cleanupContainer: jest.fn(),
    };

    // Make some methods return promises by default to match real service behavior
    mockDockerService.ensureHydraNetwork.mockResolvedValue(undefined);
    mockDockerService.removeContainerByName.mockResolvedValue(undefined);
    // Return a mock container object that implements `inspect()` as the
    // real Docker.Container does. The service calls `container.inspect()`
    // and expects an object with `Args` and `Config.Image`.
    mockDockerService.createContainer.mockResolvedValue({
        id: 'mocked',
        inspect: jest.fn().mockResolvedValue({ Args: [], Config: { Image: 'mocked-image' } }),
    });
    mockDockerService.updateHydraContainerStatus.mockResolvedValue(undefined);
    mockDockerService.handleDockerContainerExist.mockResolvedValue(undefined);
    mockDockerService.cleanupContainer.mockResolvedValue(undefined);

    const mockOgmios = {
        queryUtxoByAddress: jest.fn(),
        queryTip: jest.fn(),
        queryProtocolParameters: jest.fn(),
    };

    const moduleFixture: TestingModule = await moduleBuilder
        .overrideProvider(DockerService)
        .useValue(mockDockerService)
        .overrideProvider(OgmiosClientService)
        .useValue(mockOgmios)
        .compile();

    const app = moduleFixture.createNestApplication();

    // Apply global pipes (giống main.ts)
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    await app.init();

    const dataSource = moduleFixture.get<DataSource>(DataSource);

    if (dataSource.isInitialized) {
        await dataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
    }

    return { app, dataSource, moduleFixture };
}

export async function cleanupTestApp(app: INestApplication, dataSource: DataSource): Promise<void> {
    try {
        if (dataSource?.isInitialized) {
            console.log('Dropping test database...');
            await dataSource.dropDatabase();
            await dataSource.destroy();
        }

        try {
            const redisService = app.get('RedisService', { strict: false });
            if (redisService && typeof redisService.onModuleDestroy === 'function') {
                await redisService.onModuleDestroy();
            }
        } catch (e) {
            // Redis không có thì bỏ qua
        }

        const server = app.getHttpServer();
        if (server?.listening) {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Server close timeout'));
                }, 5000);

                server.close(err => {
                    clearTimeout(timeout);
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        if (app) {
            await app.close();
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}
