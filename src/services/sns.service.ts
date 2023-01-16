import { inject, injectable } from "tsyringe";
import { SNSStore } from "../repositories/sns-store";
import { PublishCommand } from "@aws-sdk/client-sns";
import createHttpError = require("http-errors");
import { OrderVM } from "@halapp/common";

@injectable()
export class SNSService {
  topicArn: string;
  constructor(
    @inject("SNSStore")
    private snsStore: SNSStore
  ) {
    const { SNSTopicArn } = process.env;
    if (!SNSTopicArn) {
      throw new createHttpError.InternalServerError(
        "SNSTopicArn must come from env"
      );
    }
    this.topicArn = SNSTopicArn;
  }
  async publishOrderCreatedMessage({
    orderVM,
  }: {
    orderVM: OrderVM;
  }): Promise<void> {
    const command = new PublishCommand({
      Message: JSON.stringify(orderVM),
      Subject: "OrderCreated",
      TopicArn: this.topicArn,
    });
    const data = await this.snsStore.snsClient.send(command);
    console.log("Message sent", data);
  }
}
