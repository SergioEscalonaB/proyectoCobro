import { Controller, Get, Post, Body, Delete, Param, Put, Query, BadRequestException, NotFoundException } from '@nestjs/common';
import { ClienteService } from './cliente.service';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  // ========== ENDPOINTS GENERALES ==========
  @Get()
  obtenerClientes() {
    return this.clienteService.obtenerClientes();
  }

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

  @Get(':cliCodigo')
  obtenerClientePorCodigo(@Param('cliCodigo') cliCodigo: string) {
    return this.clienteService.obtenerClientePorCodigo(cliCodigo);
  }

  @Put(':cliCodigo')
  actualizarCliente(@Param('cliCodigo') cliCodigo: string, @Body() data: any) {
    return this.clienteService.actualizarCliente(cliCodigo, data);
  }

  @Delete(':cliCodigo')
  eliminarCliente(@Param('cliCodigo') cliCodigo: string) {
    return this.clienteService.eliminarCliente(cliCodigo);
  }

  @Get(':cliCodigo/estado-real')
  obtenerEstadoReal(@Param('cliCodigo') cliCodigo: string) {
    return this.clienteService.obtenerEstadoReal(cliCodigo);
  }

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
  @Get('iten/:iten')
  obtenerClientePorIten(@Param('iten') iten: string) {
    return this.clienteService.obtenerClientePorIten(Number(iten));
  }

  @Get('iten/:iten/siguiente')
  obtenerClienteSiguiente(@Param('iten') iten: string) {
    return this.clienteService.obtenerClienteSiguiente(Number(iten));
  }

  @Get('iten/:iten/anterior')
  obtenerClienteAnterior(@Param('iten') iten: string) {
    return this.clienteService.obtenerClienteAnterior(Number(iten));
  }

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
  @Get('cobrador/:cobCodigo/primer-cliente')
  obtenerPrimerClientePorCobrador(@Param('cobCodigo') cobCodigo: string) {
    return this.clienteService.obtenerPrimerClientePorCobrador(cobCodigo);
  }

  @Get('cobrador/:cobCodigo/iten/:iten/siguiente')
  obtenerClienteSiguientePorCobrador(
    @Param('cobCodigo') cobCodigo: string,
    @Param('iten') iten: string
  ) {
    return this.clienteService.obtenerClienteSiguientePorCobrador(Number(iten), cobCodigo);
  }

  @Get('cobrador/:cobCodigo/iten/:iten/anterior')
  obtenerClienteAnteriorPorCobrador(
    @Param('cobCodigo') cobCodigo: string,
    @Param('iten') iten: string
  ) {
    return this.clienteService.obtenerClienteAnteriorPorCobrador(Number(iten), cobCodigo);
  }

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

  @Get('cobrador/:cobCodigo/todos')
  obtenerClientesPorCobrador(@Param('cobCodigo') cobCodigo: string) {
    return this.clienteService.obtenerClientesPorCobrador(cobCodigo);
  }
}