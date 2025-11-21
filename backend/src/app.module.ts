import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ClienteModule } from './cliente/cliente.module';
import { CobroModule } from './cobro/cobro.module';
import { TarjetaModule } from './tarjeta/tarjeta.module';
import { DescripcionModule  } from './descripcion/descripcion.module';
import { ReporteModule } from './reporte/reporte.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, ClienteModule, CobroModule, TarjetaModule, DescripcionModule, ReporteModule, AuthModule],
})
export class AppModule {}
