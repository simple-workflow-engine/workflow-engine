import { Module } from '@nestjs/common';
import { RuntimeController } from './runtime.controller';
import { RuntimeService } from './runtime.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Runtime, RuntimeSchema } from './runtime.schema';

@Module({
  controllers: [RuntimeController],
  providers: [RuntimeService],
  imports: [
    MongooseModule.forFeature([{ name: Runtime.name, schema: RuntimeSchema }]),
  ],
})
export class RuntimeModule {}
