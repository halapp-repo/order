import { inject, injectable } from "tsyringe";
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { LambdaStore } from "../repositories/lambda-store";

@injectable()
export default class OrganizationService {
  constructor(
    @inject("LambdaStore")
    private lambdaStore: LambdaStore
  ) {}
  async hasUser(organizationId: string, userId: string): Promise<boolean> {
    const { Payload } = await this.lambdaStore.lambdaClient.send(
      new InvokeCommand({
        InvocationType: "RequestResponse",
        FunctionName: process.env["OrganizationsUserExistsHandler"],
        Payload: Buffer.from(
          JSON.stringify({ OrganizationId: organizationId, UserId: userId }),
          "utf-8"
        ),
      })
    );
    if (!Payload) {
      return false;
    }
    const result = JSON.parse(Buffer.from(Payload).toString());
    console.log(result);

    console.log("Organization has user", result.body);
    return result.body === "true";
  }
}
