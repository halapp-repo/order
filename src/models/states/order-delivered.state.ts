import { OrderEventType, OrderStatusType } from "@halapp/common";
import { trMoment } from "../../utils/timezone";
import { OrderPaidV1Event } from "../events/order-paid-v1.event";
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
  deliver(): void {
    throw new OrderDeliveredException("Delivered order can not be delivered");
  }
  paid(paidBy: string): void {
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
  }
  updateItems(): void {
    throw new OrderDeliveredException("Delivered order can not be updated");
  }
}

export { OrderDeliveredState, OrderDeliveredException };
