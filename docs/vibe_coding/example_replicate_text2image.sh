# Example of using Replicate to generate an image from a text prompt

## Text to Image


``` typescript
import { writeFile } from "fs/promises";
import Replicate from "replicate";
const replicate = new Replicate();

const input = {
    prompt: "black forest gateau cake spelling out the words \"FLUX SCHNELL\", tasty, food photography, dynamic shot"
};

const output = await replicate.run("black-forest-labs/flux-schnell", { input });
for (const [index, item] of Object.entries(output)) {
  await writeFile(`output_${index}.webp`, item);
}
//=> output_0.webp written to disk
```