import { Exclude, plainToInstance, Transform, Type } from "class-transformer";
import moment from "moment";
import { trMoment } from "../utils/timezone";
import { Address } from "./address";
import EventSourceAggregate from "./event-source-aggregate";
import { OrderEvent } from "./events";
import { OrderCreatedV1Event } from "./events/order-created-v1.event";
import { CityType, OrderEventType, PaymentMethodType } from "@halapp/common";
import { OrderStatusType } from "@halapp/common";
import { v4 as uuidv4 } from "uuid";
import { OrderState } from "./states/order.state";
import { OrderCreatedState } from "./states/order-created.state";
import { OrderCanceledV1Event } from "./events/order-canceled-v1.event";
import { OrderCanceledState } from "./states/order-canceled.state";
import { OrderDeliveredV1Event } from "./events/order-delivered-v1.event";
import { OrderDeliveredState } from "./states/order-delivered.state";
import { OrderPaidV1Event } from "./events/order-paid-v1.event";
import { OrderPaidState } from "./states/order-paid.state";
import { OrderItemsUpdatedV1Event } from "./events/order-updated-items-v1.event";
import { OrderPickedUpV1Event } from "./events/order-pickedup-v1.event";
import { OrderPickUpState } from "./states/order-pickedup.state";
import { OrderCompletedV1Event } from "./events/order-completed-v1.event";
import { OrderCompletedState } from "./states/order-completed.state";

class OrderItem {
  ProductId: string;
  Price: number;
  Count: number;
  Unit: string;

  get TotalPrice(): number {
    return this.Count * this.Price;
  }
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
  @Transform(({ value }: { value: string }) => trMoment(value), {
    toClassOnly: true,
  })
  CreatedDate: moment.Moment;

  @Type(() => String)
  @Transform(({ value }: { value: string }) => trMoment(value), {
    toClassOnly: true,
  })
  DeliveryTime: moment.Moment;

  @Type(() => OrderItem)
  Items: OrderItem[] = [];

  Note?: string;

  City: CityType;
  PaymentMethodType: PaymentMethodType;

  get TotalPrice(): number {
    let total = 0;
    for (const item of this.Items) {
      total += item.TotalPrice;
    }
    return total;
  }

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
    } else if (event.EventType === OrderEventType.OrderPaidV1) {
      this.whenOrderPaidV1(event);
      return;
    } else if (event.EventType === OrderEventType.OrderItemsUpdatedV1) {
      this.whenOrderItemsUpdatedV1(event);
      return;
    } else if (event.EventType === OrderEventType.OrderPickedUpV1) {
      this.whenOrderPickedUpV1(event);
      return;
    } else if (event.EventType === OrderEventType.OrderCompletedV1) {
      this.whenOrderCompletedV1(event);
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
    city,
    paymentMethodType,
    organizationId,
    deliveryAddress,
    createdBy,
    ts,
    note,
    items,
    deliveryTime,
  }: {
    city: CityType;
    paymentMethodType: PaymentMethodType;
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
        City: city,
        PaymentMethodType: paymentMethodType,
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
      City,
      PaymentMethodType,
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
    //[TO-DO] get fresh amount from DB
    Items.forEach((i) => this.Items.push(plainToInstance(OrderItem, i)));
    this.CreatedBy = CreatedBy;
    this.Note = Note;
    this.CreatedDate = TS;
    this.DeliveryTime = trMoment(DeliveryTime);
    this.City = City;
    this.PaymentMethodType = PaymentMethodType;
    // Set state
    this.setState(new OrderCreatedState(this));
  }
  whenOrderCanceledV1(event: OrderCanceledV1Event) {
    const { Status } = event.Payload;
    this.Status = Status;
    this.setState(new OrderCanceledState(this));
  }
  whenOrderDeliveredV1(event: OrderDeliveredV1Event) {
    const { Status } = event.Payload;
    this.Status = Status;
    this.setState(new OrderDeliveredState(this));
  }
  whenOrderPaidV1(event: OrderPaidV1Event) {
    const { Status } = event.Payload;
    this.Status = Status;
    this.setState(new OrderPaidState(this));
  }
  whenOrderPickedUpV1(event: OrderPickedUpV1Event) {
    const { Status } = event.Payload;
    this.Status = Status;
    this.setState(new OrderPickUpState(this));
  }
  whenOrderItemsUpdatedV1(event: OrderItemsUpdatedV1Event) {
    const { DeletedItems } = event.Payload;
    this.Items = this.Items.filter(
      (i) => !DeletedItems.map((di) => di.ProductId).includes(i.ProductId)
    );
  }
  whenOrderCompletedV1(event: OrderCompletedV1Event) {
    const { Status } = event.Payload;
    this.Status = Status;
    this.setState(new OrderCompletedState(this));
  }
  cancel(canceledBy: string) {
    console.log("Order is canceling");
    this.State.cancel(canceledBy);
  }
  pickUp(pickedUpBy: string) {
    console.log("Order is picking up");
    this.State.pickup(pickedUpBy);
  }
  deliver(deliveredBy: string) {
    console.log("Order is delivering");
    this.State.deliver(deliveredBy);
  }
  pay(paidBy: string) {
    console.log("Order is paying");
    this.State.pay(paidBy);
  }
  complete(completedBy: string) {
    console.log("Order is completing");
    this.State.complete(completedBy);
  }
  updateItems(currentItems: OrderItem[], updatedBy: string) {
    console.log("Order Items are being updating");
    // Only supports delete now
    const deletedItems = this.Items.filter(
      (x) => !currentItems.map((i) => i.ProductId).includes(x.ProductId)
    );
    this.State.updateItems(deletedItems, updatedBy);
    //[TO-DO] add insert item
    if (!currentItems || currentItems.length === 0) {
      this.cancel(updatedBy);
    }
  }
  isPaid(): boolean {
    return this.RetroEvents.some(
      (e) => e.EventType === OrderEventType.OrderPaidV1
    );
  }
  isDelivered(): boolean {
    return this.RetroEvents.some(
      (e) => e.EventType === OrderEventType.OrderDeliveredV1
    );
  }
}

export { Order, OrderItem };
