import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { DescriptionService } from './descripcion.service';

@Controller('descripciones')
export class DescriptionController {
  constructor(private readonly descriptionService: DescriptionService) {}

  //
  @Post()
  crear(@Body() data: {
    desFecha?: Date;      // Opcional
    desAbono: number;
    desResta: number;
    fechaAct?: Date;      // Opcional  
    tarCodigo: string;
  }) {
    return this.descriptionService.crearDescripcion(data);
  }

  //Registrar un abono (pago rápido)
  @Post('abono/:tarCodigo')
  registrarAbono(
    @Param('tarCodigo') tarCodigo: string,
    @Body() body: { monto: number }
  ) {
    return this.descriptionService.registrarAbono(tarCodigo, body.monto);
  }

  //Obtener todas las descripciones
  @Get()
  obtenerTodas() {
    return this.descriptionService.obtenerTodasLasDescripciones();
  }

  //Obtener descripciones por tarjeta
  @Get('tarjeta/:tarCodigo')
  obtenerPorTarjeta(@Param('tarCodigo') tarCodigo: string) {
    return this.descriptionService.obtenerDescripcionesPorTarjeta(tarCodigo);
  }

  //Obtener historial de descripciones por cliente
  @Get('cliente/:cliCodigo')
  obtenerPorCliente(@Param('cliCodigo') cliCodigo: string) {
    return this.descriptionService.obtenerHistorialPorCliente(cliCodigo);
  }

  //Obtener la tarjeta activa del cliente
  @Get('cliente/:cliCodigo/activa')
  obtenerTarjetaActiva(@Param('cliCodigo') cliCodigo: string) {
    return this.descriptionService.obtenerTarjetaActivaCliente(cliCodigo);
  }

  //Obtener resumen de la tarjeta
  @Get('tarjeta/:tarCodigo/resumen')
  obtenerResumenTarjeta(@Param('tarCodigo') tarCodigo: string) {
    return this.descriptionService.obtenerResumenTarjeta(tarCodigo);
  }

  //Obtener descripcion por ID
  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.descriptionService.obtenerDescripcionPorId(id);
  }

  //Actualizar descripcion
  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any
  ) {
    return this.descriptionService.actualizarDescripcion(id, data);
  }

  //Eliminar descripcion
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.descriptionService.eliminarDescripcion(id);
  }
}