import { CityType, PaymentMethodType } from "@halapp/common";
import { object, string, number, InferType, array, mixed } from "yup";

const inputSchema = {
  body: object({
    City: mixed<CityType>().oneOf(Object.values(CityType)).required(),
    PaymentMethodType: mixed<PaymentMethodType>()
      .oneOf(Object.values(PaymentMethodType))
      .required(),
    OrganizationId: string().required(),
    Note: string().optional(),
    TS: string().required(),
    DeliveryTime: string().required(),
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
