/*
  Warnings:

  - The primary key for the `Cliente` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."Tarjeta" DROP CONSTRAINT "Tarjeta_cliCodigo_fkey";

-- DropIndex
DROP INDEX "public"."Tarjeta_cliCodigo_key";

-- AlterTable
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_pkey",
ALTER COLUMN "cliCodigo" SET DATA TYPE TEXT,
ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY ("cliCodigo");

-- AlterTable
ALTER TABLE "Tarjeta" ALTER COLUMN "cliCodigo" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Tarjeta" ADD CONSTRAINT "Tarjeta_cliCodigo_fkey" FOREIGN KEY ("cliCodigo") REFERENCES "Cliente"("cliCodigo") ON DELETE RESTRICT ON UPDATE CASCADE;
