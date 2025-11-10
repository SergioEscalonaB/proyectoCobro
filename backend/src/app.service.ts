import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AppService {
  async obtenerClientes() {
    return await prisma.cliente.findMany();
  }

  async crearCliente(data) {
    return await prisma.cliente.create({ data });
  }

  async actualizarCliente(id: string, data) {
    return await prisma.cliente.update({
      where: { cliCodigo: Number(id) },
      data,
    });
  }

  async eliminarCliente(id: string) {
    return await prisma.cliente.delete({ where: { cliCodigo: Number(id) } });
  }
}
