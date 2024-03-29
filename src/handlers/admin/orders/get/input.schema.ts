import { OrderStatusType } from "@halapp/common";
import { object, string, InferType, mixed } from "yup";

const inputSchema = {
  queryStringParameters: object({
    FromDate: string().optional(),
    ToDate: string().optional(),
    Status: mixed<OrderStatusType>()
      .oneOf(Object.values(OrderStatusType))
      .optional(),
  }),
};

type AllOrdersDTO = InferType<typeof inputSchema.queryStringParameters>;

export { inputSchema };
export type { AllOrdersDTO };
