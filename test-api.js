// Simple test script for the emoji generation API
import fetch from 'node-fetch';

async function testEmojiGeneration() {
  console.log('Testing emoji generation API...');
  
  try {
    const response = await fetch('http://localhost:3002/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'happy cat',
      }),
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.imageUrl) {
      console.log('Success! Image URL received:', data.imageUrl.substring(0, 100) + '...');
    } else {
      console.log('Error: No image URL in response');
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testEmojiGeneration();
