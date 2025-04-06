const axios = require('axios');

// CORS headers om verzoeken van je GHL site toe te staan
const headers = {
  'Access-Control-Allow-Origin': '*', // In productie specificeer je je exacte domein
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Functie om Instagram access token te vernieuwen
async function refreshToken(accessToken) {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return accessToken; // Geef de oude token terug als er een fout is
  }
}

// De hoofdfunctie die de Instagram data ophaalt
module.exports = async (req, res) => {
  // Afhandelen van OPTIONS verzoeken (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }

  // Controle of er een query parameter is
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Haal de access token en user ID op uit de omgevingsvariabelen
  // Je moet deze instellen in je Vercel dashboard
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !userId) {
    return res.status(500).json({ 
      error: 'Missing configuration', 
      message: 'Access token or user ID is not configured'
    });
  }

  try {
    // Optioneel: vernieuw de token (niet nodig bij elk verzoek, maar handig om hier te hebben)
    // Als je dit weglaat, moet je de token handmatig vernieuwen (elke 60 dagen)
    // const newToken = await refreshToken(accessToken);
    
    // Haal de Instagram posts op
    const response = await axios.get(
      `https://graph.instagram.com/${userId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&limit=12&access_token=${accessToken}`
    );

    // Stuur de data terug met CORS headers
    res.statusCode = 200;
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    return res.json(response.data);
  } catch (error) {
    console.error('Error fetching Instagram data:', error.response?.data || error.message);
    
    // Stuur een foutmelding terug
    res.statusCode = 500;
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    return res.json({ 
      error: 'Error fetching data', 
      message: error.response?.data?.error?.message || error.message 
    });
  }
};
