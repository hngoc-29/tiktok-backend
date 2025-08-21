import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database';

@Injectable()
export class LikeService {
    constructor(private readonly prismaService: PrismaService) { }

    async addLike(likeData: { videoId: number; userId: number }) {
        try {
            // Kiểm tra đã like chưa
            const existingLike = await this.prismaService.like.findUnique({
                where: {
                    userId_videoId: {
                        userId: likeData.userId,
                        videoId: likeData.videoId,
                    },
                },
            });

            if (existingLike) {
                return { message: 'Đã thích video này rồi', data: existingLike };
            }

            await this.prismaService.like.create({
                data: {
                    userId: likeData.userId,
                    videoId: likeData.videoId,
                },
            });

            return { message: 'Đã thêm lượt thích thành công', success: true };
        } catch (error) {
            return { message: 'Lỗi khi thêm lượt thích', error: error.message, success: false };
        }
    }

    async unLike(likeData: { userId: number; videoId: number }) {
        try {
            // Kiểm tra có like chưa
            const existingLike = await this.prismaService.like.findUnique({
                where: {
                    userId_videoId: {
                        userId: likeData.userId,
                        videoId: likeData.videoId,
                    },
                },
            });

            if (!existingLike) {
                return { message: 'Chưa thích video này', success: false };
            }

            await this.prismaService.like.delete({
                where: {
                    userId_videoId: {
                        userId: likeData.userId,
                        videoId: likeData.videoId,
                    },
                },
            });

            return { message: 'Đã bỏ thích thành công', success: true };
        } catch (error) {
            return { message: 'Lỗi khi bỏ thích', error: error.message, success: false };
        }
    }

    async getLikeCount(videoId: number) {
        try {
            const likeCount = await this.prismaService.like.count({
                where: { videoId },
            });
            return { message: 'Lấy số lượt thích thành công', data: likeCount, success: true };
        } catch (error) {
            return { message: 'Lỗi khi lấy số lượt thích', error: error.message, success: false };
        }
    }

    async getVideoUserLike(videoId: number, userId: number) {
        try {
            const like = await this.prismaService.like.findUnique({
                where: {
                    userId_videoId: {
                        userId,
                        videoId,
                    },
                },
            });
            return { message: 'Lấy trạng thái thích thành công', data: !!like, success: true };
        } catch (error) {
            return { message: 'Lỗi khi lấy trạng thái thích', error: error.message, success: false };
        }
    }

    async listLikes(userId: number, skip = 0, take = 10) {
        try {
            const likes = await this.prismaService.like.findMany({
                where: { userId },
                orderBy: { id: 'desc' }, // id lớn hơn thì mới hơn
                skip,
                take,
                include: { video: true },
            });

            return {
                message: 'Lấy danh sách video đã thích thành công',
                data: likes.map(like => like.video),
                success: true
            };
        } catch (error) {
            return {
                message: 'Lỗi khi lấy danh sách video đã thích',
                error: error.message,
                success: true
            };
        }
    }
}
