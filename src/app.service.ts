import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHello(): string {
        return 'Hello, from Hexcore with love!';
    }

    healthCheck(): string {
        return 'OK';
    }
}
