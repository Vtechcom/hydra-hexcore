import 'dotenv/config';

import { HydraAdminService } from '../../hydra-main/hydra-admin.service';
import { AppDataSource } from '../data-source';
import { JwtService } from '@nestjs/jwt';
import { HydraHubApiService } from '../../hydra-hub/hydrahub-api.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { jwtConstants } from '../../common/constants';
import { email, z } from 'zod';

const args = process.argv.slice(2);
const parseArg = (prefix: string): string | undefined => args.find(a => a.startsWith(prefix))?.slice(prefix.length);

const username = parseArg('--username=');
const password = parseArg('--password=');

if (!username || !password) {
    console.error('Error: --username and --password arguments are required.');
    process.exit(1);
}

const credentialSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(8),
});

const providerSchema = z.object({
    ip: z
        .string()
        .regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)
        .optional(),
    name: z.string().optional(),
    logo: z.string().url().optional(),
    url: z.string().url().optional(),
    connectionType: z.enum(['cardano_node', 'blockfrost']).optional(),
    network: z.enum(['mainnet', 'preprod', 'preview']).optional(),
    domain: z.string().optional(),
    email: email().optional(),
});

const credentials = credentialSchema.parse({ username, password });
const providerArgs = providerSchema.parse({
    ip: parseArg('--ip='),
    name: parseArg('--providerName='),
    logo: parseArg('--logoUrl='),
    url: parseArg('--providerUrl='),
    connectionType: parseArg('--connectionType='),
    network: parseArg('--network='),
    domain: parseArg('--domain='),
    email: parseArg('--email='),
});

async function main() {
    console.log('Starting create account admin seeder...');

    const dataSource = AppDataSource;
    await dataSource.initialize();

    await dataSource.transaction(async transactionalEntityManager => {
        await transactionalEntityManager.getRepository('User').clear();
        const newAdmin = transactionalEntityManager.getRepository('User').create({
            username: credentials.username,
            password: credentials.password,
            role: 'admin',
        });
        await transactionalEntityManager.save('User', newAdmin);
        console.log(`  ✓ Admin account created with username: ${credentials.username}`);
        const hydraAdminService = new HydraAdminService(
            transactionalEntityManager.getRepository('User'),
            new JwtService({ secret: jwtConstants.secret }),
        );
        const loginResult = await hydraAdminService.login(credentials);
        console.log('Access token:', loginResult.accessToken);
        const hydraHubApi = new HydraHubApiService(new HttpService(), new ConfigService());
        const response = await hydraHubApi.createProvider({
            ...providerArgs,
            accessToken: loginResult.accessToken,
        } as any);
        const data = response.data;
        console.log('ID:', data.id);
        console.log('Code:', data.code);
        console.log('Name:', data.name);
        console.log('Logo Url:', data.logo);
        console.log('Url:', data.url);
        console.log('Is Verified:', data.isVerified);
        console.log('IP:', data.ip);
        console.log('Connection Type:', data.connectionType);
        console.log('Location:', data.location);
        console.log('Score:', data.score);
        console.log('Network:', data.network);
        console.log('Domain:', data.domain);
        console.log('Access Token:', data.accessToken);
        console.log('Webhook Key:', data.webhookApiKey);
        console.log('Email', data.email);
        console.log('Last Assigned At:', data.lastAssignedAt);
        console.log('Created At:', data.createdAt);
        console.log('Updated At:', data.updatedAt);
    });

    await dataSource.destroy();
    console.log('Process finished successfully.');
}

main().catch(error => {
    console.error('Error running create account admin seeder:', error);
    process.exit(1);
});
