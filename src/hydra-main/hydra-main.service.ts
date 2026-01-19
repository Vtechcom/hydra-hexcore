import { BadRequestException, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HydraNode } from './entities/HydraNode.entity';
import { In, Repository } from 'typeorm';
import { writeFileSync } from 'node:fs';
import { access, constants, readFile, unlink } from 'node:fs/promises';
import Docker from 'dockerode';
import { Account } from './entities/Account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import {
    getBaseAddressFromMnemonic,
    getSigningKeyFromMnemonic,
    NetworkInfo,
    PaymentVerificationKey,
} from 'src/utils/cardano-core';
import { ResCardanoAccountDto } from './dto/response/cardano-account.dto';
import { CardanoCliJs } from 'cardanocli-js';

import * as net from 'net';
import { CommitHydraDto } from './dto/request/commit-hydra.dto';
import axios from 'axios';
import { SubmitTxHydraDto } from './dto/request/submit-tx-hydra.dto';
import { AddressUtxoDto } from './dto/response/address-utxo.dto';
import { IPaginationOptions } from 'src/interfaces/pagination.type';
import { HydraDto } from './dto/hydra.dto';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { resolveHydraNodeName } from './utils/name-resolver';
import { OgmiosClientService } from './ogmios-client.service';
import { convertUtxoToUTxOObject } from './utils/ogmios-converter';
import { ProviderUtils } from '@hydra-sdk/core';

type ContainerNode = {
    hydraNodeId: string;
    hydraPartyId: string;
    container: Docker.ContainerInfo;
    isActive: boolean;
};
type Caching = {
    activeNodes: ContainerNode[];
};

@Injectable()
export class HydraMainService implements OnModuleInit {
    HYDRA_BIN_DIR_PATH = process.env.NEST_HYDRA_BIN_DIR_PATH || 'D:/Projects/Vtechcom/cardano-node/hydra/bin';

    private docker: Docker;
    private CONSTANTS = {
        cardanoNodeServiceName: process.env.NEST_CARDANO_NODE_SERVICE_NAME || 'cardano-node',
        cardanoNodeImage: process.env.NEST_CARDANO_NODE_IMAGE || 'ghcr.io/intersectmbo/cardano-node:10.1.4',
        cardanoNodeFolder: process.env.NEST_CARDANO_NODE_FOLDER || 'D:/Projects/Vtechcom/cardano-node',
        cardanoNodeSocketPath:
            process.env.NEST_CARDANO_NODE_SOCKET_PATH || 'D:/Projects/Vtechcom/cardano-node/node.socket',
        hydraNodeImage: process.env.NEST_HYDRA_NODE_IMAGE || 'ghcr.io/cardano-scaling/hydra-node:0.20.0',
        hydraNodeFolder: process.env.NEST_HYDRA_NODE_FOLDER || 'D:/Projects/Vtechcom/cardano-node/hydra/preprod',
        hydraNodeScriptTxId: process.env.NEST_HYDRA_NODE_SCRIPT_TX_ID || '',
        hydraNodeNetworkId: process.env.NEST_HYDRA_NODE_NETWORK_ID || '1',
        cardanoAccountMinLovelace: process.env.ACCOUNT_MIN_LOVELACE || 50000000, // 50 ADA
        enableNetworkHost: process.env.NEST_DOCKER_ENABLE_NETWORK_HOST === 'true',

        // Dockerize
        hydraPartyLabel: 'party_id',
        hydraNodeLabel: 'node_id',
        dockerSock: process.env.NEST_DOCKER_SOCKET_PATH || '\\\\.\\pipe\\docker_engine',
    };

    private cardanoNode = {
        container: null as Docker.Container | null,
        tip: {
            block: 0,
            epoch: 0,
            hash: '',
            slot: 0,
            slotInEpoch: 0,
            slotsToEpochEnd: 0,
            syncProgress: '0.00',
            ledgerTip: {
                id: '',
                slot: 0,
            },
            eraStart: {
                epoch: 0,
                slot: 0,
            },
        },
    };
    private logger = new Logger(HydraMainService.name);

