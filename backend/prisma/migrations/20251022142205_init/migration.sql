-- CreateTable
CREATE TABLE "Cobro" (
    "cobCodigo" TEXT NOT NULL,
    "cobNombre" TEXT NOT NULL,
    "cobDireccion" TEXT,
    "cobMoto" TEXT,
    "cobTelefono" TEXT,

    CONSTRAINT "Cobro_pkey" PRIMARY KEY ("cobCodigo")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "cliCodigo" TEXT NOT NULL,
    "cliNombre" TEXT NOT NULL,
    "cliCalle" TEXT,
    "estado" TEXT,
    "cobCodigo" TEXT NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("cliCodigo")
);

-- CreateTable
CREATE TABLE "Tarjeta" (
    "tarCodigo" TEXT NOT NULL,
    "tarValor" DOUBLE PRECISION NOT NULL,
    "tarCuota" DOUBLE PRECISION NOT NULL,
    "tarFecha" TIMESTAMP(3) NOT NULL,
    "iten" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "clavo" BOOLEAN,
    "pres" INTEGER,
    "tiempo" INTEGER NOT NULL,
    "fp" TEXT NOT NULL,
    "cliCodigo" TEXT NOT NULL,

    CONSTRAINT "Tarjeta_pkey" PRIMARY KEY ("tarCodigo")
);

-- CreateTable
CREATE TABLE "Descripcion" (
    "id" SERIAL NOT NULL,
    "desFecha" TIMESTAMP(3) NOT NULL,
    "desAbono" DOUBLE PRECISION NOT NULL,
    "desResta" DOUBLE PRECISION NOT NULL,
    "fechaAct" TIMESTAMP(3) NOT NULL,
    "tarCodigo" TEXT NOT NULL,

    CONSTRAINT "Descripcion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_cobCodigo_fkey" FOREIGN KEY ("cobCodigo") REFERENCES "Cobro"("cobCodigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarjeta" ADD CONSTRAINT "Tarjeta_cliCodigo_fkey" FOREIGN KEY ("cliCodigo") REFERENCES "Cliente"("cliCodigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Descripcion" ADD CONSTRAINT "Descripcion_tarCodigo_fkey" FOREIGN KEY ("tarCodigo") REFERENCES "Tarjeta"("tarCodigo") ON DELETE RESTRICT ON UPDATE CASCADE;
