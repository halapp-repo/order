import "reflect-metadata";
import "source-map-support/register";
import middy from "@middy/core";
import { diContainer } from "../../../../../core/di-registry";
import {
  Context,
  APIGatewayProxyResult,
  APIGatewayProxyEventV2WithJWTAuthorizer,
} from "aws-lambda";
import OrderService from "../../../../../services/order.service";
import { OrderToOrderViewModelMapper } from "../../../../../mappers/order-to-order-viewmodel.mapper";
import createHttpError from "http-errors";
import httpErrorHandler from "@middy/http-error-handler";
import httpResponseSerializer from "@middy/http-response-serializer";
import OrganizationService from "../../../../../services/organization.service";
import schemaValidatorMiddleware from "../../../../../middlewares/schema-validator.middleware";
import { inputSchema, UpdateOrderStatusDTO } from "./input.schema";
import { OrderStatusType } from "@halapp/common";
import httpJsonBodyParser from "@middy/http-json-body-parser";

interface Event<TBody>
  extends Omit<APIGatewayProxyEventV2WithJWTAuthorizer, "body"> {
  body: TBody;
}

const lambdaHandler = async function (
  event: Event<UpdateOrderStatusDTO>,
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
  const isAdmin = event.requestContext.authorizer.jwt.claims[
    "custom:isAdmin"
  ] as boolean;

  const status = event.body.Status;
  // Authroize Step 1
  if (!currentUserId) {
    throw new createHttpError.Unauthorized();
  }
  // Get order
  const order = await orderService.getById(orderId);
  // Authorize Step 2
  const organization = await organizationService.getOrganization(
    order.OrganizationId
  );
  if (!organization) {
    throw createHttpError.BadRequest();
  }
  const hasOrganizationUser = organizationService.hasUser(
    organization,
    currentUserId
  );
  if (!isAdmin && !hasOrganizationUser) {
    throw createHttpError.Unauthorized();
  }
  // Authroize Step 3
  authroizeByStatusType(status, isAdmin);
  // Update status
  const updatedOrder = await orderService.updateStatus(
    order,
    status,
    currentUserId
  );
  return {
    statusCode: 200,
    body: JSON.stringify(viewModelMapper.toDTO(updatedOrder, true)),
    headers: {
      "Content-Type": "application/json",
    },
  };
};

const authroizeByStatusType = (
  status: OrderStatusType,
  isAdmin: boolean
): void => {
  switch (status) {
    case OrderStatusType.Canceled:
      break;
    case OrderStatusType.Completed:
    case OrderStatusType.Paid:
    case OrderStatusType.Created:
      throw new createHttpError.Unauthorized();
    case OrderStatusType.PickedUp:
    case OrderStatusType.Delivered: {
      if (!isAdmin) {
        throw new createHttpError.Unauthorized();
      }
      break;
    }
  }
};

const handler = middy(lambdaHandler)
  .use(httpJsonBodyParser())
  .use(httpResponseSerializer())
  .use(
    httpErrorHandler({
      fallbackMessage: JSON.stringify({
        message: "Bilinmeyen hata olustu",
      }),
    })
  )
  .use(schemaValidatorMiddleware(inputSchema));
export { handler, lambdaHandler };
