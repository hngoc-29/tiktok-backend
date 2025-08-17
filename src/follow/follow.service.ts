import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database';

@Injectable()
export class FollowService {
    constructor(private readonly prismaService: PrismaService) { }

    async followUser(followerId: number, followingId: number) {
        try {
            // Kiểm tra đã follow chưa
            const existingFollow = await this.prismaService.follow.findUnique({
                where: {
                    followerId_followingId: { // 👈 cần @@unique([followerId, followingId]) trong schema
                        followerId,
                        followingId,
                    },
                },
            });

            if (existingFollow) {
                return {
                    success: false,
                    message: 'Đã theo dõi người dùng này',
                };
            }

            // Nếu chưa follow thì tạo mới
            const follow = await this.prismaService.follow.create({
                data: {
                    follower: { connect: { id: followerId } },
                    following: { connect: { id: followingId } },
                },
            });

            return {
                success: true,
                message: 'Theo dõi thành công',
                data: follow,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi theo dõi người dùng',
            };
        }
    }
    async unfollowUser(followerId: number, followingId: number) {
        try {
            // Kiểm tra xem đã follow chưa
            const existingFollow = await this.prismaService.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId,
                    },
                },
            });

            if (!existingFollow) {
                return {
                    success: false,
                    message: 'Không theo dõi người dùng này',
                };
            }

            // Nếu đã follow thì xóa
            await this.prismaService.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId,
                    },
                },
            });

            return {
                success: true,
                message: 'Hủy theo dõi thành công',
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi hủy theo dõi người dùng',
            };
        }
    }
    async getFollowers(userId: number, skip = 0, take = 10) {
        try {
            const followers = await this.prismaService.follow.findMany({
                where: { followingId: userId },
                orderBy: { id: 'desc' }, // 👈 id lớn hơn = follow mới hơn
                skip,
                take,
                include: {
                    follower: {
                        select: { id: true, fullname: true, username: true }, // tuỳ bạn muốn lấy field nào
                    },
                },
            });

            return {
                success: true,
                data: followers.map(f => f.follower), // chỉ trả về user follower
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách người theo dõi',
                error: error.message,
            };
        }
    }
    async getFollowing(userId: number, skip = 0, take = 10) {
        try {
            const following = await this.prismaService.follow.findMany({
                where: { followerId: userId },
                orderBy: { id: 'desc' },
                skip,
                take,
                include: {
                    following: {
                        select: { id: true, fullname: true, username: true },
                    },
                },
            });

            return {
                success: true,
                data: following.map(f => f.following),
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi lấy danh sách người đang theo dõi',
                error: error.message,
            };
        }
    }
    async countFollowers(userId: number) {
        try {
            const count = await this.prismaService.follow.count({
                where: { followingId: userId },
            });
            return {
                success: true,
                data: count,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi đếm người theo dõi',
                error: error.message,
            };
        }
    }
    async countFollowing(userId: number) {
        try {
            const count = await this.prismaService.follow.count({
                where: { followerId: userId },
            });
            return {
                success: true,
                data: count,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Lỗi khi đếm người đang theo dõi',
                error: error.message,
            };
        }
    }
}
