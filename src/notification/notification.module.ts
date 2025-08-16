import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PrismaService } from 'src/config/database';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService]
})
export class NotificationModule { }
