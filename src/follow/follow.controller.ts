import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { FollowService } from './follow.service';

@Controller('follow')
export class FollowController {
    constructor(private readonly followService: FollowService) { }

    @Post('followUser')
    async followUser(@Req() req: any, @Body() data: { followingId: number }) {
        const followerId = req.user.id;
        const followingId = data.followingId;
        return this.followService.followUser(followerId, Number(followingId));
    }
    @Post('unfollowUser')
    async unfollowUser(@Req() req: any, @Body() data: { followingId: number }) {
        const followerId = req.user.id;
        const followingId = data.followingId;
        return this.followService.unfollowUser(followerId, Number(followingId));
    }
    @Get('getFollowers')
    async getFollowers(@Req() req: any, @Query('skip') skip: number = 0, @Query('take') take: number = 10) {
        const userId = req.user.id;
        return this.followService.getFollowers(userId, Number(skip), Number(take));
    }
    @Get('getFollowing')
    async getFollowing(@Req() req: any, @Query('skip') skip: number = 0, @Query('take') take: number = 10) {
        const userId = req.user.id;
        return this.followService.getFollowing(userId, Number(skip), Number(take));
    }
    @Get('countFollowers')
    async countFollowers(@Req() req: any) {
        const userId = req.user.id;
        return this.followService.countFollowers(userId);
    }
    @Get('countFollowing')
    async countFollowing(@Req() req: any) {
        const userId = req.user.id;
        return this.followService.countFollowing(userId);
    }
}
