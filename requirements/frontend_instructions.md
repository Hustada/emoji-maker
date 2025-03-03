# Project Overview
Use this guide to build a web app where users can give a text prompt to generate emoj using model hosted on Replicate

# Feature Requirements
- We will use Next.js, Shadcn UI, Lucid, Supabase, Clerk
- Create a form where users can put in prompt, and clicking on button that calls replicate model to generate emoji
- Have a nice UI an animation when the emoji is blank or generating
- Display all the images ever generated in grid
- When hover each emoji, an icon button for download, and an icon button for like should appear.

# File Structure

# Relevant Docs
## How use Replicate API
Set the REPLICATE_API_TOKEN environment variable

export REPLICATE_API_TOKEN=r8_WPy**********************************

Visibility

Copy

Install Replicate's Node.js client library

npm install replicate


Run fofr/sdxl-emoji using Replicate's API. Check out the model's schema for an overview of inputs and outputs.

import Replicate from "replicate";
const replicate = new Replicate();

const input = {
    prompt: "A TOK emoji of a man",
    apply_watermark: false
};

const output = await replicate.run("fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e", { input });

import { writeFile } from "node:fs/promises";
for (const [index, item] of Object.entries(output)) {
  await writeFile(`output_${index}.png`, item);
}
//=> output_0.png written to disk

## Replicate Schema
### Input
Input schema
Table
JSON
mask
uri
Input mask for inpaint mode. Black areas will be preserved, white areas will be inpainted.

seed
integer
Random seed. Leave blank to randomize the seed

image
uri
Input image for img2img or inpaint mode

width
integer
Width of output image

Default
1024
height
integer
Height of output image

Default
1024
prompt
string
Input prompt

Default
"An astronaut riding a rainbow unicorn"
refine
string
Which refine style to use

Default
"no_refiner"
scheduler
string
scheduler

Default
"K_EULER"
lora_scale
number
LoRA additive scale. Only applicable on trained models.

Default
0.6
Maximum
1
num_outputs
integer
Number of images to output.

Default
1
Minimum
1
Maximum
4
refine_steps
integer
For base_image_refiner, the number of steps to refine, defaults to num_inference_steps

guidance_scale
number
Scale for classifier-free guidance

Default
7.5
Minimum
1
Maximum
50
apply_watermark
boolean
Applies a watermark to enable determining if an image is generated in downstream applications. If you have other provisions for generating or deploying images safely, you can use this to disable watermarking.

Default
true
high_noise_frac
number
For expert_ensemble_refiner, the fraction of noise to use

Default
0.8
Maximum
1
negative_prompt
string
Input Negative Prompt

prompt_strength
number
Prompt strength when using img2img / inpaint. 1.0 corresponds to full destruction of information in image

Default
0.8
Maximum
1
num_inference_steps
integer
Number of denoising steps

Default
50
Minimum
1
Maximum
500
disable_safety_checker
boolean
Disable safety checker for generated images. This feature is only available through the API. See https://replicate.com/docs/how-does-replicate-work#safety

### Output
Type
uri[]


# Current File Structure
EMOJI-GENERATOR
├── .next/
├── app/
│ ├── favicon.ico
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
├── components/
│ └── ui/
│ ├── button.tsx
│ ├── card.tsx
│ └── input.tsx
├── lib/
│ └── utils.ts
├── public/
│ ├── file.svg
│ ├── globe.svg
│ ├── next.svg
│ ├── vercel.svg
│ └── window.svg
├── requirements/
│ ├── .env
│ ├── frontend_instructions.md
│ └── .gitignore
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
└── tsconfig.json

# Rules
- All new components should go in /components and be named like example-component.tsx unless otherwise specified
- All new pages go in /app
