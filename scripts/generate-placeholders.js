// Script to generate placeholder emoji images
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// First, add credits to the user
async function addCredits() {
  try {
    const response = await fetch('http://localhost:3001/api/test/add-credits?credits=20');
    const data = await response.json();
    console.log('Added credits:', data);
    return data.success;
  } catch (error) {
    console.error('Error adding credits:', error);
    return false;
  }
}

// Generate an emoji with the given prompt
async function generateEmoji(prompt) {
  try {
    console.log(`Generating emoji for prompt: "${prompt}"...`);
    
    const response = await fetch('http://localhost:3001/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      throw new Error(`Server error (${response.status}): ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Generated emoji URL:', data.imageUrl.substring(0, 50) + '...');
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating emoji:', error);
    return null;
  }
}

// Download an image from a URL and save it to the public folder
async function downloadImage(url, filename) {
  try {
    console.log(`Downloading image to ${filename}...`);
    
    let imageData;
    
    if (url.startsWith('data:')) {
      // Handle data URL
      const base64Data = url.split(',')[1];
      imageData = Buffer.from(base64Data, 'base64');
    } else {
      // Handle regular URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }
      imageData = await response.buffer();
    }
    
    // Ensure the public directory exists
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write the image file
    const filePath = path.join(publicDir, filename);
    fs.writeFileSync(filePath, imageData);
    console.log(`Successfully saved image to ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    return false;
  }
}

// Main function to generate placeholder emojis
async function generatePlaceholders() {
  // Add credits first
  const creditsAdded = await addCredits();
  if (!creditsAdded) {
    console.error('Failed to add credits. Exiting.');
    return;
  }
  
  // Prompts for placeholder emojis
  const prompts = [
    'a smiling face',
    'a laughing face',
    'a surprised face',
    'a cool face with sunglasses',
    'a sad face'
  ];
  
  // Generate and download each emoji
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const imageUrl = await generateEmoji(prompt);
    
    if (imageUrl) {
      const filename = i === 0 ? 'placeholder-emoji.png' : `placeholder-emoji-${i}.png`;
      await downloadImage(imageUrl, filename);
    }
  }
  
  console.log('Placeholder emoji generation complete!');
}

// Run the main function
generatePlaceholders().catch(console.error);
