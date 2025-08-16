import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database';

@Injectable()
export class NotificationService {
    constructor(private readonly prisma: PrismaService) { }

    async createNotification({ title, content }: { title: string; content: string }) {
        try {
            const noti = await this.prisma.notification.create({
                data: {
                    title,
                    content,
                },
            });
            return {
                success: true,
                data: noti
            };
        } catch (error) {
            return {
                success: false,
                message: "Create notification failed"
            }
        }
    }

    async deleteNotification(id: number) {
        try {
            await this.prisma.notification.delete({
                where: { id },
            });
            return {
                success: true,
                message: "Notification deleted successfully"
            };
        } catch (error) {
            return {
                success: false,
                message: "Delete notification failed"
            };
        }
    }
    async updateNotification(id: number, { title, content }: { title: string; content: string }) {
        try {
            const noti = await this.prisma.notification.update({
                where: { id },
                data: {
                    title,
                    content,
                },
            });
            return {
                success: true,
                data: noti
            };
        } catch (error) {
            return {
                success: false,
                message: "Update notification failed"
            };
        }
    }
    async updateActive(id: number, active: boolean) {
        try {
            if (active) {
                // Tắt tất cả thông báo đang active
                await this.prisma.notification.updateMany({
                    data: { active: false },
                    where: { active: true }
                });
            }

            // Bật/tắt cho thông báo được chọn
            const noti = await this.prisma.notification.update({
                where: { id },
                data: { active },
            });

            return {
                success: true,
                data: noti
            };
        } catch (error) {
            return {
                success: false,
                message: "Update notification failed"
            };
        }
    }
    async getAllNotifications() {
        try {
            const notis = await this.prisma.notification.findMany();
            return {
                success: true,
                data: notis
            };
        } catch (error) {
            return {
                success: false,
                message: "Get all notifications failed"
            };
        }
    }
    async getActiveNotification() {
        try {
            const noti = await this.prisma.notification.findFirst({
                where: { active: true },
                orderBy: { createdAt: "desc" } // lấy cái mới nhất nếu có nhiều
            });
            return {
                success: true,
                data: noti
            };
        } catch (error) {
            return {
                success: false,
                message: "Get active notification failed"
            };
        }
    }
}
