-- DropForeignKey
ALTER TABLE "public"."Descripcion" DROP CONSTRAINT "Descripcion_tarCodigo_fkey";

-- AlterTable
ALTER TABLE "Tarjeta" ALTER COLUMN "iten" SET DEFAULT 0,
ALTER COLUMN "clavo" SET DEFAULT false;

-- CreateTable
CREATE TABLE "Reporte" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cobCodigo" TEXT NOT NULL,
    "cobro" DOUBLE PRECISION NOT NULL,
    "prestamos" DOUBLE PRECISION NOT NULL,
    "gastos" DOUBLE PRECISION NOT NULL,
    "otrosGastos" DOUBLE PRECISION NOT NULL,
    "base" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL,
    "efectivo" DOUBLE PRECISION NOT NULL,
    "diferencia" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reporte_cobCodigo_fecha_idx" ON "Reporte"("cobCodigo", "fecha");

-- CreateIndex
CREATE INDEX "Reporte_fecha_idx" ON "Reporte"("fecha");

-- AddForeignKey
ALTER TABLE "Descripcion" ADD CONSTRAINT "Descripcion_tarCodigo_fkey" FOREIGN KEY ("tarCodigo") REFERENCES "Tarjeta"("tarCodigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_cobCodigo_fkey" FOREIGN KEY ("cobCodigo") REFERENCES "Cobro"("cobCodigo") ON DELETE RESTRICT ON UPDATE CASCADE;
