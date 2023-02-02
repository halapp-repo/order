import { OrderEventRepositoryDTO } from "../models/dtos/order.event.repository.dto";
import { OrderEvent } from "../models/events";
import { OrderCreatedV1Payload } from "../models/events/order-created-v1.event";
import { OrderEventType } from "@halapp/common";
import { trMoment } from "../utils/timezone";
import { IMapper } from "./base.mapper";
import { OrderCanceledV1Payload } from "../models/events/order-canceled-v1.event";
import { OrderDeliveredV1Payload } from "../models/events/order-delivered-v1.event";

export class OrderEventToOrderRepositoryDTOMapper extends IMapper<
  OrderEvent,
  OrderEventRepositoryDTO
> {
  toDTO(arg: OrderEvent): OrderEventRepositoryDTO {
    return {
      OrderID: arg.ID,
      TS: arg.TS.format(),
      EventType: arg.EventType,
      Payload: JSON.stringify(arg.Payload),
      Type: "Event",
    };
  }
  toModel(arg: OrderEventRepositoryDTO): OrderEvent {
    console.log(arg);
    const eventType =
      OrderEventType[arg.EventType as keyof typeof OrderEventType];
    const ts = trMoment(arg.TS);
    const payload = JSON.parse(arg.Payload);
    if (eventType === OrderEventType.OrderCreatedV1) {
      return {
        EventType: eventType,
        ID: arg.OrderID,
        Payload: payload as OrderCreatedV1Payload,
        TS: ts,
        Type: "Event",
      };
    } else if (eventType === OrderEventType.OrderCanceledV1) {
      return {
        EventType: eventType,
        ID: arg.OrderID,
        Payload: payload as OrderCanceledV1Payload,
        TS: ts,
        Type: "Event",
      };
    } else if (eventType === OrderEventType.OrderDeliveredV1) {
      return {
        EventType: eventType,
        ID: arg.OrderID,
        Payload: payload as OrderDeliveredV1Payload,
        TS: ts,
        Type: "Event",
      };
    } else {
      throw new Error("Unsupported type");
    }
  }
}
