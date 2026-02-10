import 'dotenv/config';

import { HydraAdminService } from "../../hydra-main/hydra-admin.service";
import { AppDataSource } from "../data-source";
import { JwtService } from "@nestjs/jwt";
import { HydraHubApiService } from "../../hydra-hub/hydrahub-api.service";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { jwtConstants } from '../../common/constants';

const args = process.argv.slice(2);
const username = args.find(a => a.startsWith('--username='))?.split('=')[1];
const password = args.find(a => a.startsWith('--password='))?.split('=')[1];

if (!username || !password) {
    console.error('Error: --username and --password arguments are required.');
    process.exit(1);
}

async function main() {
    console.log('Starting create account admin seeder...');

    const dataSource = AppDataSource;
    await dataSource.initialize();

    await dataSource.transaction(async transactionalEntityManager => {
        await transactionalEntityManager.getRepository('User').clear();
        const newAdmin = transactionalEntityManager.getRepository('User').create({
            username,
            password,
            role: 'admin',
        });
        await transactionalEntityManager.save('User', newAdmin);
        const hydraMainService = new HydraAdminService(
            transactionalEntityManager.getRepository('User'),
            new JwtService({
                secret: jwtConstants.secret,
            }),
        );
        const loginResult = await hydraMainService.login({ username, password });
        console.log('Access token:', loginResult.accessToken);
        const hydraHubApi = new HydraHubApiService(
            new HttpService(),
            new ConfigService(),
        );
        await hydraHubApi.sendAccessTokenToHub({ accessToken: loginResult.accessToken }
        );
        console.log(`  ✓ Created admin account with username: ${username}`);
    });

    await dataSource.destroy();
    console.log('Seeder finished successfully.');
}

main().catch(error => {
    console.error('Error running create account admin seeder:', error);
    process.exit(1);
});
