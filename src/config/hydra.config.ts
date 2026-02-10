import { ConfigService } from '@nestjs/config';

export const HYDRA_CONFIG = 'HYDRA_CONFIG';

export const HydraConfig = {
    provide: HYDRA_CONFIG,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        cardanoNodeServiceName: config.get<string>('NEST_CARDANO_NODE_SERVICE_NAME'),
        cardanoNodeImage: config.get<string>('NEST_CARDANO_NODE_IMAGE'),
        cardanoNodeFolder: config.get<string>('NEST_CARDANO_NODE_FOLDER'),
        cardanoNodeSocketPath: config.get<string>('NEST_CARDANO_NODE_SOCKET_PATH'),

        hydraNodeImage: config.get<string>('NEST_HYDRA_NODE_IMAGE'),
        hydraNodeFolder: config.get<string>('NEST_HYDRA_NODE_FOLDER'),
        hydraNodeScriptTxId: config.get<string>('NEST_HYDRA_NODE_SCRIPT_TX_ID'),
        hydraNodeNetworkId: config.get<string>('NEST_HYDRA_NODE_TEST_NETWORK_MAGIC_ID'),

        cardanoAccountMinLovelace: Number(config.get('ACCOUNT_MIN_LOVELACE', 50000000)),

        enableNetworkHost: config.get<boolean>('NEST_DOCKER_ENABLE_NETWORK_HOST'),

        // Max nodes limit
        maxActiveNodes: Number(config.get('MAX_ACTIVE_NODES', 20)),

        // Dockerize
        hydraHeadLabel: 'head_id',
        hydraNodeLabel: 'node_id',
        dockerSock: config.get<string>('NEST_DOCKER_SOCKET_PATH'),
    }),
};

export interface HydraConfigInterface extends ReturnType<typeof HydraConfig.useFactory> {}
