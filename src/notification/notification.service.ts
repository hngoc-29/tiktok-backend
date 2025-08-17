import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database';

@Injectable()
export class NotificationService {
    constructor(private readonly prisma: PrismaService) { }

    async createNotification({ title, content }: { title: string; content: string }) {
        try {
            const noti = await this.prisma.notification.create({
                data: { title, content },
            });
            return {
                success: true,
                message: "Tạo thông báo thành công",
                data: noti,
            };
        } catch (error) {
            return {
                success: false,
                message: "Tạo thông báo thất bại",
            };
        }
    }

    async deleteNotification(id: number) {
        try {
            await this.prisma.notification.delete({ where: { id } });
            return {
                success: true,
                message: "Xóa thông báo thành công",
            };
        } catch (error) {
            return {
                success: false,
                message: "Xóa thông báo thất bại",
            };
        }
    }

    async updateNotification(id: number, { title, content }: { title: string; content: string }) {
        try {
            const noti = await this.prisma.notification.update({
                where: { id },
                data: { title, content },
            });
            return {
                success: true,
                message: "Cập nhật thông báo thành công",
                data: noti,
            };
        } catch (error) {
            return {
                success: false,
                message: "Cập nhật thông báo thất bại",
            };
        }
    }

    async updateActive(id: number, active: boolean) {
        try {
            if (active) {
                // Tắt tất cả thông báo đang active
                await this.prisma.notification.updateMany({
                    data: { active: false },
                    where: { active: true },
                });
            }

            // Bật/tắt cho thông báo được chọn
            const noti = await this.prisma.notification.update({
                where: { id },
                data: { active },
            });

            return {
                success: true,
                message: "Cập nhật trạng thái thông báo thành công",
                data: noti,
            };
        } catch (error) {
            return {
                success: false,
                message: "Cập nhật trạng thái thông báo thất bại",
            };
        }
    }

    async getAllNotifications() {
        try {
            const notis = await this.prisma.notification.findMany();
            return {
                success: true,
                message: "Lấy danh sách thông báo thành công",
                data: notis,
            };
        } catch (error) {
            return {
                success: false,
                message: "Lấy danh sách thông báo thất bại",
            };
        }
    }

    async getActiveNotification() {
        try {
            const noti = await this.prisma.notification.findFirst({
                where: { active: true },
                orderBy: { createdAt: "desc" }, // lấy cái mới nhất nếu có nhiều
            });
            return {
                success: true,
                message: "Lấy thông báo đang hiển thị thành công",
                data: noti,
            };
        } catch (error) {
            return {
                success: false,
                message: "Lấy thông báo đang hiển thị thất bại",
            };
        }
    }
}
