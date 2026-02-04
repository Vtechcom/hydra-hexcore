import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/common/constants';
import { JwtHelper } from './helpers/jwt.helper';
import { AdminJwtPayload } from 'src/common/interfaces/jwtPayload.type';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class AdminAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = JwtHelper.extractTokenFromHeader(request.headers);

        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync<AdminJwtPayload>(token, {
                secret: jwtConstants.secret,
            });

            // Verify payload structure and role
            if (!payload.username || !payload.id || !payload.role) {
                throw new UnauthorizedException('Invalid token payload structure');
            }

            // Verify role is Admin
            if (payload.role !== Role.Admin) {
                throw new UnauthorizedException('Insufficient permissions: Admin role required');
            }

            request['user'] = payload;
        } catch (error) {
            throw new UnauthorizedException();
        }
        return true;
    }

    handleRequest(err, user, info) {
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        return user;
    }
}
