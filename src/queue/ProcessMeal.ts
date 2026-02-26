import { eq } from "drizzle-orm";
import { db } from "../db";
import { mealsTable } from "../db/schema";
import { transcribeAudio } from "../services/ai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../clients/s3Client";

export class ProcessMeal {
  static async process({ fileKey }: { fileKey: string }) {
    const meal = await db.query.mealsTable.findFirst({
      where: eq(mealsTable.inputFileKey, fileKey),
    });

    if (!meal) {
      throw new Error("Meal not found.");
    }

    if (meal.status === "failed" || meal.status === "success") {
      return;
    }

    await db
      .update(mealsTable)
      .set({ status: "processing" })
      .where(eq(mealsTable.id, meal.id));

    try {
      if (meal.inputType === "audio") {
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: meal.inputFileKey!,
        });

        const { Body } = await s3Client.send(command);

        if (!Body || !(Body instanceof ReadableStream)) {
          throw new Error("Cannot load the audio file.");
        }

        const chunks = [];
        for await (const chunk of Body) {
          chunks.push(chunk);
        }

        const audioFileBuffer = Buffer.concat(chunks);

        const transcription = await transcribeAudio(audioFileBuffer);
        console.log({ transcription });
      }

      await db
        .update(mealsTable)
        .set({
          status: "success",
          name: "Café da manhã",
          icon: "🍞",
          foods: [
            {
              name: "Pão",
              quantity: "2 fatias",
              calories: 100,
              proteins: 4,
              carbohydrates: 20,
              fats: 1,
            },
          ],
        })
        .where(eq(mealsTable.id, meal.id));
    } catch (error) {
      await db
        .update(mealsTable)
        .set({ status: "failed" })
        .where(eq(mealsTable.id, meal.id));
    }
  }
}
