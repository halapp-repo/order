import { inject, injectable } from "tsyringe";
import {
  BatchGetCommand,
  BatchWriteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { DynamoStore } from "./dynamo-store";
import createHttpError = require("http-errors");
import { Order } from "../models/order";
import { OrderEventToOrderRepositoryDTOMapper } from "../mappers/order-event-to-order-repository.mapper";
import { OrderToOrderMetadataRepositoryMapper } from "../mappers/order-to-order-metadata-repository.mapper";
import { OrderEventRepositoryDTO } from "../models/dtos/order.event.repository.dto";
import { getComparator } from "../utils/sort";
import moment = require("moment");
import { OrderStatusType } from "@halapp/common";

@injectable()
export default class OrderRepository {
  private tableName: string;

  constructor(
    @inject("DBStore")
    private store: DynamoStore,
    @inject("OrderEventToOrderRepositoryDTOMapper")
    private eventDTOMapper: OrderEventToOrderRepositoryDTOMapper,
    @inject("OrderEventToOrderMetadataRepositoryMapper")
    private eventMetadataDTOMapper: OrderToOrderMetadataRepositoryMapper
  ) {
    const { OrderDB } = process.env;
    if (!OrderDB) {
      throw new createHttpError.InternalServerError(
        "OrderDB must come from env"
      );
    }
    this.tableName = OrderDB;
  }
  async save(order: Order) {
    const entries = [];
    for (const event of order.Changes) {
      entries.push(this.eventDTOMapper.toDTO(event));
    }
    entries.push(this.eventMetadataDTOMapper.toDTO(order));
    console.log("Entries are : ", JSON.stringify(entries));
    const command = new BatchWriteCommand({
      RequestItems: {
        [this.tableName]: entries.map((entry) =>
          Object.assign({ PutRequest: { Item: entry } })
        ),
      },
    });
    await this.store.dynamoClient.send(command);
  }
  async get(id: string): Promise<Order | null> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "#OrderID = :OrderID",
      ExpressionAttributeNames: {
        "#OrderID": "OrderID",
      },
      ExpressionAttributeValues: {
        ":OrderID": id,
      },
    });
    const { Items } = await this.store.dynamoClient.send(command);
    if (!Items) {
      return null;
    }
    const listOfEvents = this.eventDTOMapper.toListModel(
      Items.map((i) => {
        return <OrderEventRepositoryDTO>{
          EventType: i["EventType"],
          OrderID: i["OrderID"],
          Payload: i["Payload"],
          Type: i["Type"],
          TS: i["TS"],
        };
      })
    );
    const sortedEvents = listOfEvents.sort(getComparator("asc", "TS"));
    const order = new Order();
    for (const event of sortedEvents) {
      order.apply(event);
    }
    return order;
  }
  async getIdsByOrgId(
    orgId: string,
    fromDate: moment.Moment,
    toDate: moment.Moment
  ): Promise<string[] | undefined> {
    console.log("Fetching OrderIds By OrgId");
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: "OrgIndex",
      KeyConditionExpression: "#OrgID = :OrgID and #TS BETWEEN :From AND :To",
      ExpressionAttributeNames: {
        "#OrgID": "OrgID",
        "#TS": "TS",
      },
      ExpressionAttributeValues: {
        ":OrgID": orgId,
        ":From": fromDate.format(),
        ":To": toDate.format(),
      },
    });
    const { Items } = await this.store.dynamoClient.send(command);
    return Items?.map((i) => {
      const orderMetadata = i["OrderID"];
      const [, orderId] = orderMetadata.split("#");
      return orderId;
    });
  }

  async getIdsByStatus(
    status: OrderStatusType,
    orgId?: string
  ): Promise<string[] | undefined> {
    console.log("Fetching OrderIds By Status");
    let command;
    if (orgId) {
      command = new QueryCommand({
        TableName: this.tableName,
        IndexName: "StatusIndex",
        KeyConditionExpression: "#Status = :Status and #OrgID = :OrgID",
        ExpressionAttributeNames: {
          "#Status": "Status",
          "#OrgID": "OrgID",
        },
        ExpressionAttributeValues: {
          ":Status": status,
          ":OrgID": orgId,
        },
      });
    } else {
      command = new QueryCommand({
        TableName: this.tableName,
        IndexName: "StatusIndex",
        KeyConditionExpression: "#Status = :Status",
        ExpressionAttributeNames: {
          "#Status": "Status",
        },
        ExpressionAttributeValues: {
          ":Status": status,
        },
      });
    }
    const { Items } = await this.store.dynamoClient.send(command);
    return Items?.map((i) => {
      const orderMetadata = i["OrderID"];
      const [, orderId] = orderMetadata.split("#");
      return orderId;
    });
  }

  async getIdsByDate(
    fromDate: moment.Moment,
    toDate: moment.Moment
  ): Promise<string[] | undefined> {
    console.log("Fetching OrderIds By Date");
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: "TypeIndex",
      KeyConditionExpression: "#Type = :Type and #TS BETWEEN :From AND :To",
      ExpressionAttributeNames: {
        "#Type": "Type",
        "#TS": "TS",
      },
      ExpressionAttributeValues: {
        ":Type": "Metadata",
        ":From": fromDate.format(),
        ":To": toDate.format(),
      },
    });
    const { Items } = await this.store.dynamoClient.send(command);
    return Items?.map((i) => {
      const orderMetadata = i["OrderID"];
      const [, orderId] = orderMetadata.split("#");
      return orderId;
    });
  }
}
