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
                    path, // Lưu path vào DB
                },
            }),
            success: true,
            message: 'Video created successfully',
        };
    }

    async fetchVideos(path?: string): Promise<any> {
        if (!path) {
            return { success: false, message: 'Thiếu path' };
        }
        const video = await this.prisma.video.findUnique({
            where: { path },
            select: {
                id: true,
                title: true,
                url: true,
                thumbnailUrl: true,
                userId: true,
                createdAt: true,
            },
        });
        if (!video) {
            return {
                success: false,
                message: 'Video not found'
            }
        }
        return {
            success: true,
            video
        }
    }

    async fetchVideosRandom(excludeIds: number[] = [], n: number = 3): Promise<any[]> {
        const excludeCondition = excludeIds.length
            ? `WHERE id NOT IN (${excludeIds.join(',')})`
            : '';
        return this.prisma.$queryRawUnsafe(`
            SELECT id, title, url, thumbnailUrl, userId, createdAt
            FROM Video
            ${excludeCondition}
            ORDER BY RAND()
            LIMIT ${n}
        `);
    }

    async fetchFollowingVideos(userId: number, skip = 0, take = 10) {
        try {
            // Lấy danh sách ID những user mà mình follow
            const followingIds = await this.prisma.follow.findMany({
                where: { followerId: userId },
                select: { followingId: true },
            }).then(follows => follows.map(f => f.followingId));

            // Nếu không follow ai thì trả rỗng luôn
            if (followingIds.length === 0) {
                return { success: true, data: [] };
            }

            // Lấy video của những user đó
            const followingVideos = await this.prisma.video.findMany({
                where: {
                    userId: { in: followingIds },
                },
                orderBy: { createdAt: 'desc' }, // mới nhất trước
                skip,
                take,
            });

            return {
                success: true,
                data: followingVideos,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi lấy video theo người theo dõi',
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
                message: 'Lỗi khi lấy video'
            };
        }
    }
}
