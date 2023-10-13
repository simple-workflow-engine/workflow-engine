import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DLQDocument = HydratedDocument<DLQ>;

@Schema({
  timestamps: true,
})
export class DLQ {
  @Prop({
    type: String,
  })
  value?: string;

  @Prop({
    type: [String],
  })
  topics?: string[];
}

export const DLQSchema = SchemaFactory.createForClass(DLQ);
