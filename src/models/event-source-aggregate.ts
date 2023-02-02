import { OrderEvent } from "./events";

abstract class EventSourceAggregate {
  RetroEvents: OrderEvent[] = [];
  Changes: OrderEvent[] = [];
  abstract apply(event: OrderEvent): void;
}

export default EventSourceAggregate;
