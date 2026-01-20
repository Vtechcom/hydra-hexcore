import { Test, TestingModule } from '@nestjs/testing';
import { HydraMainService } from './hydra-main.service';

describe('HydraMainService', () => {
    let service: HydraMainService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [HydraMainService],
        }).compile();

        service = module.get<HydraMainService>(HydraMainService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
