# NLU Flow Project

This project implements a Natural Language Understanding (NLU) flow using Firebase Genkit AI and Firebase Functions. The NLU flow detects intents and extracts entities from a given text input.

this project uses GitHub Models using the Genkit GitHub models plugin.

<!-- TOC -->

- [NLU Flow Project](#nlu-flow-project)
  - [Project Structure](#project-structure)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Development](#development)
    - [Linting](#linting)
    - [Building](#building)
    - [Serving](#serving)
    - [Deploying](#deploying)
    - [Development Workflow](#development-workflow)
  - [Code Explanation](#code-explanation)
  - [Prompt Definition](#prompt-definition)
  - [Usage](#usage)
    - [Intents](#intents)
    - [Entities](#entities)
    - [Example](#example)
  - [License](#license)
  - [Contributing](#contributing)
  - [Contact](#contact)

<!-- /TOC -->


## Project Structure

```
.firebaserc
.gitignore
firebase.json
function/
  .eslintrc.js
  .gitignore
  nlu/
    entities.yml
    intents.yml
  package.json
  prompts/
    nlu.prompt
  src/
    index.ts
  tsconfig.dev.json
  tsconfig.json
```

## Prerequisites

- Node.js v20
- Firebase CLI
- Genkit CLI
- TypeScript
- Github Account

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/xavidop/genkit-nlu.git
    cd genkit-nlu
    ```

## Configuration

1. Ensure you have the necessary Firebase configuration files (`firebase.json`, `.firebaserc`).

2. Update the `nlu/intents.yml` and `nlu/entities.yml` files with your intents and entities.

## Development

### Linting

Run ESLint to check for code quality issues:
```sh
npm run lint
```

### Building

Compile the TsypeScript code:
```sh
npm run build
```

### Serving

Serve the functions locally:
```sh
npm run serve
```

### Deploying

Deploy the functions to Firebase:
```sh
npm run deploy
```

### Development Workflow
Run in the root directory:
```sh
npm run genkit:start
```

## Code Explanation
* Configuration: The `genkit` function is called to set up the Genkit environment with plugins for Firebase, GitHub, and Dotprompt. It also sets the log level to "debug".

```typescript
const ai = genkit({
  plugins: [github()],
  promptDir: 'prompts',
  model: openAIGpt4o
});
logger.setLogLevel('debug');
```

* Flow Definition: The nluFlow is defined using the onFlow function.
   * Configuration: The flow is named `nluFlow` and has input and output schemas defined using zod. The input schema expects an object with a text string, and the output schema is a string. The flow does not require authentication (noAuth).
   * nluFlow: The flow processes the input:
        * Schema Definition: Defines an `nluOutput` schema with intent and entities.
        * Prompt Reference: Gets a reference to the "nlu" dotprompt file.
        * File Reading: Reads `intents.yml` and `entities.yml` files.
        * Prompt Generation: Uses the `nluPrompt` to generate output based on the input text and the read intents and entities.
        * Return Output: Returns the generated output with type `nluOutput`.
```typescript
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

```

## Prompt Definition 

This `nlu.prompt` file defines a prompt for a Natural Language Understanding (NLU) model. Here's a breakdown of its components:

1. **Model Specification**:
   ```yaml
   model: github/gpt-4o
   ```
   This specifies the LLM model to be used, in this case, `github/gpt-4o`.

2. **Input Schema**:
   ```yaml
   input:
     schema:
       intents: string
       entities: string
       user_input: string
   ```
   This defines the input schema for the prompt. It expects three string inputs:
   - `intents`: A string representing the intents.
   - `entities`: A string representing the entities.
   - `user_input`: A string representing the user's input text.

3. **Output Specification**:
   ```yaml
   output:
     format: json
     schema: nluOutput
   ```
   This defines the output format and schema. The output will be in JSON format and should conform to the `nluOutput` schema.

4. **Prompt Text**:
   ```yaml
   ---
   You are a NLU that detects intents and extract entities from a given text.

   you have these intents and utterances:
   {{intents}}
   You also have these entities:
   {{entities}}

   The user says: {{user_input}}
   Please specify the intent detected and the entity detected
   ```
   This is the actual prompt text that will be used by the model. It provides context and instructions to the model:
   - It describes the role of the model as an NLU system.
   - It includes placeholders (`{{intents}}`, `{{entities}}`, `{{user_input}}`) that will be replaced with the actual input values.
   - It asks the model to specify the detected intent and entity based on the provided user input.

## Usage

The main NLU flow is defined in index.ts. It reads intents and entities from YAML files and uses a prompt defined in `nlu.prompt` to generate responses.

### Intents
The intents are defined in the `nlu/intents.yml` file. Each intent has a name and a list of training phrases.

As an example, the following intent is defined in the `nlu/intents.yml` file:
```yaml
order_shoes:
  utterances: 
    - I want a pair of shoes from {shoes_brand}
    - a shoes from {shoes_brand}
```
The format is as follows:
```yaml
intent-name:
  utterances:
    - training phrase 1
    - training phrase 2
    - ...
```

### Entities
The entities are defined in the `nlu/entities.yml` file. Each entity has a name and a list of synonyms.

As an example, the following entity is defined in the `nlu/entities.yml` file:
```yaml
shoes_brand:
  examples:
    - Puma
    - Nike
```
The format is as follows:
```yaml
entity-name:
  examples:
    - synonym 1
    - synonym 2
    - ...
```

### Example

To trigger the NLU flow, send a request with the following structure:
```json
{
  "text": "Your input text here"
}
```

The response will be a JSON object with the following structure:
```json
{
  "intent": "intent-name",
  "entities": {
    "entity-name": "entity-value"
  }
}
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Contact

For any questions or issues, please open an issue in the repository.