import { Order, OrderItem } from "../order";

abstract class OrderState {
  constructor(protected order: Order) {}
  abstract cancel(canceledBy: string): void;
  abstract deliver(deliveredBy: string): void;
  abstract paid(paidBy: string): void;
  abstract updateItems(deletedItems: OrderItem[], updatedBy: string): void;
}

export { OrderState };
