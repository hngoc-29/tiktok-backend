import { Body, Controller, Get, Put, Query, Req } from '@nestjs/common';
import { UserService } from './user.service';

export interface UserType {
    id?: number;
    fullname?: string;
    username?: string;
    email: string;
    password: string;
}

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    findProducts(@Query('username') username: string) {
        return this.userService.getUserByUsername(username);
    }

    @Put()
    updateUser(@Req() req: Request, @Body() updateData: UserType) {
        const email = req['user']?.email;
        return this.userService.updateUser(email, updateData);
    }
}
