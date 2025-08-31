import { Body, Controller, Post, Req, UseInterceptors, UploadedFiles, Query, Get, Put } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';

interface VideoType {
    id?: number,
    title?: string,
    thumbnailUrl?: string,
    url?: string,
    path?: string,
    userId?: number,
    fileVideo?: Express.Multer.File,
    fileThumbnail?: Express.Multer.File,
}

@Controller('video')
export class VideoController {
    constructor(private readonly videoService: VideoService) { }

    @Post()
    @UseInterceptors(AnyFilesInterceptor())
    createVideo(
        @Req() req: Request,
        @Body() videoData: VideoType,
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        // Tìm file theo fieldname
        videoData.fileVideo = files.find(f => f.fieldname === 'fileVideo');
        videoData.fileThumbnail = files.find(f => f.fieldname === 'fileThumbnail');
        videoData.userId = req['user']?.id;
        return this.videoService.createVideo(videoData);
    }

    @Get()
    async getVideos(@Query('path') path?: string) {
        return this.videoService.fetchVideos(path);
    }

    @Get('random')
    async getRandomVideos(
        @Query('excludeIds') excludeIds?: string,
        @Query('n') n?: string
    ) {
        const ids = excludeIds
            ? excludeIds.split(',').map(id => Number(id)).filter(id => !isNaN(id))
            : [];
        return this.videoService.fetchVideosRandom(ids, n ? Number(n) : 1);
    }
    @Get('random-following-video')
    async getRandomFollowingVideos(@Req() req: any, @Query('skip') skip: number = 0, @Query('take') take: number = 1) {
        const userId = req.user.id;
        return this.videoService.fetchFollowingVideos(userId, Number(skip), Number(take));
    }
    @Get('user')
    async getUserVideos(@Query('userId') userId: string) {
        if (!userId) {
            return { success: false, message: 'Thiếu userId' };
        }
        return this.videoService.fetchVideosByUserId(Number(userId));
    }
    @Post(`delete`)
    async deleteVideos(@Req() req: Request, @Query('videoId') videoId: number) {
        const userId = req['user']?.id;
        if (!videoId) {
            return { success: false, message: 'Thiếu videoId' };
        }
        return this.videoService.deleteVideos(Number(userId), Number(videoId));
    }

    @Put()
    @UseInterceptors(AnyFilesInterceptor())
    async updateVideo(
        @Req() req: Request,
        @Body() body: any,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        const videoData: any = {
            id: Number(body.id),
            title: body.title || null,
            fileThumbnail: files.find(f => f.fieldname === 'fileThumbnail') || null,
            userId: req['user']?.id,
        };

        return this.videoService.updateVideo(videoData);
    }
}