import { OrderEvent } from "./events";

abstract class EventSourceAggregate {
  Changes: OrderEvent[] = [];
  abstract apply(event: OrderEvent): void;
}

export default EventSourceAggregate;
