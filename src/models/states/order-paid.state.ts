import { OrderEventType, OrderStatusType } from "@halapp/common";
import { trMoment } from "../../utils/timezone";
import { OrderCompletedV1Event } from "../events/order-completed-v1.event";
import { OrderDeliveredV1Event } from "../events/order-delivered-v1.event";
import { OrderPickedUpV1Event } from "../events/order-pickedup-v1.event";
import { Order } from "../order";
import { OrderState } from "./order.state";

class OrderPaidException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

class OrderPaidState extends OrderState {
  cancel() {
    throw new OrderPaidException("Paid order can not be canceled");
  }
  deliver(deliveredBy: string): void {
    if (this.order.isDelivered()) {
      throw new OrderPaidException(
        "Delivered order can not be delivered twice"
      );
    }
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
    this.order.complete(deliveredBy);
  }
  pay(): void {
    throw new OrderPaidException("Paid order can not be paid");
  }
  updateItems(): void {
    throw new OrderPaidException("Paid order can not be updated");
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
  complete(completedBy: string): void {
    if (!this.order.isDelivered()) {
      throw new OrderPaidException("Undelivered order can not be completed");
    }
    const event = <OrderCompletedV1Event>{
      ID: this.order.Id,
      EventType: OrderEventType.OrderCompletedV1,
      TS: trMoment().add(1, "seconds"),
      Payload: {
        Status: OrderStatusType.Completed,
        CompletedBy: completedBy,
      },
    };
    this.order.causes(event);
  }
}

export { OrderPaidState, OrderPaidException };
