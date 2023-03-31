import "reflect-metadata";
import "source-map-support/register";
import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";
import httpResponseSerializer from "@middy/http-response-serializer";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import {
  Context,
  APIGatewayProxyResult,
  APIGatewayProxyEventV2WithJWTAuthorizer,
} from "aws-lambda";
import createHttpError = require("http-errors");
import { diContainer } from "../../../core/di-registry";
import OrderService from "../../../services/order.service";
import schemaValidatorMiddleware from "../../../middlewares/schema-validator.middleware";
import { inputSchema, CreateOrderDTO } from "./input.schema";
import { OrderItem } from "../../../models/order";
import { OrderToOrderViewModelMapper } from "../../../mappers/order-to-order-viewmodel.mapper";
import OrganizationService from "../../../services/organization.service";
import { plainToInstance } from "class-transformer";

interface Event<TBody>
  extends Omit<APIGatewayProxyEventV2WithJWTAuthorizer, "body"> {
  body: TBody;
}

const lambdaHandler = async function (
  event: Event<CreateOrderDTO>,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log(JSON.stringify(event, null, 2));
  console.log(JSON.stringify(context, null, 2));
  // Resolve dependecies
  const orderService = diContainer.resolve(OrderService);
  const organizationService = diContainer.resolve(OrganizationService);
  const viewModelMapper = diContainer.resolve(OrderToOrderViewModelMapper);
  // Get request paramaters
  const currentUserId = event.requestContext.authorizer.jwt.claims[
    "sub"
  ] as string;

  if (!currentUserId) {
    throw createHttpError.Unauthorized();
  }
  const organization = await organizationService.getOrganization(
    event.body.OrganizationId
  );
  if (!organization) {
    throw createHttpError.BadRequest();
  }
  const hasOrganizationUser = organizationService.hasUser(
    organization,
    currentUserId
  );
  if (!hasOrganizationUser) {
    throw createHttpError.Unauthorized();
  }

  const order = await orderService.create({
    city: event.body.City,
    paymentMethodType: event.body.PaymentMethodType,
    createdBy: currentUserId,
    deliveryAddress: event.body.DeliveryAddress,
    items: event.body.Items.map((i) =>
      plainToInstance(OrderItem, {
        Count: i.Count,
        Price: i.Price,
        ProductId: i.ProductId,
        Unit: i.Unit,
      } as OrderItem)
    ),
    note: event.body.Note,
    organization: organization,
    ts: event.body.TS,
    deliveryTime: event.body.DeliveryTime,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(viewModelMapper.toDTO(order)),
    headers: {
      "Content-Type": "application/json",
    },
  };
};

const handler = middy(lambdaHandler)
  .use(httpJsonBodyParser())
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
