import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { CommentService } from './comment.service';

@Controller('comment')
export class CommentController {
    constructor(private readonly commentService: CommentService) { }
    @Post('create')
    createComment(@Req() req, @Query('videoId') videoId: number, @Body() body: { content: string }) {
        const userId = req.user.id; // Assuming user ID is available in the request

        return this.commentService.createComment({
            videoId: Number(videoId),
            userId,
            content: body.content,
        });
    }
    @Post('delete')
    deleteComment(@Req() req, @Query('commentId') commentId: number) {
        const userId = req.user.id; // Assuming user ID is available in the request
        return this.commentService.deleteComment({
            commentId: Number(commentId),
            userId,
        });
    }
    @Get('list')
    listComments(@Query('videoId') videoId: number, @Query('skip') skip: number = 0, @Query('take') take: number = 10) {
        return this.commentService.listComments(Number(videoId), Number(skip), Number(take));
    }
    @Get('count')
    countComments(@Query('videoId') videoId: number) {
        return this.commentService.countComments(Number(videoId));
    }
}
