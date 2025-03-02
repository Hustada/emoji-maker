import { NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    const output = await replicate.run(
      "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
      {
        input: {
          prompt: "A simple, cute emoji style illustration of " + prompt + ", flat colors, minimalist design, white background",
          negative_prompt: "realistic, detailed, 3D, shading, gradient, photograph, complex",
          num_outputs: 4,
          scheduler: "K_EULER",
          num_inference_steps: 25,
        }
      }
    )

    return NextResponse.json({ emojis: output })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to generate emoji' },
      { status: 500 }
    )
  }
} 