import { Module } from '@nestjs/common';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { PrismaService } from 'src/config/database';

@Module({
  controllers: [LikeController],
  providers: [LikeService, PrismaService]
})
export class LikeModule { }