    constructor(
        @InjectRepository(HydraNode)
        private hydraNodeRepository: Repository<HydraNode>,
        @InjectRepository(Account)
        private accountRepository: Repository<Account>,
        // @InjectRepository(GameRoom)
        // private gameRoomRepository: Repository<GameRoom>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,

        private ogmiosClientService: OgmiosClientService,
    ) {
        const DOCKER_SOCKET = process.env.NEST_DOCKER_SOCKET_PATH || '\\\\.\\pipe\\docker_engine';
        this.docker = new Docker({ socketPath: DOCKER_SOCKET });
    }

    async onModuleInit() {
        console.log('onModuleInit');
        console.log('[LOAD ENVs]', this.CONSTANTS);
        if (process.env.CONNECT_CARDANO === 'cardano-node') {
            const listContainers = await this.docker.listContainers({ all: true });

            const cardanoNodeContainer = listContainers.find(
                container => container.Image === this.CONSTANTS.cardanoNodeImage,
            );
            if (cardanoNodeContainer && cardanoNodeContainer.State !== 'running') {
                console.log('Cardano node is not running');

                // Ensure hydra-network exists
                await this.ensureHydraNetwork();

                // Check if container is connected to hydra-network
                const containerInfo = await this.docker.getContainer(cardanoNodeContainer.Id).inspect();
                const isConnectedToHydraNetwork = containerInfo.NetworkSettings.Networks['hydra-network'];

                if (!isConnectedToHydraNetwork) {
                    console.log('Connecting cardano-node to hydra-network');
                    const hydraNetwork = this.docker.getNetwork('hydra-network');
                    await hydraNetwork.connect({
                        Container: cardanoNodeContainer.Id,
                    });
                }

                // delete node.socket to restart docker
                await this.docker.getContainer(cardanoNodeContainer.Id).restart();
                this.cardanoNode.container = this.docker.getContainer(cardanoNodeContainer.Id);
            } else if (!cardanoNodeContainer) {
                console.log('Cardano node is not running, try to run cardano-node');

                // Ensure hydra-network exists before creating cardano-node
                await this.ensureHydraNetwork();

                const container = await this.docker.createContainer({
                    Image: this.CONSTANTS.cardanoNodeImage,
                    name: this.CONSTANTS.cardanoNodeServiceName,
                    HostConfig: {
                        NetworkMode: 'hydra-network', // Connect to the same network as Hydra nodes
                        Binds: [
                            `${this.CONSTANTS.cardanoNodeFolder}/database:/db`, // Map local ./database to /db
                            `${this.CONSTANTS.cardanoNodeFolder}:/workspace`, // Map local ./ to /workspace
                        ],
                        PortBindings: {
                            '8091/tcp': [{ HostPort: '8091' }], // Map port 8091
                        },
                        RestartPolicy: {
                            Name: 'always', // Equivalent to `restart: always`
                        },
                    },
                    Cmd: [
                        'run',
                        '--config',
                        '/workspace/config.json',
                        '--topology',
                        '/workspace/topology.json',
                        '--socket-path',
                        '/workspace/node.socket',
                        '--database-path',
                        '/db',
                        '--port',
                        '8091',
                        '--host-addr',
                        '0.0.0.0',
                    ],
                    ExposedPorts: {
                        '8091/tcp': {},
                    },
                });

                // Start the container
                await container.start();
                this.cardanoNode.container = container;
            }
            this.cardanoNode.container = this.docker.getContainer(cardanoNodeContainer.Id);

            // Ensure the cardano-node container is connected to hydra-network (even if already running)
            await this.ensureCardanoNodeNetworkConnection(cardanoNodeContainer.Id);
            const output = await this.execInContainer(this.CONSTANTS.cardanoNodeServiceName, [
                'cardano-cli',
                'query',
                'tip',
                `--socket-path`,
                `/workspace/node.socket`,
                '--testnet-magic',
                '1',
            ]);
            this.logger.verbose('>>> / file: hydra-main.service.ts:121 / execInContainer:', output);
            this.updateHydraContainerStatus();
            try {
                const tip = await this.cardanoQueryTip();
                this.logger.log('>>> / file: hydra-main.service.ts:121 / tip:', tip);
                this.cardanoNode.tip = tip;
                await this.cacheManager.set('cardanoNodeTip', tip);
            } catch (err) {
                this.logger.error('Error parse json', err);
            }
        }
        return;
    }

