export default () => ({
    port: parseInt(process.env.PORT, 10) || 3010,
    hydra: {
        binDirPath: process.env.NEST_HYDRA_BIN_DIR_PATH,
        nodeImage: process.env.NEST_HYDRA_NODE_IMAGE,
        nodeFolder: process.env.NEST_HYDRA_NODE_FOLDER,
    },
    cardano: {
        nodeServiceName: process.env.NEST_CARDANO_NODE_SERVICE_NAME,
        nodeImage: process.env.NEST_CARDANO_NODE_IMAGE,
        nodeFolder: process.env.NEST_CARDANO_NODE_FOLDER,
        nodeSocketPath: process.env.NEST_CARDANO_NODE_SOCKER_PATH,
    },
    docker: {
        socketPath: process.env.NEST_DOCKER_SOCKET_PATH,
        enableNetworkHost: process.env.NEST_DOCKER_ENABLE_NETWORK_HOST === 'true',
    },
    database: {
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'hexcore',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: process.env.DB_SYNCHRONIZE === 'true',
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || '',
    },
    proxy: {
        matchPattern: process.env.NEST_PROXY_MATCH_PATTERN || '^([a-z0-9-]+)\.hydranode\.io\.vn$',
        proxyDomain: process.env.NEST_PROXY_DOMAIN || 'hydranode.io.vn',
    },
});
