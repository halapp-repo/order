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
import httpJsonBodyParser from "@middy/http-json-body-parser";
import schemaValidatorMiddleware from "../../../../../middlewares/schema-validator.middleware";
import { inputSchema, UpdateOrderItemsDTO } from "./input.schema";

interface Event<TBody>
  extends Omit<APIGatewayProxyEventV2WithJWTAuthorizer, "body"> {
  body: TBody;
}

const lambdaHandler = async function (
  event: Event<UpdateOrderItemsDTO>,
  context: Context
): Promise<APIGatewayProxyResult> {
  // Print event
  console.log(JSON.stringify(event, null, 2));
  console.log(JSON.stringify(context, null, 2));
  // Resolve  dependencies
  const orderService = diContainer.resolve(OrderService);
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

  // Get order
  const order = await orderService.getById(orderId);
  // Authorize Step 2
  if (!isAdmin) {
    throw createHttpError.Unauthorized();
  }
  await orderService.updateItems(order, event.body.Items, currentUserId);

  return {
    statusCode: 200,
    body: JSON.stringify(viewModelMapper.toDTO(order, true)),
    headers: {
      "Content-Type": "application/json",
    },
  };
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
