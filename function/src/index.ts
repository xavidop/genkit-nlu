import {configureGenkit, defineSchema} from "@genkit-ai/core";
import {onFlow, noAuth} from "@genkit-ai/firebase/functions";
import { readFileSync } from 'fs';

import * as z from "zod";
import {firebase} from "@genkit-ai/firebase";
import {github} from "genkitx-github";
import {dotprompt, promptRef} from "@genkit-ai/dotprompt";

configureGenkit({
  plugins: [firebase(), github({}), dotprompt()],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

export const nluFlow = onFlow(
  {
    name: "nluFlow",
    inputSchema: z.object({text: z.string()}),
    outputSchema: z.string(),
    authPolicy: noAuth(), // Not requiring authentication.
  },
  async (toDetect) => {
    const nluOutput = defineSchema(
      "nluOutput",
      z.object({
        intent: z.string(),
        entities: z.map(z.string(), z.string()),
      }),
    );

    const nluPrompt = promptRef("nlu");

    const intents = readFileSync('nlu/intents.yml','utf8');
    const entities = readFileSync('nlu/entities.yml','utf8');

    const result = await nluPrompt.generate<typeof nluOutput>({
      input: {
        intents: intents,
        entities: entities,
        user_input: toDetect.text,
      },
    });

    return result.output();
  },
);
