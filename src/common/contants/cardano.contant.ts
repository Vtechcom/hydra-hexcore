export const CONSTANTS = () => ({
    cardanoNodeServiceName: process.env.NEST_CARDANO_NODE_SERVICE_NAME || 'cardano-node',
    cardanoNodeImage: process.env.NEST_CARDANO_NODE_IMAGE || 'ghcr.io/intersectmbo/cardano-node:10.1.4',
    cardanoNodeFolder: process.env.NEST_CARDANO_NODE_FOLDER || 'D:/Projects/Vtechcom/cardano-node',
    cardanoNodeSocketPath:
        process.env.NEST_CARDANO_NODE_SOCKET_PATH || 'D:/Projects/Vtechcom/cardano-node/node.socket',
    hydraNodeImage: process.env.NEST_HYDRA_NODE_IMAGE || 'ghcr.io/cardano-scaling/hydra-node:0.20.0',
    hydraNodeFolder: process.env.NEST_HYDRA_NODE_FOLDER || 'D:/Projects/Vtechcom/cardano-node/hydra/preprod',
    hydraNodeScriptTxId: process.env.NEST_HYDRA_NODE_SCRIPT_TX_ID || '',
    hydraNodeNetworkId: process.env.NEST_HYDRA_NODE_NETWORK_ID || '1',
    cardanoAccountMinLovelace: Number(process.env.ACCOUNT_MINT_LOVELACE) || 50000000, // 50 ADA
    enableNetworkHost: process.env.NEST_DOCKER_ENABLE_NETWORK_HOST === 'true',

    // Dockerize
    hydraHeadLabel: 'head_id',
    hydraNodeLabel: 'node_id',
    dockerSock: process.env.NEST_DOCKER_SOCKET_PATH || '\\\\.\\pipe\\docker_engine',
});
