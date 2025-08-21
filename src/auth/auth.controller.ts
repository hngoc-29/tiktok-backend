import { Controller, Post, Body, Req, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';

export interface UserType {
    id?: number;
    fullname?: string;
    username?: string;
    email: string;
    password: string;
    isAdmin?: boolean;
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
            return { success: false, message: 'Email chưa đăng kí' };
        }
        return this.authService.handleSendVerificationEmail(email);
    }

    @Post('verify-email')
    async verifyEmail(@Body('token') token: string) {
        return this.authService.verifyEmailToken(token);
    }

    @Post('send-reset-email')
    async sendResetEmail(@Query('email') email) {
        if (!email) {
            return { success: false, message: 'Email chưa đăng kí' };
        }
        return this.authService.sendForgotPasswordEmail(email);
    }

    @Post('reset-password')
    async resetPassword(@Req() req: Request, @Body('token') token: string, @Body('newPassword') newPassword: string) {
        return this.authService.resetPassword(token, newPassword);
    }

    @Post('refresh-token')
    async refreshToken(@Body('refreshToken') refreshToken: string) {
        return this.authService.refreshToken(refreshToken);
    }
}
