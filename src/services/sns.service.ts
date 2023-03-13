import { inject, injectable } from "tsyringe";
import { SNSStore } from "../repositories/sns-store";
import { PublishCommand } from "@aws-sdk/client-sns";
import createHttpError = require("http-errors");
import {
  OrderCanceledPayload,
  OrderCreatedPayload,
  OrderSQSMessageType,
  SQSMessage,
} from "@halapp/common";
import { Order } from "../models/order";
import { OrderToOrderViewModelMapper } from "../mappers/order-to-order-viewmodel.mapper";

@injectable()
export class SNSService {
  topicArn: string;
  constructor(
    @inject("SNSStore")
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
      } as OrderCreatedPayload,
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
      } as OrderCanceledPayload,
    };
    const command = new PublishCommand({
      Message: JSON.stringify(message),
      Subject: "OrderCanceled",
      TopicArn: this.topicArn,
    });
    const data = await this.snsStore.snsClient.send(command);
    console.log("Order Canceled Message sent", data);
  }
}
