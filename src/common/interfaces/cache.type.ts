import Docker from 'dockerode';

export type ContainerNode = {
    hydraNodeId: string;
    hydraHeadId: string;
    container: Docker.ContainerInfo;
    isActive: boolean;
};

export type Caching = {
    activeNodes: ContainerNode[];
};
