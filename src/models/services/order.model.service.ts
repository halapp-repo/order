import { PriceVM } from "@halapp/common";
import createHttpError from "http-errors";
import { Order } from "../order";

export class OrderModelService {
  doesOrderHaveValidPrices(order: Order, currentPrices: PriceVM[]): boolean {
    console.log(currentPrices);
    return order.Items.every((i) => {
      const price = currentPrices.find(
        (cp) => cp.ProductId === i.ProductId && cp.IsActive === true
      );
      if (!price) {
        return false;
      }
      return price.Price === i.Price && price.Unit === i.Unit;
    });
  }
}
