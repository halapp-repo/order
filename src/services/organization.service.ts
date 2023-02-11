import { inject, injectable } from "tsyringe";
import { InvokeCommand } from "@aws-sdk/client-lambda";
import { LambdaStore } from "../repositories/lambda-store";
import { plainToInstance } from "class-transformer";
import { OrganizationVM } from "@halapp/common";

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
        FunctionName: process.env["GetOrganizationHandler"],
        Payload: Buffer.from(
          JSON.stringify({ OrganizationId: organizationId }),
          "utf-8"
        ),
      })
    );
    if (!Payload) {
      return false;
    }
    const result = JSON.parse(Buffer.from(Payload).toString());
    const organization = plainToInstance(
      OrganizationVM,
      JSON.parse(result.body)
    );

    console.log(
      "Organization has user",
      organization.JoinedUsers.includes(userId)
    );
    return organization.JoinedUsers.includes(userId);
  }
}
