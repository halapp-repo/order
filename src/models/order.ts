import * as moment from "moment";
import { Address } from "./address";

class OrderItem {
  ProductId: string;
  Price: number;
  Count: number;
  Unit: string;
}

class Order {
  OrganizationId: string;
  DeliveryAddress: Address;
  CreatedBy: string;
  TS: moment.Moment;
  Items: OrderItem[];
}

export { Order, OrderItem };
