import { Exclude, plainToInstance, Transform, Type } from "class-transformer";
import moment from "moment";
import { trMoment } from "../utils/timezone";
import { Address } from "./address";
import EventSourceAggregate from "./event-source-aggregate";
import { OrderEvent } from "./events";
import { OrderCreatedV1Event } from "./events/order-created-v1.event";
import { OrderEventType } from "@halapp/common";
import { OrderStatusType } from "@halapp/common";
import { v4 as uuidv4 } from "uuid";
import { OrderState } from "./states/order.state";
import { OrderCreatedState } from "./states/order-created.state";
import { OrderCanceledV1Event } from "./events/order-canceled-v1.event";
import { OrderCanceledState } from "./states/order-canceled.state";
import { OrderDeliveredV1Event } from "./events/order-delivered-v1.event";
import { OrderDeliveredState } from "./states/order-delivered.state";

class OrderItem {
  ProductId: string;
  Price: number;
  Count: number;
  Unit: string;
}

class Order extends EventSourceAggregate {
  @Exclude()
  State: OrderState;

  Id: string;

  OrganizationId: string;

  Status: OrderStatusType;

  @Type(() => Address)
  DeliveryAddress: Address = new Address();

  CreatedBy: string;

  @Type(() => String)
  @Transform(({ value }: { value: String }) => trMoment(value), {
    toClassOnly: true,
  })
  CreatedDate: moment.Moment;

  @Type(() => String)
  @Transform(({ value }: { value: String }) => trMoment(value), {
    toClassOnly: true,
  })
  DeliveryTime: moment.Moment;

  @Type(() => OrderItem)
  Items: OrderItem[] = [];

  Note?: string;

  apply(event: OrderEvent): void {
    this.RetroEvents.push(event);
    if (event.EventType === OrderEventType.OrderCreatedV1) {
      this.whenOrderCreatedV1(event);
      return;
    } else if (event.EventType === OrderEventType.OrderCanceledV1) {
      this.whenOrderCanceledV1(event);
      return;
    } else if (event.EventType === OrderEventType.OrderDeliveredV1) {
      this.whenOrderDeliveredV1(event);
      return;
    }
  }

  causes(event: OrderEvent): void {
    this.Changes.push(event);
    this.apply(event);
  }

  setState(state: OrderState) {
    this.State = state;
  }

  static create({
    organizationId,
    deliveryAddress,
    createdBy,
    ts,
    note,
    items,
    deliveryTime,
  }: {
    organizationId: string;
    deliveryAddress: Address;
    createdBy: string;
    ts: string;
    note?: string;
    items: OrderItem[];
    deliveryTime: string;
  }) {
    const id = uuidv4();
    const orderTS = trMoment(ts);
    const event = <OrderCreatedV1Event>{
      ID: id,
      EventType: OrderEventType.OrderCreatedV1,
      TS: orderTS,
      Payload: {
        CreatedBy: createdBy,
        DeliveryAddress: deliveryAddress,
        Items: items,
        OrgID: organizationId,
        Status: OrderStatusType.Created,
        Note: note,
        DeliveryTime: deliveryTime,
      },
    };
    const order = new Order();
    order.causes(event);
    return order;
  }

  whenOrderCreatedV1(event: OrderCreatedV1Event) {
    const {
      CreatedBy,
      DeliveryAddress,
      Items,
      OrgID,
      Note,
      Status,
      DeliveryTime,
    } = event.Payload;
    const { ID, TS } = event;

    this.Id = ID;
    this.OrganizationId = OrgID;
    this.Status = Status;
    this.DeliveryAddress = plainToInstance(Address, DeliveryAddress);
    Items.forEach((i) => this.Items.push(plainToInstance(OrderItem, i)));
    this.CreatedBy = CreatedBy;
    this.Note = Note;
    this.CreatedDate = TS;
    this.DeliveryTime = trMoment(DeliveryTime);
    // Set state
    this.setState(new OrderCreatedState(this));
  }
  whenOrderCanceledV1(event: OrderCanceledV1Event) {
    const { Status } = event.Payload;
    this.Status = Status;
    // Set state
    this.setState(new OrderCanceledState(this));
  }
  whenOrderDeliveredV1(event: OrderDeliveredV1Event) {
    const { Status } = event.Payload;
    this.Status = Status;
    // Set state
    this.setState(new OrderDeliveredState(this));
  }
  cancel(canceledBy: string) {
    console.log("Order is canceling");
    this.State.cancel(canceledBy);
  }
  deliver(deliveredBy: string) {
    console.log("Order is delivering");
    this.State.deliver(deliveredBy);
  }
}

export { Order, OrderItem };
