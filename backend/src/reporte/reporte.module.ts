import { Module } from '@nestjs/common';
import { ReporteService } from './reporte.service';
import { ReporteController } from './reporte.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ReporteController],
  providers: [ReporteService, PrismaService],
})
export class ReporteModule {}
