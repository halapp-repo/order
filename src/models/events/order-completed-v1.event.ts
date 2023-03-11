import { OrderEventType, OrderStatusType } from "@halapp/common";

interface OrderCompletedV1Payload {
  Status: OrderStatusType.Completed;
  CompletedBy: string;
}

type OrderCompletedV1Event = {
  ID: string;
  TS: moment.Moment;
  Type: "Event";
  EventType: OrderEventType.OrderCompletedV1;
  Payload: OrderCompletedV1Payload;
};

export type { OrderCompletedV1Event, OrderCompletedV1Payload };
