import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { ReporteService } from './reporte.service';

@Controller('reporte')
export class ReporteController {
  constructor(private readonly reporteService: ReporteService) {}

  @Post()
  crear(@Body() data: any) {
    return this.reporteService.crearReporte(data);
  }

  @Get()
  obtenerTodos() {
    return this.reporteService.obtenerReportes();
  }

  @Get('cobrador/:cobCodigo')
  obtenerPorCobrador(@Param('cobCodigo') cobCodigo: string) {
    return this.reporteService.obtenerPorCobrador(cobCodigo);
  }

  @Get('fecha/:fecha')
  obtenerPorFecha(@Param('fecha') fecha: string) {
    return this.reporteService.obtenerPorFecha(fecha);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.reporteService.eliminarReporte(Number(id));
  }
}
