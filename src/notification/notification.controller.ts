import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Post('create')
    createNotification(@Body() { title, content }: { title: string; content: string }) {
        return this.notificationService.createNotification({ title, content });
    }
    @Post('delete/:id')
    deleteNotification(@Param('id') id: number) {
        return this.notificationService.deleteNotification(Number(id));
    }
    @Post('update/:id')
    updateNotification(
        @Param('id') id: number,
        @Body() { title, content }: { title: string; content: string }
    ) {
        return this.notificationService.updateNotification(Number(id), { title, content });
    }
    @Post('update-active/:id')
    updateActive(
        @Param('id') id: number,
        @Body() { active }: { active: boolean }
    ) {
        return this.notificationService.updateActive(Number(id), active);
    }
    @Get('get-notification/:id')
    getNotification(@Param('id') id: number) {
        return this.notificationService.getActiveNotification();
    }
    @Get('get-all')
    getAllNotifications() {
        return this.notificationService.getAllNotifications();
    }
}
