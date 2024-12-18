import { Controller, Get } from '@nestjs/common';

@Controller('hydra-main')
export class HydraMainController {
  @Get('request-node')
  requestHydraNode() {
    return 'This route uses a wildcard';
  }
}
