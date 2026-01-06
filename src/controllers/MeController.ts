
import type { HttpResponse, ProtectedHttpRequest } from "../types/Http";
import { ok } from "../utils/http";

export class MeController {
  static async handle({ userId }: ProtectedHttpRequest): Promise<HttpResponse> {


    return ok({ userId });
  }
}