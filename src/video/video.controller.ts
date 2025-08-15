import { Body, Controller, Post, Req, UseInterceptors, UploadedFiles, Query, Get } from '@nestjs/common';
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
        return this.videoService.fetchVideosRandom(ids, n ? Number(n) : 3);
    }
}
