import { Address } from "../address";
import { OrderItem } from "../order";
import { OrderEventType } from "../order-event-type.enum";
import { OrderStatus } from "../order-status";

interface OrderCreatedV1Payload {
  OrgID: string;
  DeliveryAddress: Address;
  CreatedBy: string;
  Note?: string;
  Items: OrderItem[];
  Status: OrderStatus.Created;
}

type OrderCreatedV1Event = {
  ID: string;
  TS: moment.Moment;
  Type: "Event";
  EventType: OrderEventType.OrderCreatedV1;
  Payload: OrderCreatedV1Payload;
};

export type { OrderCreatedV1Event, OrderCreatedV1Payload };
