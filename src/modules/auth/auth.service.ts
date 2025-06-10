import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { AuthResult, JwtPayload } from '../../common/interfaces/auth.interfaces';
import { User } from '@prisma/client';
import { Response } from 'express';
import { GoogleUserDto } from './dto/google-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isPasswordSet: true,
      },
    });

    const token = this.generateToken(user.id, user.email);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      token,
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password || !user.isPasswordSet) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  generateToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  async validateUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  setJwtCookie(response: Response, token: string) {
    response.cookie('jwt_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  async validateOrCreateGoogleUser(googleUserDto: GoogleUserDto) {
    const { email, googleId, firstName, lastName, profilePicture } = googleUserDto;

    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            profilePicture: profilePicture || user.profilePicture,
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email,
            googleId,
            firstName,
            lastName,
            profilePicture,
            isPasswordSet: false,
          },
        });
      }
    }

    return user;
  }

  loginWithGoogle(user: User) {
    const token = this.generateToken(user.id, user.email);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      token,
    };
  }
}
