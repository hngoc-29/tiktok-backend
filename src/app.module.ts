import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
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

@Module({
  imports: [AuthModule, UserModule, VideoModule, CloudinaryModule, LikeModule, CommentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        //auth
        { path: 'auth/refresh-token', method: RequestMethod.POST },
        { path: 'auth/send-verification-email', method: RequestMethod.POST },
        { path: 'auth/verify-email', method: RequestMethod.POST },
        { path: 'auth/send-reset-email', method: RequestMethod.POST },
        { path: 'auth/reset-password', method: RequestMethod.POST },
        //user
        { path: 'user', method: RequestMethod.PUT },
        { path: 'video', method: RequestMethod.POST },
        //like
        { path: 'like/add', method: RequestMethod.POST },
        { path: 'like/remove', method: RequestMethod.POST },
        { path: 'like/video-user', method: RequestMethod.GET },
        //comment
        { path: 'comment/create', method: RequestMethod.POST },
        { path: 'comment/delete', method: RequestMethod.POST },
      )
      .apply(CheckActiveMiddleware)
      .forRoutes(
        { path: 'user', method: RequestMethod.PUT },
        { path: 'video', method: RequestMethod.POST },
        { path: 'like/add', method: RequestMethod.POST },
        { path: 'like/remove', method: RequestMethod.POST },
        { path: 'like/video-user', method: RequestMethod.GET },
        { path: 'comment/create', method: RequestMethod.POST },
        { path: 'comment/delete', method: RequestMethod.POST },
      );
  }
}
