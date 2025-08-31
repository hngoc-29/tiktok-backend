import { Injectable } from '@nestjs/common';
import FormData from 'form-data';

@Injectable()
export class CloudinaryChunkService {
    async uploadChunk(
        chunk: Buffer,
        uploadId: string,
        start: number,
        end: number,
        total: number,
        resourceType: 'video' | 'image' = 'video',
    ) {
        const formData = new FormData();
        formData.append('file', chunk, { filename: 'chunk.mp4' });

        const cloudName = process.env.CLOUDINARY_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        // ký params
        const timestamp = Math.floor(Date.now() / 1000);
        const paramsToSign = {
            public_id: uploadId,
            timestamp,
        };
        const crypto = await import('crypto');
        const signature = crypto
            .createHash('sha1')
            .update(
                Object.keys(paramsToSign)
                    .map((k) => `${k}=${paramsToSign[k]}`)
                    .join('&') + apiSecret,
            )
            .digest('hex');

        formData.append('public_id', uploadId);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
            {
                method: 'POST',
                headers: {
                    ...formData.getHeaders(),
                    'X-Unique-Upload-Id': uploadId,
                    'Content-Range': `bytes ${start}-${end - 1}/${total}`,
                },
                body: formData as any,
            },
        );

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Cloudinary error: ${err}`);
        }

        return res.json();
    }
}
