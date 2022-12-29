import { BuildConfig } from "../lib/build-config";
import { parse } from "yaml";
import { readFileSync } from "fs";
import { resolve } from "path";
import * as cdk from "aws-cdk-lib";

function ensureString(
  object: { [name: string]: any },
  propName: string
): string {
  if (!object[propName] || object[propName].trim().length == 0) {
    throw new Error(`${propName} does not exist or is empty`);
  }
  return object[propName];
}

function getConfig(app: cdk.App): BuildConfig {
  const env = app.node.tryGetContext("config");
  if (!env) {
    throw new Error(
      "Contect variable missing on CDK command. Pass in as `-c config=XXX`"
    );
  }
  const unparsedEnv = parse(
    readFileSync(resolve(__dirname, `../config/${env}.yaml`), "utf8")
  );
  const buildConfig: BuildConfig = {
    AWSAccountID: ensureString(unparsedEnv, "AWSAccountID"),
    App: ensureString(unparsedEnv, "App"),
    Environment: ensureString(unparsedEnv, "Environment"),
    Region: ensureString(unparsedEnv, "Region"),

    ShouldCreateDynamoOrderDB:
      ensureString(unparsedEnv, "ShouldCreateDynamoOrderDB") === "true",
    OrderDBName: ensureString(unparsedEnv, "OrderDBName"),

    UserPoolID: ensureString(unparsedEnv, "UserPoolID"),
    UserPoolClientID: ensureString(unparsedEnv, "UserPoolClientID"),
  };
  return buildConfig;
}

export default getConfig;
