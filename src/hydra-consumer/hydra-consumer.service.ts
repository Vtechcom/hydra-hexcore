import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConsumerKeyMapper } from './entities/ConsumerKeyMapper.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateConsumerDto } from './dto/CreateConsumer.dto';
import { Consumer } from './entities/Consumer.entity';
import { createProxyMiddleware } from 'http-proxy-middleware';
@Injectable()
export class HydraConsumerService implements OnModuleInit {
    constructor(
        @InjectRepository(ConsumerKeyMapper)
        private mapperRepository: Repository<ConsumerKeyMapper>,
        @InjectRepository(Consumer)
        private consumerRepository: Repository<Consumer>,
    ) {}

    async onModuleInit() {
        
    }

    async getUrlByConsumerKey(consumerKey: string): Promise<string> {
        const mapper = await this.mapperRepository.findOne({
            where: { consumerKey },
        });
        return mapper ? mapper.url : null;
    }

    async createConsumer(createConsumerDto: CreateConsumerDto) {
        const consumer = await this.consumerRepository.create(createConsumerDto);
        return this.consumerRepository.save(consumer);
    }
}
