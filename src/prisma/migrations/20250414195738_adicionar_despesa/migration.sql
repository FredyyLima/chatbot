/*
  Warnings:

  - You are about to drop the column `imagemUrl` on the `Despesa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Despesa" DROP COLUMN "imagemUrl",
ADD COLUMN     "imagem" TEXT;
