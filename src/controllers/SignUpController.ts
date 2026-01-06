import z from "zod";
import { HttpRequest, HttpResponse } from "../types/Http";
import { badRequest, conflict, created } from "../utils/http";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { usersTable } from "../db/schema";
import { id } from "zod/locales";
import { hash } from "bcryptjs";
import { signAccessTokenFor } from "../lib/jwt";
import { calculateGoals } from "../lib/calculateGoals";

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

    // Desestruturando data
    const { account, ...rest } = data;
    const goals = calculateGoals({
      activityLevel: rest.activityLevel,
      birthDate: new Date(rest.birthDate),
      gender: rest.gender,
      goal: rest.goal,
      height: rest.height,
      weight: rest.weight,
    })

    // Hash da senha
    const hashedPassword = await hash(data.account.password, 8);

    // Cria o usuário no banco de dados
    const [user] = await db
      .insert(usersTable)
      .values({
        ...rest,
        ...account,
        ...goals,
        password: hashedPassword,
      })
      .returning({
        id: usersTable.id,
      });

    // Gerar token
    const accessToken = signAccessTokenFor(user.id);

    return created({
      accessToken,
    });
  }
}