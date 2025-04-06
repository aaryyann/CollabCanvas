/*
  Warnings:

  - A unique constraint covering the columns `[adminId]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentRoomId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Room_adminId_key" ON "Room"("adminId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentRoomId_fkey" FOREIGN KEY ("currentRoomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
