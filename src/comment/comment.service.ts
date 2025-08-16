import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database';

@Injectable()
export class CommentService {
    constructor(private readonly prismaService: PrismaService) { }
    async createComment(commentData: { videoId: number; userId: number; content: string }) {
        try {
            const newComment = await this.prismaService.comment.create({
                data: {
                    videoId: commentData.videoId,
                    userId: commentData.userId,
                    content: commentData.content,
                },
                include: {
                    user: {
                        select: { id: true, fullname: true }, // để trả về luôn user info
                    },
                },
            });

            return newComment;
        } catch (error) {
            return {
                success: false,
                message: 'Error creating comment',
                error: error.message,
            };
        }
    }

    async deleteComment(commentData: { commentId: number; userId: number }) {
        try {
            const comment = await this.prismaService.comment.findUnique({
                where: { id: commentData.commentId },
            });

            if (!comment || comment.userId !== commentData.userId) {
                return {
                    success: false,
                    message: 'You cannot delete this comment',
                };
            }

            await this.prismaService.comment.delete({
                where: { id: commentData.commentId },
            });

            return { success: true, message: 'Comment deleted' };
        } catch (error) {
            return {
                success: false,
                message: 'Error deleting comment',
                error: error.message,
            };
        }
    }
    async listComments(videoId: number, skip = 0, take = 10) {
        return this.prismaService.comment.findMany({
            where: { videoId },
            orderBy: {
                createdAt: 'desc', // 👈 mới nhất nằm trên
            },
            skip, // bỏ qua bao nhiêu cái (dùng cho fetch thêm)
            take, // số lượng muốn lấy (mặc định 10)
            include: {
                user: {
                    select: { id: true, fullname: true }, // lấy thêm info user nếu cần
                },
            },
        });
    }
    async countComments(videoId: number) {
        try {
            return {
                data: await this.prismaService.comment.count({
                    where: { videoId },
                }),
                success: true
            }
        } catch (error) {
            return {
                success: false,
                message: 'Error counting comments',
                error: error.message,
            };
        }
    }
}
