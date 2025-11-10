import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CobroService } from './cobro.service';

@Controller('cobros')
export class CobroController {
  constructor(private readonly cobroService: CobroService) {}

  @Get()
  async obtenerCobros() {
    return this.cobroService.obtenerCobros();
  }

  @Get(':cobCodigo')
  async obtenerCobroPorCodigo(@Param('cobCodigo') cobCodigo: string) {
    return this.cobroService.obtenerCobroPorCodigo(cobCodigo);
  }

  @Post()
  async crearCobro(@Body() data) {
    return this.cobroService.crearCobro(data);
  }

  @Put(':id')
  async actualizarCobro(@Param('id') id: string, @Body() data) {
    return this.cobroService.actualizarCobro(id, data);
  }

  @Delete('eliminarcobro/:id')
  async eliminarCobro(@Param('id') id: string) {
    return this.cobroService.eliminarCobroforzado(id);
  }
}