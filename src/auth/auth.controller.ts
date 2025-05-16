import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDTO } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('login')
async signIn(@Body() loginDto: LoginDto) { // Ganti signInDto menjadi loginDto
  // Ganti ini:
  // return this.authService.signIn(loginDto.email, loginDto.password);
  // Menjadi ini (menggunakan metode login yang sudah ada):
  return this.authService.login(loginDto);
}

  @Post('register')
  register(@Body() registerDto: RegisterDTO) {
    return this.authService.register(registerDto);
  }
}