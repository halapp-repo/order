import "reflect-metadata";
import "source-map-support/register";
import middy from "@middy/core";
import { diContainer } from "../../../../core/di-registry";
import {
  Context,
  APIGatewayProxyResult,
  APIGatewayProxyEventV2WithJWTAuthorizer,
} from "aws-lambda";
import OrderService from "../../../../services/order.service";
import { OrderToOrderViewModelMapper } from "../../../../mappers/order-to-order-viewmodel.mapper";
import createHttpError from "http-errors";
import httpErrorHandler from "@middy/http-error-handler";
import httpResponseSerializer from "@middy/http-response-serializer";
import cors from "@middy/http-cors";
import OrganizationService from "../../../../services/organization.service";

const lambdaHandler = async function (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
  context: Context
): Promise<APIGatewayProxyResult> {
  // Print event
  console.log(JSON.stringify(event, null, 2));
  console.log(JSON.stringify(context, null, 2));
  // Resolve  dependencies
  const orderService = diContainer.resolve(OrderService);
  const organizationService = diContainer.resolve(OrganizationService);
  const viewModelMapper = diContainer.resolve(OrderToOrderViewModelMapper);
  // Get paramaters from request
  const orderId = event.pathParameters?.id;
  if (!orderId) {
    throw new createHttpError.BadRequest();
  }
  const currentUserId = event.requestContext.authorizer.jwt.claims[
    "sub"
  ] as string;
  const isAdmin = event.requestContext.authorizer.jwt.claims["custom:isAdmin"];
  // Authroize Step 1
  if (!currentUserId) {
    throw new createHttpError.Unauthorized();
  }
  // Get order
  const order = await orderService.getById(orderId);
  // Authorize Step 2
  const hasOrganizationUser = await organizationService.hasUser(
    order.OrganizationId,
    currentUserId
  );
  if (!isAdmin && !hasOrganizationUser) {
    throw createHttpError.Unauthorized();
  }

  return {
    statusCode: 200,
    body: JSON.stringify(viewModelMapper.toDTO(order, true)),
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
  );
export { handler, lambdaHandler };
