import { OrderEventType, OrderStatusType } from "@halapp/common";
import { trMoment } from "../../utils/timezone";
import { OrderCompletedV1Event } from "../events/order-completed-v1.event";
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
  pickup(): void {
    throw new OrderDeliveredException(
      "Delivered order can not be pickedUp again"
    );
  }
  deliver(): void {
    throw new OrderDeliveredException("Delivered order can not be delivered");
  }
  pay(): void {
    throw new OrderDeliveredException("Delivered order can not be paid");
  }
  updateItems(): void {
    throw new OrderDeliveredException("Delivered order can not be updated");
  }
  complete(completedBy: string): void {
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
