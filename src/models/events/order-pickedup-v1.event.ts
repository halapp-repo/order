import { OrderEventType, OrderStatusType } from "@halapp/common";

interface OrderPickedUpV1Payload {
  Status: OrderStatusType.PickedUp;
  PickedUpBy: string;
}

type OrderPickedUpV1Event = {
  ID: string;
  TS: moment.Moment;
  Type: "Event";
  EventType: OrderEventType.OrderPickedUpV1;
  Payload: OrderPickedUpV1Payload;
};

export type { OrderPickedUpV1Event, OrderPickedUpV1Payload };
