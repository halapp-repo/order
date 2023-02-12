import "reflect-metadata";
import "source-map-support/register";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpResponseSerializer from "@middy/http-response-serializer";
import {
  Context,
  APIGatewayProxyResult,
  APIGatewayProxyEventV2WithJWTAuthorizer,
} from "aws-lambda";
import schemaValidatorMiddleware from "../../../middlewares/schema-validator.middleware";
import { ByOrgDTO, inputSchema } from "./input.schema";
import { diContainer } from "../../../core/di-registry";
import createHttpError from "http-errors";
import OrderService from "../../../services/order.service";
import OrganizationService from "../../../services/organization.service";
import { OrderToOrderViewModelMapper } from "../../../mappers/order-to-order-viewmodel.mapper";
import { trMoment } from "../../../utils/timezone";
import { OrderStatusType } from "@halapp/common";

interface Event<TBody>
  extends Omit<
    APIGatewayProxyEventV2WithJWTAuthorizer,
    "queryStringParameters"
  > {
  queryStringParameters: TBody;
}

const lambdaHandler = async function (
  event: Event<ByOrgDTO>,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log(JSON.stringify(event, null, 2));
  console.log(JSON.stringify(context, null, 2));

  // Resolve dependecies
  const orderService = diContainer.resolve(OrderService);
  const organizationService = diContainer.resolve(OrganizationService);
  const viewModelMapper = diContainer.resolve(OrderToOrderViewModelMapper);

  // Get request paramaters
  const organizationId = event.queryStringParameters.OrganizationId;
  const currentUserId = event.requestContext.authorizer.jwt.claims[
    "sub"
  ] as string;
  const isAdmin = event.requestContext.authorizer.jwt.claims["custom:isAdmin"];
  const fromDate = event.queryStringParameters.FromDate;
  const toDate = event.queryStringParameters.ToDate;
  const status: OrderStatusType | undefined =
    event.queryStringParameters.Status;

  console.log(JSON.stringify(event.queryStringParameters));
  console.log("Organization is ", organizationId);
  console.log("Status is ", status);

  if (!currentUserId) {
    throw createHttpError.Unauthorized();
  }
  const hasOrganizationUser = await organizationService.hasUser(
    organizationId,
    currentUserId
  );
  if (!isAdmin && !hasOrganizationUser) {
    throw createHttpError.Unauthorized();
  }

  const orders = await orderService.getByOrganizationId({
    orgId: organizationId,
    ...(fromDate ? { fromDate: trMoment(fromDate) } : null),
    ...(toDate ? { toDate: trMoment(toDate) } : null),
    ...(status ? { status: status } : null),
  });

  return {
    statusCode: 200,
    body: JSON.stringify(viewModelMapper.toListDTO(orders)),
    headers: {
      "Content-Type": "application/json",
    },
  };
};

const handler = middy(lambdaHandler)
  .use(httpResponseSerializer())
  .use(cors())
  .use(
    httpErrorHandler({
      fallbackMessage: JSON.stringify({
        message: "Bilinmeyen hata olustu",
      }),
    })
  )
  .use(schemaValidatorMiddleware(inputSchema));

export { handler, lambdaHandler };
