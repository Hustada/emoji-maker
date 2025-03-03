// Script to download placeholder emoji images from Microsoft Fluent Emoji set
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Placeholder emoji URLs from emoji-generator.tsx
const placeholderEmojis = [
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Grinning%20face/3D/grinning_face_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Smiling%20face%20with%20hearts/3D/smiling_face_with_hearts_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Star-struck/3D/star-struck_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Nerd%20face/3D/nerd_face_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Partying%20face/3D/partying_face_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Winking%20face/3D/winking_face_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Money-mouth%20face/3D/money-mouth_face_3d.png',
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sunglasses/3D/sunglasses_3d.png'
];

// Download an image from a URL and save it to the public folder
async function downloadImage(url, filename) {
  try {
    console.log(`Downloading image from ${url} to ${filename}...`);
    
    // Download the image
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    const imageData = await response.buffer();
    
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

// Main function to download placeholder emojis
async function downloadPlaceholders() {
  // Download the first emoji as placeholder-emoji.png
  await downloadImage(placeholderEmojis[0], 'placeholder-emoji.png');
  
  // Download the rest with numbered filenames
  for (let i = 1; i < placeholderEmojis.length; i++) {
    await downloadImage(placeholderEmojis[i], `placeholder-emoji-${i}.png`);
  }
  
  console.log('Placeholder emoji download complete!');
}

// Run the main function
downloadPlaceholders().catch(console.error);
