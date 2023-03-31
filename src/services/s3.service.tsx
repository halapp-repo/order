import { PutObjectCommand, PutObjectCommandOutput } from "@aws-sdk/client-s3";
import { inject, injectable } from "tsyringe";
import { S3Store } from "../repositories/s3-store";
import fs from "fs";

@injectable()
export default class S3Service {
  s3BucketName: string;
  constructor(
    @inject("S3Store")
    private repo: S3Store
  ) {
    const { S3BucketName } = process.env;
    if (!S3BucketName) {
      throw new Error("S3Bucket must come from env");
    }
    this.s3BucketName = S3BucketName;
  }

  async uploadFile({
    s3Key,
    fileBody,
  }: {
    s3Key: string;
    fileBody: Buffer;
  }): Promise<PutObjectCommandOutput> {
    const command = new PutObjectCommand({
      Bucket: this.s3BucketName,
      Key: s3Key,
      Body: fileBody,
      ContentType: "application/pdf",
    });
    return this.repo.s3Client.send(command);
  }
}
