import createHttpError from "http-errors";
import { Order } from "../models/order";
import { OrderItemVM, OrderVM, OrderEventVM } from "@halapp/common";
import { IMapper } from "./base.mapper";

export class OrderToOrderViewModelMapper extends IMapper<Order, OrderVM> {
  toDTO(arg: Order, includeEvents?: boolean): OrderVM {
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
      DeliveryTime: arg.DeliveryTime.format(),
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
      ...(includeEvents
        ? {
            Events: arg.RetroEvents.map(
              (e) =>
                ({
                  EventType: e.EventType,
                  Payload: JSON.stringify(e.Payload),
                  TS: e.TS.format(),
                } as OrderEventVM)
            ),
          }
        : null),
    };
  }
  toModel(arg: OrderVM): Order {
    throw new createHttpError.NotImplemented();
  }
}
