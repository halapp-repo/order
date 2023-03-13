import { PaymentMethodType } from "@halapp/common";
import { Order, OrderItem } from "../order";

abstract class OrderState {
  constructor(protected order: Order) {}
  abstract pickup(pickedUp: string): void;
  abstract cancel(canceledBy: string): void;
  abstract deliver(deliveredBy: string): void;
  abstract pay(paidBy: string): void;
  abstract updateItems(deletedItems: OrderItem[], updatedBy: string): void;
  abstract complete(completedBy: string): void;
}

export { OrderState };
