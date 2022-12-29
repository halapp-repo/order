import { BaseSchema } from "yup";
import middy from "@middy/core";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import createHttpError = require("http-errors");

const schemaValidatorMiddleware = (schema: {
  body?: BaseSchema;
  queryStringParameters?: BaseSchema;
}): middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> => {
  const before: middy.MiddlewareFn<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  > = async (request): Promise<void> => {
    // Your middleware logic
    try {
      const { body, queryStringParameters } = request.event;

      if (schema.body) {
        schema.body.validateSync(body);
      }

      if (schema.queryStringParameters) {
        schema.queryStringParameters.validateSync(queryStringParameters ?? {});
      }

      return Promise.resolve();
    } catch (e) {
      let message: string;
      if (e instanceof Error) {
        message = e.message;
      } else {
        message = String(e);
      }
      throw new createHttpError.BadRequest(JSON.stringify({ error: message }));
    }
  };

  return {
    before,
  };
};

export default schemaValidatorMiddleware;
