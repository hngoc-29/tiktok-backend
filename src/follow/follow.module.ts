import { Module } from '@nestjs/common';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';
import { PrismaService } from 'src/config/database';

@Module({
  controllers: [FollowController],
  providers: [FollowService, PrismaService]
})
export class FollowModule { }
