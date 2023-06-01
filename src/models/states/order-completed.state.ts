import { OrderState } from "./order.state";

class OrderCompletedException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

class OrderCompletedState extends OrderState {
  cancel() {
    throw new OrderCompletedException("Completed order can not be canceled");
  }
  deliver(): void {
    throw new OrderCompletedException("Completed order can not be delivered");
  }
  pay(): void {
    throw new OrderCompletedException("Completed order can not be paid");
  }
  updateItems(): void {
    throw new OrderCompletedException("Completed order can not be updated");
  }
  pickup(): void {
    throw new OrderCompletedException("Completed order can not be picked-up");
  }
  complete(): void {
    throw new OrderCompletedException("Completed order can not be completed");
  }
}

export { OrderCompletedState, OrderCompletedException };
