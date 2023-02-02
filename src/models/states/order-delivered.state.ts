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
}

export { OrderDeliveredState, OrderDeliveredException };
