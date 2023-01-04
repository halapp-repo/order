import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import * as apiGatewayAuthorizers from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";
import * as apiGatewayIntegrations from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { HttpMethod } from "@aws-cdk/aws-apigatewayv2-alpha";
import { NodejsFunction, LogLevel } from "aws-cdk-lib/aws-lambda-nodejs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import getConfig from "../config";
import { BuildConfig } from "./build-config";

export class HalappOrderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    //*****************
    // BUILD CONFIG
    //******************
    const buildConfig = getConfig(scope as cdk.App);
    ///*************
    // Import Authorizer
    ///***************
    const authorizer = this.importAuthorizer(buildConfig);
    // ********************
    // Create API Gateway
    // ********************
    const orderApi = this.createOrderApiGateway(buildConfig);
    // **************
    // Create OrderDB
    // **************
    const orderDB = this.createOrderTable(buildConfig);
    // **************
    // Create Handlers
    // **************
    this.createPostOrderHandler(buildConfig, orderApi, authorizer, orderDB);
    this.createGetOrderHandler(buildConfig, orderApi, authorizer, orderDB);
  }
  createOrderApiGateway(buildConfig: BuildConfig): apiGateway.HttpApi {
    const orderApi = new apiGateway.HttpApi(this, "HalAppOrderApi", {
      description: "HalApp Order Api Gateway",
      corsPreflight: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        allowMethods: [
          apiGateway.CorsHttpMethod.GET,
          apiGateway.CorsHttpMethod.HEAD,
          apiGateway.CorsHttpMethod.OPTIONS,
          apiGateway.CorsHttpMethod.POST,
          apiGateway.CorsHttpMethod.PUT,
          apiGateway.CorsHttpMethod.DELETE,
          apiGateway.CorsHttpMethod.PATCH,
        ],
        allowOrigins:
          buildConfig.Environment === "PRODUCTION" ? ["halapp.io"] : ["*"],
      },
    });
    return orderApi;
  }
  importAuthorizer(
    buildConfig: BuildConfig
  ): apiGatewayAuthorizers.HttpUserPoolAuthorizer {
    const importedUserPool = cognito.UserPool.fromUserPoolId(
      this,
      "ImportedHalAppAuthUserPool",
      buildConfig.UserPoolID
    );
    const importedUserPoolClient = cognito.UserPoolClient.fromUserPoolClientId(
      this,
      "ImportedHalAppUserPoolClient",
      buildConfig.UserPoolClientID
    );

    const authorizer = new apiGatewayAuthorizers.HttpUserPoolAuthorizer(
      "Account-Authorizer",
      importedUserPool,
      {
        userPoolRegion: buildConfig.Region,
        userPoolClients: [importedUserPoolClient],
        identitySource: ["$request.header.Authorization"],
      }
    );
    return authorizer;
  }
  createOrderTable(buildConfig: BuildConfig): dynamodb.ITable {
    let orderTable;
    if (buildConfig.ShouldCreateDynamoOrderDB === false) {
      orderTable = dynamodb.Table.fromTableAttributes(this, "HalOrderDB", {
        tableName: buildConfig.OrderDBName,
        globalIndexes: ["OrgIndex"],
      });
    } else {
      orderTable = new dynamodb.Table(this, "HalOrderDB", {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        tableName: buildConfig.OrderDBName,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        partitionKey: {
          name: "OrderID",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "TS",
          type: dynamodb.AttributeType.STRING,
        },
        pointInTimeRecovery: true,
      });
      orderTable.addGlobalSecondaryIndex({
        indexName: "OrgIndex",
        partitionKey: {
          name: "OrgID",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "TS",
          type: dynamodb.AttributeType.STRING,
        },
        projectionType: dynamodb.ProjectionType.KEYS_ONLY,
      });
      orderTable.addGlobalSecondaryIndex({
        indexName: "StatusIndex",
        partitionKey: {
          name: "Status",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "OrgID",
          type: dynamodb.AttributeType.STRING,
        },
        projectionType: dynamodb.ProjectionType.ALL,
      });
      orderTable.addGlobalSecondaryIndex({
        indexName: "TypeIndex",
        partitionKey: {
          name: "Type",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "TS",
          type: dynamodb.AttributeType.STRING,
        },
        projectionType: dynamodb.ProjectionType.ALL,
      });
    }
    return orderTable;
  }
  createPostOrderHandler(
    buildConfig: BuildConfig,
    orderApi: apiGateway.HttpApi,
    authorizer: apiGatewayAuthorizers.HttpUserPoolAuthorizer,
    orderDB: cdk.aws_dynamodb.ITable
  ): cdk.aws_lambda_nodejs.NodejsFunction {
    const postOrderCreateHandler = new NodejsFunction(
      this,
      "OrderCreateHandler",
      {
        memorySize: 1024,
        runtime: lambda.Runtime.NODEJS_18_X,
        functionName: "OrderCreateHandler",
        handler: "handler",
        timeout: cdk.Duration.seconds(15),
        entry: path.join(__dirname, `/../src/handlers/orders/post/index.ts`),
        bundling: {
          target: "es2020",
          keepNames: true,
          logLevel: LogLevel.INFO,
          sourceMap: true,
          minify: true,
        },
        environment: {
          NODE_OPTIONS: "--enable-source-maps",
          Region: buildConfig.Region,
          OrderDB: buildConfig.OrderDBName,
          OrganizationsUserExistsHandler: "OrganizationsUserExists",
        },
      }
    );
    orderApi.addRoutes({
      methods: [HttpMethod.POST],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "postOrderCreateHandlerIntegration",
        postOrderCreateHandler
      ),
      path: "/orders",
      authorizer,
    });
    postOrderCreateHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
    orderDB.grantWriteData(postOrderCreateHandler);
    return postOrderCreateHandler;
  }
  createGetOrderHandler(
    buildConfig: BuildConfig,
    orderApi: apiGateway.HttpApi,
    authorizer: apiGatewayAuthorizers.HttpUserPoolAuthorizer,
    orderDB: cdk.aws_dynamodb.ITable
  ): cdk.aws_lambda_nodejs.NodejsFunction {
    const getOrderHandler = new NodejsFunction(this, "OrderFetchHandler", {
      memorySize: 1024,
      runtime: lambda.Runtime.NODEJS_18_X,
      functionName: "OrderFetchHandler",
      handler: "handler",
      timeout: cdk.Duration.seconds(15),
      entry: path.join(__dirname, `/../src/handlers/orders/get/index.ts`),
      bundling: {
        target: "es2020",
        keepNames: true,
        logLevel: LogLevel.INFO,
        sourceMap: true,
        minify: true,
      },
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        Region: buildConfig.Region,
        OrderDB: buildConfig.OrderDBName,
        OrganizationsUserExistsHandler: "OrganizationsUserExists",
      },
    });
    orderApi.addRoutes({
      methods: [HttpMethod.GET],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "getOrderHandlerIntegration",
        getOrderHandler
      ),
      path: "/orders",
      authorizer,
    });
    getOrderHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
    orderDB.grantReadData(getOrderHandler);
    return getOrderHandler;
  }
}
