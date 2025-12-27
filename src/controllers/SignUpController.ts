import z from "zod";
import { HttpRequest, HttpResponse } from "../types/Http";
import { badRequest, created } from "../utils/http";

const schema = z.object({
  goal: z.enum(['lose', 'maintain', 'gain']),
  gender: z.enum(['male', 'female']),
  birthDate: z.iso.date(),
  height: z.number(),
  weight: z.number(),
  activityLevel: z.number().min(1).max(5),
  account: z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(8),

  })
})

export class SignUpController {
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


    return created({
      data,
    });
  }
}