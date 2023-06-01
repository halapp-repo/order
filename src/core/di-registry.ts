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
import { ExtraChargeService } from "@halapp/common";
import { S3Store } from "../repositories/s3-store";
import S3Service from "../services/s3.service";
import PDFService from "../services/pdf.service";
import InventoryRepository from "../repositories/inventory.repository";
import { DBSTORE, LAMBDASTORE, SNSSTORE } from "../models/constants";

container.registerSingleton<DynamoStore>(DBSTORE, DynamoStore);
container.registerSingleton<LambdaStore>(LAMBDASTORE, LambdaStore);
container.registerSingleton<SNSStore>(SNSSTORE, SNSStore);
container.registerSingleton<S3Store>("S3Store", S3Store);

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
container.register("ExtraChargeService", {
  useClass: ExtraChargeService,
});
container.register("S3Service", {
  useClass: S3Service,
});
container.register("PDFService", {
  useClass: PDFService,
});
container.register("InventoryRepository", {
  useClass: InventoryRepository,
});

export const diContainer = container;
