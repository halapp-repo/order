import { OrderEventRepositoryDTO } from "../models/dtos/order.event.repository.dto";
import { OrderEvent } from "../models/events";
import { OrderEventType } from "@halapp/common";
import { trMoment } from "../utils/timezone";
import { IMapper } from "./base.mapper";

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
    return {
      EventType: eventType,
      ID: arg.OrderID,
      Payload: payload,
      TS: ts,
      Type: "Event",
    };
  }
}
