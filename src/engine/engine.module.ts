import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Runtime, RuntimeSchema } from '@/runtime/runtime.schema';
import { Processor } from './processor';
import { EngineService } from './engine.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Runtime.name, schema: RuntimeSchema }]),
  ],
  providers: [EngineService, Processor],
})
export class EngineModule {}
