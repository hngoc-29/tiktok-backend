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

    @Get("info")
    findUserById(@Query('userId') userId: number) {
        return this.userService.getUserById(Number(userId));
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

    @Put('update-password')
    async updatePassword(@Req() req: Request, @Body() updateData: { password: string; newPass: string }) {
        const id = req['user']?.id;
        return this.userService.updatePassword(id, updateData);
    }
    @Get('count')
    async countVideos() {
        return this.userService.countUsers();
    }
    @Get('list')
    listComments(@Query('skip') skip: number = 0, @Query('take') take: number = 10) {
        return this.userService.listUsers(Number(skip), Number(take));
    }
}
