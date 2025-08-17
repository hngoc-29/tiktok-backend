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
                message: 'Tạo bình luận thất bại',
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
                    message: 'Bạn không thể xóa bình luận này',
                };
            }

            await this.prismaService.comment.delete({
                where: { id: commentData.commentId },
            });

            return { success: true, message: 'Đã xóa bình luận' };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi xóa bình luận',
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
                message: 'Lỗi khi đếm bình luận',
                error: error.message,
            };
        }
    }
}
