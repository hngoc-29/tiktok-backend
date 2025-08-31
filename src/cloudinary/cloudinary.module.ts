// cloudinary.module.ts
import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryChunkService } from './cloudinary-chunk.service';

@Module({
  providers: [CloudinaryProvider, CloudinaryService, CloudinaryChunkService],
  exports: [CloudinaryProvider, CloudinaryService, CloudinaryChunkService]
})
export class CloudinaryModule { }
