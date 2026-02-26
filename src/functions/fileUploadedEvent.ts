import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { S3Event } from "aws-lambda";
import { sqsClient } from "../clients/sqsClient";

export async function handler(event: S3Event) {
  await Promise.all(
    event.Records.map(async (record) => {
      const fileKey = record.s3.object.key;

      const command = new SendMessageCommand({
        QueueUrl: process.env.MEALS_QUEUE_URL,
        MessageBody: JSON.stringify({ fileKey }),
      });

      await sqsClient.send(command);
    }),
  );
}
