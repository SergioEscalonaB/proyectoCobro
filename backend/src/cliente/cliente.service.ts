import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Cliente } from '@prisma/client';

@Injectable()
export class ClienteService {
  constructor(private prisma: PrismaService) {}

  // Función auxiliar para obtener el saldo pendiente de una tarjeta
  private getSaldoPendiente(tarjeta: any): number {
    if (tarjeta.descripciones && tarjeta.descripciones.length > 0) {
      return tarjeta.descripciones[0].desResta;
    }
    return tarjeta.tarValor;
  }

  // Obtener todos los clientes
  async obtenerClientes() {
    const clientes = await this.prisma.cliente.findMany({
      include: {
        tarjetas: {
          where: { estado: 'Activa' },
          include: {
            descripciones: {
              orderBy: { desFecha: 'desc' },
              take: 1,
            },
          },
          orderBy: { iten: 'asc' },
        },
        cobro: true,
      },
    });

    const clientesConSaldo = clientes.map((cliente) => {
      const tarjetaActiva = cliente.tarjetas.find((t) => t.estado === 'Activa');
      let saldoTotal = 0;
      let iten = Infinity;

      if (tarjetaActiva) {
        saldoTotal = this.getSaldoPendiente(tarjetaActiva);
        iten = tarjetaActiva.iten;
      }

      const estado = saldoTotal > 0 ? 'Activo' : 'Inactivo';

      return {
        ...cliente,
        estado,
        saldoTotal,
        iten,
        tarjetaActiva: tarjetaActiva
          ? {
              ...tarjetaActiva,
              saldoActual: saldoTotal,
            }
          : null,
      };
    });

    return clientesConSaldo.sort((a, b) => a.iten - b.iten);
  }

  // --- LÓGICA DE RE-INDEXACIÓN ---
  private async calcularYReindexarIten(
    tx: Prisma.TransactionClient,
    insertarPosicion?: { referencia: number; modo: 'antes' | 'despues' },
  ): Promise<number> {
    if (!insertarPosicion) {
      const maxIten = await tx.tarjeta.aggregate({
        _max: { iten: true },
        where: { estado: 'Activa' },
      });
      return (maxIten._max.iten || 0) + 1;
    }

    const { referencia, modo } = insertarPosicion;
    const tarjetaRef = await tx.tarjeta.findFirst({
      where: { iten: referencia, estado: 'Activa' },
    });

    if (!tarjetaRef) {
      throw new BadRequestException(
        `No existe una tarjeta activa con iten ${referencia} para usar como referencia.`,
      );
    }

    const nuevoIten = modo === 'antes' ? tarjetaRef.iten : tarjetaRef.iten + 1;
    const itenToShift = nuevoIten;

    await tx.tarjeta.updateMany({
      where: {
        estado: 'Activa',
        iten: { gte: itenToShift },
      },
      data: { iten: { increment: 1 } },
    });

    return nuevoIten;
  }

