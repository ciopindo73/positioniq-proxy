export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  try {
    const decoded = decodeURIComponent(url);
    const isQuoteSummary = decoded.includes('quoteSummary');
    
    let headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    };

    if (isQuoteSummary) {
      // Get crumb first
      const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
        headers: { 'User-Agent': headers['User-Agent'], 'Cookie': '' }
      });
      const crumb = await crumbRes.text();
      const cookie = crumbRes.headers.get('set-cookie') || '';
      if (crumb && crumb.length < 20) {
        const urlWithCrumb = decoded + (decoded.includes('?') ? '&' : '?') + 'crumb=' + encodeURIComponent(crumb);
        const response = await fetch(urlWithCrumb, { headers: { ...headers, 'Cookie': cookie } });
        const data = await response.json();
        return res.status(200).json(data);
      }
    }

    const response = await fetch(decoded, { headers });
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.status(200).json(await response.json());
    }
    return res.status(200).send(await response.text());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
