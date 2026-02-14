
export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://hireloom1234.vercel.app/api/public/jobs/nexacore"
    );

    if (!response.ok) {
      console.error("Hireloom returned status:", response.status);
      return res.status(200).json([]);
    }

    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch (err) {
      console.error("Invalid JSON from Hireloom:", text);
      return res.status(200).json([]);
    }

  } catch (error) {
    console.error("Proxy fetch failed:", error);
    return res.status(200).json([]);
  }
}