  // Crear cliente y tarjeta inicial
  async crearCliente(
    data: any,
    insertarPosicion?: { referencia: number; modo: 'antes' | 'despues' },
  ) {
    const {
      cliCodigo,
      cliNombre,
      cliCalle,
      cobCodigo,
      tarValor,
      tiempo,
      fp,
      tarFecha,
    } = data;

    return this.prisma.$transaction(async (tx) => {
      const clienteExistente = await tx.cliente.findUnique({
        where: { cliCodigo: Number(cliCodigo) },
        include: {
          tarjetas: {
            where: { estado: 'Activa' },
            include: {
              descripciones: {
                orderBy: { desFecha: 'desc' },
                take: 1,
              },
            },
          },
        },
      });

      let nuevoCliente: Cliente | null = clienteExistente
        ? (clienteExistente as Cliente)
        : null;

      if (clienteExistente) {
        const tarjetaActiva = clienteExistente.tarjetas[0];
        if (tarjetaActiva) {
          const saldoActual = this.getSaldoPendiente(tarjetaActiva);
          if (saldoActual > 0) {
            throw new BadRequestException(
              `El cliente "${clienteExistente.cliNombre}" con cedula ${cliCodigo} ya existe y tiene una tarjeta activa con saldo pendiente de $${saldoActual}.`,
            );
          }
        }
      }

      // Cálculo de cuotas
      let diasFrecuencia = 1;
      switch (fp) {
        case 'Semanal':
          diasFrecuencia = 7;
          break;
        case 'Quincenal':
          diasFrecuencia = 15;
          break;
        case 'Mensual':
          diasFrecuencia = 30;
          break;
        case 'Diario':
        default:
          diasFrecuencia = 1;
          break;
      }
      const numCuotas = Math.ceil(Number(tiempo) / diasFrecuencia);
      const tarCuota = Number(Number(tarValor) / numCuotas);

      const nuevoIten = await this.calcularYReindexarIten(tx, insertarPosicion);

      if (!clienteExistente) {
        const cobradorExistente = await tx.cobro.findUnique({
          where: { cobCodigo },
        });

        if (!cobradorExistente) {
          throw new BadRequestException(`El cobrador ${cobCodigo} no existe`);
        }

        nuevoCliente = await tx.cliente.create({
          data: {
            cliCodigo: Number(cliCodigo),
            cliNombre,
            cliCalle,
            cobCodigo,
            estado: 'Activo',
          },
        });
      }

      const nuevaTarjeta = await tx.tarjeta.create({
        data: {
          tarCodigo: `TAR-${cliCodigo}-${Date.now()}`,
          tarValor: Number(tarValor),
          tarCuota,
          tarFecha: tarFecha ? new Date(tarFecha) : new Date(),
          iten: nuevoIten,
          estado: 'Activa',
          clavo: false,
          tiempo: Number(tiempo),
          fp,
          cliCodigo: Number(cliCodigo),
        },
      });

      await tx.descripcion.create({
        data: {
          desFecha: new Date(),
          desAbono: 0,
          desResta: nuevaTarjeta.tarValor,
          fechaAct: new Date(),
          tarCodigo: nuevaTarjeta.tarCodigo,
        },
      });

      if (nuevoCliente && nuevoCliente.estado !== 'Activo') {
        await tx.cliente.update({
          where: { cliCodigo: Number(cliCodigo) },
          data: { estado: 'Activo' },
        });
      }

      return {
        mensaje: clienteExistente
          ? 'Cliente existente con saldo 0, nueva tarjeta creada exitosamente'
          : 'Cliente y tarjeta creados exitosamente',
        nuevoCliente: nuevoCliente,
        tarjeta: nuevaTarjeta,
        calculo: { frecuencia: fp, diasFrecuencia, numCuotas, tarCuota },
      };
    });
  }

