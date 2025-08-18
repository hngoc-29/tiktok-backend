import { Body, Controller, Get, Put, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

export interface UserType {
    id?: number;
    fullname?: string;
    username?: string;
    email: string;
    password: string;
    avatarUrl?: string;
    isAdmin?: boolean;
}

@Controller('user')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    @Get('me')
    getProfile(@Req() req: Request) {
        const email = req['user']?.email;
        return this.userService.getUserByEmail(email);
    }

    @Get()
    findProducts(@Query('username') username: string) {
        return this.userService.getUserByUsername(username);
    }

    @Put()
    @UseInterceptors(FileInterceptor('avatar'))
    async updateUser(
        @Req() req: Request,
        @Body() updateData: UserType,
        @UploadedFile() file: Express.Multer.File
    ) {
        const email = req['user']?.email;

        if (file) {
            // ✅ Truyền nguyên object file, không dùng file.path
            const uploadResult = await this.cloudinaryService.uploadFile(file, 'tiktok/avatar', 'image');
            updateData.avatarUrl = uploadResult.secure_url;
        }

        return this.userService.updateUser(email, updateData);
    }
}
