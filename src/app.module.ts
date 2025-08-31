import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AuthMiddleware } from './middleware/checktoken.middleware';
import { CheckActiveMiddleware } from './middleware/checkactive.middleware';
import { VideoModule } from './video/video.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { FollowModule } from './follow/follow.module';
import { NotificationModule } from './notification/notification.module';
import { CheckAdminMiddleware } from './middleware/checkAdmin.middleware';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, UserModule, VideoModule, CloudinaryModule, LikeModule, CommentModule, FollowModule, NotificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        //auth
        { path: 'auth/send-verification-email', method: RequestMethod.POST },
        { path: 'auth/verify-email', method: RequestMethod.POST },
        //user
        { path: 'user', method: RequestMethod.PUT },
        { path: 'user/me', method: RequestMethod.GET },
        { path: 'user/update-password', method: RequestMethod.PUT },
        //video
        { path: 'video', method: RequestMethod.POST },
        { path: 'video/random-following-video', method: RequestMethod.GET },
        { path: 'video/delete', method: RequestMethod.POST },
        { path: 'video/save', method: RequestMethod.POST },
        //like
        { path: 'like/add', method: RequestMethod.POST },
        { path: 'like/remove', method: RequestMethod.POST },
        { path: 'like/video-user', method: RequestMethod.GET },
        { path: 'like/list', method: RequestMethod.GET },
        //comment
        { path: 'comment/create', method: RequestMethod.POST },
        { path: 'comment/delete', method: RequestMethod.POST },
        //follow
        { path: 'follow/user', method: RequestMethod.GET },
        { path: 'follow/followUser', method: RequestMethod.POST },
        { path: 'follow/unfollowUser', method: RequestMethod.POST },
        { path: 'follow/getFollowers', method: RequestMethod.GET },
        { path: 'follow/getFollowing', method: RequestMethod.GET },
        //notification
        { path: 'notification/create', method: RequestMethod.POST },
        { path: 'notification/delete/:id', method: RequestMethod.POST },
        { path: 'notification/update/:id', method: RequestMethod.POST },
        { path: 'notification/update-active/:id', method: RequestMethod.POST },
      )
      .apply(CheckActiveMiddleware)
      .forRoutes(
        //user
        { path: 'user', method: RequestMethod.PUT },
        { path: 'user/update-password', method: RequestMethod.PUT },
        //video
        { path: 'video', method: RequestMethod.POST },
        { path: 'video/random-following-video', method: RequestMethod.GET },
        { path: 'video/delete', method: RequestMethod.POST },
        { path: 'video/save', method: RequestMethod.POST },
        //like
        { path: 'like/add', method: RequestMethod.POST },
        { path: 'like/remove', method: RequestMethod.POST },
        { path: 'like/video-user', method: RequestMethod.GET },
        { path: 'like/list', method: RequestMethod.GET },
        //comment
        { path: 'comment/create', method: RequestMethod.POST },
        { path: 'comment/delete', method: RequestMethod.POST },
        //follow
        { path: 'follow/followUser', method: RequestMethod.POST },
        { path: 'follow/unfollowUser', method: RequestMethod.POST },
        { path: 'follow/getFollowers', method: RequestMethod.GET },
        { path: 'follow/getFollowing', method: RequestMethod.GET },
      )
      .apply(CheckAdminMiddleware)
      .forRoutes(
        { path: 'notification/create', method: RequestMethod.POST },
        { path: 'notification/delete/:id', method: RequestMethod.POST },
        { path: 'notification/update/:id', method: RequestMethod.POST },
        { path: 'notification/update-active/:id', method: RequestMethod.POST },
      )
  }
}
