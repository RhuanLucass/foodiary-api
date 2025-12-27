import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEvent } from "../utils/parseEvent";
import { parseResponse } from "../utils/parseResponse";
import { SignUpController } from "../controllers/SignUpController";


export async function handler(event: APIGatewayProxyEventV2) {
  const request = parseEvent(event)

  const response = await SignUpController.handle(request)

  return parseResponse(response)
}