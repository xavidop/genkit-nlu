import { readFileSync } from 'fs';

import {github, openAIGpt4o} from "genkitx-github";
import { genkit, z } from "genkit";
import { logger } from 'genkit/logging';
import { onCallGenkit } from 'firebase-functions/https';


const ai = genkit({
  plugins: [github()],
  promptDir: 'prompts',
  model: openAIGpt4o
});
logger.setLogLevel('debug');


const nluOutput = ai.defineSchema(
  "nluOutput",
  z.object({
    intent: z.string(),
    entities: z.map(z.string(), z.string()),
  }),
);

export const nluFlow = ai.defineFlow(
  {
    name: "nluFlow",
    inputSchema: z.object({text: z.string()}),
    outputSchema: z.string(),
  },
  async (toDetect) => {


    const nluPrompt = ai.prompt<
                        z.ZodTypeAny, // Input schema
                        typeof nluOutput, // Output schema
                        z.ZodTypeAny // Custom options schema
                      >("nlu");

    const intents = readFileSync('nlu/intents.yml','utf8');
    const entities = readFileSync('nlu/entities.yml','utf8');

    const result = await nluPrompt({
        intents: intents,
        entities: entities,
        user_input: toDetect.text,
    });

    return JSON.stringify(result.output);
  },
);

export const nluFunction = onCallGenkit({
  authPolicy: () => true, // Allow all users to call this function. Not recommended for production.
}, nluFlow);
