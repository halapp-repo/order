import { OrderState } from "./order.state";

class OrderCanceledException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

class OrderCanceledState extends OrderState {
  cancel() {
    throw new OrderCanceledException(
      "Canceled order can not be canceled again"
    );
  }
  deliver(): void {
    throw new OrderCanceledException("Canceled order can not be delivered");
  }
}

export { OrderCanceledState, OrderCanceledException };
