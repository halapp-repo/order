import { inject, injectable } from "tsyringe";
import { SNSStore } from "../repositories/sns-store";
import { PublishCommand } from "@aws-sdk/client-sns";
import createHttpError = require("http-errors");
import {
  OrderCanceledMessagePayload,
  OrderCreatedMessagePayload,
  OrderDeliveredMessagePayload,
  OrderItemsUpdatedMessagePayload,
  OrderSQSMessageType,
  SQSMessage,
} from "@halapp/common";
import { Order, OrderItem } from "../models/order";
import { OrderToOrderViewModelMapper } from "../mappers/order-to-order-viewmodel.mapper";
import { SNSSTORE } from "../models/constants";

@injectable()
export class SNSService {
  topicArn: string;
  constructor(
    @inject(SNSSTORE)
    private snsStore: SNSStore,
    @inject("OrderToOrderViewModelMapper")
    private viewModelMapper: OrderToOrderViewModelMapper
  ) {
    const { SNSTopicArn } = process.env;
    if (!SNSTopicArn) {
      throw new createHttpError.InternalServerError(
        "SNSTopicArn must come from env"
      );
    }
    this.topicArn = SNSTopicArn;
  }
  async publishOrderCreatedMessage({ order }: { order: Order }): Promise<void> {
    const message: SQSMessage<OrderSQSMessageType> = {
      Type: OrderSQSMessageType.OrderCreated,
      Payload: {
        Order: this.viewModelMapper.toDTO(order),
      } as OrderCreatedMessagePayload,
    };
    const command = new PublishCommand({
      Message: JSON.stringify(message),
      Subject: "OrderCreated",
      TopicArn: this.topicArn,
    });
    const data = await this.snsStore.snsClient.send(command);
    console.log("Order Created Message sent", data);
  }
  async publishOrderCanceledMessage({
    order,
  }: {
    order: Order;
  }): Promise<void> {
    const message: SQSMessage<OrderSQSMessageType> = {
      Type: OrderSQSMessageType.OrderCanceled,
      Payload: {
        Order: this.viewModelMapper.toDTO(order),
      } as OrderCanceledMessagePayload,
    };
    const command = new PublishCommand({
      Message: JSON.stringify(message),
      Subject: "OrderCanceled",
      TopicArn: this.topicArn,
    });
    const data = await this.snsStore.snsClient.send(command);
    console.log("Order Canceled Message sent", data);
  }
  async publishOrderItemsUpdatedMessage({
    order,
    deletedItems,
  }: {
    order: Order;
    deletedItems: OrderItem[];
  }): Promise<void> {
    const message: SQSMessage<OrderSQSMessageType> = {
      Type: OrderSQSMessageType.OrderItemsUpdated,
      Payload: {
        Order: this.viewModelMapper.toDTO(order),
        DeletedItems: deletedItems,
      } as OrderItemsUpdatedMessagePayload,
    };
    const command = new PublishCommand({
      Message: JSON.stringify(message),
      Subject: "OrderItemsUpdated",
      TopicArn: this.topicArn,
    });
    const data = await this.snsStore.snsClient.send(command);
    console.log("Order Items Updated Message sent", data);
  }
  async publishOrderDeliveredMessage({
    order,
  }: {
    order: Order;
  }): Promise<void> {
    const message: SQSMessage<OrderSQSMessageType> = {
      Type: OrderSQSMessageType.OrderDelivered,
      Payload: {
        Order: this.viewModelMapper.toDTO(order),
      } as OrderDeliveredMessagePayload,
    };
    const command = new PublishCommand({
      Message: JSON.stringify(message),
      Subject: "OrderDelivered",
      TopicArn: this.topicArn,
    });
    const data = await this.snsStore.snsClient.send(command);
    console.log("Order Delivered Message sent", data);
  }
}
