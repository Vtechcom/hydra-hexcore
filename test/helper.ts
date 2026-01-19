import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HydraHead } from 'src/hydra-heads/entities/HydraHead.entity';
import request from 'supertest';
import { DataSource } from 'typeorm';

export const StatusConsumerType = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    BLOCKED: 'BLOCKED',
    REQUESTED: 'REQUESTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const;

export type StatusConsumer = (typeof StatusConsumerType)[keyof typeof StatusConsumerType];

export async function generateAdminTest() {
    return {
        username: 'admin_test',
        password: 'admin_password_test',
    };
}

export async function insertAdminAccount(data: { username: string; password: string }, dataSource: DataSource) {
    const userRepository = dataSource.getRepository('User');
    const user = userRepository.create({
        username: data.username,
        password: data.password,
        role: 'admin',
    });
    await userRepository.save(user);
}

export async function insertAccount(mnemonic: string, dataSource: DataSource) {
    const accountRepository = dataSource.getRepository('Account');
    const account = accountRepository.create({
        baseAddress: `addr_test_base_${Date.now()}`,
        pointerAddress: `addr_test_pointer_${Date.now()}`,
        mnemonic: mnemonic,
    });
    return await accountRepository.save(account);
}

export async function insertHydraNode(accountId: number, description: string, dataSource: DataSource) {
    const hydraNodeRepository = dataSource.getRepository('HydraNode');
    const hydraNode = hydraNodeRepository.create({
        description: description,
        port: 5000 + Math.floor(Math.random() * 1000),
        skey: `skey_${Date.now()}`,
        vkey: `vkey_${Date.now()}`,
        cardanoAccount: { id: accountId },
    });
    return await hydraNodeRepository.save(hydraNode);
}

export async function clearDatabase(dataSource: DataSource) {
    if (!dataSource || !dataSource.isInitialized) {
        console.warn('DataSource is not initialized, skipping database cleanup');
        return;
    }

    const entities = dataSource.entityMetadatas;

    // Disable foreign key checks before clearing
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear all tables
    for (const entity of entities) {
        const repository = dataSource.getRepository(entity.name);
        try {
            await repository.query(`DELETE FROM \`${entity.tableName}\``);
        } catch (error) {
            console.warn(`Failed to clear ${entity.tableName}:`, error.message);
        }
    }

    // Re-enable foreign key checks
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
}

export async function createAdminAccountAndGetToken(dataSource: DataSource, jwtService: JwtService) {
    const userRepository = dataSource.getRepository('User');
    let admin = await userRepository.findOneBy({ username: 'admin' });
    if (!admin) {
        const dataCreate = {
            username: 'admin',
            password: 'strongpassword123',
            role: 'admin',
        };
        admin = userRepository.create(dataCreate);
        await userRepository.save(admin);
    }
    const payload = { username: admin.username, id: admin.id, role: admin.role };

    return await jwtService.signAsync(payload);
}

export async function addActiveNodes(nodes: any, headId: number) {
    return nodes.map((node: any, index: number) => ({
        hydraNodeId: node.id.toString(),
        hydraHeadId: headId.toString(),
        isActive: true,
    }));
}

export async function createHead(app: INestApplication, accessToken: string): Promise<HydraHead> {
    const response = await request(app.getHttpServer())
        .post('/hydra-heads/create')
        .auth(accessToken, { type: 'bearer' })
        .send({
            description: 'Test Head for Clear Data',
            blockfrostProjectId: 'test_blockfrost_project_id',
            hydraHeadKeys: [
                {
                    hydraHeadVkey: 'clear_data_test_vkey',
                    hydraHeadSkey: 'clear_data_test_skey',
                    fundVkey: 'clear_data_test_fund_vkey',
                    fundSkey: 'clear_data_test_fund_skey',
                },
            ],
        });
    return response.body;
}
