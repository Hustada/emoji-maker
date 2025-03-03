// Simple test script for the Replicate API directly
import Replicate from 'replicate';

async function testReplicate() {
  console.log('Testing Replicate API directly...');
  
  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('Using API token:', process.env.REPLICATE_API_TOKEN);
    
    console.log('Calling Replicate API...');
    const output = await replicate.run(
      "fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e",
      {
        input: {
          prompt: "A TOK emoji of happy cat",
          apply_watermark: false,
          num_outputs: 1
        }
      }
    );
    
    console.log('Replicate output type:', typeof output);
    console.log('Is array?', Array.isArray(output));
    if (Array.isArray(output)) {
      console.log('Array length:', output.length);
      if (output.length > 0) {
        console.log('First item type:', typeof output[0]);
        console.log('First item:', output[0]);
      }
    } else {
      console.log('Output:', output);
    }
  } catch (error) {
    console.error('Error testing Replicate API:', error);
  }
}

testReplicate();
