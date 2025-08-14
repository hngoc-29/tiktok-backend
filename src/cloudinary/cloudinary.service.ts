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
    async uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
        if (!file || !file.buffer) {
            throw new Error('File is missing or invalid');
        }
        return new Promise<CloudinaryResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result as CloudinaryResponse);
                },
            );
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
}
