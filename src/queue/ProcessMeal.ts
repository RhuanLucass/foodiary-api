import { eq } from "drizzle-orm";
import { db } from "../db";
import { mealsTable } from "../db/schema";
import { getMealDetailsFromText, transcribeAudio } from "../services/ai";
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
      let icon = "";
      let name = "";
      let foods = [];

      if (meal.inputType === "audio") {
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: meal.inputFileKey!,
        });

        const { Body } = await s3Client.send(command);

        if (!Body) {
          throw new Error("Cannot load the audio file.");
        }

        const chunks: Buffer[] = [];
        for await (const chunk of Body as AsyncIterable<Buffer>) {
          chunks.push(Buffer.from(chunk));
        }

        const audioFileBuffer = Buffer.concat(chunks);

        const transcription = await transcribeAudio(audioFileBuffer);

        const mealDetails = await getMealDetailsFromText({
          createdAt: new Date(),
          text: transcription,
        });

        icon = mealDetails.icon;
        name = mealDetails.name;
        foods = mealDetails.foods;
      }

      await db.update(mealsTable).set({
        status: "success",
        name,
        icon,
        foods,
      });
    } catch (error) {
      console.log(error);
      await db
        .update(mealsTable)
        .set({ status: "failed" })
        .where(eq(mealsTable.id, meal.id));
    }
  }
}
