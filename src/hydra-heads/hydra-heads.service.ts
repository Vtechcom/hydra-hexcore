import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateHydraHeadsDto } from './dto/create-hydra-heads.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HydraHead } from './entities/HydraHead.entity';
import { DataSource, In, Repository } from 'typeorm';
import { HydraNode } from 'src/hydra-main/entities/HydraNode.entity';
import * as net from 'net';
import { Account } from 'src/hydra-main/entities/Account.entity';
import { Logger } from '@nestjs/common';
import WebSocket from 'ws';
import { resolveHeadDirPath, resolvePersistenceDir } from 'src/hydra-main/utils/path-resolver';
import { access, constants, mkdir, rm } from 'node:fs/promises';
import { chmodSync, writeFileSync } from 'node:fs';
import { resolveHydraNodeName } from 'src/hydra-main/utils/name-resolver';
import { generateKeyFile } from 'src/common/utils/generator.util';
import { ActiveHydraHeadsDto } from './dto/active-hydra-heads.dto';
import { CardanoCliJs } from 'cardanocli-js';
import Docker from 'dockerode';
import { DockerService } from 'src/docker/docker.service';
import { convertUtxoToUTxOObject } from 'src/hydra-main/utils/ogmios-converter';
import { OgmiosClientService } from 'src/hydra-main/ogmios-client.service';
import { AddressUtxoDto } from 'src/hydra-main/dto/response/address-utxo.dto';
import { getEnterpriseAddressFromKeys } from 'src/common/utils/cardano-core';
import { HydraHeadKeys } from './interfaces/hydra-head-keys.type';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Caching } from 'src/common/interfaces/cache.type';
import { ClearHeadDataDto } from './dto/clear-head-data.dto';
import { HYDRA_CONFIG, HydraConfigInterface } from 'src/config/hydra.config';
import { CARDANO_SK, CARDANO_VK, HYDRA_SK, HYDRA_VK } from './contants/type-key.contants';
import { ProviderUtils } from '@hydra-sdk/core';
import { BlockFrostApiService } from 'src/blockfrost/blockfrost-api.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventEnum } from 'src/event-listener/enums/event.enum';
import { ActiveHydraHeadEvent } from 'src/event-listener/events/active-hydra-head.event';
import { Cron } from '@nestjs/schedule';

const TIMEOUT_NODE_READY_MS = 300000;
const POLL_INTERVAL_NODE_READY_MS = 3000;
const PER_NODE_CHECK_TIMEOUT_MS = 15000;

@Injectable()
export class HydraHeadService {
    private logger = new Logger(HydraHeadService.name);

    constructor(
        @InjectRepository(HydraHead)
        private hydraHeadRepository: Repository<HydraHead>,
        @InjectRepository(HydraNode)
        private readonly hydraNodeRepository: Repository<HydraNode>,
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        private readonly dataSource: DataSource,
        private readonly dockerService: DockerService,
        private readonly ogmiosClientService: OgmiosClientService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        @Inject(HYDRA_CONFIG) private readonly hydraConfig: HydraConfigInterface,
        private readonly blockfrostApiService: BlockFrostApiService,
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2,
    ) {}

