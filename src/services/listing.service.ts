import { inject, injectable } from "tsyringe";
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { LambdaStore } from "../repositories/lambda-store";
import { CityType, ProductType } from "@halapp/common";
import { PriceVM } from "@halapp/common";
import { LAMBDASTORE } from "../models/constants";

@injectable()
export default class ListingService {
  constructor(
    @inject(LAMBDASTORE)
    private lambdaStore: LambdaStore
  ) {}
  async getActivePrices(city: CityType, type: ProductType): Promise<PriceVM[]> {
    const { Payload } = await this.lambdaStore.lambdaClient.send(
      new InvokeCommand({
        InvocationType: "RequestResponse",
        FunctionName: process.env["ListingPriceHandler"],
        Payload: Buffer.from(
          JSON.stringify({ City: city, Type: type }),
          "utf-8"
        ),
      })
    );
    if (!Payload) {
      return [];
    }
    const result = JSON.parse(Buffer.from(Payload).toString());

    return JSON.parse(result.body);
  }
}
