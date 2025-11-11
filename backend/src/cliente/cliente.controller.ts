import { Controller, Get, Post, Body, Delete, Param, Put, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { ClienteService } from './cliente.service';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  // ========== ENDPOINTS GENERALES ==========
  // Obtener todos los clientes
  @Get()
  obtenerClientes() {
    return this.clienteService.obtenerClientes();
  }

  // Crear un nuevo cliente
  @Post()
  crearCliente(
    @Body() data: any,
    @Query('referencia') referencia?: string,
    @Query('modo') modo?: 'antes' | 'despues',
  ) {
    if (referencia && modo) {
      return this.clienteService.crearCliente(data, {
        referencia: Number(referencia),
        modo,
      });
    }
    return this.clienteService.crearCliente(data);
  }

  // Obtener un cliente por su código
  @Get(':cliCodigo')
  obtenerClientePorCodigo(@Param('cliCodigo') cliCodigo: string) {
    return this.clienteService.obtenerClientePorCodigo(cliCodigo);
  }

  // Actualizar un cliente existente
  @Put(':cliCodigo')
  actualizarCliente(@Param('cliCodigo') cliCodigo: string, @Body() data: any) {
    return this.clienteService.actualizarCliente(cliCodigo, data);
  }

  // Eliminar un cliente por su código
  @Delete(':cliCodigo')
  eliminarCliente(@Param('cliCodigo') cliCodigo: string) {
    return this.clienteService.eliminarCliente(cliCodigo);
  }

  // Obtener el estado real de un cliente
  @Get(':cliCodigo/estado-real')
  obtenerEstadoReal(@Param('cliCodigo') cliCodigo: string) {
    return this.clienteService.obtenerEstadoReal(cliCodigo);
  }

  // Eliminar un cliente peligroso (sin validaciones)
  @Delete('peligro-eliminar-cliente/:cliCodigo')
  eliminarClientePeligroso(@Param('cliCodigo') cliCodigo: string) {
    return this.clienteService.eliminarClientePeligroso(cliCodigo);
  }

  //Este es el mas usado
  @Post(':cliCodigo/nuevatarjeta')
  crearTarjetaParaClienteExistente(
    @Param('cliCodigo') cliCodigo: string,
    @Body() data: any,
    @Query('referencia') referencia?: string,
    @Query('modo') modo?: 'antes' | 'despues',
  ) {
    const insertarPosicion = (referencia && modo) ? {
      referencia: Number(referencia),
      modo,
    } : undefined;

    return this.clienteService.crearTarjetaParaClienteExistente({
      ...data,
      cliCodigo,
    }, insertarPosicion);
  }

  // ========== ENDPOINTS POR ITEN ==========
  // Obtener un cliente por su iten
  @Get('iten/:iten')
  obtenerClientePorIten(@Param('iten') iten: string) {
    return this.clienteService.obtenerClientePorIten(Number(iten));
  }

  // Obtener el primer cliente
  @Get('iten/:iten/siguiente')
  obtenerClienteSiguiente(@Param('iten') iten: string) {
    return this.clienteService.obtenerClienteSiguiente(Number(iten));
  }

  // Obtener el cliente anterior
  @Get('iten/:iten/anterior')
  obtenerClienteAnterior(@Param('iten') iten: string) {
    return this.clienteService.obtenerClienteAnterior(Number(iten));
  }

  // Navegar entre clientes
  @Get('navegar/general')
  navegarEntreClientes(
    @Query('iten') iten: string,
    @Query('direccion') direccion: 'siguiente' | 'anterior',
  ) {
    if (!iten || !direccion) {
      throw new BadRequestException('Debe enviar los parámetros "iten" y "direccion".');
    }
    return this.clienteService.navegarEntreClientes(Number(iten), direccion);
  }

  // ========== ENDPOINTS POR COBRADOR ==========
  // Obtener el primer cliente asignado a un cobrador
  @Get('cobrador/:cobCodigo/primer-cliente')
  obtenerPrimerClientePorCobrador(@Param('cobCodigo') cobCodigo: string) {
    return this.clienteService.obtenerPrimerClientePorCobrador(cobCodigo);
  }

  // Obtener un cliente por su iten y cobrador
  @Get('cobrador/:cobCodigo/iten/:iten/siguiente')
  obtenerClienteSiguientePorCobrador(
    @Param('cobCodigo') cobCodigo: string,
    @Param('iten') iten: string
  ) {
    return this.clienteService.obtenerClienteSiguientePorCobrador(Number(iten), cobCodigo);
  }

  // Obtener el cliente anterior por su iten y cobrador
  @Get('cobrador/:cobCodigo/iten/:iten/anterior')
  obtenerClienteAnteriorPorCobrador(
    @Param('cobCodigo') cobCodigo: string,
    @Param('iten') iten: string
  ) {
    return this.clienteService.obtenerClienteAnteriorPorCobrador(Number(iten), cobCodigo);
  }

  // Navegar entre clientes por cobrador
  @Get('cobrador/:cobCodigo/navegar')
  navegarEntreClientesPorCobrador(
    @Param('cobCodigo') cobCodigo: string,
    @Query('iten') iten: string,
    @Query('direccion') direccion: 'siguiente' | 'anterior',
  ) {
    if (!iten || !direccion) {
      throw new BadRequestException('Debe enviar los parámetros "iten" y "direccion".');
    }
    return this.clienteService.navegarEntreClientesPorCobrador(Number(iten), cobCodigo, direccion);
  }

  // Obtener todos los clientes asignados a un cobrador
  @Get('cobrador/:cobCodigo/todos')
  obtenerClientesPorCobrador(@Param('cobCodigo') cobCodigo: string) {
    return this.clienteService.obtenerClientesPorCobrador(cobCodigo);
  }
}