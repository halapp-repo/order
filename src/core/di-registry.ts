import { container } from "tsyringe";
import { DynamoStore } from "../repositories/dynamo-store";
import { LambdaStore } from "../repositories/lambda-store";
import OrderRepository from "../repositories/order.repository";
import OrderService from "../services/order.service";
import OrganizationService from "../services/organization.service";
import { OrderToOrderMetadataRepositoryMapper } from "../mappers/order-to-order-metadata-repository.mapper";
import { OrderEventToOrderRepositoryDTOMapper } from "../mappers/order-event-to-order-repository.mapper";
import { OrderToOrderViewModelMapper } from "../mappers/order-to-order-viewmodel.mapper";

container.registerSingleton<DynamoStore>("DBStore", DynamoStore);
container.registerSingleton<LambdaStore>("LambdaStore", LambdaStore);

container.register("OrderRepository", {
  useClass: OrderRepository,
});
container.register("OrderService", {
  useClass: OrderService,
});
container.register("OrganizationService", {
  useClass: OrganizationService,
});
container.register("OrderEventToOrderMetadataRepositoryMapper", {
  useClass: OrderToOrderMetadataRepositoryMapper,
});
container.register("OrderEventToOrderRepositoryDTOMapper", {
  useClass: OrderEventToOrderRepositoryDTOMapper,
});
container.register("OrderToOrderViewModelMapper", {
  useClass: OrderToOrderViewModelMapper,
});

export const diContainer = container;
