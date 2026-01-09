import type { APIGatewayProxyEventV2 } from "aws-lambda";

import { parseResponse } from "../utils/parseResponse";
import { parseProtectedEvent } from "../utils/parseProtectedEvent";
import { unauthorized } from "../utils/http";
import { ListMealsController } from "../controllers/ListMealsController";

export async function handler(event: APIGatewayProxyEventV2) {
  try {
    const request = parseProtectedEvent(event);

    const response = await ListMealsController.handle(request);

    return parseResponse(response);
  } catch {
    return parseResponse(
      unauthorized({ error: "Invalid access token." })
    )
  }
}