import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy } from 'passport-http';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(
  BasicStrategy,
  'basic',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      passReqToCallback: true,
    });
  }

  validate(req: Request, username: string, password: string) {
    const apiKey = this.configService.get<string>('API_KEY') ?? '';
    if (username === 'workflow' && password === apiKey) {
      return true;
    }
    throw new UnauthorizedException();
  }
}
