import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { BasicAuthStrategy } from './basic.strategy';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: ['jwt', 'basic'],
      property: 'auth',
    }),
  ],
  providers: [JwtStrategy, BasicAuthStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