    async create(body: CreateHydraHeadsDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // create a head
            const newHydraHead = this.hydraHeadRepository.create();
            newHydraHead.description = body.description;
            newHydraHead.status = 'configured';
            newHydraHead.contestationPeriod = body.contestationPeriod?.toString();
            newHydraHead.depositPeriod = body.depositPeriod?.toString();
            newHydraHead.persistenceRotateAfter = body.persistenceRotateAfter?.toString();
            newHydraHead.protocolParameters = body.protocolParams;
            newHydraHead.nodes = body.hydraHeadKeys.length;
            const account = await this.accountRepository.findOne({
                where: { id: 1 },
            });

            // save the head
            await this.hydraHeadRepository.save(newHydraHead);

            // create head directory
            const headDirPath = resolveHeadDirPath(newHydraHead.id, this.hydraConfig.hydraNodeFolder);
            try {
                await access(headDirPath, constants.R_OK | constants.W_OK);
            } catch (error: any) {
                this.logger.error(`Error while accessing head dir: ${headDirPath} - ${error.message}`);
                await mkdir(headDirPath, { recursive: true });
                await chmodSync(headDirPath, 0o775);
            }

            if (this.configService.get('CARDANO_CONNECTION_MODE') !== 'cardano-node' && body.blockfrostProjectId) {
                const blockfrostFilePath = `${headDirPath}/blockfrost-project.txt`;
                await this.writeFile(blockfrostFilePath, body.blockfrostProjectId);
            }

            // create nodes for the head
            const nodes = [];
            for (const hydraHeadKey of body.hydraHeadKeys) {
                const newHydraNode = await this.createHydraNode(newHydraHead, account, hydraHeadKey);
                nodes.push({
                    ...newHydraNode,
                    hydraHeadKey,
                });

                const nodeName = this.getDockerContainerName(newHydraNode);

                const skeyFilePath = `${headDirPath}/${nodeName}.sk`;
                const vkeyFilePath = `${headDirPath}/${nodeName}.vk`;
                const cardanoSkeyFilePath = `${headDirPath}/${nodeName}.cardano.sk`;
                const cardanoVkeyFilePath = `${headDirPath}/${nodeName}.cardano.vk`;

                // create credentials files
                await this.writeFile(skeyFilePath, generateKeyFile(newHydraNode.skey, HYDRA_SK));
                await this.writeFile(vkeyFilePath, generateKeyFile(newHydraNode.vkey, HYDRA_VK));
                await this.writeFile(cardanoSkeyFilePath, generateKeyFile(newHydraNode.cardanoSKey, CARDANO_SK));
                await this.writeFile(cardanoVkeyFilePath, generateKeyFile(newHydraNode.cardanoVKey, CARDANO_VK));
                console.log(`Created credential files for ${nodeName}`);
            }
            await queryRunner.commitTransaction();

            return {
                ...newHydraHead,
                nodes,
            };
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error while creating hydra head: ${error.message}`);
            throw error;
        }
    }

    async list() {
        const heads = await this.hydraHeadRepository
            .createQueryBuilder('head')
            .leftJoinAndSelect('head.hydraNodes', 'hydraNodes')
            .leftJoinAndSelect('hydraNodes.cardanoAccount', 'cardanoAccount')
            .addOrderBy('head.id', 'DESC')
            .getMany();
        const activeNodes = await this.getActiveNodeContainers();
        return heads.map(head => {
            const isActive =
                head.hydraNodes.length &&
                head.hydraNodes.every(hydraNode => {
                    return activeNodes.find(
                        item => item.hydraHeadId === head.id.toString() && item.hydraNodeId === hydraNode.id.toString(),
                    );
                });
            return {
                ...head,
                status: isActive ? 'ACTIVE' : 'INACTIVE',
            };
        });
    }

    async getActiveNodeContainers() {
        const activeNodes = (await this.cacheManager.get<Caching['activeNodes']>('activeNodes')) || [];
        return activeNodes;
    }

    async checkNodesActiveHydraHead(hydraNodes: HydraNode[]): Promise<void> {
        // Get active nodes from cache (updated by cron job every 10 seconds)
        // This is more accurate than querying database as it reflects actual running containers
        const activeNodes = await this.getActiveNodeContainers();

        // Check nodes active
        const activeNode = hydraNodes.filter(node =>
            activeNodes.some(active => active.hydraNodeId === node.id.toString()),
        );
        console.log('Active nodes for head check:', activeNode);

        if (activeNode.length >= hydraNodes.length) {
            throw new BadRequestException('Head has already started');
        }

        const nodesToAdd = hydraNodes.length;
        const currentActiveNodesCount = activeNodes.length;

        const maxActiveNodes = this.hydraConfig.maxActiveNodes || 20;

        console.log(
            'maxActiveNodes',
            maxActiveNodes,
            'currentActiveNodesCount',
            currentActiveNodesCount,
            'nodesToAdd',
            nodesToAdd,
        );
        if (currentActiveNodesCount + nodesToAdd > maxActiveNodes) {
            this.logger.error(
                `Cannot activate head: would exceed maximum active nodes limit (${maxActiveNodes}). ` +
                    `Current active: ${currentActiveNodesCount}, attempting to add: ${nodesToAdd}`,
            );
            throw new BadRequestException(
                `Cannot activate head: maximum active nodes limit (${maxActiveNodes}) would be exceeded. ` +
                    `Current active nodes: ${currentActiveNodesCount}, nodes to add: ${nodesToAdd}`,
            );
        }
    }

    async createHydraNode(head: HydraHead, account: Account, hydraHeadKey: HydraHeadKeys): Promise<HydraNode> {
        const newHydraNode = this.hydraNodeRepository.create();
        newHydraNode.cardanoAccount = account;
        newHydraNode.description = `Generated by head ${head.id}`;
        newHydraNode.skey = hydraHeadKey.hydraHeadSkey;
        newHydraNode.vkey = hydraHeadKey.hydraHeadVkey;
        newHydraNode.cardanoVKey = hydraHeadKey.fundVkey;
        newHydraNode.cardanoSKey = hydraHeadKey.fundSkey;
        newHydraNode.port = await this.genValidPort();
        newHydraNode.hydraHead = head;
        await this.hydraNodeRepository.save(newHydraNode);

        return newHydraNode;
    }

    async activeHydraHead(activeHeadDto: ActiveHydraHeadsDto) {
        console.log('Load hydra config: ', this.hydraConfig);
        const headId = activeHeadDto.id;
        const head = await this.hydraHeadRepository
            .createQueryBuilder('head')
            .where('head.id = :id', { id: headId })
            .leftJoinAndSelect('head.hydraNodes', 'hydraNodes')
            .leftJoinAndSelect('hydraNodes.cardanoAccount', 'cardanoAccount')
            .getOne();

        if (!head) {
            this.logger.error('Invalid Head Id');
            throw new BadRequestException('Invalid Head Id');
        }

        await this.checkNodesActiveHydraHead(head.hydraNodes);

        // if (head.status === 'ACTIVE') {
        //     throw new BadRequestException('Head is already active');
        // }
        // for (const node of head.hydraNodes) {
        //     const enterpriseAddress = getEnterpriseAddressFromKeys(
        //         node.cardanoSKey as `5820${string}`,
        //         node.cardanoVKey as `5820${string}`,
        //         0,
        //     );
        //     const check = await this.checkUtxoAccount(enterpriseAddress);
        //     if (!check) {
        //         this.logger.error(enterpriseAddress + ' not enough lovelace');
        //         throw new BadRequestException(enterpriseAddress + ' not enough lovelace');
        //     }
        // }
        const headDirPath = resolveHeadDirPath(head.id, this.hydraConfig.hydraNodeFolder);

        let protocolParameters: any;
        if (this.configService.get('CARDANO_CONNECTION_MODE') === 'cardano-node') {
            // generate protocol-parameters.json from cardano-node
            const cardanoCli = new CardanoCliJs({
                cliPath: `docker exec cardano-node cardano-cli`,
                dir: `/workspace`,
                era: '',
                network: '1',
                socketPath: '/workspace/node.socket',
                shelleyGenesis: '/workspace/shelley-genesis.json',
            });
            const output = await cardanoCli.runCommand({
                command: 'query',
                subcommand: 'protocol-parameters',
                parameters: [
                    { name: 'socket-path', value: '/workspace/node.socket' },
                    { name: 'testnet-magic', value: '1' },
                ],
            });
            protocolParameters = JSON.parse(Buffer.from(output).toString());
        } else {
            // Get protocol parameters from Blockfrost API
            const blockfrostParams = await this.blockfrostApiService.getProtocolParameters();
            protocolParameters = this.convertBlockfrostToCardanoCliFormat(blockfrostParams);
        }

        await this.writeFile(
            `${headDirPath}/protocol-parameters.json`,
            JSON.stringify({
                ...protocolParameters,
                ...head.protocolParameters,
            }),
        );

        // ensure hydra-network exists before creating containers
        await this.dockerService.ensureHydraNetwork();

        // Track created containers for cleanup on error
        const createdContainers: Docker.Container[] = [];

        try {
            console.log(`Creating containers for ${head.hydraNodes.length} nodes...`);
            for (const node of head.hydraNodes) {
                const peerNodes = head.hydraNodes.filter(peerNode => peerNode.id !== node.id);
                const nodeName = this.getDockerContainerName(node);

                // remove container if existed
                await this.dockerService.handleDockerContainerExist(nodeName);

                const cleanArg = (str: string | number) =>
                    String(str)
                        .replace(/[^\x20-\x7E]/g, '')
                        .trim();
                /**
                 * NOTE:
                 * - Cập nhật command run node cho Hydra v0.21.0
                 * - Chuyển sang chế độ network custom brigde:
                 * - Nếu chưa có custom bridge network: `docker network create --driver bridge hydra-network`
                 * - Thêm advertise param
                 */
                /**
                 * NOTE:
                 * - Cập nhật command run node cho Hydra v0.22.2
                 * - Chuyển sang chế độ network custom brigde:
                 * - Nếu chưa có custom bridge network: `docker network create --driver bridge hydra-network`
                 * - Thêm advertise param
                 */
                const peerNodeParams = peerNodes
                    .map(peerNode => {
                        const nodeName = this.getDockerContainerName(peerNode);
                        return [
                            '--peer',
                            `${nodeName}:${peerNode.port + 1000}`,
                            `--hydra-verification-key`,
                            `/data/head-${head.id}/${nodeName}.vk`,
                            `--cardano-verification-key`,
                            `/data/head-${head.id}/${nodeName}.cardano.vk`,
                        ];
                    })
                    .flat();
                const containerConfig: Docker.ContainerCreateOptions = {
                    Image: this.hydraConfig.hydraNodeImage,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    // prettier-ignore
                    Cmd: [
                        '--node-id', `${nodeName}`,
                        '--listen', `0.0.0.0:${node.port + 1000}`,
                        '--advertise', `${nodeName}:${node.port + 1000}`, 
                        '--hydra-signing-key', `/data/head-${head.id}/${nodeName}.sk`,
                        '--persistence-dir', `/data${resolvePersistenceDir(head.id, nodeName)}`,
                        '--api-host', '0.0.0.0',
                        '--api-port', `${node.port}`,
                        ...peerNodeParams,
                        '--cardano-signing-key', `/data/head-${head.id}/${nodeName}.cardano.sk`,
                        // Skip hydra-scripts-tx-id if empty - let Hydra use built-in scripts
                        ...(this.hydraConfig.hydraNodeScriptTxId ? ['--hydra-scripts-tx-id', this.hydraConfig.hydraNodeScriptTxId] : []),
                        '--persistence-rotate-after', head.persistenceRotateAfter, // 15_000 seq

                        '--deposit-period', head.depositPeriod + 's',
                        '--contestation-period', head.contestationPeriod + 's',
                        
                        ...(this.configService.get('CARDANO_CONNECTION_MODE') === 'cardano-node'
                            ? [
                                '--testnet-magic', `${this.hydraConfig.hydraNodeNetworkId}`,
                                '--node-socket', `/cardano-node/node.socket`
                            ]
                            : ['--blockfrost', `/data/head-${head.id}/blockfrost-project.txt`]
                        ),
                        '--ledger-protocol-parameters', `/data/head-${head.id}/protocol-parameters.json`,
                    ],
                    HostConfig: {
                        NetworkMode: 'hydra-network',
                        Binds: [
                            `${this.hydraConfig.hydraNodeFolder}:/data`,
                            `${this.hydraConfig.cardanoNodeFolder}:/cardano-node`,
                        ],
                        PortBindings: {
                            [`${node.port}/tcp`]: [{ HostPort: `${node.port}` }],
                            [`${node.port + 1000}/tcp`]: [{ HostPort: `${node.port + 1000}` }],
                        },
                    },
                    ExposedPorts: {
                        [`${node.port}/tcp`]: {},
                        [`${node.port + 1000}/tcp`]: {},
                    },
                    Labels: {
                        [this.hydraConfig.hydraHeadLabel]: head.id.toString(),
                        [this.hydraConfig.hydraNodeLabel]: node.id.toString(),
                    },
                    Env: [
                        'ETCD_AUTO_COMPACTION_MODE=periodic',
                        'ETCD_AUTO_COMPACTION_RETENTION=168h',
                        // Giảm nhịp heartbeat, tăng timeout election để hạn chế lease drop
                        'ETCD_HEARTBEAT_INTERVAL=1000', // 1000ms
                        'ETCD_ELECTION_TIMEOUT=5000', // 5000ms
                    ],
                    User: `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
                };
                // Use createContainer with retry logic
                const container = await this.dockerService.createContainer(nodeName, containerConfig, 2);
                createdContainers.push(container);

