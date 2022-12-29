import { container } from "tsyringe";
import { DynamoStore } from "../repositories/dynamo-store";
import OrderRepository from "../repositories/order.repository";
import OrderService from "../services/order.service";

container.registerSingleton<DynamoStore>("DBStore", DynamoStore);
container.register("OrderRepository", {
  useClass: OrderRepository,
});
container.register("OrderService", {
  useClass: OrderService,
});

export const diContainer = container;
