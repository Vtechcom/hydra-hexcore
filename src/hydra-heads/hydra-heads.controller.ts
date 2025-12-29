import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { HydraHeadService } from "./hydra-heads.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CreateHydraHeadsDto } from "./dto/create-hydra-heads.dto";
import { AdminAuthGuard } from "src/auth/admin-auth.guard";
import { ActiveHydraHeadsDto } from "./dto/active-hydra-heads.dto";
import { ClearHeadDataDto } from "./dto/clear-head-data.dto";

@ApiTags('Hydra Heads')
@Controller('hydra-heads')
@ApiBearerAuth()
export class HydraHeadController {
    constructor(
        private readonly hydraHeadService: HydraHeadService,
    ) {}

    @UseGuards(AdminAuthGuard)
    @Post('create')
    async create(@Body() createHeadDto: CreateHydraHeadsDto) {
        return this.hydraHeadService.create(createHeadDto);
    }

    @UseGuards(AdminAuthGuard)
    @Post('active')
    @HttpCode(200)
    async active(@Body() activeHeadDto: ActiveHydraHeadsDto) {
        return this.hydraHeadService.activeHydraHead(activeHeadDto);
    }

    @UseGuards(AdminAuthGuard)
    @Get('list')
    async list() {
        return this.hydraHeadService.list();
    }

    @UseGuards(AdminAuthGuard)
    @Post('deactive')
    @HttpCode(200)
    async deactive(@Body() activeHeadDto: ActiveHydraHeadsDto) {
        return this.hydraHeadService.deactiveHydraHead(activeHeadDto);
    }

    @UseGuards(AdminAuthGuard)
    @Post('clear-head-data')
    @HttpCode(200)
    async clearHeadData(@Body() body: ClearHeadDataDto) {
        return this.hydraHeadService.clearHeadData(body);
    }

    @UseGuards(AdminAuthGuard)
    @Delete('delete/:id')
    async delete (@Param('id') id: number) {
        return this.hydraHeadService.delete(id);
    }
}
