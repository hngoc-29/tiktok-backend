// cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import * as streamifier from 'streamifier';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Injectable()
export class CloudinaryService {
    async uploadFile(
        file: Express.Multer.File,
        folder: string,
        resourceType: 'image' | 'video' = 'image',
    ): Promise<CloudinaryResponse> {
        if (!file || !file.buffer) {
            throw new Error('Tệp không hợp lệ hoặc không có dữ liệu.');
        }

        return new Promise<CloudinaryResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: resourceType,
                    folder: folder,
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result as CloudinaryResponse);
                },
            );
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
}
