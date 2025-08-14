import { Body, Controller, Post } from '@nestjs/common';
import { VideoService } from './video.service';
interface VideoType {
    id?: number,
    title?: string,
    thumbnailUrl?: string,
    url?: string,
    userId?: number,
}
@Controller('video')
export class VideoController {
    constructor(private readonly videoService: VideoService) { }

    @Post()
    createVideo(@Body() videoData: VideoType) {
        return this.videoService.createVideo(videoData);
    }
}
