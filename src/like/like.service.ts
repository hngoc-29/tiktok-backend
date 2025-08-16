import { Injectable, Req } from '@nestjs/common';
import { PrismaService } from 'src/config/database';

@Injectable()
export class LikeService {
    constructor(private readonly prismaService: PrismaService) { }

    async addLike(likeData: { videoId: number, userId: number }) {
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
                return { message: 'User already liked this video', data: existingLike };
            }

            const like = await this.prismaService.like.create({
                data: {
                    userId: likeData.userId,
                    videoId: likeData.videoId,
                },
            });

            return { message: 'Like added successfully', success: true };
        } catch (error) {
            return { message: 'Error adding like', error: error.message, success: false };
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
                return { message: 'User has not liked this video yet', success: false };
            }

            const like = await this.prismaService.like.delete({
                where: {
                    userId_videoId: {
                        userId: likeData.userId,
                        videoId: likeData.videoId,
                    },
                },
            });

            return { message: 'Like removed successfully', success: true };
        } catch (error) {
            return { message: 'Error removing like', error: error.message, success: false };
        }
    }
    async getLikeCount(videoId: number) {
        try {
            const likeCount = await this.prismaService.like.count({
                where: {
                    videoId: videoId,
                },
            });
            return { message: 'Like count retrieved successfully', data: likeCount };
        } catch (error) {
            return { message: 'Error retrieving like count', error: error.message };
        }
    }
    async getVideoUserLike(videoId: number, userId: number) {
        try {
            const like = await this.prismaService.like.findUnique({
                where: {
                    userId_videoId: {
                        userId: userId,
                        videoId: videoId,
                    },
                },
            });
            return { message: 'User like status retrieved successfully', data: like ? true : false };
        } catch (error) {
            return { message: 'Error retrieving user like status', error: error.message };
        }
    }
    async listLikes(userId: number, skip = 0, take = 10) {
        try {
            const likes = await this.prismaService.like.findMany({
                where: { userId },
                orderBy: {
                    id: 'desc', // 👈 id lớn hơn thì mới hơn
                },
                skip,
                take,
                include: {
                    video: true, // lấy luôn video từ like
                },
            });

            return {
                message: 'User likes retrieved successfully',
                data: likes.map(like => like.video), // chỉ trả về video
            };
        } catch (error) {
            return {
                message: 'Error retrieving user likes',
                error: error.message,
            };
        }
    }
}