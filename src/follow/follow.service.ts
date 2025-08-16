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
                    message: 'Already following this user',
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
                message: 'Follow successful',
                data: follow,
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error following user',
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
                    message: 'Not following this user',
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
                message: 'Unfollow successful',
            };
        } catch (error) {
            return {
                success: false,
                message: 'Error unfollowing user',
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
                message: 'Error fetching followers',
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
                message: 'Error fetching following',
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
                message: 'Error counting followers',
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
                message: 'Error counting following',
                error: error.message,
            };
        }
    }
}
