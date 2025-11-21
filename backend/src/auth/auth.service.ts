import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Credenciales de prueba para validación sencilla
const USUARIO_FACIL = 'admin';
const CONTRASENA_FACIL = '1234';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(usuario: string, contrasena: string): Promise<any> {
    // Realizar para buscar en base de datos

    if (usuario === USUARIO_FACIL && contrasena === CONTRASENA_FACIL) {
      return { usuario };
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.usuario };
    return {
      token: this.jwtService.sign(payload),
    };
  }
}

export default AuthService;