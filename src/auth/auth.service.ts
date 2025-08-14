import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken'; // Thêm dòng này
import { PrismaService } from '../config/database';
import { transporter } from '../config/mail';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }

    async signIn(body): Promise<any> {
        const { email, password } = body;

        // Tìm user theo email hoặc username
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email }
                ]
            }
        });

        if (!user) {
            throw new UnauthorizedException('Không tìm thấy người dùng');
        }

        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Tạo JWT token
        const payload = { id: user.id, email: user.email, username: user.username };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Trả về user (loại bỏ password) và token
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token, refreshToken };
    }

    async signUp(body): Promise<any> {
        const { fullname, username, email, password } = body;

        // Kiểm tra xem user đã tồn tại chưa
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email }
                ]
            }
        });

        if (existingUser) {
            throw new UnauthorizedException('Người dùng đã tồn tại');
        }

        if (password.length < 6) {
            throw new UnauthorizedException('Mật khẩu phải có ít nhất 6 ký tự');
        }

        // Mã hóa password
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(password, saltOrRounds);

        // Tạo user mới
        const user = await this.prisma.user.create({
            data: {
                fullname,
                username,
                email,
                password: hash,
                avatarUrl: `https://taphoammo.net/img/tai-khoan-tiktok-clone-avatar-cong-khai-tim-va-follow-co-cookie-tut-ngon.png`
            }
        });

        return user;
    }
    async refreshToken(user: any): Promise<any> {
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        const newToken = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const newRefreshToken = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return { user, token: newToken, refreshToken: newRefreshToken };
    }

    async verifyEmailToken(token: string): Promise<any> {
        // Tìm token trong bảng EmailVerificationToken
        const emailToken = await this.prisma.emailVerificationToken.findUnique({
            where: { token }
        });
        if (!emailToken || emailToken.expiresAt < new Date()) {
            throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }

        // Kích hoạt tài khoản user
        await this.prisma.user.update({
            where: { id: emailToken.userId },
            data: { active: true }
        });

        // Xóa tất cả token của user sau khi xác thực
        await this.prisma.emailVerificationToken.deleteMany({
            where: { userId: emailToken.userId }
        });

        return { message: 'Xác thực email thành công' };
    }

    async sendVerificationEmail(email: string, token: string): Promise<{ success: boolean, message?: string }> {
        try {
            const verificationUrl = `${process.env.BASE_URL}/auth/verify-email?token=${token}`;
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Xác thực email TikTok Clone',
                html: `
                    <h3>Chào bạn!</h3>
                    <p>Vui lòng xác thực email bằng cách nhấn vào liên kết bên dưới:</p>
                    <a href="${verificationUrl}">${verificationUrl}</a>
                `,
            });
            return { success: true, message: 'Đã gửi email xác thực' };
        } catch (error) {
            return { success: false, message: 'Gửi email xác thực thất bại' };
        }
    }

    async handleSendVerificationEmail(email: string): Promise<{ success: boolean; message?: string }> {
        // Tìm user
        const user = await this.prisma.user.findFirst({ where: { email } });
        if (!user) {
            return { success: false, message: 'Không tìm thấy người dùng' };
        }
        if (user.active) {
            return { success: true, message: 'Tài khoản đã được kích hoạt' };
        }
        // Tạo token
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
        await this.prisma.emailVerificationToken.create({
            data: { token, userId: user.id, expiresAt }
        });
        // Gửi email
        return this.sendVerificationEmail(email, token);
    }

    async sendForgotPasswordEmail(email: string): Promise<{ success: boolean; message?: string }> {
        // Tìm user
        const user = await this.prisma.user.findFirst({ where: { email } });
        if (!user) {
            return { success: false, message: 'Không tìm thấy người dùng' };
        }
        // Tạo token
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
        await this.prisma.passwordResetToken.create({
            data: { token, userId: user.id, expiresAt }
        });
        // Gửi email
        try {
            const resetUrl = `${process.env.BASE_URL}/auth/reset-password?token=${token}`;
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: email,
                subject: 'Yêu cầu đặt lại mật khẩu TikTok Clone',
                html: `
                    <h3>Chào bạn!</h3>
                    <p>Vui lòng đặt lại mật khẩu bằng cách nhấn vào liên kết bên dưới:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                `,
            });
            return { success: true, message: 'Đã gửi email đặt lại mật khẩu' };
        } catch (error) {
            return { success: false, message: 'Gửi email đặt lại mật khẩu thất bại' };
        }
    }

    async resetPassword(token: string, newPassword: string, userId: number): Promise<{ success: boolean; message?: string }> {
        // Tìm token
        const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { token } });
        if (!resetToken || resetToken.expiresAt < new Date() && resetToken.userId !== userId) {
            return { success: false, message: 'Token không hợp lệ hoặc đã hết hạn' };
        }
        if (newPassword.length < 6) {
            return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
        }
        // Mã hóa mật khẩu mới
        const hash = await bcrypt.hash(newPassword, 10);
        // Cập nhật mật khẩu
        await this.prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hash }
        });
        // Xóa tất cả token đặt lại mật khẩu của user
        await this.prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } });
        return { success: true, message: 'Đặt lại mật khẩu thành công' };
    }
}
