import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { writeFileSync } from 'node:fs';
import { access, constants, readFile, unlink, mkdir } from 'node:fs/promises';
import Docker from 'dockerode';

import { HydraParty } from '../hydra-main/entities/HydraParty.entity';
import { HydraNode } from '../hydra-main/entities/HydraNode.entity';
import { Account } from '../hydra-main/entities/Account.entity';

@Injectable()
export class HydraGameService implements OnModuleInit {
    private docker: Docker;

    constructor(
        @InjectRepository(HydraNode)
        private hydraNodeRepository: Repository<HydraNode>,
        @InjectRepository(Account)
        private accountRepository: Repository<Account>,
        @InjectRepository(HydraParty)
        private hydraPartyRepository: Repository<HydraParty>,
    ) {
        const DOCKER_SOCKET = process.env.NEST_DOCKER_SOCKET_PATH || '\\\\.\\pipe\\docker_engine';
        this.docker = new Docker({ socketPath: DOCKER_SOCKET });
    }

    async onModuleInit() {
    }

    async getListRoom() {
        // Get node container
        const containers = await this.docker.listContainers({
            all: false,
            filters: {
                name: ['hexcore-hydra-node-'],
                status: ['running'],
                // label: ['party_name=party-1']
            },
        });

        const partyRuningIds = Array.from(
            new Set(containers.map(containerInfo => parseInt(containerInfo.Labels.party_id)))
        );
        const queryBuilder = this.hydraPartyRepository
            .createQueryBuilder('party')
            .where('party.id IN (:...ids)', { ids: partyRuningIds })
            .leftJoinAndSelect('party.hydraNodes', 'hydraNodes')
            .leftJoinAndSelect('hydraNodes.cardanoAccount', 'cardanoAccount');

        console.log(queryBuilder.getSql());

        const parties = await queryBuilder.getMany();
        return parties
    }
}