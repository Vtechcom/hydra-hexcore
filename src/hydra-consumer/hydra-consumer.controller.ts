import {
    Controller,
    Get,
    Post,
    Query,
    Body,
    UseInterceptors,
    ClassSerializerInterceptor,
    UseGuards,
    Req,
    Put,
} from '@nestjs/common';
import { HydraConsumerService } from './hydra-consumer.service';
import { CreateConsumerDto } from './dto/CreateConsumer.dto';
import { QueryConsumersDto } from './dto/query-consumers.dto';
import { UpdateConsumerDto } from './dto/UpdateConsumer.dto';
import { ConsumerAuthGuard } from 'src/auth/consumer-auth.guard';
import { AdminAuthGuard } from 'src/auth/admin-auth.guard';
import { ConsumerLoginDto } from './dto/consumer-login.dto';
import { ShareConsumerNodeDto } from './dto/share-consumer-node.dto';
import { RemoveConsumerNodeDto } from './dto/remove-consumer-node.dto';
@Controller('hydra-consumer')
export class HydraConsumerController {
    constructor(private readonly hydraConsumerService: HydraConsumerService) {}

    @Get('get-url-by-consumer-key')
    getUrlByConsumerKey(@Query('consumerKey') consumerKey: string) {
        return this.hydraConsumerService.getUrlByConsumerKey(consumerKey);
    }

    @Post('create-consumer')
    @UseInterceptors(ClassSerializerInterceptor)
    createConsumer(@Body() createConsumerDto: CreateConsumerDto) {
        return this.hydraConsumerService.createConsumer(createConsumerDto);
    }

    @UseGuards(AdminAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('list-consumers')
    listConsumers(@Query() query: QueryConsumersDto) {
        return this.hydraConsumerService.listConsumers(query);
    }

    @UseGuards(AdminAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Put('update-consumer')
    updateConsumer(@Body() updateConsumerDto: UpdateConsumerDto) {
        return this.hydraConsumerService.updateConsumer(updateConsumerDto.id, updateConsumerDto);
    }

    @UseGuards(AdminAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Post('share-consumer-node')
    shareConsumerNode(@Body() shareConsumerNodeDto: ShareConsumerNodeDto) {
        return this.hydraConsumerService.shareConsumerNode(shareConsumerNodeDto);
    }

    @UseGuards(AdminAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Post('remove-consumer-node')
    removeConsumerNode(@Body() removeConsumerNodeDto: RemoveConsumerNodeDto) {
        return this.hydraConsumerService.removeConsumerNode(removeConsumerNodeDto);
    }

    @UseGuards(ConsumerAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('info')
    getConsumerInfo(@Req() req: any) {
        return this.hydraConsumerService.getConsumerInfo(req.user.id);
    }

    @UseGuards(ConsumerAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('authorization')
    authorization(@Req() req: any) {
        return this.hydraConsumerService.authorization(req.user);
    }

    @Post('login')
    login(@Body() loginDto: ConsumerLoginDto) {
        return this.hydraConsumerService.login(loginDto);
    }

    @UseGuards(ConsumerAuthGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('owned-nodes')
    getOwnedNodes(@Req() req: any) {
        return this.hydraConsumerService.getOwnedNodes(req.user.id);
    }
}
