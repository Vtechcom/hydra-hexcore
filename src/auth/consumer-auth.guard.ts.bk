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
            
            // Verify payload structure - must have address and id, must NOT have username or role
            if (!payload.address || !payload.id) {
                throw new UnauthorizedException('Invalid token payload structure');
            }
            
            // Ensure this is a Consumer token, not Admin token
            if ('username' in payload || 'role' in payload) {
                throw new UnauthorizedException('Invalid token type: Consumer token required');
            }
            
            request['user'] = payload;
        } catch (error) {
            throw new UnauthorizedException();
        }
        return true;
    }
}
