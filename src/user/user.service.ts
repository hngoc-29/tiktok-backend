import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/config/database';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async getUserByEmail(email: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    email,
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

    async getUserById(userId: number) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: userId,
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
            return {
                success: true,
                user
            };
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

    async updatePassword(id: number, updateData: { password: string; newPass: string }) {
        try {
            const { password, newPass } = updateData;

            // Lấy user từ DB
            const user = await this.prisma.user.findUnique({ where: { id } });
            if (!user) {
                return { success: false, message: 'Người dùng không tồn tại' };
            }

            // Kiểm tra mật khẩu cũ có đúng không
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return { success: false, message: 'Mật khẩu cũ không chính xác' };
            }

            if (newPass.length < 6) {
                throw new UnauthorizedException('Mật khẩu phải có ít nhất 6 ký tự');
            }

            // Hash mật khẩu mới
            const hashedNewPass = await bcrypt.hash(newPass, 10);

            // Update mật khẩu
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: { password: hashedNewPass },
            });

            return {
                success: true,
                user: updatedUser,
                message: 'Thay đổi mật khẩu thành công',
            };
        } catch (error) {
            return { success: false, message: error.message || 'Có lỗi xảy ra' };
        }
    }

    async countUsers() {
        try {
            const userCount = await this.prisma.user.count();
            return { data: userCount, success: true };
        } catch (error) {
            return { message: 'Lỗi khi lấy số video', error: error.message, success: false };
        }
    }

    async listUsers(skip = 0, take = 10) {
        return this.prisma.user.findMany({
            skip, // bỏ qua bao nhiêu cái (dùng cho phân trang)
            take, // số lượng muốn lấy
            select: {
                username: true,
            }
        });
    }
}
