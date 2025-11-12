import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class TarjetaService {
  async obtenerTarjetas() {
    return prisma.tarjeta.findMany({
      orderBy: { iten: 'asc' },
    });
  }

  /**
   * Crear una tarjeta con control de orden (iten)
   * @param data - Datos de la nueva tarjeta
   * @param insertarPosicion - { referencia: number, modo: 'antes' | 'despues' } (opcional)
   */
  async crearTarjeta(
    data: any,
    insertarPosicion?: { referencia: number; modo: 'antes' | 'despues' },
  ) {
    // --- Si no hay posicion especial, se asigna al final ---
    if (!insertarPosicion) {
      const maxIten = await prisma.tarjeta.aggregate({
        _max: { iten: true },
        where: { estado: 'Activa' },
      });

      const nuevoIten = (maxIten._max.iten || 0) + 1;

      return prisma.tarjeta.create({
        data: { ...data, iten: nuevoIten },
      });
    }

    // --- 2️Si se quiere insertar antes o después de otra tarjeta ---
    const { referencia, modo } = insertarPosicion;

    const tarjetaRef = await prisma.tarjeta.findFirst({
      where: { iten: referencia, estado: 'Activa' },
    });

    if (!tarjetaRef) {
      throw new BadRequestException(
        `No existe una tarjeta activa con iten ${referencia}`,
      );
    }

    const nuevoIten = modo === 'antes' ? tarjetaRef.iten : tarjetaRef.iten + 1;

    // Desplazar hacia abajo todas las tarjetas activas a partir de ese punto
    await prisma.tarjeta.updateMany({
      where: {
        estado: 'Activa',
        iten: { gte: nuevoIten },
      },
      data: { iten: { increment: 1 } },
    });

    // Crear la nueva tarjeta en la posición correcta
    return prisma.tarjeta.create({
      data: { ...data, iten: nuevoIten },
    });
  }

  async actualizarTarjeta(id: string, data) {
    return prisma.tarjeta.update({
      where: { tarCodigo: id },
      data,
    });
  }

  async eliminarTarjeta(id: string) {
    return prisma.tarjeta.delete({
      where: { tarCodigo: id },
    });
  }
}
