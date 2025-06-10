/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard';
import { Request, Response } from 'express';
import { RequestUser, UserData } from '../../common/interfaces/auth.interfaces';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) response: Response): Promise<UserData> {
    const result = await this.authService.register(registerDto);

    this.authService.setJwtCookie(response, result.token);

    const { token, ...userData } = result;
    return userData;
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request & { user: RequestUser },
  ) {
    const token = this.authService.generateToken(req.user.id, req.user.email);
    this.authService.setJwtCookie(response, token);
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request & { user: RequestUser }): RequestUser {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): { message: string } {
    response.clearCookie('jwt_token');
    return { message: 'Success logout' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleAuthRedirect(@Req() req: Request & { user: any }, @Res({ passthrough: true }) response: Response) {
    const result = this.authService.loginWithGoogle(req.user);
    this.authService.setJwtCookie(response, result.token);

    return result;
  }
}
