import { object, InferType, array, string, number } from "yup";

const inputSchema = {
  body: object({
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
  }).required(),
};

type UpdateOrderItemsDTO = InferType<typeof inputSchema.body>;

export { inputSchema };
export type { UpdateOrderItemsDTO };
