import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateHydraHeadsDto } from './dto/create-hydra-heads.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HydraHead } from './entities/HydraHead.entity';
import { DataSource, In, Repository } from 'typeorm';
import { HydraNode } from 'src/hydra-main/entities/HydraNode.entity';
import * as net from 'net';
import { Account } from 'src/hydra-main/entities/Account.entity';
import { Logger } from '@nestjs/common';
import { resolveHeadDirPath, resolvePersistenceDir } from 'src/hydra-main/utils/path-resolver';
import { access, constants, mkdir, rm } from 'node:fs/promises';
import { chmodSync, writeFileSync } from 'node:fs';
import { resolveHydraNodeName } from 'src/hydra-main/utils/name-resolver';
import { generateKeyFile } from 'src/utils/generator.util';
import { ActiveHydraHeadsDto } from './dto/active-hydra-heads.dto';
import { CardanoCliJs } from 'cardanocli-js';
import Docker from 'dockerode';
import { DockerService } from 'src/docker/docker.service';
import { convertUtxoToUTxOObject } from 'src/hydra-main/utils/ogmios-converter';
import { OgmiosClientService } from 'src/hydra-main/ogmios-client.service';
import { AddressUtxoDto } from 'src/hydra-main/dto/response/address-utxo.dto';
import { getEnterpriseAddressFromKeys } from 'src/utils/cardano-core';
import { HydraHeadKeys } from './interfaces/hydra-head-keys.type';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Caching } from 'src/common/interfaces/cache.type';
import { ClearHeadDataDto } from './dto/clear-head-data.dto';
import { HYDRA_CONFIG, HydraConfigInterface } from 'src/config/hydra.config';
import { CARDANO_SK, CARDANO_VK, HYDRA_SK, HYDRA_VK } from './contants/type-key.contants';
import { ProviderUtils } from '@hydra-sdk/core';
import { BlockFrostApiService } from 'src/blockfrost/blockfrost-api.service';
import { ConfigService } from '@nestjs/config';

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
            newHydraHead.protocolParameters = body.protocolParameters;
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
        } catch (error) {
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
        for (const node of head.hydraNodes) {
            const enterpriseAddress = getEnterpriseAddressFromKeys(
                node.cardanoSKey as `5820${string}`,
                node.cardanoVKey as `5820${string}`,
                0,
            );
            const check = await this.checkUtxoAccount(enterpriseAddress);
            if (!check) {
                this.logger.error(enterpriseAddress + ' not enough lovelace');
                throw new BadRequestException(enterpriseAddress + ' not enough lovelace');
            }
        }
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

            // All containers started successfully
            head.status = 'running';
            await this.hydraHeadRepository.save(head);

            // Update Redis cache - add newly activated nodes
            await this.updateRedisActiveNodes(head, createdContainers);
        } catch (error: any) {
            // If any container fails, cleanup all created containers
            this.logger.error(`Error activating head ${head.id}: ${error.message}`);
            this.logger.log(`Cleaning up ${createdContainers.length} containers due to error...`);

            for (const container of createdContainers) {
                try {
                    await this.dockerService.cleanupContainer(container);
                } catch (cleanupError) {
                    this.logger.error(`Error during cleanup: ${cleanupError.message}`);
                }
            }

            head.status = 'stop';
            await this.hydraHeadRepository.save(head);

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
                    } catch (error) {
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
            } catch (err) {
                throw new BadRequestException(`Failed to remove container ${nodeName}: ${err.message}`);
            }
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
            await Promise.all(
                head.hydraNodes.map(node => {
                    const nodeName = this.getDockerContainerName(node);
                    return this.dockerService.restartContainerByName(nodeName);
                }),
            );
        } catch (err) {
            throw new BadRequestException(`Failed to restart one or more containers: ${err.message}`);
        }

        return {
            message: `Hydra Head ${id} containers have been restarted successfully.`,
        };
    }

    /**
     * Update Redis cache by adding newly activated nodes
     * Similar to updateHydraContainerStatus but only adds new nodes
     */
    public async updateRedisActiveNodes(head: HydraHead, containers: Docker.Container[]): Promise<void> {
        try {
            // Get current active nodes from Redis
            const currentActiveNodes = (await this.cacheManager.get<Caching['activeNodes']>('activeNodes')) || [];

            // Get container info for newly created containers
            const newActiveNodes = await Promise.all(
                containers.map(async container => {
                    const containerInfo = await container.inspect();
                    if (!containerInfo.State.Running) {
                        throw new Error(`Container ${containerInfo.Name} is not running after activation.`);
                    }
                    return {
                        hydraNodeId: containerInfo.Config.Labels[this.hydraConfig.hydraNodeLabel],
                        hydraHeadId: containerInfo.Config.Labels[this.hydraConfig.hydraHeadLabel],
                        container: containerInfo as unknown as Docker.ContainerInfo,
                        isActive: containerInfo.State.Running,
                    };
                }),
            );

            // Filter out any nodes that already exist in cache (by hydraNodeId)
            const existingNodeIds = currentActiveNodes.map(node => node.hydraNodeId);
            const nodesToAdd = newActiveNodes.filter(node => !existingNodeIds.includes(node.hydraNodeId));

            // Merge with existing active nodes
            const updatedActiveNodes = [...currentActiveNodes, ...nodesToAdd];

            // Update Redis cache
            await this.cacheManager.set<Caching['activeNodes']>('activeNodes', updatedActiveNodes);

            this.logger.log(
                `Updated Redis cache: Added ${nodesToAdd.length} new active nodes for Head ${head.id}. ` +
                    `Active nodes: ${updatedActiveNodes}`,
            );
        } catch (error: any) {
            throw error;
        }
    }
}
