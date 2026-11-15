// Vercel serverless function: starts a video generation task.
// Env vars (Vercel -> Settings -> Environment Variables):
//   ATLASCLOUD_API_KEY  (required)
//   MODEL               (optional, default below; swap for a Seedance 2.0 id when your provider lists one)
const BASE = "https://api.atlascloud.ai/api/v1/model";

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ATLASCLOUD_API_KEY;
  if (!key) return res.status(500).json({ error: "ATLASCLOUD_API_KEY is not set" });

  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const prompt = String(b.prompt || "").trim().slice(0, 1500);
  if (!prompt) return res.status(400).json({ error: "Write a prompt first" });

  // Cost guards: cap duration and resolution on the server.
  const duration = Math.min(Math.max(parseInt(b.duration) || 4, 2), 8);
  const resolution = ["480p", "720p"].includes(b.resolution) ? b.resolution : "480p";
  const aspect_ratio = ["16:9", "9:16", "1:1"].includes(b.aspect) ? b.aspect : "16:9";

  const payload = {
    model: process.env.MODEL || "bytedance/seedance-v1.5-pro/text-to-video",
    prompt, duration, resolution, aspect_ratio,
    generate_audio: false, camera_fixed: false, seed: -1,
  };
  // Optional reference image URL (image-to-video). The model id must support it.
  if (b.image_url) payload.image = String(b.image_url);

  try {
    const r = await fetch(`${BASE}/generateVideo`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok || !j.data || !j.data.id) return res.status(502).json({ error: j.message || j.error || "Provider error", raw: j });
    res.status(200).json({ id: j.data.id });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
