import { OrderCanceledV1Event } from "./order-canceled-v1.event";
import { OrderCreatedV1Event } from "./order-created-v1.event";
import { OrderDeliveredV1Event } from "./order-delivered-v1.event";
import { OrderPaidV1Event } from "./order-paid-v1.event";
import { OrderItemsUpdatedV1Event } from "./order-updated-items-v1.event";

export type OrderEvent =
  | OrderCreatedV1Event
  | OrderCanceledV1Event
  | OrderDeliveredV1Event
  | OrderPaidV1Event
  | OrderItemsUpdatedV1Event;
