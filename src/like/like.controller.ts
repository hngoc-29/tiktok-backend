import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { LikeService } from './like.service';

@Controller('like')
export class LikeController {
    constructor(private readonly likeService: LikeService) { }
    // Define your endpoints here
    @Post('add')
    addLike(@Body() data, @Req() req: Request) {
        if (!data || !data.videoId) {
            return {
                success: false,
                message: 'Video không hợp lệ',
            };
        }
        const likeData = { videoId: data.videoId, userId: Number(req['user']?.id) };
        return this.likeService.addLike(likeData);
    }
    @Post('remove')
    unLike(@Body() data, @Req() req: Request) {
        if (!data || !data.videoId) {
            return {
                success: false,
                message: '',
            };
        }
        const likeData = { videoId: data.videoId, userId: Number(req['user']?.id) };
        return this.likeService.unLike(likeData);
    }
    @Get('count')
    async getLikeCount(@Query('videoId') videoId: number) {
        if (!videoId) {
            return {
                success: false,
                message: 'Video không hợp lệ',
            };
        }
        return this.likeService.getLikeCount(Number(videoId));
    }
    @Get('video-user')
    async getVideoUserLike(@Query('videoId') videoId: number, @Req() req: Request) {
        const userId = Number(req['user']?.id);
        if (!userId) {
            return {
                success: false,
                message: 'Người dùng không hợp lệ',
            };
        }
        return this.likeService.getVideoUserLike(Number(videoId), userId);
    }
    @Get('list')
    async listLikes(@Req() req: Request, @Query('skip') skip: number = 0, @Query('take') take: number = 10) {
        const userId = req["user"]?.id;
        if (!userId) {
            return {
                success: false,
                message: 'Người dùng không hợp lệ',
            };
        }
        return this.likeService.listLikes(userId, Number(skip), Number(take));
    }
}