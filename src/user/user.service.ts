import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async getUserByEmail(email: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    email,
                    active: true,
                },
                omit: {
                    password: true,
                },
            });
            if (!user) {
                throw new Error('Không tìm thấy người dùng');
            }
            return {
                success: true,
                user,
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async getUserByUsername(username: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    username,
                    active: true,
                },
                omit: {
                    password: true,
                    email: true,
                },
            });
            if (!user) {
                throw new Error('Không tìm thấy người dùng');
            }
            return user;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async updateUser(email: string, updateData: any) {
        try {
            if (updateData && (updateData.password || updateData.active || updateData.id || updateData.isAdmin)) {
                return { success: false, message: 'Không thể cập nhật các trường này' };
            }
            const user = await this.prisma.user.update({
                where: { email },
                data: updateData,
            });
            return { success: true, user, message: 'Cập nhật người dùng thành công' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}