  // Crear tarjeta para cliente existente
  async crearTarjetaParaClienteExistente(
    data: any,
    insertarPosicion?: { referencia: number; modo: 'antes' | 'despues' },
  ) {
    const { cliCodigo, tarValor, tiempo, fp, tarFecha } = data;

    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findUnique({
        where: { cliCodigo: Number(cliCodigo) },
        include: {
          tarjetas: {
            where: { estado: 'Activa' },
            include: {
              descripciones: { orderBy: { desFecha: 'desc' }, take: 1 },
            },
          },
        },
      });

      if (!cliente) {
        throw new NotFoundException(
          `Cliente con código ${cliCodigo} no encontrado.`,
        );
      }

      const tarjetaActiva = cliente.tarjetas[0];
      if (tarjetaActiva) {
        const saldoActual = this.getSaldoPendiente(tarjetaActiva);
        if (saldoActual > 0) {
          throw new BadRequestException(
            `El cliente "${cliente.cliNombre}" ya tiene una tarjeta activa con saldo pendiente de $${saldoActual}.`,
          );
        }
      }

      let diasFrecuencia = 1;
      switch (fp) {
        case 'Semanal':
          diasFrecuencia = 7;
          break;
        case 'Quincenal':
          diasFrecuencia = 15;
          break;
        case 'Mensual':
          diasFrecuencia = 30;
          break;
        case 'Diario':
        default:
          diasFrecuencia = 1;
          break;
      }
      const numCuotas = Math.ceil(Number(tiempo) / diasFrecuencia);
      const tarCuota = Number((Number(tarValor) / numCuotas).toFixed(2));

      const nuevoIten = await this.calcularYReindexarIten(tx, insertarPosicion);

      const nuevaTarjeta = await tx.tarjeta.create({
        data: {
          tarCodigo: `TAR-${cliCodigo}-${Date.now()}`,
          tarValor: Number(tarValor),
          tarCuota,
          tarFecha: tarFecha ? new Date(tarFecha) : new Date(),
          iten: nuevoIten,
          estado: 'Activa',
          clavo: false,
          tiempo: Number(tiempo),
          fp,
          cliCodigo: Number(cliCodigo),
        },
      });

      await tx.descripcion.create({
        data: {
          desFecha: new Date(),
          desAbono: 0,
          desResta: nuevaTarjeta.tarValor,
          fechaAct: new Date(),
          tarCodigo: nuevaTarjeta.tarCodigo,
        },
      });

      if (cliente.estado !== 'Activo') {
        await tx.cliente.update({
          where: { cliCodigo: Number(cliCodigo) },
          data: { estado: 'Activo' },
        });
      }

      return {
        mensaje: 'Nueva tarjeta creada exitosamente para cliente existente',
        nuevaTarjeta,
      };
    });
  }

  // Obtener cliente por código
  async obtenerClientePorCodigo(cliCodigo: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { cliCodigo: Number(cliCodigo) },
      include: {
        tarjetas: {
          include: {
            descripciones: {
              orderBy: { desFecha: 'desc' },
              take: 1,
            },
          },
        },
        cobro: true,
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const tarjetaActiva = cliente.tarjetas.find((t) => t.estado === 'Activa');
    let saldoTotal = 0;
    if (tarjetaActiva) {
      saldoTotal = this.getSaldoPendiente(tarjetaActiva);
    }

    const estado = saldoTotal > 0 ? 'Activo' : 'Inactivo';

    return {
      ...cliente,
      estado,
      saldoTotal,
      tarjetaActiva: tarjetaActiva
        ? { ...tarjetaActiva, saldoActual: saldoTotal }
        : null,
    };
  }

  // Obtener cliente por iten
  async obtenerClientePorIten(iten: number) {
    const tarjeta = await this.prisma.tarjeta.findFirst({
      where: { iten, estado: 'Activa' },
      include: {
        cliente: {
          include: {
            cobro: true,
            tarjetas: {
              where: { estado: 'Activa' },
              include: {
                descripciones: {
                  orderBy: { desFecha: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!tarjeta) {
      throw new NotFoundException(`No existe cliente con iten ${iten}`);
    }

    const cliente = tarjeta.cliente;
    const saldoTotal = this.getSaldoPendiente(tarjeta);
    const estado = saldoTotal > 0 ? 'Activo' : 'Inactivo';

    return {
      ...cliente,
      estado,
      saldoTotal,
      tarjetaActiva: { ...tarjeta, saldoActual: saldoTotal },
    };
  }

  // Obtener siguiente cliente
  async obtenerClienteSiguiente(itenActual: number) {
    const siguiente = await this.prisma.tarjeta.findFirst({
      where: { estado: 'Activa', iten: { gt: itenActual } },
      orderBy: { iten: 'asc' },
    });

    if (!siguiente) {
      throw new NotFoundException('No hay más clientes hacia adelante.');
    }

    return this.obtenerClientePorIten(siguiente.iten);
  }

  // Obtener cliente anterior
  async obtenerClienteAnterior(itenActual: number) {
    const anterior = await this.prisma.tarjeta.findFirst({
      where: { estado: 'Activa', iten: { lt: itenActual } },
      orderBy: { iten: 'desc' },
    });

    if (!anterior) {
      throw new NotFoundException('No hay más clientes hacia atrás.');
    }

    return this.obtenerClientePorIten(anterior.iten);
  }

  // Navegar entre clientes
  async navegarEntreClientes(
    itenActual: number,
    direccion: 'siguiente' | 'anterior',
  ) {
    const condicion =
      direccion === 'siguiente' ? { gt: itenActual } : { lt: itenActual };
    const orden = direccion === 'siguiente' ? 'asc' : 'desc';

    const tarjeta = await this.prisma.tarjeta.findFirst({
      where: { estado: 'Activa', iten: condicion },
      orderBy: { iten: orden },
      include: {
        cliente: {
          include: {
            cobro: true,
            tarjetas: {
              where: { estado: 'Activa' },
              include: {
                descripciones: {
                  orderBy: { desFecha: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!tarjeta) {
      throw new NotFoundException(
        direccion === 'siguiente'
          ? 'No hay más clientes hacia adelante.'
          : 'No hay más clientes hacia atrás.',
      );
    }

    const cliente = tarjeta.cliente;
    const saldoTotal = this.getSaldoPendiente(tarjeta);
    const estado = saldoTotal > 0 ? 'Activo' : 'Inactivo';

    return {
      ...cliente,
      estado,
      saldoTotal,
      tarjetaActiva: { ...tarjeta, saldoActual: saldoTotal },
    };
  }

  // Eliminar cliente
  async eliminarCliente(cliCodigo: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { cliCodigo: Number(cliCodigo) },
      include: {
        tarjetas: {
          where: { estado: 'Activa' },
          include: {
            descripciones: {
              orderBy: { desFecha: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const tarjetaActiva = cliente.tarjetas[0];
    let saldoTotal = 0;

    if (tarjetaActiva) {
      saldoTotal = this.getSaldoPendiente(tarjetaActiva);
    }

    if (saldoTotal > 0) {
      throw new BadRequestException(
        'No se puede eliminar cliente con saldo pendiente.',
      );
    }

    if (tarjetaActiva) {
      return this.prisma.$transaction(async (tx) => {
        const itenADesactivar = tarjetaActiva.iten;

        await tx.tarjeta.update({
          where: { tarCodigo: tarjetaActiva.tarCodigo },
          data: { estado: 'Pagada', iten: 0 },
        });

        await tx.tarjeta.updateMany({
          where: { estado: 'Activa', iten: { gt: itenADesactivar } },
          data: { iten: { decrement: 1 } },
        });

        return tx.cliente.update({
          where: { cliCodigo: Number(cliCodigo) },
          data: { estado: 'Inactivo' },
        });
      });
    } else {
      return this.prisma.cliente.update({
        where: { cliCodigo: Number(cliCodigo) },
        data: { estado: 'Inactivo' },
      });
    }
  }

  // Actualizar cliente
  async actualizarCliente(cliCodigo: string, data: any) {
    return this.prisma.cliente.update({
      where: { cliCodigo: Number(cliCodigo) },
      data,
    });
  }

  async actualizarClienteBasico(
    cliCodigo: number,
    data: { cliNombre?: string; cliCalle?: string },
  ) {
    return this.prisma.cliente.update({
      where: { cliCodigo },
      data,
    });
  }

  async actualizarTarjetaActiva(cliCodigo: number, data: any) {
    const { tiempo, fp, tarCuota } = data; // Solo campos permitidos

    const tarjetaActiva = await this.prisma.tarjeta.findFirst({
      where: {
        cliente: { cliCodigo },
        estado: 'Activa', // ✅ ¡IMPRESIONANTE!
      },
      orderBy: { iten: 'asc' },
    });

    if (!tarjetaActiva) {
      throw new NotFoundException(
        'No se encontró una tarjeta activa para este cliente',
      );
    }

    return this.prisma.tarjeta.update({
      where: { tarCodigo: tarjetaActiva.tarCodigo },
      data: { tiempo, fp, tarCuota },
    });
  }

  // Obtener estado real
  async obtenerEstadoReal(cliCodigo: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { cliCodigo: Number(cliCodigo) },
      include: {
        tarjetas: {
          where: { estado: 'Activa' },
          include: {
            descripciones: {
              orderBy: { desFecha: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const tarjetaActiva = cliente.tarjetas[0];
    let saldoTotal = 0;

    if (tarjetaActiva) {
      saldoTotal = this.getSaldoPendiente(tarjetaActiva);
    }

    const estadoReal = saldoTotal > 0 ? 'Activo' : 'Inactivo';

    if (cliente.estado !== estadoReal) {
      await this.prisma.cliente.update({
        where: { cliCodigo: Number(cliCodigo) },
        data: { estado: estadoReal },
      });
    }

    return {
      cliente: { ...cliente, estado: estadoReal },
      saldoTotal,
      estadoReal,
    };
  }

  // Eliminar cliente peligroso
  async eliminarClientePeligroso(cliCodigo: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { cliCodigo: Number(cliCodigo) },
      include: { tarjetas: true },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const tarjetaActiva = cliente.tarjetas.find((t) => t.estado === 'Activa');

    return await this.prisma.$transaction(async (tx) => {
      for (const tarjeta of cliente.tarjetas) {
        await tx.descripcion.deleteMany({
          where: { tarCodigo: tarjeta.tarCodigo },
        });
      }

      await tx.tarjeta.deleteMany({
        where: { cliCodigo: Number(cliCodigo) },
      });

      const clienteEliminado = await tx.cliente.delete({
        where: { cliCodigo: Number(cliCodigo) },
      });

      if (tarjetaActiva) {
        await tx.tarjeta.updateMany({
          where: { estado: 'Activa', iten: { gt: tarjetaActiva.iten } },
          data: { iten: { decrement: 1 } },
        });
      }

      return {
        mensaje:
          'Cliente, tarjetas y descripciones eliminados completamente de la base de datos (Operación Peligrosa).',
        clienteEliminado,
      };
    });
  }

  // --- MÉTODOS PARA COBRADORES ---

  // Obtener primer cliente por cobrador
  async obtenerPrimerClientePorCobrador(cobCodigo: string) {
    const primeraTarjeta = await this.prisma.tarjeta.findFirst({
      where: {
        estado: 'Activa',
        cliente: { cobCodigo: cobCodigo },
      },
      orderBy: { iten: 'asc' },
      include: {
        cliente: {
          include: {
            cobro: true,
            tarjetas: {
              where: { estado: 'Activa' },
              include: {
                descripciones: {
                  orderBy: { desFecha: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!primeraTarjeta) {
      throw new NotFoundException(
        `No hay clientes activos para el cobrador ${cobCodigo}`,
      );
    }

    const cliente = primeraTarjeta.cliente;
    const saldoTotal = this.getSaldoPendiente(primeraTarjeta);
    const estado = saldoTotal > 0 ? 'Activo' : 'Inactivo';

    return {
      ...cliente,
      estado,
      saldoTotal,
      tarjetaActiva: { ...primeraTarjeta, saldoActual: saldoTotal },
    };
  }

  // Obtener siguiente cliente por cobrador
  async obtenerClienteSiguientePorCobrador(
    itenActual: number,
    cobCodigo: string,
  ) {
    const siguiente = await this.prisma.tarjeta.findFirst({
      where: {
        estado: 'Activa',
        iten: { gt: itenActual },
        cliente: { cobCodigo: cobCodigo },
      },
      orderBy: { iten: 'asc' },
      include: {
        cliente: {
          include: {
            cobro: true,
            tarjetas: {
              where: { estado: 'Activa' },
              include: {
                descripciones: {
                  orderBy: { desFecha: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!siguiente) {
      throw new NotFoundException(
        'No hay más clientes hacia adelante para este cobrador.',
      );
    }

    const cliente = siguiente.cliente;
    const saldoTotal = this.getSaldoPendiente(siguiente);
    const estado = saldoTotal > 0 ? 'Activo' : 'Inactivo';

    return {
      ...cliente,
      estado,
      saldoTotal,
      tarjetaActiva: { ...siguiente, saldoActual: saldoTotal },
    };
  }

  // Obtener cliente anterior por cobrador
  async obtenerClienteAnteriorPorCobrador(
    itenActual: number,
    cobCodigo: string,
  ) {
    const anterior = await this.prisma.tarjeta.findFirst({
      where: {
        estado: 'Activa',
        iten: { lt: itenActual },
        cliente: { cobCodigo: cobCodigo },
      },
      orderBy: { iten: 'desc' },
      include: {
        cliente: {
          include: {
            cobro: true,
            tarjetas: {
              where: { estado: 'Activa' },
              include: {
                descripciones: {
                  orderBy: { desFecha: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!anterior) {
      throw new NotFoundException(
        'No hay más clientes hacia atrás para este cobrador.',
      );
    }

    const cliente = anterior.cliente;
    const saldoTotal = this.getSaldoPendiente(anterior);
    const estado = saldoTotal > 0 ? 'Activo' : 'Inactivo';

    return {
      ...cliente,
      estado,
      saldoTotal,
      tarjetaActiva: { ...anterior, saldoActual: saldoTotal },
    };
  }

  // Navegar entre clientes por cobrador
  async navegarEntreClientesPorCobrador(
    itenActual: number,
    cobCodigo: string,
    direccion: 'siguiente' | 'anterior',
  ) {
    const condicion =
      direccion === 'siguiente' ? { gt: itenActual } : { lt: itenActual };
    const orden = direccion === 'siguiente' ? 'asc' : 'desc';

    const tarjeta = await this.prisma.tarjeta.findFirst({
      where: {
        estado: 'Activa',
        iten: condicion,
        cliente: { cobCodigo: cobCodigo },
      },
      orderBy: { iten: orden },
      include: {
        cliente: {
          include: {
            cobro: true,
            tarjetas: {
              where: { estado: 'Activa' },
              include: {
                descripciones: {
                  orderBy: { desFecha: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!tarjeta) {
      throw new NotFoundException(
        direccion === 'siguiente'
          ? 'No hay más clientes hacia adelante para este cobrador.'
          : 'No hay más clientes hacia atrás para este cobrador.',
      );
    }

    const cliente = tarjeta.cliente;
    const saldoTotal = this.getSaldoPendiente(tarjeta);
    const estado = saldoTotal > 0 ? 'Activo' : 'Inactivo';

    return {
      ...cliente,
      estado,
      saldoTotal,
      tarjetaActiva: { ...tarjeta, saldoActual: saldoTotal },
    };
  }

  // Obtener todos los clientes por cobrador
  async obtenerClientesPorCobrador(cobCodigo: string) {
    const clientes = await this.prisma.cliente.findMany({
      where: { cobCodigo },
      include: {
        tarjetas: {
          where: { estado: 'Activa' },
          include: {
            descripciones: {
              orderBy: { desFecha: 'desc' },
              take: 1,
            },
          },
          orderBy: { iten: 'asc' },
        },
        cobro: true,
      },
    });

    const clientesConSaldo = clientes.map((cliente) => {
      const tarjetaActiva = cliente.tarjetas.find((t) => t.estado === 'Activa');
      let saldoTotal = 0;
      let iten = Infinity;

      if (tarjetaActiva) {
        saldoTotal = this.getSaldoPendiente(tarjetaActiva);
        iten = tarjetaActiva.iten;
      }

      const estado = saldoTotal > 0 ? 'Activo' : 'Inactivo';

      return {
        ...cliente,
        estado,
        saldoTotal,
        iten,
        tarjetaActiva: tarjetaActiva
          ? { ...tarjetaActiva, saldoActual: saldoTotal }
          : null,
      };
    });

    return clientesConSaldo.sort((a, b) => a.iten - b.iten);
  }
}
