
import z from "zod";
import type { HttpRequest, HttpResponse } from "../types/Http";
import { badRequest, ok, unauthorized } from "../utils/http";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { usersTable } from "../db/schema";
import { compare } from "bcryptjs";

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

    // Verifica se o usuário existe
    const user = await db.query.usersTable.findFirst({
      columns: {
        id: true,
        email: true,
        password: true,
      },
      where: eq(usersTable.email, data.email)
    });

    // Se não existir, retorna unauthorized
    if (!user) {
      return unauthorized({ error: 'Invalid credentials.' });
    }

    // Verifica se a senha está correta
    const isPasswordValid = await compare(data.password, user.password);

    // Se a senha estiver incorreta, retorna unauthorized
    if (!isPasswordValid) {
      return unauthorized({ error: 'Invalid credentials.' });
    }

    return ok({
      user,
    });
  }
}