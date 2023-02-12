import { OrderStatusType } from "@halapp/common";
import { object, string, number, InferType, array, mixed } from "yup";

const inputSchema = {
  queryStringParameters: object({
    OrganizationId: string().required(),
    FromDate: string().optional(),
    ToDate: string().optional(),
    Status: mixed<OrderStatusType>()
      .oneOf(Object.values(OrderStatusType))
      .optional(),
  }),
};

type ByOrgDTO = InferType<typeof inputSchema.queryStringParameters>;

export { inputSchema };
export type { ByOrgDTO };
