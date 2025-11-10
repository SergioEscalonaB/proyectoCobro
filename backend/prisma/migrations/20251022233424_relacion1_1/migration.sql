/*
  Warnings:

  - A unique constraint covering the columns `[cliCodigo]` on the table `Tarjeta` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Tarjeta_cliCodigo_key" ON "Tarjeta"("cliCodigo");
