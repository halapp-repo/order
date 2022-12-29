import { inject, injectable } from "tsyringe";
import OrderRepository from "../repositories/order.repository";

@injectable()
export default class OrderService {
  constructor(
    @inject("OrderRepository")
    private repo: OrderRepository
  ) {}

  create() {}
}
