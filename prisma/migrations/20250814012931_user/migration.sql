/*
  Warnings:

  - You are about to drop the `emailverificationtoken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `emailverificationtoken` DROP FOREIGN KEY `EmailVerificationToken_userId_fkey`;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `emailVerificationTokens` VARCHAR(191) NULL,
    ADD COLUMN `tokenExp` DATETIME(3) NULL;

-- DropTable
DROP TABLE `emailverificationtoken`;
