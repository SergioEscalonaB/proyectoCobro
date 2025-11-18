import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReporteService {
  constructor(private prisma: PrismaService) {}

  // Crear reporte
  async crearReporte(data: any) {
    return await this.prisma.reporte.create({
      data,
    });
  }

  // Obtener todos
  async obtenerReportes() {
    return await this.prisma.reporte.findMany({
      orderBy: { fecha: 'desc' },
    });
  }

  // Obtener por cobrador
  async obtenerPorCobrador(cobCodigo: string) {
    return await this.prisma.reporte.findMany({
      where: { cobCodigo },
      orderBy: { fecha: 'desc' },
    });
  }

  // Obtener por fecha (YYYY-MM-DD)
  async obtenerPorFecha(fecha: string) {
    return await this.prisma.reporte.findMany({
      where: {
        fecha: {
          gte: new Date(`${fecha}T00:00:00`),
          lte: new Date(`${fecha}T23:59:59`),
        },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  // Eliminar reporte
  async eliminarReporte(id: number) {
    return await this.prisma.reporte.delete({
      where: { id },
    });
  }
}
