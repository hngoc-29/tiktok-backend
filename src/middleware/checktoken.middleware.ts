import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const token = req.headers['authorization'];
        if (!token || !token.startsWith('Bearer ')) {
            throw new UnauthorizedException('Token không tồn tại hoặc không hợp lệ');
        }
        const jwtToken = token.split(' ')[1];
        try {
            const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
            // Gắn thông tin user vào request nếu cần
            req['user'] = decoded;
            next();
        } catch (err) {
            throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }
    }
}