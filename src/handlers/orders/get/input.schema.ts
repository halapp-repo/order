import { object, string, number, InferType, array } from "yup";

const inputSchema = {
  queryStringParameters: object({
    OrganizationId: string().required(),
    FromDate: string().optional(),
    ToDate: string().optional(),
    Status: string().optional(),
  }),
};

type ByOrgDTO = InferType<typeof inputSchema.queryStringParameters>;

export { inputSchema };
export type { ByOrgDTO };
