import { object, string, number, InferType, array } from "yup";

const inputSchema = {
  body: object({
    OrganizationId: string().required(),
    Note: string().optional(),
    TS: string().required(),
    DeliveryAddress: object().shape({
      AddressLine: string().required(),
      County: string().required(),
      City: string().required(),
      ZipCode: string().required(),
      Country: string().required(),
    }),
    Items: array()
      .of(
        object().shape({
          ProductId: string().required(),
          Price: number().required(),
          Count: number().required(),
          Unit: string().required(),
        })
      )
      .min(1)
      .required(),
  }),
};

type CreateOrderDTO = InferType<typeof inputSchema.body>;

export { inputSchema };
export type { CreateOrderDTO };
