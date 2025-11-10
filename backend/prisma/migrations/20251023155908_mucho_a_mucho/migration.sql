-- Paso 1: Crear columnas temporales con el nuevo tipo
ALTER TABLE "Cliente" ADD COLUMN "cliCodigo_new" INTEGER;
ALTER TABLE "Tarjeta" ADD COLUMN "cliCodigo_new" INTEGER;

-- Paso 2: Copiar datos convirtiendo String a Integer
UPDATE "Cliente" SET "cliCodigo_new" = CAST("cliCodigo" AS INTEGER);
UPDATE "Tarjeta" SET "cliCodigo_new" = CAST("cliCodigo" AS INTEGER);

-- Paso 3: Eliminar la constraint UNIQUE y la foreign key
ALTER TABLE "Tarjeta" DROP CONSTRAINT IF EXISTS "Tarjeta_cliCodigo_key";
ALTER TABLE "Tarjeta" DROP CONSTRAINT IF EXISTS "Tarjeta_cliCodigo_fkey";
ALTER TABLE "Cliente" DROP CONSTRAINT IF EXISTS "Cliente_pkey";

-- Paso 4: Eliminar las columnas antiguas
ALTER TABLE "Cliente" DROP COLUMN "cliCodigo";
ALTER TABLE "Tarjeta" DROP COLUMN "cliCodigo";

-- Paso 5: Renombrar las columnas nuevas
ALTER TABLE "Cliente" RENAME COLUMN "cliCodigo_new" TO "cliCodigo";
ALTER TABLE "Tarjeta" RENAME COLUMN "cliCodigo_new" TO "cliCodigo";

-- Paso 6: Hacer las columnas NOT NULL
ALTER TABLE "Cliente" ALTER COLUMN "cliCodigo" SET NOT NULL;
ALTER TABLE "Tarjeta" ALTER COLUMN "cliCodigo" SET NOT NULL;

-- Paso 7: Agregar las constraints de nuevo
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY ("cliCodigo");

-- Paso 8: Agregar foreign key (SIN unique constraint para permitir 1-a-muchos)
ALTER TABLE "Tarjeta" ADD CONSTRAINT "Tarjeta_cliCodigo_fkey" 
  FOREIGN KEY ("cliCodigo") REFERENCES "Cliente"("cliCodigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Paso 9: Crear índice para mejorar performance en búsquedas
CREATE INDEX "Tarjeta_cliCodigo_estado_idx" ON "Tarjeta"("cliCodigo", "estado");