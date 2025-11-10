import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DescriptionService {
  constructor(private prisma: PrismaService) {}

  // Crear un nuevo abono
  async crearDescripcion(data: {
    desFecha?: Date;
    desAbono: number;
    desResta: number;
    fechaAct?: Date;
    tarCodigo: string;
  }) {
    const { tarCodigo, desAbono, desResta } = data;

    // Validar que sean números enteros
    if (!Number.isInteger(desAbono) || !Number.isInteger(desResta)) {
      throw new BadRequestException('Los montos deben ser números enteros');
    }

    // Verificar que la tarjeta existe
    const tarjeta = await this.prisma.tarjeta.findUnique({
      where: { tarCodigo },
      include: { descripciones: true }
    });

    if (!tarjeta) {
      throw new NotFoundException(`La tarjeta ${tarCodigo} no existe`);
    }

    // Validar que el abono no sea mayor al saldo pendiente
    const ultimaDescripcion = await this.obtenerUltimaDescripcion(tarCodigo);
    const saldoActual = ultimaDescripcion ? ultimaDescripcion.desResta : tarjeta.tarValor;

    if (desAbono > saldoActual) {
      throw new BadRequestException('El abono no puede ser mayor al saldo pendiente');
    }

    // Validar que desResta coincida con el cálculo
    if (desResta !== (saldoActual - desAbono)) {
      throw new BadRequestException('El saldo restante no coincide con el cálculo');
    }

    // Asignar fechas actuales si no se proporcionan
    const fechaActual = new Date();
    const desFecha = data.desFecha ? new Date(data.desFecha) : fechaActual;
    const fechaAct = data.fechaAct ? new Date(data.fechaAct) : fechaActual;

    // Crear la descripción
    const descripcion = await this.prisma.descripcion.create({
      data: {
        desFecha,
        desAbono,
        desResta,
        fechaAct,
        tarCodigo,
      },
      include: {
        tarjeta: {
          include: {
            cliente: true
          }
        }
      }
    });

    // Actualizar estado de la tarjeta y cliente si está pagada completamente
    if (desResta === 0) {
      await this.prisma.tarjeta.update({
        where: { tarCodigo },
        data: { estado: 'Pagada' }
      });

      // Actualizar estado del cliente a Inactivo si ya no tiene tarjetas activas
      await this.actualizarEstadoCliente(tarjeta.cliCodigo);
    }

    return descripcion;
  }

  // Método auxiliar para actualizar el estado del cliente
  private async actualizarEstadoCliente(cliCodigo: number) {
    const tarjetasActivas = await this.prisma.tarjeta.findMany({
      where: {
        cliCodigo: cliCodigo,
        estado: 'Activa'
      }
    });

    const nuevoEstado = tarjetasActivas.length > 0 ? 'Activo' : 'Inactivo';

    await this.prisma.cliente.update({
      where: { cliCodigo },
      data: { estado: nuevoEstado }
    });
  }

  // Obtener la última descripción de una tarjeta
  private async obtenerUltimaDescripcion(tarCodigo: string) {
    const descripciones = await this.prisma.descripcion.findMany({
      where: { tarCodigo },
      orderBy: { desFecha: 'desc' },
      take: 1
    });
    return descripciones.length > 0 ? descripciones[0] : null;
  }

  // Obtener todas las descripciones de una tarjeta
  async obtenerDescripcionesPorTarjeta(tarCodigo: string) {
    const tarjeta = await this.prisma.tarjeta.findUnique({
      where: { tarCodigo },
      include: {
        cliente: true
      }
    });

    if (!tarjeta) {
      throw new NotFoundException(`La tarjeta ${tarCodigo} no existe`);
    }

    const descripciones = await this.prisma.descripcion.findMany({
      where: { tarCodigo },
      orderBy: {
        desFecha: 'asc'
      }
    });

    return {
      tarjeta: {
        ...tarjeta,
        saldoPendiente: descripciones.length > 0 ? descripciones[descripciones.length - 1].desResta : tarjeta.tarValor
      },
      descripciones,
      resumen: {
        montoOriginal: tarjeta.tarValor,
        totalAbonado: descripciones.reduce((sum, desc) => sum + desc.desAbono, 0),
        saldoPendiente: descripciones.length > 0 ? descripciones[descripciones.length - 1].desResta : tarjeta.tarValor
      }
    };
  }

  // Obtener todas las descripciones
  async obtenerTodasLasDescripciones() {
    return this.prisma.descripcion.findMany({
      include: {
        tarjeta: {
          include: {
            cliente: true
          }
        }
      },
      orderBy: {
        desFecha: 'desc'
      }
    });
  }

  // Obtener una descripción por ID
  async obtenerDescripcionPorId(id: number) {
    const descripcion = await this.prisma.descripcion.findUnique({
      where: { id },
      include: {
        tarjeta: {
          include: {
            cliente: true
          }
        }
      }
    });

    if (!descripcion) {
      throw new NotFoundException(`Descripción con ID ${id} no encontrada`);
    }

    return descripcion;
  }

  // Actualizar una descripción
  async actualizarDescripcion(id: number, data: any) {
    // Verificar que existe
    const descripcionExistente = await this.obtenerDescripcionPorId(id);

    // Validar números enteros si se envían
    if (data.desAbono !== undefined && !Number.isInteger(data.desAbono)) {
      throw new BadRequestException('El abono debe ser un número entero');
    }
    if (data.desResta !== undefined && !Number.isInteger(data.desResta)) {
      throw new BadRequestException('El saldo restante debe ser un número entero');
    }

    // Si se modifica desAbono o desResta, validar coherencia
    if (data.desAbono !== undefined || data.desResta !== undefined) {
      const tarjeta = await this.prisma.tarjeta.findUnique({
        where: { tarCodigo: descripcionExistente.tarCodigo }
      });

      if (!tarjeta) {
        throw new NotFoundException('Tarjeta no encontrada');
      }

      const descripcionesAnteriores = await this.prisma.descripcion.findMany({
        where: { 
          tarCodigo: descripcionExistente.tarCodigo,
          desFecha: { lt: descripcionExistente.desFecha }
        },
        orderBy: { desFecha: 'desc' },
        take: 1
      });

      const saldoAnterior = descripcionesAnteriores.length > 0 
        ? descripcionesAnteriores[0].desResta 
        : tarjeta.tarValor;

      const nuevoAbono = data.desAbono !== undefined ? data.desAbono : descripcionExistente.desAbono;
      const nuevaResta = data.desResta !== undefined ? data.desResta : descripcionExistente.desResta;

      if (nuevaResta !== (saldoAnterior - nuevoAbono)) {
        throw new BadRequestException('El saldo restante no coincide con el cálculo');
      }
    }

    return this.prisma.descripcion.update({
      where: { id },
      data,
      include: {
        tarjeta: {
          include: {
            cliente: true
          }
        }
      }
    });
  }

  // Eliminar una descripción
  async eliminarDescripcion(id: number) {
    const descripcion = await this.obtenerDescripcionPorId(id);

    await this.prisma.descripcion.delete({
      where: { id }
    });

    const descripcionesRestantes = await this.prisma.descripcion.findMany({
      where: { tarCodigo: descripcion.tarCodigo },
      orderBy: { desFecha: 'desc' },
      take: 1
    });

    const tarjeta = await this.prisma.tarjeta.findUnique({ 
      where: { tarCodigo: descripcion.tarCodigo } 
    });

    if (!tarjeta) {
      throw new NotFoundException('Tarjeta no encontrada');
    }

    const nuevoSaldo = descripcionesRestantes.length > 0 
      ? descripcionesRestantes[0].desResta 
      : tarjeta.tarValor;

    const nuevoEstado = nuevoSaldo === 0 ? 'Pagada' : 'Activa';

    await this.prisma.tarjeta.update({
      where: { tarCodigo: descripcion.tarCodigo },
      data: { estado: nuevoEstado }
    });

    // Actualizar estado del cliente
    await this.actualizarEstadoCliente(tarjeta.cliCodigo);

    return { mensaje: 'Descripción eliminada correctamente' };
  }

  // Registrar un pago/abono
  async registrarAbono(tarCodigo: string, montoAbono: number) {
    if (!Number.isInteger(montoAbono)) {
      throw new BadRequestException('El monto del abono debe ser un número entero');
    }

    const tarjeta = await this.prisma.tarjeta.findUnique({
      where: { tarCodigo }
    });

    if (!tarjeta) {
      throw new NotFoundException(`Tarjeta ${tarCodigo} no encontrada`);
    }

    if (montoAbono <= 0) {
      throw new BadRequestException('El monto del abono debe ser mayor a 0');
    }

    const ultimaDescripcion = await this.obtenerUltimaDescripcion(tarCodigo);
    const saldoActual = ultimaDescripcion ? ultimaDescripcion.desResta : tarjeta.tarValor;

    if (montoAbono > saldoActual) {
      throw new BadRequestException('El monto del abono no puede ser mayor al saldo pendiente');
    }

    const nuevoSaldo = saldoActual - montoAbono;
    const fechaActual = new Date();

    const descripcion = await this.prisma.descripcion.create({
      data: {
        desFecha: fechaActual,
        desAbono: montoAbono,
        desResta: nuevoSaldo,
        fechaAct: fechaActual,
        tarCodigo: tarCodigo
      },
      include: {
        tarjeta: {
          include: {
            cliente: true
          }
        }
      }
    });

    // Actualizar estado si está completamente pagada
    if (nuevoSaldo === 0) {
      await this.prisma.tarjeta.update({
        where: { tarCodigo },
        data: { estado: 'Pagada' }
      });

      // Actualizar estado del cliente
      await this.actualizarEstadoCliente(tarjeta.cliCodigo);
    }

    return {
      mensaje: 'Abono registrado correctamente',
      descripcion,
      saldoAnterior: saldoActual,
      nuevoSaldo,
      abono: montoAbono,
      montoOriginal: tarjeta.tarValor
    };
  }

  // Obtener historial completo de un cliente (TODAS sus tarjetas)
  async obtenerHistorialPorCliente(cliCodigo: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { cliCodigo: Number(cliCodigo) },
      include: {
        tarjetas: {  // ← CAMBIO: ahora es tarjetas[] plural
          include: {
            descripciones: {
              orderBy: {
                desFecha: 'asc'
              }
            }
          },
          orderBy: {
            tarFecha: 'desc'  // Mostrar tarjetas más recientes primero
          }
        }
      }
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente ${cliCodigo} no encontrado`);
    }

    // Agregar resumen a cada tarjeta
    const tarjetasConResumen = cliente.tarjetas.map(tarjeta => {
      const descripciones = tarjeta.descripciones;
      const saldoPendiente = descripciones.length > 0 
        ? descripciones[descripciones.length - 1].desResta 
        : tarjeta.tarValor;

      return {
        ...tarjeta,
        resumen: {
          montoOriginal: tarjeta.tarValor,
          totalAbonado: descripciones.reduce((sum, desc) => sum + desc.desAbono, 0),
          saldoPendiente: saldoPendiente,
          porcentajePagado: tarjeta.tarValor > 0 
            ? Math.round(((tarjeta.tarValor - saldoPendiente) / tarjeta.tarValor) * 100) 
            : 0
        }
      };
    });

    // Calcular resumen general del cliente
    const resumenGeneral = {
      totalTarjetas: cliente.tarjetas.length,
      tarjetasActivas: cliente.tarjetas.filter(t => t.estado === 'Activa').length,
      tarjetasPagadas: cliente.tarjetas.filter(t => t.estado === 'Pagada').length,
      montoTotalPrestado: cliente.tarjetas.reduce((sum, t) => sum + t.tarValor, 0),
      saldoTotalPendiente: tarjetasConResumen.reduce((sum, t) => sum + t.resumen.saldoPendiente, 0),
      totalAbonado: tarjetasConResumen.reduce((sum, t) => sum + t.resumen.totalAbonado, 0)
    };

    return {
      ...cliente,
      tarjetas: tarjetasConResumen,  // ← CAMBIO: ahora es tarjetas[] plural
      resumenGeneral
    };
  }

  // Obtener solo la tarjeta activa de un cliente
  async obtenerTarjetaActivaCliente(cliCodigo: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { cliCodigo: Number(cliCodigo) },
      include: {
        tarjetas: {
          where: { estado: 'Activa' },
          include: {
            descripciones: {
              orderBy: {
                desFecha: 'asc'
              }
            }
          }
        }
      }
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente ${cliCodigo} no encontrado`);
    }

    const tarjetaActiva = cliente.tarjetas[0] || null;

    if (!tarjetaActiva) {
      return {
        ...cliente,
        tarjetaActiva: null,
        mensaje: 'El cliente no tiene tarjetas activas'
      };
    }

    const descripciones = tarjetaActiva.descripciones;
    const saldoPendiente = descripciones.length > 0 
      ? descripciones[descripciones.length - 1].desResta 
      : tarjetaActiva.tarValor;

    return {
      ...cliente,
      tarjetaActiva: {
        ...tarjetaActiva,
        resumen: {
          montoOriginal: tarjetaActiva.tarValor,
          totalAbonado: descripciones.reduce((sum, desc) => sum + desc.desAbono, 0),
          saldoPendiente: saldoPendiente,
          porcentajePagado: tarjetaActiva.tarValor > 0 
            ? Math.round(((tarjetaActiva.tarValor - saldoPendiente) / tarjetaActiva.tarValor) * 100) 
            : 0
        }
      }
    };
  }

  // Obtener resumen de una tarjeta
  async obtenerResumenTarjeta(tarCodigo: string) {
    const tarjeta = await this.prisma.tarjeta.findUnique({
      where: { tarCodigo },
      include: {
        cliente: true,
        descripciones: {
          orderBy: {
            desFecha: 'asc'
          }
        }
      }
    });

    if (!tarjeta) {
      throw new NotFoundException(`Tarjeta ${tarCodigo} no encontrada`);
    }

    const descripciones = tarjeta.descripciones;
    const saldoPendiente = descripciones.length > 0 
      ? descripciones[descripciones.length - 1].desResta 
      : tarjeta.tarValor;

    return {
      tarjeta: {
        ...tarjeta,
        saldoPendiente: saldoPendiente
      },
      resumen: {
        montoOriginal: tarjeta.tarValor,
        totalAbonado: descripciones.reduce((sum, desc) => sum + desc.desAbono, 0),
        saldoPendiente: saldoPendiente,
        porcentajePagado: tarjeta.tarValor > 0 ? Math.round(((tarjeta.tarValor - saldoPendiente) / tarjeta.tarValor) * 100) : 0
      },
      descripciones: descripciones.length
    };
  }
}