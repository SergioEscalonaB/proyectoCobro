import { Module } from '@nestjs/common';
import { DescriptionService } from './descripcion.service';
import { DescriptionController } from './descripcion.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DescriptionController],
  providers: [DescriptionService],
  exports: [DescriptionService]
})
export class DescripcionModule {}  // ← Cambia a 'DescripcionModule'