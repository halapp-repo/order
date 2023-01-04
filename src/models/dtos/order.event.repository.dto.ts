import { OrderStatus } from "../order-status";

class OrderEventRepositoryDTO {
  OrderID: string;
  TS?: string;
  EventType: string;
  Payload: string;
  Type: "Event";
}

export { OrderEventRepositoryDTO };
