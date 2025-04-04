import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConsumerKeyMapper } from './entities/ConsumerKeyMapper.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateConsumerDto } from './dto/CreateConsumer.dto';
import { Consumer, ConsumerStatus } from './entities/Consumer.entity';
import { QueryConsumersDto } from './dto/query-consumers.dto';
import { UpdateConsumerDto } from './dto/UpdateConsumer.dto';
import { ConsumerLoginDto } from './dto/consumer-login.dto';
import { ConsumerJwtPayload } from 'src/hydra-game/interfaces/jwtPayload.type';
import { JwtService } from '@nestjs/jwt';
import { generateConsumerKey } from 'src/utils/generator.util';
import { ShareConsumerNodeDto } from './dto/share-consumer-node.dto';
import { HydraMainService } from 'src/hydra-main/hydra-main.service';
import { RemoveConsumerNodeDto } from './dto/remove-consumer-node.dto';
import configuration from 'src/config/configuration';
@Injectable()
export class HydraConsumerService implements OnModuleInit {
    constructor(
        @InjectRepository(ConsumerKeyMapper)
        private mapperRepository: Repository<ConsumerKeyMapper>,
        @InjectRepository(Consumer)
        private consumerRepository: Repository<Consumer>,
        private jwtService: JwtService,
        private hydraMainService: HydraMainService,
    ) {}

    async onModuleInit() {}

    async getUrlByConsumerKey(consumerKey: string): Promise<string> {
        const mapper = await this.mapperRepository.findOne({
            where: { consumerKey },
        });
        return mapper ? mapper.url : null;
    }

    async createConsumer(createConsumerDto: CreateConsumerDto) {
        // check if consumer already exists
        const consumerExists = await this.consumerRepository.findOne({
            where: { address: createConsumerDto.address },
        });
        if (consumerExists) {
            throw new HttpException('Consumer already exists', HttpStatus.BAD_REQUEST);
        }
        const consumer = await this.consumerRepository.create(createConsumerDto);
        return this.consumerRepository.save(consumer);
    }

    async listConsumers(query: QueryConsumersDto) {
        const consumers = await this.consumerRepository.find({
            where: { status: query.status, address: query.address },
        });
        return consumers;
    }

    async updateConsumer(id: number, updateConsumerDto: UpdateConsumerDto) {
        const consumer = await this.consumerRepository.findOne({
            where: { id },
        });
        if (!consumer) {
            throw new HttpException('Consumer not found', HttpStatus.NOT_FOUND);
        }
        const result = await this.consumerRepository.update(id, updateConsumerDto);
        if (result.affected === 0) {
            throw new HttpException('Update consumer failed', HttpStatus.BAD_REQUEST);
        }
        return {
            ...consumer,
            ...updateConsumerDto,
            password: undefined,
        };
    }

    async shareConsumerNode(shareConsumerNodeDto: ShareConsumerNodeDto) {
        const consumer = await this.consumerRepository.findOne({
            where: { id: shareConsumerNodeDto.consumerId },
        });
        if (!consumer) {
            throw new HttpException('Consumer not found', HttpStatus.NOT_FOUND);
        }
        const hydraNode = await this.hydraMainService.getHydraNodeById(shareConsumerNodeDto.hydraNodeId);
        if (!hydraNode) {
            throw new HttpException('Hydra node not found', HttpStatus.NOT_FOUND);
        }
        const url = `localhost:${hydraNode.port}`;
        const mapper = await this.mapperRepository.create({
            consumer,
            consumerKey: generateConsumerKey(),
            url: url,
            isActive: true,
            hydraNode,
        });
        return this.mapperRepository.save(mapper);
    }

    async removeSharedNode(removeConsumerNodeDto: RemoveConsumerNodeDto) {
        const mapper = await this.mapperRepository.findOne({
            where: { id: removeConsumerNodeDto.mapperId },
        });
        if (!mapper) {
            throw new HttpException('Mapper not found', HttpStatus.NOT_FOUND);
        }
        mapper.isActive = false;
        mapper.url = '';
        await this.mapperRepository.save(mapper);
        return mapper;
    }

    async getConsumerInfoById(id: number) {
        const consumer = await this.consumerRepository
            .createQueryBuilder('consumer')
            .leftJoinAndSelect('consumer.mappers', 'mappers')
            .leftJoinAndSelect('mappers.hydraNode', 'hydraNode')
            .where('consumer.id = :id', { id })
            .getOne();
        if (!consumer) {
            throw new HttpException('Consumer not found', HttpStatus.NOT_FOUND);
        }
        // check nodes is online or not
        const activeNodes = await this.hydraMainService.getActiveNodeContainers();

        const mappers = consumer.mappers.map(mapper => {
            const node = activeNodes.find(node => node.hydraNodeId === mapper.hydraNode.id.toString());
            return {
                ...mapper,
                isOnline: node ? true : false,
            };
        });
        return {
            ...consumer,
            mappers,
        };
    }

    async getConsumerInfo(id: number) {
        const consumer = await this.consumerRepository.findOne({
            where: { id },
        });
        return consumer;
    }

    async login(loginDto: ConsumerLoginDto) {
        const consumer = await this.consumerRepository.findOne({
            where: { address: loginDto.address },
        });
        if (!consumer) {
            throw new HttpException('Consumer not found', HttpStatus.NOT_FOUND);
        }
        if (consumer.password !== loginDto.password) {
            throw new HttpException('Invalid password', HttpStatus.BAD_REQUEST);
        }
        const payload: ConsumerJwtPayload = { address: consumer.address, id: consumer.id };
        return {
            accessToken: await this.jwtService.signAsync(payload),
        };
    }

    async authorization(payload: ConsumerJwtPayload) {
        const consumer = await this.consumerRepository.findOne({
            where: { id: payload.id },
        });
        if (!consumer) {
            throw new HttpException('Cannot authorization', HttpStatus.UNAUTHORIZED);
        }
        const _payload: ConsumerJwtPayload = { address: consumer.address, id: consumer.id };
        return {
            accessToken: await this.jwtService.signAsync(_payload),
        };
    }

    async getOwnedNodes(id: number) {
        const consumer = await this.consumerRepository.findOne({
            where: { id },
        });
        if (!consumer) {
            throw new HttpException('Consumer not found', HttpStatus.NOT_FOUND);
        }
        if (consumer.status !== ConsumerStatus.ACTIVE) {
            throw new HttpException('Consumer is not active', HttpStatus.FORBIDDEN);
        }
        const mappers = await this.mapperRepository.find({
            where: { consumer, isActive: true },
        });
        const buildUrl = (apiKey: string) => {
            const endpoint = configuration().proxy.proxyDomain;
            return `${apiKey}.${endpoint}`;
        };
        return mappers.map(mapper => ({
            ...mapper,
            url: buildUrl(mapper.consumerKey),
        }));
    }

    async generateConsumerKey(id: number) {
        const consumer = await this.consumerRepository.findOne({
            where: { id },
        });
        if (!consumer) {
            throw new HttpException('Consumer not found', HttpStatus.NOT_FOUND);
        }
        const key = generateConsumerKey();
        const mapper = await this.mapperRepository.create({
            consumer,
            consumerKey: key,
        });
        return mapper;
    }
}
