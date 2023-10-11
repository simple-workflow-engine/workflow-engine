import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaModule } from './kafka/kafka.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TestConsumer } from './test.consumer';
import { AuthModule } from './auth/auth.module';
import { DefinitionModule } from './definition/definition.module';
import { RuntimeModule } from './runtime/runtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    KafkaModule,
    AuthModule,
    DefinitionModule,
    RuntimeModule,
  ],
  controllers: [AppController],
  providers: [AppService, TestConsumer],
})
export class AppModule {}
