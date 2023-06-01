import { PaymentMethodType, PriceVM } from "@halapp/common";
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
  doesOrderHaveEnoughCredit(order: Order, availableCredit: number): boolean {
    if (order.PaymentMethodType === PaymentMethodType.card) {
      return true;
    }
    return availableCredit >= order.TotalPrice;
  }
}
