import { Test, TestingModule } from '@nestjs/testing';
import { HydraMainController } from './hydra-main.controller';

describe('HydraMainController', () => {
    let controller: HydraMainController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HydraMainController],
        }).compile();

        controller = module.get<HydraMainController>(HydraMainController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
