import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { TarjetaService } from './tarjeta.service';

@Controller('tarjetas')
export class TarjetaController {
  constructor(private readonly tarjetaService: TarjetaService) {}

  // Obtener todas las tarjetas ordenadas
  @Get()
  obtenerTodas() {
    return this.tarjetaService.obtenerTarjetas();
  }

  // Crear una tarjeta
  // Ejemplo:
  // POST /tarjetas?referencia=10&modo=antes
  @Post()
  crear(
    @Body() data: any,
    @Query('referencia') referencia?: string,
    @Query('modo') modo?: 'antes' | 'despues',
  ) {
    if (referencia && modo) {
      return this.tarjetaService.crearTarjeta(data, {
        referencia: Number(referencia),
        modo,
      });
    }
    return this.tarjetaService.crearTarjeta(data);
  }

  // Actualizar una tarjeta por su código
  @Put(':id')
  actualizar(@Param('id') id: string, @Body() data: any) {
    return this.tarjetaService.actualizarTarjeta(id, data);
  }

  // Eliminar una tarjeta
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.tarjetaService.eliminarTarjeta(id);
  }
}
