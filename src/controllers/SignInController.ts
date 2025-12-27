
import z from "zod";
import type { HttpRequest, HttpResponse } from "../types/Http";
import { badRequest, ok } from "../utils/http";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export class SignInController {
  static async handle({ body }: HttpRequest): Promise<HttpResponse> {
    // Compara o body com a validação do schema
    // schema.parse retorna excessão e precisaria de try/catch
    // schema.safeParse retorna success ou error
    const { success, error, data } = schema.safeParse(body);

    if (!success) {
      // Retorna bad request com os erros de validação
      // error.issues contém os detalhes dos erros
      return badRequest({ errors: error.issues });
    }


    return ok({
      data,
    });
  }
}