import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Dockerode from 'dockerode';
import Docker from 'dockerode';
import { Caching } from 'src/common/interfaces/cache.type';
import { HYDRA_CONFIG, HydraConfigInterface } from 'src/config/hydra.config';

@Injectable()
export class DockerService {
    private readonly logger = new Logger(DockerService.name);
    private readonly docker: Dockerode;

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
        @Inject(HYDRA_CONFIG) private readonly hydraConfig: HydraConfigInterface,
    ) {
        this.docker = new Dockerode({
            socketPath: process.env.NEST_DOCKER_SOCKET_PATH || '\\\\.\\pipe\\docker_engine',
        });
    }

    @Cron('*/10 * * * * *')
    async updateHydraContainerStatus() {
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
                            hydraNodeId: node.Labels[this.hydraConfig.hydraNodeLabel],
                            hydraHeadId: node.Labels[this.hydraConfig.hydraHeadLabel],
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

    async handleDockerContainerExist(containerName: string): Promise<void> {
        try {
            const existedContainer = await this.docker.getContainer(containerName);
            if (existedContainer) {
                if ((await existedContainer.inspect()).State.Running) {
                    await existedContainer.stop();
                    console.log(`Container ${containerName} stopped`);
                }
                await existedContainer.remove();
                console.log(`Container ${containerName} removed`);
            }
        } catch (error: any) {
            this.logger.error(`Error while removing container: ${containerName} - ${error.message}`);
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

    async removeContainerByName(name: string): Promise<void> {
        try {
            const container = await this.docker.getContainer(name);
            if (container) {
                if ((await container.inspect()).State.Running) {
                    await container.stop();
                    console.log(`[deactiveHydraParty]: Container ${name} stopped`);
                }
                await container.remove();
                console.log(`[deactiveHydraParty]: Container ${name} removed`);
            }
        } catch (error: any) {
            console.error(`Error while removing container: ${name}`, error.message);
        }
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
}
