import middy from "@middy/core";
import {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResult,
} from "aws-lambda";
import createHttpError = require("http-errors");

const adminValidatorMiddleware = (): middy.MiddlewareObj<
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyResult
> => {
  const before: middy.MiddlewareFn<
    APIGatewayProxyEventV2WithJWTAuthorizer,
    APIGatewayProxyResult
  > = async (request): Promise<void> => {
    // Your middleware logic
    const isAdmin =
      request.event.requestContext.authorizer.jwt.claims["custom:isAdmin"];
    if (!isAdmin) {
      throw createHttpError.Unauthorized();
    }
    return Promise.resolve();
  };

  return {
    before,
  };
};

export default adminValidatorMiddleware;
