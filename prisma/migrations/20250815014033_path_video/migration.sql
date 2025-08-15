/*
  Warnings:

  - A unique constraint covering the columns `[path]` on the table `Video` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Video_path_key` ON `Video`(`path`);
