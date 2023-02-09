import { OrderEventType, OrderStatusType } from "@halapp/common";
import { trMoment } from "../../utils/timezone";
import { OrderCanceledV1Event } from "../events/order-canceled-v1.event";
import { OrderDeliveredV1Event } from "../events/order-delivered-v1.event";
import { OrderItemsUpdatedV1Event } from "../events/order-updated-items-v1.event";
import { OrderItem } from "../order";
import { OrderState } from "./order.state";

class OrderCreatedException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

class OrderCreatedState extends OrderState {
  cancel(canceledBy: string) {
    const event = <OrderCanceledV1Event>{
      ID: this.order.Id,
      EventType: OrderEventType.OrderCanceledV1,
      TS: trMoment(),
      Payload: {
        Status: OrderStatusType.Canceled,
        CanceledBy: canceledBy,
      },
    };
    this.order.causes(event);
  }
  deliver(deliveredBy: string): void {
    const event = <OrderDeliveredV1Event>{
      ID: this.order.Id,
      EventType: OrderEventType.OrderDeliveredV1,
      TS: trMoment(),
      Payload: {
        Status: OrderStatusType.Delivered,
        DeliveredBy: deliveredBy,
      },
    };
    this.order.causes(event);
  }
  paid(): void {
    throw new OrderCreatedException("Created order can not be paid");
  }
  updateItems(deletedItems: OrderItem[], updatedBy: string): void {
    const event = <OrderItemsUpdatedV1Event>{
      ID: this.order.Id,
      EventType: OrderEventType.OrderItemsUpdatedV1,
      TS: trMoment(),
      Payload: {
        UpdatedBy: updatedBy,
        DeletedItems: deletedItems,
      },
    };
    this.order.causes(event);
  }
}

export { OrderCreatedState };
