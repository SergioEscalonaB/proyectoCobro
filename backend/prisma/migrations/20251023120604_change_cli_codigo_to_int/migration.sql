/*
  Warnings:

  - The primary key for the `Cliente` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `cliCodigo` on the `Cliente` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cliCodigo` on the `Tarjeta` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Tarjeta" DROP CONSTRAINT "Tarjeta_cliCodigo_fkey";

-- AlterTable
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_pkey",
DROP COLUMN "cliCodigo",
ADD COLUMN     "cliCodigo" INTEGER NOT NULL,
ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY ("cliCodigo");

-- AlterTable
ALTER TABLE "Tarjeta" DROP COLUMN "cliCodigo",
ADD COLUMN     "cliCodigo" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tarjeta_cliCodigo_key" ON "Tarjeta"("cliCodigo");

-- AddForeignKey
ALTER TABLE "Tarjeta" ADD CONSTRAINT "Tarjeta_cliCodigo_fkey" FOREIGN KEY ("cliCodigo") REFERENCES "Cliente"("cliCodigo") ON DELETE RESTRICT ON UPDATE CASCADE;
