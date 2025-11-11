import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { CobroService } from './cobro.service';

@Controller('cobros')
export class CobroController {
  constructor(private readonly cobroService: CobroService) {}

  //obtener todos los cobros
  @Get()
  async obtenerCobros() {
    return this.cobroService.obtenerCobros();
  }

  //obtener cobro por codigo
  @Get(':cobCodigo')
  async obtenerCobroPorCodigo(@Param('cobCodigo') cobCodigo: string) {
    return this.cobroService.obtenerCobroPorCodigo(cobCodigo);
  }

  //crear cobro nuevo
  @Post()
  async crearCobro(@Body() data) {
    return this.cobroService.crearCobro(data);
  }

  //actualizar cobro por id
  @Put(':id')
  async actualizarCobro(@Param('id') id: string, @Body() data) {
    return this.cobroService.actualizarCobro(id, data);
  }

  //eliminar cobro por id
  @Delete('eliminarcobro/:id')
  async eliminarCobro(@Param('id') id: string) {
    return this.cobroService.eliminarCobroforzado(id);
  }
}