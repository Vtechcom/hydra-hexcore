import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants';
import { ConsumerJwtPayload } from 'src/common/interfaces/jwtPayload.type';
import { JwtHelper } from './jwt.helper';

@Injectable()
export class ConsumerAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = JwtHelper.extractTokenFromHeader(request.headers);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync<ConsumerJwtPayload>(token, {
                secret: jwtConstants.secret,
            });
            request['user'] = payload;
        } catch (error) {
            throw new UnauthorizedException();
        }
        return true;
    }
}
