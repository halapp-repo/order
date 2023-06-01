import {
  OrderEventType,
  OrderStatusType,
  PaymentMethodType,
} from "@halapp/common";

interface OrderPaidV1Payload {
  Status: OrderStatusType.Paid;
  PaidBy: string;
  PaymentMethodType: PaymentMethodType;
}

type OrderPaidV1Event = {
  ID: string;
  TS: moment.Moment;
  Type: "Event";
  EventType: OrderEventType.OrderPaidV1;
  Payload: OrderPaidV1Payload;
};

export type { OrderPaidV1Event, OrderPaidV1Payload };
