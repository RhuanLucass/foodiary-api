import z from "zod";
import { HttpRequest, HttpResponse } from "../types/Http";
import { badRequest, conflict, created } from "../utils/http";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { usersTable } from "../db/schema";
import { id } from "zod/locales";

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
    password: z.string().min(8)
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

    // Verifica se o usuário já existe
    const userAlreadyExists = await db.query.usersTable.findFirst({
      columns: {
        email: true,
      },
      where: eq(usersTable.email, data.account.email)
    });

    // Se existir, retorna conflict
    if (userAlreadyExists) {
      return conflict({ error: 'This email is already in use.' });
    }

    // Cria o usuário no banco de dados
    const [user] = await db
      .insert(usersTable)
      .values({
        ...data,
        ...data.account,
        calories: 0,
        carbohydrates: 0,
        protein: 0,
        fats: 0,
      })
      .returning({
        id: usersTable.id,
      });

    return created({
      userId: user.id,
    });
  }
}