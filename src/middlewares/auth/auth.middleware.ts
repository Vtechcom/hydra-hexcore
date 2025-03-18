import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    if (!req.headers.authorization) {
      res.status(401).json({
        message: 'Unauthorization',
      });
      return;
    }
    // console.log(req.headers.authorization)
    next();
  }
}
