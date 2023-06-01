import { OrderEventType, OrderStatusType } from "@halapp/common";
import { trMoment } from "../../utils/timezone";
import { OrderDeliveredV1Event } from "../events/order-delivered-v1.event";
import { OrderState } from "./order.state";

class OrderPickUpException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

class OrderPickUpState extends OrderState {
  cancel() {
    throw new OrderPickUpException("Pickedup order can not be canceled");
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
    if (this.order.isPaid()) {
      this.order.complete(deliveredBy);
    }
  }
  pay(): void {
    throw new OrderPickUpException("Pickedup order can not be paid");
  }
  updateItems(): void {
    throw new OrderPickUpException("Pickedup order can not be updated");
  }
  pickup(): void {
    throw new OrderPickUpException("Pickedup order can not be pickedup twice");
  }
  complete(): void {
    throw new OrderPickUpException("Paid order can not be completed");
  }
}

export { OrderPickUpState, OrderPickUpException };
