import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

interface VideoType {
    id?: number,
    title?: string,
    thumbnailUrl?: string | null, // <-- Fix here
    url?: string,
    path?: string,
    userId?: number,
    fileVideo?: Express.Multer.File,
    fileThumbnail?: Express.Multer.File,
    createdAt?: Date,
}

interface VideoCreateResponse {
    video: VideoType,
    success: boolean,
    message: string,
}

function generateRandomPath(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

@Injectable()
export class VideoService {
    constructor(
        private prisma: PrismaService,
        private cloudinaryService: CloudinaryService
    ) { }

    async createVideo(videoData): Promise<any> {
        // Upload video và thumbnail song song
        const [uploadResult, uploadResultThumbnail] = await Promise.all([
            this.cloudinaryService.uploadFile(videoData.fileVideo, 'tiktok/video', 'video'),
            this.cloudinaryService.uploadFile(videoData.fileThumbnail, 'tiktok/thumbnail', 'image'),
        ]);

        // Sinh path unique
        let path: string;
        do {
            path = generateRandomPath();
        } while (
            await this.prisma.video.findUnique({ where: { path } })
        );

        // Tạo video trong database
        return {
            video: await this.prisma.video.create({
                data: {
                    title: videoData.title,
                    url: uploadResult.secure_url,
                    thumbnailUrl: uploadResultThumbnail?.secure_url || null,
                    userId: videoData.userId,
                    path,
                },
            }),
            success: true,
            message: 'Tạo video thành công',
        };
    }

    async fetchVideos(path?: string): Promise<any> {
        if (!path) {
            return { success: false, message: 'Thiếu đường dẫn video' };
        }

        const video = await this.prisma.video.findUnique({
            where: { path },
            select: {
                id: true,
                title: true,
                url: true,
                thumbnailUrl: true,
                path: true,
                userId: true,
                createdAt: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            },
        });

        if (!video) {
            return {
                success: false,
                message: 'Không tìm thấy video'
            };
        }

        return {
            success: true,
            video: {
                ...video,
                likeCount: video._count.likes,
                commentCount: video._count.comments,
            }
        };
    }

    async fetchVideosRandom(excludeIds: number[] = [], n: number = 3): Promise<any[]> {
        const videos = await this.prisma.video.findMany({
            where: excludeIds.length ? { id: { notIn: excludeIds } } : {},
            orderBy: { createdAt: 'desc' },
            take: n,
            select: {
                id: true,
                title: true,
                url: true,
                thumbnailUrl: true,
                userId: true,
                createdAt: true,
                path: true,
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    }
                }
            }
        });

        return videos.map(v => ({
            ...v,
            likeCount: v._count.likes,
            commentCount: v._count.comments,
        }));
    }

    async fetchFollowingVideos(userId: number, skip = 0, take = 10) {
        try {
            const followingIds = await this.prisma.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            }).then(follows => follows.map(f => f.followingId));

            if (followingIds.length === 0) {
                return { success: true, data: [] };
            }

            const followingVideos = await this.prisma.video.findMany({
                where: { userId: { in: followingIds } },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                select: {
                    id: true,
                    title: true,
                    url: true,
                    thumbnailUrl: true,
                    userId: true,
                    createdAt: true,
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        }
                    }
                }
            });

            return {
                success: true,
                data: followingVideos.map(v => ({
                    ...v,
                    likeCount: v._count.likes,
                    commentCount: v._count.comments,
                })),
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách video từ người theo dõi',
                error: error.message,
            };
        }
    }

    async fetchVideosByUserId(userId): Promise<object | { success: boolean, message: string }> {
        try {
            const videos = await this.prisma.video.findMany({
                where: { userId: Number(userId) },
            });
            return {
                success: true,
                videos
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi lấy video của người dùng'
            };
        }
    }

    async deleteVideos(userId: number, videoId: number) {
        try {
            const videos = await this.prisma.video.delete({
                where: {
                    userId,
                    id: videoId
                },
            });
            return {
                success: true,
                message: 'Xóa video thành công'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Lỗi khi xóa video'
            };
        }
    }
}
