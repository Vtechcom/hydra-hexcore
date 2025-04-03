import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { HydraConsumerService } from './hydra-consumer.service';
import { CreateConsumerDto } from './dto/CreateConsumer.dto';

@Controller('hydra-consumer')
export class HydraConsumerController {
    constructor(private readonly hydraConsumerService: HydraConsumerService) {}

    @Get('get-url-by-consumer-key')
    getUrlByConsumerKey(@Query('consumerKey') consumerKey: string) {
        return this.hydraConsumerService.getUrlByConsumerKey(consumerKey);
    }

    @Post('create-consumer')
    createConsumer(@Body() createConsumerDto: CreateConsumerDto) {
        return this.hydraConsumerService.createConsumer(createConsumerDto);
    }
}
