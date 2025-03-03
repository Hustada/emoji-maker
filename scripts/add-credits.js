// Script to add credits to a user
// Using import with dynamic import() since node-fetch is ESM

async function addCredits() {
  // Dynamically import node-fetch
  const { default: fetch } = await import('node-fetch');
  const credits = process.argv[2] ? parseInt(process.argv[2]) : 10;
  
  console.log(`Adding ${credits} credits...`);
  
  try {
    const response = await fetch('http://localhost:3001/api/admin/add-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credits }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data.message);
      console.log('Updated profile:', data.profile);
    } else {
      console.error('❌ Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Failed to add credits:', error.message);
  }
}

addCredits();