    // @Cron('*/10 * * * * *')
    async updateHydraContainerStatus() {
        // Update hydra party status
        // Check container with "Name": "/hexcore-hydra-node-[ID]" that has running status
        // If all nodes are running, set party status to "ACTIVE"
        // Otherwise, set party status to "INACTIVE"
        this.docker
            .listContainers({ all: true })
            .then(containers => {
                const pattern = /hexcore-hydra-node-(\d+)/;
                const activeNodes = containers
                    .filter(container => {
                        return container.Names.find(name => pattern.test(name)) && container.State === 'running';
                    })
                    .map(node => {
                        return {
                            hydraNodeId: node.Labels[this.CONSTANTS.hydraNodeLabel],
                            hydraPartyId: node.Labels[this.CONSTANTS.hydraPartyLabel],
                            container: node,
                            isActive: node.State === 'running',
                        };
                    });
                this.cacheManager.set<Caching['activeNodes']>('activeNodes', activeNodes);
            })
            .catch(err => {
                this.logger.error('>>> / file: hydra-main.service.ts:217 / Error fetching active nodes:', err);
                this.cacheManager.set('activeNodes', []);
            });
    }

    async testOgmiosConnection() {
        if (process.env.CONNECT_CARDANO !== 'cardano-node') {
            return 'Connected via Blockfrost API';
        }
        return this.ogmiosClientService.test();
    }

    async getActiveNodeContainers() {
        const activeNodes = (await this.cacheManager.get<Caching['activeNodes']>('activeNodes')) || [];
        return activeNodes;
    }

    async cardanoQueryTip() {
        const tip = await this.ogmiosClientService.queryTip();
        return tip;
    }

    async getCardanoNodeInfo() {
        if (process.env.CONNECT_CARDANO !== 'cardano-node') {
            return 'Connected via Blockfrost API';
        }
        const tip = await this.ogmiosClientService.queryTip();
        const protocolParameters = await this.ogmiosClientService.getProtocolParameters();
        return {
            tip,
            protocolParameters,
        };
    }

    async getAddressUtxo(address: string): Promise<AddressUtxoDto> {
        try {
            const addrUTxOs = await this.ogmiosClientService.queryUtxoByAddress(address);
            const utxoObject = convertUtxoToUTxOObject(addrUTxOs);
            return utxoObject;
        } catch (err) {
            console.log(`[Error getAddressUtxo] [${address}] `, err);
            throw new BadRequestException('Error getAddressUtxo');
        }
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        await writeFileSync(filePath, content, {
            encoding: 'utf-8',
        });
    }

    async removeFile(filePath: string): Promise<void> {
        try {
            // check if file exists
            await access(filePath, constants.R_OK | constants.W_OK);
            await unlink(filePath);
        } catch (error: any) {
            console.error(`Error while removing file: ${filePath}`, error.message);
        }
    }

    async execInContainer(containerName: string, cmd: string[], workDir = '/') {
        try {
            // Find the container
            const container = this.docker.getContainer(containerName);

            // Create an exec instance
            const exec = await container.exec({
                Cmd: cmd,
                AttachStdout: true,
                AttachStderr: true,
                WorkingDir: workDir,
                AttachStdin: false,
            });

            // Start the exec instance and attach the output streams
            const stream = await exec.start({});

            // Capture the output
            return new Promise<string>((resolve, reject) => {
                const buffer: Buffer[] = [];

                stream.on('data', (chunk: Buffer) => {
                    buffer.push(chunk);
                });

                stream.on('end', () => {
                    resolve(Buffer.concat(buffer).toString());
                });

                stream.on('error', err => {
                    reject(err);
                });
            });
        } catch (error) {
            console.error('Error executing command in container:', error.message);
            throw error;
        }
    }

