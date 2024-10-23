/*
  Warnings:

  - You are about to drop the column `roomId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `menuId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the `Menu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `roomNumber` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemId` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Order` DROP FOREIGN KEY `Order_roomId_fkey`;

-- DropForeignKey
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_menuId_fkey`;

-- AlterTable
ALTER TABLE `Order` DROP COLUMN `roomId`,
    ADD COLUMN `roomNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `totalPrice` DOUBLE NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE `OrderItem` DROP COLUMN `menuId`,
    ADD COLUMN `itemId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `Menu`;

-- DropTable
DROP TABLE `Room`;

-- CreateTable
CREATE TABLE `Item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `price` DOUBLE NOT NULL,
    `course` VARCHAR(191) NULL,

    UNIQUE INDEX `Item_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
