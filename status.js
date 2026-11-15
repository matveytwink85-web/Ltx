// Vercel serverless function: checks a task and returns the video URL when ready.
const BASE = "https://api.atlascloud.ai/api/v1/model";

module.exports = async (req, res) => {
  const key = process.env.ATLASCLOUD_API_KEY;
  const id = String((req.query && req.query.id) || "");
  if (!key) return res.status(500).json({ error: "ATLASCLOUD_API_KEY is not set" });
  if (!/^[\w-]+$/.test(id)) return res.status(400).json({ error: "Bad id" });
  try {
    const r = await fetch(`${BASE}/prediction/${id}`, { headers: { Authorization: `Bearer ${key}` } });
    const j = await r.json();
    const d = j.data || {};
    if (["completed", "succeeded"].includes(d.status)) return res.json({ status: "done", url: (d.outputs || [])[0] });
    if (d.status === "failed") return res.json({ status: "failed", error: d.error || "Generation failed" });
    res.json({ status: "working" });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
