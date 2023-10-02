import { Runtime } from '@/runtime/runtime.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class EngineService {
  constructor(
    @InjectModel(Runtime.name) private runtimeCollection: Model<Runtime>,
  ) {}
}
