import { object, InferType, mixed } from "yup";
import { OrderStatusType } from "@halapp/common";

const inputSchema = {
  body: object({
    Status: mixed<OrderStatusType>()
      .oneOf(Object.values(OrderStatusType))
      .required(),
  }).required(),
};

type UpdateOrderStatusDTO = InferType<typeof inputSchema.body>;

export { inputSchema };
export type { UpdateOrderStatusDTO };
