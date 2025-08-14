import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AuthMiddleware } from './middleware/checktoken.middleware';
import { CheckActiveMiddleware } from './middleware/checkactive.middleware';
import { VideoModule } from './video/video.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [AuthModule, UserModule, VideoModule, CloudinaryModule],
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
        { path: 'user', method: RequestMethod.PUT }
      )
      .apply(CheckActiveMiddleware)
      .forRoutes(
        { path: 'user', method: RequestMethod.PUT }
      );
  }
}
