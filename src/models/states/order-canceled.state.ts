import { OrderState } from "./order.state";

class OrderCanceledException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

class OrderCanceledState extends OrderState {
  cancel() {
    throw new OrderCanceledException("Canceled order can not be canceled");
  }
  deliver(): void {
    throw new OrderCanceledException("Canceled order can not be delivered");
  }
  pay(): void {
    throw new OrderCanceledException("Canceled order can not be paid");
  }
  updateItems(): void {
    throw new OrderCanceledException("Canceled order can not be updated");
  }
  pickup(pickedUp: string): void {
    throw new OrderCanceledException("Canceled order can not be picked-up");
  }
  complete(completedBy: string): void {
    throw new OrderCanceledException("Canceled order can not be completed");
  }
}

export { OrderCanceledState, OrderCanceledException };
