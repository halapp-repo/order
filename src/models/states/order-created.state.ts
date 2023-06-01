import {
  OrderEventType,
  OrderStatusType,
  PaymentMethodType,
} from "@halapp/common";
import { trMoment } from "../../utils/timezone";
import { OrderCanceledV1Event } from "../events/order-canceled-v1.event";
import { OrderPaidV1Event } from "../events/order-paid-v1.event";
import { OrderPickedUpV1Event } from "../events/order-pickedup-v1.event";
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
  deliver(): void {
    throw new OrderCreatedException("Created order can not be delivered");
  }
  pay(paymentMethodType: PaymentMethodType, paidBy: string): void {
    const event = <OrderPaidV1Event>{
      ID: this.order.Id,
      EventType: OrderEventType.OrderPaidV1,
      TS: trMoment(),
      Payload: {
        Status: OrderStatusType.Paid,
        PaidBy: paidBy,
        PaymentMethodType: paymentMethodType,
      },
    };
    this.order.causes(event);
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
  pickup(pickedUp: string): void {
    const event = <OrderPickedUpV1Event>{
      ID: this.order.Id,
      EventType: OrderEventType.OrderPickedUpV1,
      TS: trMoment(),
      Payload: {
        Status: OrderStatusType.PickedUp,
        PickedUpBy: pickedUp,
      },
    };
    this.order.causes(event);
  }
  complete(): void {
    throw new OrderCreatedException("Created order can not be completed");
  }
}

export { OrderCreatedState };
