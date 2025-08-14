import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CheckActiveMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const user = req['user'];
        if (!user || user.active !== true) {
            throw new ForbiddenException('Tài khoản chưa được kích hoạt');
        }
        next();
    }
}