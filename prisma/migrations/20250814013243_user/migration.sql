/*
  Warnings:

  - You are about to drop the column `emailVerificationTokens` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `tokenExp` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `emailVerificationTokens`,
    DROP COLUMN `tokenExp`;

-- CreateTable
CREATE TABLE `EmailVerificationToken` (
    `token` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EmailVerificationToken` ADD CONSTRAINT `EmailVerificationToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
