import {onFlow, noAuth} from "@genkit-ai/firebase/functions";
import { readFileSync } from 'fs';

import {github, openAIGpt4o} from "genkitx-github";
import { genkit, z } from "genkit";
import { logger } from 'genkit/logging';


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

export const nluFlow = onFlow(
  ai,
  {
    name: "nluFlow",
    inputSchema: z.object({text: z.string()}),
    outputSchema: z.string(),
    authPolicy: noAuth(), // Not requiring authentication.
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
