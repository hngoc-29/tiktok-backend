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
}
