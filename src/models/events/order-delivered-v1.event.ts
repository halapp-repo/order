import { OrderEventType, OrderStatusType } from "@halapp/common";

interface OrderDeliveredV1Payload {
  Status: OrderStatusType.Delivered;
  DeliveredBy: string;
}

type OrderDeliveredV1Event = {
  ID: string;
  TS: moment.Moment;
  Type: "Event";
  EventType: OrderEventType.OrderDeliveredV1;
  Payload: OrderDeliveredV1Payload;
};

export type { OrderDeliveredV1Event, OrderDeliveredV1Payload };
