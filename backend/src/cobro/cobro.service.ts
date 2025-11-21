import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CobroService {
  constructor(private prisma: PrismaService) {}

  async obtenerCobros() {
    return this.prisma.cobro.findMany({
      select: {
        cobCodigo: true,
        cobNombre: true,
        cobDireccion: true,
        cobTelefono: true,
        cobMoto: true,
      },
      orderBy: {
        cobCodigo: 'asc' // Ordenar por código
      }
    });
  }

  async obtenerCobroPorCodigo(cobCodigo: string) {
    return this.prisma.cobro.findUnique({
      where: { cobCodigo: cobCodigo },
      select: {
        cobCodigo: true,
        cobNombre: true,
        cobDireccion: true,
        cobTelefono: true,
        cobMoto: true,
      }
    });
  }

  async crearCobro(data) {
    return this.prisma.cobro.create({ data });
  }

  async actualizarCobro(id: string, data) {
    return this.prisma.cobro.update({
      where: { cobCodigo: id },
      data,
    });
  }

  async eliminarCobroforzado(id: string) {
    return this.prisma.cobro.delete({
      where: { cobCodigo: id },
    });
  }
}