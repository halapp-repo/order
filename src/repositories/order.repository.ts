import { inject, injectable } from "tsyringe";
import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoStore } from "./dynamo-store";
import createHttpError = require("http-errors");

@injectable()
export default class OrderRepository {
  private tableName: string;

  constructor(
    @inject("DBStore")
    private store: DynamoStore
  ) {
    const { OrderDB } = process.env;
    if (!OrderDB) {
      throw new createHttpError.InternalServerError(
        "OrderDB must come from env"
      );
    }
    this.tableName = OrderDB;
  }
}
