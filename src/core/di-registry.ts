import { container } from "tsyringe";
import { DynamoStore } from "../repositories/dynamo-store";
import { LambdaStore } from "../repositories/lambda-store";
import OrderRepository from "../repositories/order.repository";
import OrderService from "../services/order.service";
import OrganizationService from "../services/organization.service";
import { OrderToOrderMetadataRepositoryMapper } from "../mappers/order-to-order-metadata-repository.mapper";
import { OrderEventToOrderRepositoryDTOMapper } from "../mappers/order-event-to-order-repository.mapper";
import { OrderToOrderViewModelMapper } from "../mappers/order-to-order-viewmodel.mapper";
import { SNSStore } from "../repositories/sns-store";
import { SNSService } from "../services/sns.service";
import ListingService from "../services/listing.service";
import { OrderModelService } from "../models/services/order.model.service";

container.registerSingleton<DynamoStore>("DBStore", DynamoStore);
container.registerSingleton<LambdaStore>("LambdaStore", LambdaStore);
container.registerSingleton<SNSStore>("SNSStore", SNSStore);

container.register("OrderRepository", {
  useClass: OrderRepository,
});
container.register("OrderService", {
  useClass: OrderService,
});
container.register("OrganizationService", {
  useClass: OrganizationService,
});
container.register("ListingService", {
  useClass: ListingService,
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
container.register("SNSService", {
  useClass: SNSService,
});
container.register("OrderModelService", {
  useClass: OrderModelService,
});

export const diContainer = container;
