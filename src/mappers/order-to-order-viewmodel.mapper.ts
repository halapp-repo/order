import createHttpError from "http-errors";
import { Order } from "../models/order";
import {
  OrderItemViewModel,
  OrderViewModel,
} from "../models/viewmodels/order.viewmodel";
import { IMapper } from "./base.mapper";

export class OrderToOrderViewModelMapper extends IMapper<
  Order,
  OrderViewModel
> {
  toDTO(arg: Order): OrderViewModel {
    return {
      CreatedBy: arg.CreatedBy,
      DeliveryAddress: {
        AddressLine: arg.DeliveryAddress.AddressLine,
        City: arg.DeliveryAddress.City,
        Country: arg.DeliveryAddress.Country,
        County: arg.DeliveryAddress.County,
        ZipCode: arg.DeliveryAddress.ZipCode,
      },
      Id: arg.Id,
      OrganizationId: arg.OrganizationId,
      CreatedDate: arg.CreatedDate.format(),
      Status: arg.Status,
      Note: arg.Note,
      Items: arg.Items.map((i) => {
        return {
          Count: i.Count,
          Price: i.Price,
          ProductId: i.ProductId,
          Unit: i.Unit,
        } as OrderItemViewModel;
      }),
    };
  }
  toModel(arg: OrderViewModel): Order {
    throw new createHttpError.NotImplemented();
  }
}
