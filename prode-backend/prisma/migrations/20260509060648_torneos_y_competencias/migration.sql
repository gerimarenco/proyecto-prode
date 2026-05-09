/*
  Warnings:

  - The values [NO_COMENZO] on the enum `EstadoPartido` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `torneoId` on the `Partido` table. All the data in the column will be lost.
  - Added the required column `competenciaId` to the `Partido` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoPartido_new" AS ENUM ('FUTURO', 'PROGRAMADO', 'EN_JUEGO', 'SUSPENDIDO', 'CANCELADO', 'TERMINADO');
ALTER TABLE "public"."Partido" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Partido" ALTER COLUMN "estado" TYPE "EstadoPartido_new" USING ("estado"::text::"EstadoPartido_new");
ALTER TYPE "EstadoPartido" RENAME TO "EstadoPartido_old";
ALTER TYPE "EstadoPartido_new" RENAME TO "EstadoPartido";
DROP TYPE "public"."EstadoPartido_old";
ALTER TABLE "Partido" ALTER COLUMN "estado" SET DEFAULT 'FUTURO';
COMMIT;

-- DropForeignKey
ALTER TABLE "Partido" DROP CONSTRAINT "Partido_torneoId_fkey";

-- DropIndex
DROP INDEX "Partido_torneoId_idx";

-- AlterTable
ALTER TABLE "Partido" DROP COLUMN "torneoId",
ADD COLUMN     "competenciaId" TEXT NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'FUTURO';

-- CreateIndex
CREATE INDEX "Partido_competenciaId_idx" ON "Partido"("competenciaId");

-- AddForeignKey
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "Competencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
