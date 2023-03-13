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
  async getOrganization(
    organizationId: string
  ): Promise<OrganizationVM | undefined> {
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
      return undefined;
    }
    const result = JSON.parse(Buffer.from(Payload).toString());
    const organization = plainToInstance(
      OrganizationVM,
      JSON.parse(result.body)
    );
    return organization;
  }
  hasUser(organization: OrganizationVM, userId: string): boolean {
    console.log(
      "Organization has user",
      organization.JoinedUsers.includes(userId)
    );
    return organization.JoinedUsers.includes(userId);
  }
}