    cleanJSON(_jsonString: string) {
        let jsonString = _jsonString
            .replace(/^[\s\S]*?{/, '{')
            .replace(/^[^{]*\{\{/, '{') // Replace double {{
            .replace(/\}\}[^}]*$/, '}') // Replace double }} at end
            .replace(/^\uFFFD/, '') // remove replacement character at start
            .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '') // control characters
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/\u00A0/g, ' ')
            .replace(/\u2026/g, '...')
            .replace(/^\uFFFD/, '')
            .replace(/[^\x20-\x7E]/g, '') // non-printable
            .trim();
        if (!jsonString.startsWith('{')) {
            jsonString = _jsonString.slice(1, jsonString.length);
        }
        return jsonString;
    }

    async getListAccount() {
        const accounts = (await this.accountRepository.find()) as Array<Account & { utxo: any }>;
        for (const account of accounts) {
            account.utxo = {};
        }
        return accounts.map(account => new ResCardanoAccountDto(account));
    }

    async createAccount(body: CreateAccountDto) {
        const baseAddress = getBaseAddressFromMnemonic(body.mnemonic);
        const baseAddressStr = baseAddress.to_address().to_bech32();

        const paymentSKey = getSigningKeyFromMnemonic(body.mnemonic);
        const paymentVkey = new PaymentVerificationKey(paymentSKey);
        const poiterAddress = paymentVkey.toPointerAddress(NetworkInfo.TESTNET_PREPROD).to_address().to_bech32();

        const existedAccount = await this.accountRepository.findOne({
            where: {
                mnemonic: body.mnemonic,
            },
        });
        if (existedAccount) {
            throw new BadRequestException('This account has exited');
        }

        const newAccount = this.accountRepository.create();
        newAccount.mnemonic = body.mnemonic;
        newAccount.baseAddress = baseAddressStr;
        newAccount.pointerAddress = poiterAddress;
        const result = await this.accountRepository.save(newAccount);
        return result;
    }

    async getListHydraNode({ pagination }: { pagination: IPaginationOptions }) {
        const page = pagination?.page ?? 1;
        const limit = pagination?.limit ?? 10;
        const nodes = await this.hydraNodeRepository.find({
            skip: (page - 1) * limit,
            take: limit,
            relations: {
                cardanoAccount: true,
            },
            order: { id: 'DESC' },
        });
        const activeNodes = await this.getActiveNodeContainers();
        console.log('>>> / activeNodes:', nodes);

        return nodes.map(node => {
            // check node active
            const isActive = activeNodes.find(item => item.hydraNodeId === node.id.toString());

            return new HydraDto(node, isActive ? 'ACTIVE' : 'INACTIVE');
        });
    }

    async getHydraNodeById(id: number) {
        return this.hydraNodeRepository.findOne({
            where: { id },
        });
    }

    async getHydraNodeDetail(id: number) {
        const node = await this.hydraNodeRepository.findOne({
            where: { id },
            relations: {
                cardanoAccount: true,
            },
        });
        if (!node) {
            throw new BadRequestException('Invalid Hydra Node Id');
        }
        // remove sensitive key only when node exists
        delete node.skey;
        const activeNodes = await this.getActiveNodeContainers();
        const containerNode = activeNodes.find(item => item.hydraNodeId === node.id.toString());
        return {
            ...node,
            status: containerNode ? 'ACTIVE' : 'INACTIVE',
            container: containerNode?.container,
        };
    }

    async genHydraKey() {
        try {
            const containerVolume = '/data';

            // Run the container
            const container = await this.docker.createContainer({
                Image: this.CONSTANTS.hydraNodeImage,
                Cmd: ['gen-hydra-key', '--output-file', `${containerVolume}/_hydra-internal-key`],
                HostConfig: {
                    Binds: [`${this.CONSTANTS.hydraNodeFolder}:${containerVolume}`], // Bind mount
                },
            });

            // Start the container
            await container.start();

            // Wait for the container to finish
            const stream = await container.logs({ stdout: true, stderr: true, follow: true });
            stream.pipe(process.stdout);

            const status = await container.wait();
            console.log('Container exited with status:', status.StatusCode);
            let skey = '';
            let vkey = '';
            if (status.StatusCode === 0) {
                skey = await readFile(`${this.CONSTANTS.hydraNodeFolder}/_hydra-internal-key.sk`, {
                    encoding: 'utf-8',
                });
                vkey = await readFile(`${this.CONSTANTS.hydraNodeFolder}/_hydra-internal-key.vk`, {
                    encoding: 'utf-8',
                });
            }
            // Remove the container
            await container.remove();
            console.log('Container removed successfully.');
            return { skey: JSON.stringify(JSON.parse(skey)), vkey: JSON.stringify(JSON.parse(vkey)) };
        } catch (error) {
            console.log('>>> / file: hydra-main.service.ts:267 / error:', error);
            return null;
        }
    }

    async genValidPort() {
        const defaultPort = 10005;
        let port = defaultPort;

        while (!(await this.isPortAvailable(port)) || (await this.checkHydraNodePort(port))) {
            console.log('node port: ' + port);
            port++;
        }
        return port;
    }

    async checkHydraNodePort(port: number): Promise<boolean> {
        const nodeExits = await this.hydraNodeRepository.find({
            where: { port: port },
        });

        return nodeExits.length > 0;
    }

    /**
     * Check if a specific port is available.
     * @param port - The port to check.
     * @returns Promise<boolean> - True if available, false otherwise.
     */
    async isPortAvailable(port: number): Promise<boolean> {
        return new Promise(resolve => {
            const server = net.createServer();

            server.once('error', (err: any) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(false); // Port is in use
                } else {
                    resolve(false); // Other errors
                }
            });

            server.once('listening', () => {
                server.close();
                resolve(true); // Port is available
            });

            server.listen(port);
        });
    }

    async checkUtxoAccount(account: Account): Promise<boolean> {
        const a_utxo = await this.getAddressUtxo(account.pointerAddress);
        const totalLovelace = Object.values(a_utxo).reduce((sum, item) => sum + item.value.lovelace, 0);
        console.log(`[${account.pointerAddress}]:[${totalLovelace} lovelace]`);
        return totalLovelace >= this.CONSTANTS.cardanoAccountMinLovelace ? true : false;
    }

    async ensureHydraNetwork(): Promise<void> {
        const networkName = 'hydra-network';

        try {
            // Check if network already exists
            const networks = await this.docker.listNetworks();
            const existingNetwork = networks.find(network => network.Name === networkName);

            if (existingNetwork) {
                console.log(`Network ${networkName} already exists`);
                return;
            }

            // Create the network if it doesn't exist
            console.log(`Creating Docker network: ${networkName}`);
            await this.docker.createNetwork({
                Name: networkName,
                Driver: 'bridge',
                CheckDuplicate: true,
            });
            console.log(`Network ${networkName} created successfully`);
        } catch (error: any) {
            console.error(`Error ensuring network ${networkName}:`, error.message);
            throw new Error(`Failed to ensure network ${networkName}: ${error.message}`);
        }
    }

    async ensureCardanoNodeNetworkConnection(containerId: string): Promise<void> {
        try {
            // Ensure hydra-network exists first
            await this.ensureHydraNetwork();

            // Check if container is connected to hydra-network
            const containerInfo = await this.docker.getContainer(containerId).inspect();
            const isConnectedToHydraNetwork = containerInfo.NetworkSettings.Networks['hydra-network'];

            if (!isConnectedToHydraNetwork) {
                console.log('Connecting cardano-node to hydra-network');
                const hydraNetwork = this.docker.getNetwork('hydra-network');
                await hydraNetwork.connect({
                    Container: containerId,
                });
                console.log('Cardano-node successfully connected to hydra-network');
            } else {
                console.log('Cardano-node is already connected to hydra-network');
            }
        } catch (error: any) {
            console.error(`Error ensuring cardano-node network connection:`, error.message);
            // Don't throw here as this is not critical for startup
        }
    }

    async checkContainerNetworkConnection(containerId: string, networkName: string): Promise<boolean> {
        try {
            const containerInfo = await this.docker.getContainer(containerId).inspect();
            const networkSettings = containerInfo.NetworkSettings.Networks[networkName];
            return !!(networkSettings && networkSettings.IPAddress);
        } catch (error) {
            return false;
        }
    }

    async ensureContainerNetworkConnection(containerId: string, networkName: string): Promise<void> {
        try {
            // Check if container is properly connected to the network
            const isInitiallyConnected = await this.checkContainerNetworkConnection(containerId, networkName);

            if (!isInitiallyConnected) {
                console.log(
                    `Container ${containerId} not properly connected to ${networkName}, attempting to reconnect...`,
                );

                const network = this.docker.getNetwork(networkName);

                // Try to disconnect first (in case it's partially connected)
                try {
                    await network.disconnect({ Container: containerId, Force: true });
                } catch (disconnectError) {
                    // Ignore disconnect errors
                }

                // Reconnect to network
                await network.connect({
                    Container: containerId,
                });

                console.log(`Container ${containerId} successfully reconnected to ${networkName}`);
            } else {
                const containerInfo = await this.docker.getContainer(containerId).inspect();
                const networkSettings = containerInfo.NetworkSettings.Networks[networkName];
                console.log(
                    `Container ${containerId} is properly connected to ${networkName} with IP: ${networkSettings.IPAddress}`,
                );
            }
        } catch (error: any) {
            console.error(`Error ensuring container network connection:`, error.message);
            // Don't throw error here to avoid breaking the entire party activation
            // The container might still work if it gets connected later
        }
    }

    // async createGameRoom(partyObj: HydraParty, active_status = true) {
    //     const item = await this.gameRoomRepository.findOne({
    //         where: { party: { id: partyObj.id } },
    //     });
    //     if (item) {
    //         item.status = active_status ? 'ACTIVE' : 'INACTIVE';
    //         await this.gameRoomRepository.save(item);
    //     } else {
    //         const room = this.gameRoomRepository.create({
    //             party: partyObj,
    //             name: `Room ${partyObj.id}`,
    //             status: active_status ? 'ACTIVE' : 'INACTIVE',
    //         });
    //         this.gameRoomRepository.save(room);
    //     }
    // }

    getDockerContainerName(hydraNode: HydraNode) {
        return resolveHydraNodeName(hydraNode.id);
    }

    /**
     * Get container if exists, return null if not found
     */
    async getContainerIfExists(containerName: string): Promise<Docker.Container | null> {
        try {
            const container = this.docker.getContainer(containerName);
            await container.inspect(); // Verify container exists
            return container;
        } catch (error: any) {
            if (error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }

    /**
     * Stop container if running
     */
    async stopContainer(container: Docker.Container): Promise<void> {
        try {
            const state = await container.inspect();
            if (state.State.Running) {
                await container.stop();
                console.log(`Container ${state.Name} stopped`);
            }
        } catch (error: any) {
            console.error(`Error stopping container:`, error.message);
            throw error;
        }
    }

    /**
     * Start container if exists, create if not
     */
    async createContainer(
        nodeName: string,
        containerConfig: Docker.ContainerCreateOptions,
        retryCount = 2,
    ): Promise<Docker.Container> {
        let container: Docker.Container | null = null;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
                // Container doesn't exist, create new one
                if (attempt === 0) {
                    console.log(`Creating new container ${nodeName}...`);
                } else {
                    console.log(`Retry ${attempt}: Creating new container ${nodeName}...`);
                }

                container = await this.docker.createContainer({
                    ...containerConfig,
                    name: nodeName,
                });

                await container.start();
                console.log(`Container ${nodeName} created and started successfully`);
                return container;
            } catch (error: any) {
                lastError = error;
                console.error(`Attempt ${attempt + 1} failed for container ${nodeName}:`, error.message);

                // Cleanup on error (except last attempt)
                if (attempt < retryCount && container) {
                    try {
                        await this.cleanupContainer(container);
                        console.log(`Cleaned up container ${nodeName} after error`);
                    } catch (cleanupError) {
                        console.error(`Error during cleanup:`, cleanupError);
                    }
                }

                // Wait before retry
                if (attempt < retryCount) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        // All attempts failed
        throw new Error(
            `Failed to start/create container ${nodeName} after ${retryCount + 1} attempts: ${lastError?.message}`,
        );
    }

    /**
     * Cleanup container (stop and remove)
     */
    async cleanupContainer(container: Docker.Container): Promise<void> {
        try {
            const state = await container.inspect();
            if (state.State.Running) {
                await container.stop();
            }
            await container.remove();
            console.log(`Container ${state.Name} cleaned up (stopped and removed)`);
        } catch (error: any) {
            if (error.statusCode !== 404) {
                console.error(`Error cleaning up container:`, error.message);
                throw error;
            }
        }
    }

    /**
     * Get utxo of an address from blockfrost
     */
    async getAddressUtxoBlockfrost(address: string) {
        try {
            const provider = new ProviderUtils.BlockfrostProvider({
                apiKey: process.env.BLOCKFROST_PROJECT_ID,
                network: 'preprod',
            });
            const utxos = await provider.fetcher.fetchAddressUTxOs(address);
            console.log('>>> / file: hydra-main.service.ts:1156 / utxos:', utxos);
            return utxos;
        } catch (err) {
            console.log(`[Error getAddressUtxoBlockfrost] [${address}] `, err);
            throw err;
        }
    }
}
