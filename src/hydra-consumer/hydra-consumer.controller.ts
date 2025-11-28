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
    Param,
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
import { ApiBearerAuth } from '@nestjs/swagger';
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
    @ApiBearerAuth()
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('admin/list-consumers')
    listConsumers(@Query() query: QueryConsumersDto) {
        return this.hydraConsumerService.listConsumers(query);
    }

    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(ClassSerializerInterceptor)
    @Put('admin/update-consumer')
    updateConsumer(@Body() updateConsumerDto: UpdateConsumerDto) {
        return this.hydraConsumerService.updateConsumer(updateConsumerDto.id, updateConsumerDto);
    }

    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(ClassSerializerInterceptor)
    @Post('admin/share-consumer-node')
    shareConsumerNode(@Body() shareConsumerNodeDto: ShareConsumerNodeDto) {
        return this.hydraConsumerService.shareConsumerNode(shareConsumerNodeDto);
    }

    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(ClassSerializerInterceptor)
    @Post('admin/remove-shared-node')
    removeSharedNode(@Body() removeConsumerNodeDto: RemoveConsumerNodeDto) {
        return this.hydraConsumerService.removeSharedNode(removeConsumerNodeDto);
    }

    @UseGuards(AdminAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('admin/consumer/:id')
    getConsumerInfoById(@Param('id') id: string) {
        return this.hydraConsumerService.getConsumerInfoById(+id);
    }

    // Consumer

    @UseGuards(ConsumerAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('consumer/info')
    getConsumerInfo(@Req() req: any) {
        return this.hydraConsumerService.getConsumerInfo(req.user.id);
    }

    @UseGuards(ConsumerAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('consumer/authorization')
    authorization(@Req() req: any) {
        return this.hydraConsumerService.authorization(req.user);
    }

    @Post('consumer/login')
    login(@Body() loginDto: ConsumerLoginDto) {
        return this.hydraConsumerService.login(loginDto);
    }

    @UseGuards(ConsumerAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(ClassSerializerInterceptor)
    @Get('consumer/owned-nodes')
    getOwnedNodes(@Req() req: any) {
        return this.hydraConsumerService.getOwnedNodes(req.user.id);
    }
}
