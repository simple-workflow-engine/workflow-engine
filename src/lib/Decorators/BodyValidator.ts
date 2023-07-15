import type { ZodSchema } from "zod";

function BodyValidator(schema: ZodSchema) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log("schema", schema);
    console.log("target", target);
    console.log("propertyKey", propertyKey);
    console.log("descriptor", descriptor);
  };
}
export default BodyValidator;
