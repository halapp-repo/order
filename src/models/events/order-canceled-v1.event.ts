import { OrderEventType, OrderStatusType } from "@halapp/common";

interface OrderCanceledV1Payload {
  Status: OrderStatusType.Canceled;
  CanceledBy: string;
}

type OrderCanceledV1Event = {
  ID: string;
  TS: moment.Moment;
  Type: "Event";
  EventType: OrderEventType.OrderCanceledV1;
  Payload: OrderCanceledV1Payload;
};

export type { OrderCanceledV1Event, OrderCanceledV1Payload };
