export interface BuildConfig {
  readonly AccountID: string;
  readonly App: string;
  readonly Environment: string;
  readonly Region: string;

  readonly ShouldCreateDynamoOrderDB: boolean;
  readonly OrderDBName: string;

  readonly UserPoolID: string;
  readonly UserPoolClientID: string;

  readonly SNSOrderCreatedTopic: string;
}
