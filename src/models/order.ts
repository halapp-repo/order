import { plainToInstance, Transform, Type } from "class-transformer";
import moment from "moment";
import { trMoment } from "../utils/timezone";
import { Address } from "./address";
import EventSourceAggregate from "./event-source-aggregate";
import { OrderEvent } from "./events";
import { OrderCreatedV1Event } from "./events/order-created-v1.event";
import { OrderEventType } from "./order-event-type.enum";
import { OrderStatus } from "./order-status";
import { v4 as uuidv4 } from "uuid";

class OrderItem {
  ProductId: string;
  Price: number;
  Count: number;
  Unit: string;
}

class Order extends EventSourceAggregate {
  Id: string;

  OrganizationId: string;

  Status: OrderStatus;

  @Type(() => Address)
  DeliveryAddress: Address = new Address();

  CreatedBy: string;

  @Type(() => String)
  @Transform(({ value }: { value: String }) => trMoment(value), {
    toClassOnly: true,
  })
  CreatedDate: moment.Moment;

  @Type(() => OrderItem)
  Items: OrderItem[] = [];

  Note?: string;

  apply(event: OrderEvent): void {
    if (event.EventType === OrderEventType.OrderCreatedV1) {
      this.whenOrderCreatedV1(event);
      return;
    }
  }

  causes(event: OrderEvent): void {
    this.Changes.push(event);
    this.apply(event);
  }

  static create({
    organizationId,
    deliveryAddress,
    createdBy,
    ts,
    note,
    items,
  }: {
    organizationId: string;
    deliveryAddress: Address;
    createdBy: string;
    ts: string;
    note?: string;
    items: OrderItem[];
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
        Status: OrderStatus.Created,
        Note: note,
      },
    };
    const order = new Order();
    order.causes(event);
    return order;
  }

  whenOrderCreatedV1(event: OrderCreatedV1Event) {
    const { CreatedBy, DeliveryAddress, Items, OrgID, Note, Status } =
      event.Payload;
    const { ID, TS } = event;

    this.Id = ID;
    this.OrganizationId = OrgID;
    this.Status = Status;
    this.DeliveryAddress = plainToInstance(Address, DeliveryAddress);
    Items.forEach((i) => this.Items.push(plainToInstance(OrderItem, i)));
    this.CreatedBy = CreatedBy;
    this.Note = Note;
    this.CreatedDate = TS;
  }
}

export { Order, OrderItem };
