import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CheckAdminMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const user = req['user'];
        if (!user.isAdmin) {
            throw new ForbiddenException('Tài khoản không có quyền truy cập');
        }
        next();
    }
}