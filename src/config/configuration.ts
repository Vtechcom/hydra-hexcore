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
    rabbitmq: {
        enabled: process.env.RABBITMQ_ENABLED === 'true',
        uri: process.env.RABBITMQ_URI || 'amqp://guest:guest@localhost:5672',
        exchange: process.env.RABBITMQ_EXCHANGE || 'provider.metrics',
        queue: process.env.RABBITMQ_QUEUE || 'hexcore.queue',
        prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT, 10) || 1,
        noAck: process.env.RABBITMQ_NO_ACK === 'true',
        queueDurable: process.env.RABBITMQ_QUEUE_DURABLE !== 'false',
    },
    monitoringAgent: {
        hubApiKey: process.env.HUB_API_KEY || '',
        sendIntervalMs: Math.max(parseInt(process.env.SEND_INTERVAL_MS, 10) || 2000, 1000),
    },
    proxy: {
        matchPattern: process.env.NEST_PROXY_MATCH_PATTERN || '^([a-z0-9-]+)\.hydranode\.io\.vn$',
        proxyDomain: process.env.NEST_PROXY_DOMAIN || 'hydranode.io.vn',
    },
});
