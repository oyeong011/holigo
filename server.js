import express from "express";
import Parser from "rss-parser";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "threads-reader/1.0" }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const RSS_URL = process.env.RSS_URL;

if (!RSS_URL) {
  console.error("Missing RSS_URL in .env");
  process.exit(1);
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/feed", async (req, res) => {
  try {
    const feed = await parser.parseURL(RSS_URL);

    // 표준화: UI에서 쓰기 좋게 정리
    const items = (feed.items || []).map((it) => {
      const link = it.link || "";
      const title = it.title || "";
      const content = it.contentSnippet || it.content || it.summary || "";
      const isoDate = it.isoDate || it.pubDate || "";
      // 일부 RSS는 enclosure/media에 이미지가 들어있음
      const image =
        it.enclosure?.url ||
        it["media:content"]?.url ||
        it["media:thumbnail"]?.url ||
        null;

      return { link, title, content, isoDate, image };
    });

    res.json({
      title: feed.title || "Threads Feed",
      link: feed.link || "",
      items
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load feed", detail: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ http://localhost:${PORT}`);
});



