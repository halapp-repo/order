import "reflect-metadata";
import "source-map-support/register";
import middy from "@middy/core";
import { diContainer } from "../../../core/di-registry";
import { Context, APIGatewayProxyResult } from "aws-lambda";
import OrderService from "../../../services/order.service";

const lambdaHandler = async function (
  event: any,
  context: Context
): Promise<APIGatewayProxyResult> {
  // Print event
  console.log(JSON.stringify(event));
  const orderService = diContainer.resolve(OrderService);
  const orderId = event["OrderId"] as string;

  console.log("Calling data is : ", {
    OrderId: orderId,
  });

  const order = await orderService.getById(orderId);
  console.log("Result is :", order);

  return {
    statusCode: 200,
    body: JSON.stringify({ Order: order }),
    headers: {
      "Content-Type": "application/json",
    },
  };
};

const handler = middy(lambdaHandler);

export { handler, lambdaHandler };
