import createHttpError from "http-errors";
import { Order } from "../models/order";
import { OrderItemVM, OrderVM } from "@halapp/common";
import { IMapper } from "./base.mapper";

export class OrderToOrderViewModelMapper extends IMapper<Order, OrderVM> {
  toDTO(arg: Order): OrderVM {
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
        } as OrderItemVM;
      }),
    };
  }
  toModel(arg: OrderVM): Order {
    throw new createHttpError.NotImplemented();
  }
}
