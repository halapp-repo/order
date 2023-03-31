import "reflect-metadata";
import { SQSEvent, SNSMessage } from "aws-lambda";
import { plainToInstance } from "class-transformer";
import {
  OrderCreatedMessagePayload,
  OrderSQSMessageType,
  OrderVM,
  SQSMessage,
} from "@halapp/common";
import { diContainer } from "../../../core/di-registry";
import PDFService from "../../../services/pdf.service";
import S3Service from "../../../services/s3.service";
import OrganizationService from "../../../services/organization.service";
import InventoryRepository from "../../../repositories/inventory.repository";

export async function handler(event: SQSEvent) {
  console.log(JSON.stringify(event, null, 2));
  const inventoryRepository = diContainer.resolve(InventoryRepository);
  const organizationService = diContainer.resolve(OrganizationService);
  const pdfService = diContainer.resolve(PDFService);
  const s3Service = diContainer.resolve(S3Service);

  // Inventories
  const inventories = await inventoryRepository.fetchAll();
  for (const record of event.Records) {
    const { body } = record;
    const rawMessage = JSON.parse(body) as SNSMessage;
    // Add Record to Signup DB
    console.log(rawMessage.Message);
    console.log(rawMessage.Subject);

    const message = JSON.parse(
      rawMessage.Message
    ) as SQSMessage<OrderSQSMessageType>;
    if (message.Type === OrderSQSMessageType.OrderCreated) {
      const { Order: orderPayload } =
        message.Payload as OrderCreatedMessagePayload;
      const order = plainToInstance(OrderVM, orderPayload);
      const organization = await organizationService.getOrganization(
        order.OrganizationId
      );
      const contract1 = await pdfService.generateDistantSaleContract(
        order,
        organization,
        inventories
      );
      await s3Service.uploadFile(contract1);
    }
  }
}
