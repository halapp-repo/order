import createHttpError from "http-errors";
import { Order } from "../models/order";
import {
  OrderItemVM,
  OrderVM,
  OrderEventVM,
  OrderEventType,
  OrderItemsUpdatedV1PayloadVM,
} from "@halapp/common";
import { IMapper } from "./base.mapper";

export class OrderToOrderViewModelMapper extends IMapper<Order, OrderVM> {
  toDTO(arg: Order, includeEvents?: boolean): OrderVM {
    return {
      City: arg.City,
      PaymentMethodType: arg.PaymentMethodType,
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
      ExtraCharges: arg.ExtraCharges,
      TotalPrice: arg.TotalPrice,
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
            Events: arg.RetroEvents.map((e) => {
              switch (e.EventType) {
                case OrderEventType.OrderItemsUpdatedV1: {
                  return {
                    EventType: e.EventType,
                    Payload: JSON.stringify({
                      UpdatedBy: e.Payload.UpdatedBy,
                      DeletedItems: e.Payload.DeletedItems,
                    } as OrderItemsUpdatedV1PayloadVM),
                    TS: e.TS.format(),
                  } as OrderEventVM;
                }
                default:
                  return {
                    EventType: e.EventType,
                    Payload: JSON.stringify(e.Payload),
                    TS: e.TS.format(),
                  } as OrderEventVM;
              }
            }),
          }
        : null),
    };
  }
  toModel(arg: OrderVM): Order {
    throw new createHttpError.NotImplemented();
  }
}