                // @ts-ignore
                node.container = {
                    id: container.id,
                    name: nodeName,
                    args: (await container.inspect()).Args,
                    image: (await container.inspect()).Config.Image,
                };
            }

            // Update in-memory cache - add newly activated nodes
            await this.dockerService.cacheActiveNodes(head, createdContainers);

            // Wait for all nodes to be ready (receive Greetings with headStatus: Idle)
            this.logger.log(`Waiting for all ${head.hydraNodes.length} nodes to be ready...`);
            await this.waitForAllNodesReady(head.hydraNodes, TIMEOUT_NODE_READY_MS, POLL_INTERVAL_NODE_READY_MS);
            this.logger.log(`All nodes for Head ${head.id} are ready and accepting connections!`);

            // All containers started successfully
            head.status = 'running';
            await this.hydraHeadRepository.save(head);

            this.eventEmitter.emit(
                EventEnum.ACTIVE_HYDRA_HEAD,
                new ActiveHydraHeadEvent(
                    head.id,
                    head.status,
                    head.hydraNodes.map(node => ({
                        ...node,
                        status: 'running',
                    })),
                ),
            );
        } catch (error: any) {
            // If any container fails, cleanup all created containers
            this.logger.error(`Error activating head ${head.id}: ${error.message}`);
            this.logger.log(`Cleaning up ${createdContainers.length} containers due to error...`);

            for (const container of createdContainers) {
                try {
                    await this.dockerService.cleanupContainer(container);
                } catch (cleanupError: any) {
                    this.logger.error(`Error during cleanup: ${cleanupError.message}`);
                }
            }

            head.status = 'stop';
            await this.hydraHeadRepository.save(head);
            this.eventEmitter.emit(
                EventEnum.ACTIVE_HYDRA_HEAD,
                new ActiveHydraHeadEvent(
                    head.id,
                    head.status,
                    head.hydraNodes.map(node => ({
                        ...node,
                        status: 'stop',
                    })),
                ),
            );

            throw new BadRequestException(`Failed to activate head: ${error.message}`);
        }

        // active GameRoom
        // await this.createGameRoom(head);

        // check head active
        // const status = await this.checkHeadActive(head);

        return {
            ...head,
            // status: status ? 'ACTIVE' : 'INACTIVE',
        };
    }

    public convertBlockfrostToCardanoCliFormat(blockfrostParams: any) {
        const hydraParams = {
            collateralPercentage: blockfrostParams.collateral_percent,
            committeeMaxTermLength: parseInt(blockfrostParams.committee_max_term_length),
            committeeMinSize: parseInt(blockfrostParams.committee_min_size),

            // Use cost_models_raw (array format) instead of cost_models (object format)
            costModels: {
                PlutusV1: blockfrostParams.cost_models_raw?.PlutusV1 || [],
                PlutusV2: blockfrostParams.cost_models_raw?.PlutusV2 || [],
                PlutusV3: blockfrostParams.cost_models_raw?.PlutusV3 || [],
            },

            dRepActivity: parseInt(blockfrostParams.drep_activity),
            dRepDeposit: parseInt(blockfrostParams.drep_deposit),

            dRepVotingThresholds: {
                committeeNoConfidence: blockfrostParams.dvt_committee_no_confidence,
                committeeNormal: blockfrostParams.dvt_committee_normal,
                hardForkInitiation: blockfrostParams.dvt_hard_fork_initiation,
                motionNoConfidence: blockfrostParams.dvt_motion_no_confidence,
                ppEconomicGroup: blockfrostParams.dvt_p_p_economic_group,
                ppGovGroup: blockfrostParams.dvt_p_p_gov_group,
                ppNetworkGroup: blockfrostParams.dvt_p_p_network_group,
                ppTechnicalGroup: blockfrostParams.dvt_p_p_technical_group,
                treasuryWithdrawal: blockfrostParams.dvt_treasury_withdrawal,
                updateToConstitution: blockfrostParams.dvt_update_to_constitution,
            },

            executionUnitPrices: {
                priceSteps: parseFloat(blockfrostParams.price_step),
                priceMemory: parseFloat(blockfrostParams.price_mem),
            },

            govActionDeposit: parseInt(blockfrostParams.gov_action_deposit),
            govActionLifetime: parseInt(blockfrostParams.gov_action_lifetime),
            maxBlockBodySize: blockfrostParams.max_block_size,

            maxBlockExecutionUnits: {
                memory: parseInt(blockfrostParams.max_block_ex_mem),
                steps: parseInt(blockfrostParams.max_block_ex_steps),
            },

            maxBlockHeaderSize: blockfrostParams.max_block_header_size,
            maxCollateralInputs: blockfrostParams.max_collateral_inputs,

            maxTxExecutionUnits: {
                memory: parseInt(blockfrostParams.max_tx_ex_mem),
                steps: parseInt(blockfrostParams.max_tx_ex_steps),
            },

            maxTxSize: blockfrostParams.max_tx_size,
            maxValueSize: parseInt(blockfrostParams.max_val_size),
            minFeeRefScriptCostPerByte: blockfrostParams.min_fee_ref_script_cost_per_byte,
            minPoolCost: parseInt(blockfrostParams.min_pool_cost),
            monetaryExpansion: parseFloat(blockfrostParams.rho),
            poolPledgeInfluence: parseFloat(blockfrostParams.a0),
            poolRetireMaxEpoch: blockfrostParams.e_max,

            poolVotingThresholds: {
                committeeNoConfidence: blockfrostParams.pvt_committee_no_confidence,
                committeeNormal: blockfrostParams.pvt_committee_normal,
                hardForkInitiation: blockfrostParams.pvt_hard_fork_initiation,
                motionNoConfidence: blockfrostParams.pvt_motion_no_confidence,
                ppSecurityGroup: blockfrostParams.pvt_p_p_security_group,
            },

            protocolVersion: {
                major: blockfrostParams.protocol_major_ver,
                minor: blockfrostParams.protocol_minor_ver,
            },

            stakeAddressDeposit: parseInt(blockfrostParams.key_deposit),
            stakePoolDeposit: parseInt(blockfrostParams.pool_deposit),
            stakePoolTargetNum: blockfrostParams.n_opt,
            treasuryCut: parseFloat(blockfrostParams.tau),
            txFeeFixed: blockfrostParams.min_fee_b,
            txFeePerByte: blockfrostParams.min_fee_a,
            utxoCostPerByte: parseInt(blockfrostParams.coins_per_utxo_size),
        };

        return hydraParams;
    }

    async deactiveHydraHead(activeHeadDto: ActiveHydraHeadsDto): Promise<HydraHead> {
        const headId = activeHeadDto.id;
        const head = await this.hydraHeadRepository
            .createQueryBuilder('head')
            .where('head.id = :id', { id: headId })
            .leftJoinAndSelect('head.hydraNodes', 'hydraNodes')
            .leftJoinAndSelect('hydraNodes.cardanoAccount', 'cardanoAccount')
            .getOne();

        if (!head) {
            throw new BadRequestException('Invalid Head Id');
        }
        // if (head.status === 'INACTIVE') {
        //     throw new BadRequestException('Head is already inactive');
        // }
        // Stop all containers for this head (don't remove, keep for reuse)
        for (const node of head.hydraNodes) {
            const nodeName = this.getDockerContainerName(node);
            await this.dockerService.removeContainerByName(nodeName);
        }

        head.status = 'stop';
        await this.hydraHeadRepository.save(head);
        await this.dockerService.updateHydraContainerStatus();

        // check head active
        // const status = await this.checkHeadActive(head);

        return {
            ...head,
            // status: status ? 'ACTIVE' : 'INACTIVE',
        };
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

    getDockerContainerName(hydraNode: HydraNode) {
        return resolveHydraNodeName(hydraNode.id);
    }

    /**
     * Check if a single Hydra node is ready by connecting to its WebSocket API
     * and waiting for a Greetings message (any headStatus: Idle, Open, Initializing, etc.)
     * @param port - The API port of the Hydra node
     * @param timeoutMs - Maximum time to wait for the node to be ready (default: 15000ms)
     * @returns Promise<boolean> - True if the node is ready, false otherwise
     */
    async checkNodeReady(port: number, timeoutMs: number = 15000): Promise<boolean> {
        return new Promise(resolve => {
            const wsUrl = `ws://localhost:${port}`;
            let ws: WebSocket | null = null;
            let timeoutId: NodeJS.Timeout | null = null;
            let resolved = false;

            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                if (ws) {
                    try {
                        ws.removeAllListeners();
                        ws.close();
                    } catch (e) {
                        // Ignore close errors
                    }
                    ws = null;
                }
            };

            const resolveOnce = (value: boolean) => {
                if (!resolved) {
                    resolved = true;
                    cleanup();
                    resolve(value);
                }
            };

            // Set timeout
            timeoutId = setTimeout(() => {
                this.logger.warn(`Node at port ${port} did not become ready within ${timeoutMs}ms`);
                resolveOnce(false);
            }, timeoutMs);

            try {
                ws = new WebSocket(wsUrl);

                ws.on('open', () => {
                    this.logger.log(`WebSocket connected to node at port ${port}, waiting for Greetings...`);
                });

                ws.on('message', (data: Buffer) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.logger.log(`Received WS message from port ${port}: tag=${message.tag}`);
                        // Accept any Greetings message - node is ready regardless of headStatus
                        // Valid headStatus values: Idle, Initializing, Open, Closed, Final
                        if (message.tag === 'Greetings') {
                            this.logger.log(`Node at port ${port} is ready (headStatus: ${message.headStatus})`);
                            resolveOnce(true);
                        }
                    } catch (e) {
                        this.logger.error(`Error parsing message from node at port ${port}: ${e}`);
                    }
                });

                ws.on('error', (error: Error) => {
                    this.logger.warn(`WebSocket error for node at port ${port}: ${error.message}`);
                    // Resolve false immediately so waitForAllNodesReady can retry faster
                    resolveOnce(false);
                });

                ws.on('close', (code: number, reason: Buffer) => {
                    this.logger.log(`WebSocket closed for node at port ${port} (code: ${code}, reason: ${reason?.toString() || 'none'})`);
                    // Resolve false immediately when connection closes without Greetings
                    resolveOnce(false);
                });
            } catch (error: any) {
                this.logger.error(`Failed to connect to node at port ${port}: ${error.message}`);
                resolveOnce(false);
            }
        });
    }

    /**
     * Wait for all Hydra nodes to be ready before proceeding
     * @param nodes - Array of HydraNode objects
     * @param timeoutMs - Maximum time to wait for each node (default: 60000ms)
     * @param retryIntervalMs - Interval between retry attempts (default: 2000ms)
     * @returns Promise<void> - Resolves when all nodes are ready, throws if timeout
     */
    async waitForAllNodesReady(
        nodes: HydraNode[],
        timeoutMs: number = 60000,
        retryIntervalMs: number = 2000,
    ): Promise<void> {
        const startTime = Date.now();
        const nodeStatuses = new Map<number, boolean>();

        // Initialize all nodes as not ready
        for (const node of nodes) {
            nodeStatuses.set(node.id, false);
        }

        this.logger.log(`Waiting for ${nodes.length} nodes to be ready...`);

        while (Date.now() - startTime < timeoutMs) {
            const pendingNodes = nodes.filter(node => !nodeStatuses.get(node.id));

            if (pendingNodes.length === 0) {
                this.logger.log('All nodes are ready!');
                return;
            }

            // Check all pending nodes in parallel
            const checkPromises = pendingNodes.map(async node => {
                const isReady = await this.checkNodeReady(node.port, PER_NODE_CHECK_TIMEOUT_MS);
                if (isReady) {
                    nodeStatuses.set(node.id, true);
                    this.logger.log(`Node ${node.id} (port ${node.port}) is now ready`);
                }
                return { nodeId: node.id, isReady };
            });

            await Promise.all(checkPromises);

            // Check if all nodes are ready
            const allReady = nodes.every(node => nodeStatuses.get(node.id));
            if (allReady) {
                this.logger.log('All nodes are ready!');
                return;
            }

            // Wait before next retry
            const remainingNodes = nodes.filter(node => !nodeStatuses.get(node.id));
            this.logger.log(
                `Waiting for ${remainingNodes.length} nodes to be ready. ` +
                    `Retrying in ${retryIntervalMs}ms... ` +
                    `(${Math.round((Date.now() - startTime) / 1000)}s elapsed)`,
            );
            await new Promise(resolve => setTimeout(resolve, retryIntervalMs));
        }

        // Timeout reached
        const notReadyNodes = nodes.filter(node => !nodeStatuses.get(node.id));
        const notReadyPorts = notReadyNodes.map(n => n.port).join(', ');
        throw new BadRequestException(
            `Timeout waiting for nodes to be ready. The following nodes did not respond: ports [${notReadyPorts}]`,
        );
    }

    async writeFile(filePath: string, content: string): Promise<void> {
        await writeFileSync(filePath, content, {
            encoding: 'utf-8',
        });
    }

    async checkUtxoAccount(enterpriseAddress: string) {
        this.logger.log(`Checking UTXO for address: ${enterpriseAddress}`);
        const provider = new ProviderUtils.BlockfrostProvider({
            apiKey: process.env.BLOCKFROST_PROJECT_ID,
            network: 'preprod',
        });
        const utxo = await provider.fetcher.fetchAddressUTxOs(enterpriseAddress);

        const totalLovelace = Object.values(utxo).reduce((sum, item) => {
            const lovelaceUtxo = item.output.amount.reduce(
                (acc: bigint, atm) => (atm.unit === 'lovelace' ? acc + BigInt(atm.quantity) : acc),
                0n,
            );
            return sum + lovelaceUtxo;
        }, 0n);
        // const a_utxo = await this.getAddressUtxo(enterpriseAddress);
        console.log(`[${enterpriseAddress}]:[${totalLovelace} lovelace]`);
        console.log(
            `Total lovelace: ${totalLovelace}, Required minimum: ${this.hydraConfig.cardanoAccountMinLovelace}`,
        );
        return totalLovelace >= this.hydraConfig.cardanoAccountMinLovelace ? true : false;
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

    async clearHeadData(data: ClearHeadDataDto) {
        try {
            console.log('data.ids', data.ids);
            const headIds = data.ids;
            const [heads, count] = await this.hydraHeadRepository
                .createQueryBuilder('head')
                .where('head.id IN (:...ids)', { ids: headIds })
                .leftJoinAndSelect('head.hydraNodes', 'hydraNodes')
                .leftJoinAndSelect('hydraNodes.cardanoAccount', 'cardanoAccount')
                .getManyAndCount();

            if (!count || !heads) {
                throw new NotFoundException('Invalid Head Id');
            }
            // await access(headDirPath, constants.R_OK | constants.W_OK);
            const removedDirs = [] as string[];
            const errors = [] as string[];
            for (const head of heads) {
                for (const node of head.hydraNodes) {
                    const persistenceDir = resolvePersistenceDir(
                        head.id,
                        resolveHydraNodeName(node.id),
                        this.hydraConfig.hydraNodeFolder,
                    );
                    console.log('persistenceDir', persistenceDir);
                    try {
                        await access(persistenceDir, constants.R_OK | constants.W_OK);
                        await rm(persistenceDir, { recursive: true, force: true });
                        removedDirs.push(persistenceDir);
                    } catch (error: any) {
                        errors.push(error.message);
                    }
                }
            }
            return {
                removedDirs,
                errors,
                heads,
            };
        } catch (error: any) {
            console.log('error', error);
            // console.error(`Error while accessing head dir: ${headDirPath}`, error.message);
            // await mkdir(headDirPath, { recursive: true });
            return [];
        }
    }

    async delete(id: number) {
        const head = await this.hydraHeadRepository.findOne({
            where: { id },
            relations: ['hydraNodes'],
        });

        if (!head) {
            throw new NotFoundException('Hydra Head not found');
        }

        // Remove docker containers (best-effort)
        for (const node of head.hydraNodes) {
            const nodeName = this.getDockerContainerName(node);
            try {
                await this.dockerService.removeContainerByName(nodeName);
            } catch (err: any) {
                throw new BadRequestException(`Failed to remove container ${nodeName}: ${err.message}`);
            }
        }

        try {
            // Remove head directory
            const headDirPath = resolveHeadDirPath(head.id, this.hydraConfig.hydraNodeFolder);
            await access(headDirPath, constants.R_OK | constants.W_OK);
            await rm(headDirPath, { recursive: true, force: true });
            console.log(`Removed head directory: ${headDirPath}`);
        } catch (error: any) {
            console.log(`Error removing head directory: ${error.message}`);
        }

        // Remove DB in transaction
        await this.dataSource.transaction(async manager => {
            await manager.delete(HydraNode, {
                id: In(head.hydraNodes.map(n => n.id)),
            });
            await manager.delete(HydraHead, head.id);
        });

        return {
            message: `Hydra Head ${id} and its nodes have been deleted.`,
        };
    }

    async restart(id: number) {
        const head = await this.hydraHeadRepository.findOne({
            where: { id },
            relations: ['hydraNodes'],
        });

        if (!head) {
            throw new NotFoundException('Hydra Head not found');
        }

        // Get active nodes from Redis
        const activeNodesCache = await this.cacheManager.get<Caching['activeNodes']>('activeNodes');
        const activeNodes = activeNodesCache || [];

        // Check if all nodes of this head are active in Redis
        const inactiveNodes = [];
        for (const node of head.hydraNodes) {
            const isNodeActive = activeNodes.some(
                activeNode =>
                    activeNode.hydraNodeId === node.id.toString() &&
                    activeNode.hydraHeadId === head.id.toString() &&
                    activeNode.isActive === true,
            );

            if (!isNodeActive) {
                const nodeName = this.getDockerContainerName(node);
                inactiveNodes.push(nodeName);
            }
        }

        if (inactiveNodes.length > 0) {
            throw new BadRequestException(
                `Cannot restart Hydra Head ${id}: The following nodes are not active: ${inactiveNodes.join(', ')}. ` +
                    `Please ensure all nodes are running before restarting the head.`,
            );
        }

        // All nodes are active, proceed with restart
        try {
            let containers: Docker.Container[] = [];
            await Promise.all(
                head.hydraNodes.map(node => {
                    const nodeName = this.getDockerContainerName(node);
                    return this.dockerService.restartContainerByName(nodeName);
                }),
            );
            for (const node of head.hydraNodes) {
                const nodeName = this.getDockerContainerName(node);
                const container = await this.dockerService.getContainerByName(nodeName);
                containers.push(container);
            }
            await this.dockerService.cacheActiveNodes(head, containers);
            await this.waitForAllNodesReady(head.hydraNodes, TIMEOUT_NODE_READY_MS, POLL_INTERVAL_NODE_READY_MS);
            this.eventEmitter.emit(EventEnum.ACTIVE_HYDRA_HEAD, new ActiveHydraHeadEvent(head.id, head.status));
        } catch (err: any) {
            let headStatus: string = head.status;
            for (const node of head.hydraNodes) {
                const nodeName = this.getDockerContainerName(node);
                const isRunning = await this.dockerService.checkContainerRunning(nodeName);
                if (!isRunning) {
                    head.status = 'stop';
                    await this.hydraHeadRepository.save(head);
                    break;
                }
            }
            console.log('Running come here!!!');
            this.eventEmitter.emit(EventEnum.ACTIVE_HYDRA_HEAD, new ActiveHydraHeadEvent(head.id, headStatus));
            throw new BadRequestException(`Have error when restart Hydra Head ${id}: ${err.message}`);
        }

        return {
            message: `Hydra Head ${id} containers have been restarted successfully.`,
        };
    }

    /**
     * Cron job chạy mỗi 10 giây để kiểm tra trạng thái các node
     * Nếu head trong DB có status "running" nhưng container đã chết thì sync với Hub
     */
    @Cron('*/10 * * * * *')
    async checkNodeHealth(): Promise<void> {
        try {
            // Get all running heads in DB
            const runningHeads = await this.hydraHeadRepository.find({
                where: { status: 'running' },
                relations: ['hydraNodes'],
            });

            if (runningHeads.length === 0) {
                return;
            }

            for (const head of runningHeads) {
                const headNodes = head.hydraNodes || [];
                if (headNodes.length === 0) continue;

                // FIXED: Reset nodes array PER HEAD (was previously shared across all heads)
                const stoppedNodes: HydraNode[] = [];

                // Kiểm tra xem có node nào bị chết không
                for (const node of headNodes) {
                    const containerName = this.getDockerContainerName(node);
                    const isRunning = await this.dockerService.checkContainerRunning(containerName);

                    if (!isRunning) stoppedNodes.push({ ...node, status: 'stop' } as HydraNode);
                }
                try {
                    if (stoppedNodes.length > 0) {
                        this.logger.warn(
                            `Head ${head.id}: ${stoppedNodes.length}/${headNodes.length} nodes stopped`,
                        );
                        // Cập nhật DB
                        await this.hydraHeadRepository.update(head.id, { status: 'stop' });
                        // Sync với Hub
                        await this.eventEmitter.emitAsync(
                            EventEnum.ACTIVE_HYDRA_HEAD,
                            new ActiveHydraHeadEvent(
                                head.id,
                                'stop',
                                stoppedNodes.map(node => ({
                                    ...node,
                                    status: 'stop',
                                })),
                            ),
                        );
                        this.logger.log(`Synced Head ${head.id} status "stop" with Hub`);
                    }
                } catch (err: any) {
                    this.logger.error(`Failed to sync Head ${head.id} with Hub: ${err.message}`);
                }
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Health check error: ${errorMsg}`);
        }
    }
}
