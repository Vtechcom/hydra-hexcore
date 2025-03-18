import {
    BadRequestException,
    Body,
    ClassSerializerInterceptor,
    Controller,
    Get,
    Post,
    UseInterceptors,
} from '@nestjs/common';
import { HydraGameService } from './hydra-game.service';

@Controller('hydra-game')
export class HydraGameController {
    constructor(private hydraGameService: HydraGameService) { }

    @Get('list-room')
    requestHydraNode() {
        return this.hydraGameService.getListRoom();
    }
}