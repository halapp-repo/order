import * as cdk from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3 from "aws-cdk-lib/aws-s3";
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
import { Effect, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class HalappOrderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    //*****************
    // BUILD CONFIG
    //******************
    const buildConfig = getConfig(scope as cdk.App);
    ///*************
    // S3 BUCKET
    ///*************
    const documentBucket = this.createDocumentBucket(buildConfig);
    // 👇 layer we've written
    const chromiumLayer = new lambda.LayerVersion(
      this,
      "chromiumLayerV111.0.0-layer",
      {
        compatibleRuntimes: [
          lambda.Runtime.NODEJS_18_X,
          lambda.Runtime.NODEJS_16_X,
        ],
        code: lambda.Code.fromAsset("./layers/chromium-v111.0.0-layer.zip"),
        description: "chromium v:111.0.0",
      }
    );
    ///*************
    // Import Authorizer
    ///***************
    const authorizer = this.importAuthorizer(buildConfig);
    // ********************
    // Create API Gateway
    // ********************
    const orderApi = this.createOrderApiGateway(buildConfig);
    // **************
    // Create DYNAMODB (OrderDB)
    // **************
    const orderDB = this.createOrderTable(buildConfig);
    // **************
    // CREATE SNS TOPIC
    // **************
    const orderTopic = this.createOrderCreatedSNSTopic(buildConfig);
    // **************
    // CREATE SNS TOPIC
    // **************
    const orderQueue = this.createOrderQueue(buildConfig, orderTopic);
    // **************
    // CREATE LAMBDA HANDLERS
    // **************
    this.createPostOrderHandler(
      buildConfig,
      orderApi,
      authorizer,
      orderDB,
      orderTopic
    );
    this.createGetOrdersByOrganizationIdHandler(
      buildConfig,
      orderApi,
      authorizer,
      orderDB
    );
    this.createGetOrderByIdHandler(buildConfig, orderApi, authorizer, orderDB);
    this.createUpdateOrderStatusHandler(
      buildConfig,
      orderApi,
      authorizer,
      orderDB,
      orderTopic
    );
    this.createUpdateOrderItemsHandler(
      buildConfig,
      orderApi,
      authorizer,
      orderDB,
      orderTopic
    );
    this.createGetOrdersHandler(buildConfig, orderApi, authorizer, orderDB);
    this.createOrderSQSHandler(
      buildConfig,
      orderQueue,
      documentBucket,
      chromiumLayer
    );
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
          buildConfig.Environment === "PRODUCTION"
            ? ["https://halapp.io", "https://www.halapp.io"]
            : ["*"],
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
  createOrderCreatedSNSTopic(buildConfig: BuildConfig): cdk.aws_sns.Topic {
    const orderCreatedTopic = new sns.Topic(this, "OrderSNSTopic", {
      displayName: buildConfig.SNSOrderTopic,
      topicName: buildConfig.SNSOrderTopic,
    });
    return orderCreatedTopic;
  }
  createPostOrderHandler(
    buildConfig: BuildConfig,
    orderApi: apiGateway.HttpApi,
    authorizer: apiGatewayAuthorizers.HttpUserPoolAuthorizer,
    orderDB: cdk.aws_dynamodb.ITable,
    orderCreatedTopic: cdk.aws_sns.Topic
  ): cdk.aws_lambda_nodejs.NodejsFunction {
    const postOrderCreateHandler = new NodejsFunction(
      this,
      "OrderCreateHandler",
      {
        memorySize: 1024,
        runtime: lambda.Runtime.NODEJS_18_X,
        functionName: "Order-CreateHandler",
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
          GetOrganizationHandler: "Account-GetOrganizationHandler",
          ListingPriceHandler: buildConfig.LAMBDAListingGETPriceHandler,
          SNSTopicArn: `arn:aws:sns:${buildConfig.Region}:${buildConfig.AccountID}:${buildConfig.SNSOrderTopic}`,
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
    orderCreatedTopic.grantPublish(postOrderCreateHandler);
    return postOrderCreateHandler;
  }
  createGetOrdersByOrganizationIdHandler(
    buildConfig: BuildConfig,
    orderApi: apiGateway.HttpApi,
    authorizer: apiGatewayAuthorizers.HttpUserPoolAuthorizer,
    orderDB: cdk.aws_dynamodb.ITable
  ): cdk.aws_lambda_nodejs.NodejsFunction {
    const getOrderHandler = new NodejsFunction(
      this,
      "OrderFetchByOrganizationIdHandler",
      {
        memorySize: 1024,
        runtime: lambda.Runtime.NODEJS_18_X,
        functionName: "Order-FetchListByOrganizationIdHandler",
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
          GetOrganizationHandler: "Account-GetOrganizationHandler",
          SNSTopicArn: `arn:aws:sns:${buildConfig.Region}:${buildConfig.AccountID}:${buildConfig.SNSOrderTopic}`,
        },
      }
    );
    orderApi.addRoutes({
      methods: [HttpMethod.GET],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "getOrdersByOrganizationIdHandlerIntegration",
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
  createGetOrderByIdHandler(
    buildConfig: BuildConfig,
    orderApi: apiGateway.HttpApi,
    authorizer: apiGatewayAuthorizers.HttpUserPoolAuthorizer,
    orderDB: cdk.aws_dynamodb.ITable
  ) {
    const getOrderByIdHandler = new NodejsFunction(
      this,
      "OrderFetchByIdHandler",
      {
        memorySize: 1024,
        runtime: lambda.Runtime.NODEJS_18_X,
        functionName: "Order-FetchByIdHandler",
        handler: "handler",
        timeout: cdk.Duration.seconds(10),
        entry: path.join(__dirname, `/../src/handlers/orders/get/id/index.ts`),
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
          GetOrganizationHandler: "Account-GetOrganizationHandler",
          SNSTopicArn: `arn:aws:sns:${buildConfig.Region}:${buildConfig.AccountID}:${buildConfig.SNSOrderTopic}`,
        },
      }
    );
    orderApi.addRoutes({
      methods: [HttpMethod.GET],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "getOrderByIdHandlerIntegration",
        getOrderByIdHandler
      ),
      path: "/orders/{id}",
      authorizer,
    });
    getOrderByIdHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
    orderDB.grantReadData(getOrderByIdHandler);
    return getOrderByIdHandler;
  }
  createUpdateOrderStatusHandler(
    buildConfig: BuildConfig,
    orderApi: apiGateway.HttpApi,
    authorizer: apiGatewayAuthorizers.HttpUserPoolAuthorizer,
    orderDB: cdk.aws_dynamodb.ITable,
    orderTopic: cdk.aws_sns.Topic
  ) {
    const updateOrderStatusHandler = new NodejsFunction(
      this,
      "OrderUpdateStatusHandler",
      {
        memorySize: 1024,
        runtime: lambda.Runtime.NODEJS_18_X,
        functionName: "Order-UpdateStatusHandler",
        handler: "handler",
        timeout: cdk.Duration.seconds(10),
        entry: path.join(
          __dirname,
          `/../src/handlers/orders/put/id/status/index.ts`
        ),
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
          GetOrganizationHandler: "Account-GetOrganizationHandler",
          SNSTopicArn: `arn:aws:sns:${buildConfig.Region}:${buildConfig.AccountID}:${buildConfig.SNSOrderTopic}`,
        },
      }
    );
    orderApi.addRoutes({
      methods: [HttpMethod.PUT],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "updateOrderStatusHandlerIntegration",
        updateOrderStatusHandler
      ),
      path: "/orders/{id}/status",
      authorizer,
    });
    updateOrderStatusHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
    orderDB.grantReadWriteData(updateOrderStatusHandler);
    orderTopic.grantPublish(updateOrderStatusHandler);
    return updateOrderStatusHandler;
  }
  createUpdateOrderItemsHandler(
    buildConfig: BuildConfig,
    orderApi: apiGateway.HttpApi,
    authorizer: apiGatewayAuthorizers.HttpUserPoolAuthorizer,
    orderDB: cdk.aws_dynamodb.ITable,
    orderTopic: cdk.aws_sns.Topic
  ) {
    const updateOrderItemsHandler = new NodejsFunction(
      this,
      "OrderUpdateItemsHandler",
      {
        memorySize: 1024,
        runtime: lambda.Runtime.NODEJS_18_X,
        functionName: "Order-UpdateItemsHandler",
        handler: "handler",
        timeout: cdk.Duration.seconds(10),
        entry: path.join(
          __dirname,
          `/../src/handlers/orders/put/id/items/index.ts`
        ),
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
          GetOrganizationHandler: "Account-GetOrganizationHandler",
          SNSTopicArn: `arn:aws:sns:${buildConfig.Region}:${buildConfig.AccountID}:${buildConfig.SNSOrderTopic}`,
        },
      }
    );
    orderApi.addRoutes({
      methods: [HttpMethod.PUT],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "updateOrderItemsHandlerIntegration",
        updateOrderItemsHandler
      ),
      path: "/orders/{id}/items",
      authorizer,
    });
    updateOrderItemsHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
    orderTopic.grantPublish(updateOrderItemsHandler);
    orderDB.grantReadWriteData(updateOrderItemsHandler);
    return updateOrderItemsHandler;
  }
  createGetOrdersHandler(
    buildConfig: BuildConfig,
    orderApi: apiGateway.HttpApi,
    authorizer: apiGatewayAuthorizers.HttpUserPoolAuthorizer,
    orderDB: cdk.aws_dynamodb.ITable
  ) {
    const getOrderHandler = new NodejsFunction(this, "OrderFetchAllHandler", {
      memorySize: 1024,
      runtime: lambda.Runtime.NODEJS_18_X,
      functionName: "Order-FetchAllHandler",
      handler: "handler",
      timeout: cdk.Duration.seconds(15),
      entry: path.join(__dirname, `/../src/handlers/admin/orders/get/index.ts`),
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
        GetOrganizationHandler: "Account-GetOrganizationHandler",
        SNSTopicArn: `arn:aws:sns:${buildConfig.Region}:${buildConfig.AccountID}:${buildConfig.SNSOrderTopic}`,
      },
    });
    orderApi.addRoutes({
      methods: [HttpMethod.GET],
      integration: new apiGatewayIntegrations.HttpLambdaIntegration(
        "getAllOrdersHandlerIntegration",
        getOrderHandler
      ),
      path: "/admin/orders",
      authorizer,
    });
    orderDB.grantReadData(getOrderHandler);
    return getOrderHandler;
  }
  createDocumentBucket(buildConfig: BuildConfig): cdk.aws_s3.Bucket {
    const documentBucket = new s3.Bucket(this, "HalDocument", {
      bucketName: `hal-document-${this.account}`,
      autoDeleteObjects: false,
      versioned: true,
      publicReadAccess: true,
      lifecycleRules: [
        {
          prefix: "/contracts",
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(60),
            },
          ],
          expiration: cdk.Duration.days(1095),
        },
      ],
    });
    return documentBucket;
  }
  createOrderQueue(
    buildConfig: BuildConfig,
    orderTopic: cdk.aws_sns.Topic
  ): cdk.aws_sqs.Queue {
    const orderCreatedDLQ = new sqs.Queue(this, "Order-OrderDLQ", {
      queueName: "Order-OrderDLQ",
      retentionPeriod: cdk.Duration.hours(10),
    });
    const orderQueue = new sqs.Queue(this, "Order-OrderQueue", {
      queueName: "Order-OrderQueue",
      visibilityTimeout: cdk.Duration.minutes(2),
      receiveMessageWaitTime: cdk.Duration.seconds(5),
      retentionPeriod: cdk.Duration.days(1),
      deadLetterQueue: {
        queue: orderCreatedDLQ,
        maxReceiveCount: 4,
      },
    });
    orderQueue.addToResourcePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal("sns.amazonaws.com")],
        actions: ["sqs:SendMessage"],
        resources: [orderQueue.queueArn],
        conditions: {
          StringEquals: {
            "aws:SourceAccount": this.account,
          },
          ArnLike: {
            "aws:SourceArn": `arn:aws:sns:*:*:${buildConfig.SNSOrderTopic}`,
          },
        },
      })
    );
    orderTopic.addSubscription(new subs.SqsSubscription(orderQueue));
    return orderQueue;
  }
  createOrderSQSHandler(
    buildConfig: BuildConfig,
    orderSQS: cdk.aws_sqs.Queue,
    documentBucket: cdk.aws_s3.Bucket,
    chromiumLayer: cdk.aws_lambda.LayerVersion
  ): cdk.aws_lambda_nodejs.NodejsFunction {
    const orderCreatedHandler = new NodejsFunction(
      this,
      "Order-SQSOrderHandler",
      {
        memorySize: 1024,
        timeout: cdk.Duration.minutes(1),
        functionName: "Order-SQSOrderHandler",
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "handler",
        entry: path.join(__dirname, `/../src/handlers/orders/sqs/index.ts`),
        bundling: {
          target: "es2020",
          keepNames: true,
          logLevel: LogLevel.INFO,
          sourceMap: true,
          minify: true,
          externalModules: [
            "aws-sdk", // Use the 'aws-sdk' available in the Lambda runtime
            "@sparticuz/chromium",
          ],
        },
        environment: {
          NODE_OPTIONS: "--enable-source-maps",
          Region: buildConfig.Region,
          S3BucketName: documentBucket.bucketName,
          GetOrganizationHandler:
            buildConfig.LAMBDAAccountGetOrganizationHandler,
          LAMBDAAccountGetOrganizationHandler:
            buildConfig.LAMBDAAccountGetOrganizationHandler,
          LAMBDAListingGetInventoriesHandler:
            buildConfig.LAMBDAListingGetInventoriesHandler,
        },
        layers: [chromiumLayer],
      }
    );
    orderCreatedHandler.addEventSource(
      new SqsEventSource(orderSQS, {
        batchSize: 1,
      })
    );
    orderCreatedHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: ["*"],
        effect: iam.Effect.ALLOW,
      })
    );
    documentBucket.grantWrite(orderCreatedHandler);
    return orderCreatedHandler;
  }
}
