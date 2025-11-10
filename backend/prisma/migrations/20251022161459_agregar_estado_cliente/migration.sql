/*
  Warnings:

  - Made the column `estado` on table `Cliente` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Cliente" ALTER COLUMN "estado" SET NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'Activo';
