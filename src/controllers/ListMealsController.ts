import { HttpResponse, ProtectedHttpRequest } from "../types/Http";
import z from "zod";
import { db } from "../db";
import { mealsTable } from "../db/schema";
import { badRequest, created, ok } from "../utils/http";
import { and, eq, gte, lte } from "drizzle-orm";

const schema = z.object({
  date: z.iso.date().transform(dateStr => new Date(dateStr)),


})

export class ListMealsController {
  static async handle({ userId, queryParams }: ProtectedHttpRequest): Promise<HttpResponse> {
    const { success, error, data } = schema.safeParse(queryParams);

    if (!success) {
      return badRequest({ errors: error.issues })
    }

    const endDate = new Date(data.date);
    endDate.setUTCHours(23, 59, 59, 999);

    const meals = await db.query.mealsTable.findMany({
      columns: {
        id: true,
        foods: true,
        createdAt: true,
        icon: true,
        name: true,
      },
      where: and(
        eq(mealsTable.userId, userId),
        gte(mealsTable.createdAt, data.date), // >= start of the day
        lte(mealsTable.createdAt, endDate), // <= end of the day
        eq(mealsTable.status, 'success')
      )
    });

    return ok({ meals });
  }
}