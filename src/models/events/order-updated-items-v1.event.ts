import { OrderEventType } from "@halapp/common";
import { OrderItem } from "../order";

interface OrderItemsUpdatedV1Payload {
  DeletedItems: OrderItem[];
  UpdatedBy: string;
}

type OrderItemsUpdatedV1Event = {
  ID: string;
  TS: moment.Moment;
  Type: "Event";
  EventType: OrderEventType.OrderItemsUpdatedV1;
  Payload: OrderItemsUpdatedV1Payload;
};

export type { OrderItemsUpdatedV1Event, OrderItemsUpdatedV1Payload };
