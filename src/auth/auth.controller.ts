import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';

export interface UserType {
    id?: number;
    username?: string;
    email: string;
    password: string;
}

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() body: UserType) {
        // Logic for user login
        return this.authService.signIn(body);
    }

    @Post('register')
    async register(@Body() body: UserType) {
        // Logic for user registration
        return this.authService.signUp(body);
    }

    @Post('send-verification-email')
    async sendVerificationEmail(@Req() req: Request) {
        const email = req['user']?.email;
        if (!email) {
            return { success: false, message: 'Không tìm thấy email trong token' };
        }
        return this.authService.handleSendVerificationEmail(email);
    }

    @Post('verify-email')
    async verifyEmail(@Body('token') token: string) {
        return this.authService.verifyEmailToken(token);
    }

    @Post('send-reset-email')
    async sendResetEmail(@Req() req: Request) {
        const email = req['user']?.email;
        if (!email) {
            return { success: false, message: 'Không tìm thấy email trong token' };
        }
        return this.authService.sendForgotPasswordEmail(email);
    }

    @Post('reset-password')
    async resetPassword(@Req() req: Request, @Body('token') token: string, @Body('newPassword') newPassword: string) {
        const userId = req['user']?.id;
        if (!userId) {
            return { success: false, message: 'Không tìm thấy ID người dùng trong token' };
        }
        return this.authService.resetPassword(token, newPassword, userId);
    }

    @Post('refresh-token')
    async refreshToken(@Req() req: Request) {
        // req.user đã được gắn ở middleware
        return this.authService.refreshToken(req['user']);
    }
}
