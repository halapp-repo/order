import { OrderEventType, OrderStatusType } from "@halapp/common";
import { trMoment } from "../../utils/timezone";
import { OrderCompletedV1Event } from "../events/order-completed-v1.event";
import { OrderPaidV1Event } from "../events/order-paid-v1.event";
import { Order } from "../order";
import { OrderState } from "./order.state";

class OrderDeliveredException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

class OrderDeliveredState extends OrderState {
  cancel() {
    throw new OrderDeliveredException(
      "Delivered order can not be canceled again"
    );
  }
  pickup(pickedUp: string): void {
    throw new OrderDeliveredException(
      "Delivered order can not be pickedUp again"
    );
  }
  deliver(): void {
    throw new OrderDeliveredException("Delivered order can not be delivered");
  }
  pay(paidBy: string): void {
    if (this.order.isPaid()) {
      throw new OrderDeliveredException(
        "Delivered order can not be paid twice"
      );
    }
    const event = <OrderPaidV1Event>{
      ID: this.order.Id,
      EventType: OrderEventType.OrderPaidV1,
      TS: trMoment(),
      Payload: {
        Status: OrderStatusType.Paid,
        PaidBy: paidBy,
      },
    };
    this.order.causes(event);
    this.order.complete(paidBy);
  }
  updateItems(): void {
    throw new OrderDeliveredException("Delivered order can not be updated");
  }
  complete(completedBy: string): void {
    if (!this.order.isPaid()) {
      throw new OrderDeliveredException("Unpaid order can not be completed");
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

export { OrderDeliveredState, OrderDeliveredException };
