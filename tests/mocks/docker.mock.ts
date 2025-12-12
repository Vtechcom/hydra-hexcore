import { Injectable } from '@nestjs/common';

/**
 * Mock Docker service for testing
 * Prevents actual Docker API calls during tests
 */
@Injectable()
export class MockDockerService {
    async listContainers() {
        return [];
    }

    async getContainer() {
        return {
            inspect: async () => ({
                State: { Running: true },
                NetworkSettings: {
                    Networks: {},
                },
            }),
            start: async () => {},
            stop: async () => {},
            remove: async () => {},
        };
    }

    async createContainer() {
        return this.getContainer();
    }

    async pruneContainers() {
        return { ContainersDeleted: [], SpaceReclaimed: 0 };
    }
}
