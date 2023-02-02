import { Order } from "../order";

abstract class OrderState {
  constructor(protected order: Order) {}
  abstract cancel(canceledBy: string): void;
  abstract deliver(deliveredBy: string): void;
}

export { OrderState };
