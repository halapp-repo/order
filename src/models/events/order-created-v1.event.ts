import { Address } from "../address";
import { OrderItem } from "../order";
import {
  CityType,
  OrderEventType,
  OrderStatusType,
  PaymentMethodType,
} from "@halapp/common";

interface OrderCreatedV1Payload {
  City: CityType;
  PaymentMethodType: PaymentMethodType;
  OrgID: string;
  DeliveryAddress: Address;
  CreatedBy: string;
  Note?: string;
  Items: OrderItem[];
  Status: OrderStatusType.Created;
  DeliveryTime: string;
}

type OrderCreatedV1Event = {
  ID: string;
  TS: moment.Moment;
  Type: "Event";
  EventType: OrderEventType.OrderCreatedV1;
  Payload: OrderCreatedV1Payload;
};

export type { OrderCreatedV1Event, OrderCreatedV1Payload };
