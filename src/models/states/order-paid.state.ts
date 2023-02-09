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
  deliver(): void {
    throw new OrderPaidException("Paid order can not be delivered");
  }
  paid(): void {
    throw new OrderPaidException("Paid order can not be paid");
  }
  updateItems(): void {
    throw new OrderPaidException("Paid order can not be updated");
  }
}

export { OrderPaidState, OrderPaidException };
