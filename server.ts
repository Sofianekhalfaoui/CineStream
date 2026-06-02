import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy for TMDB API to prevent CORS / network errors in sandboxed environments
  app.get("/api/tmdb/*", async (req, res) => {
    let subpath = req.params[0] || "";
    if (!subpath && req.path.startsWith("/api/tmdb/")) {
      subpath = req.path.substring("/api/tmdb/".length);
    }
    // Safeguard to prevent recursive or double-prefixing
    if (subpath.startsWith("api/tmdb/")) {
      subpath = subpath.substring("api/tmdb/".length);
    }
    // Strip leading slashes
    subpath = subpath.replace(/^\/+/, "");

    const queryParams = new URLSearchParams();
    
    // Copy all query parameters from original request
    for (const [key, value] of Object.entries(req.query)) {
      if (value !== undefined) {
        queryParams.set(key, String(value));
      }
    }
    
    const apiKey = process.env.VITE_TMDB_API_KEY || '826d7088b7762696612143ad0bf99e28';
    const isV4Token = apiKey.length > 50;

    const headers: Record<string, string> = {
      'accept': 'application/json'
    };

    if (isV4Token) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      // Ensure API Key is set in query parameter
      if (!queryParams.has('api_key')) {
        queryParams.set('api_key', apiKey);
      }
    }
    
    const targetUrl = `https://api.themoviedb.org/3/${subpath}?${queryParams.toString()}`;
    
    try {
      const response = await fetch(targetUrl, { headers });
      const contentType = response.headers.get("content-type");
      
      res.status(response.status);
      
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (error: any) {
      console.error(`TMDB proxy fetch error on ${targetUrl}:`, error);
      res.status(500).json({ error: "Failed to fetch TMDB proxy resource" });
    }
  });

  // API Route for trailers (placeholder for the user's logic)
  app.get("/api/trailer/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    const apiKey = process.env.VITE_TMDB_API_KEY || '826d7088b7762696612143ad0bf99e28';
    
    try {
      // Direct TMDB fetch as default implementation
      const response = await fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${apiKey}`);
      const data = await response.json();
      const videos = data.results || [];
      
      const trailer = videos.find((vid: any) => vid.type === 'Trailer' && vid.site === 'YouTube') ||
                      videos.find((vid: any) => vid.site === 'YouTube');
      
      if (trailer) {
        res.json({ key: trailer.key });
      } else {
        res.status(404).json({ error: "Trailer not found" });
      }
    } catch (error) {
      console.error('Trailer fetch error:', error);
      res.status(500).json({ error: "Failed to fetch trailer" });
    }
  });

  // API Route for Arab Seed links
  app.get("/api/arabseed/search", async (req, res) => {
    const { title, titleAr, year, season, episode, mediaType } = req.query as {
      title?: string;
      titleAr?: string;
      year?: string;
      season?: string;
      episode?: string;
      mediaType?: string;
    };

    if (!title) {
      return res.status(400).json({ error: "Title parameter is required" });
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      'Referer': 'https://asd.ink/'
    };

    const cleanTitle = title.replace(/[:']/g, '').trim();
    const cleanTitleAr = titleAr ? titleAr.replace(/[:']/g, '').trim() : '';

    const searchQueries: string[] = [];
    const isTv = mediaType === 'tv';

    if (isTv && season && episode) {
      if (cleanTitleAr) {
        searchQueries.push(`${cleanTitleAr} الموسم ${season} الحلقة ${episode}`);
        searchQueries.push(`${cleanTitleAr} الموسم ${season}`);
      } else {
        searchQueries.push(`${cleanTitle} S${season}E${episode}`);
        searchQueries.push(`${cleanTitle} Season ${season}`);
      }
    } else {
      if (cleanTitleAr) {
        if (year) searchQueries.push(`${cleanTitleAr} ${year}`);
        searchQueries.push(`${cleanTitleAr}`);
      } else {
        if (year) searchQueries.push(`${cleanTitle} ${year}`);
        searchQueries.push(`${cleanTitle}`);
      }
    }

    // Prioritize working domain mirrors and drop unstable old mobile endpoints
    const domains = ['https://asd.ink', 'https://arabseed.show'];
    let foundPostUrl = "";
    let foundEmbedUrl = "";
    let queryUsed = "";
    let domainUsed = "";

    // Search logic with targeted, lightweight queries and faster failovcer
    for (const domain of domains) {
      if (foundPostUrl) break;
      for (const query of searchQueries) {
        if (foundPostUrl) break;
        try {
          // Attempt the main endpoint optimized for Arab Seed WordPress themes first, with standard WP fallback
          const searchUrls = [
            `${domain}/find?key=${encodeURIComponent(query)}`,
            `${domain}/?s=${encodeURIComponent(query)}`
          ];

          for (const url of searchUrls) {
            try {
              const searchRes = await fetch(url, { headers, signal: AbortSignal.timeout(2500) });
              if (!searchRes.ok) continue;
              const html = await searchRes.text();

              // Match post URLs like ?p=XXXX
              const foundPaths: string[] = [];
              const genericLinkRegex = /href="([^"]*?(?:\?p=|\?post=)(\d+))"/gi;
              let linkMatch;
              while ((linkMatch = genericLinkRegex.exec(html)) !== null) {
                foundPaths.push(linkMatch[1]);
              }

              if (foundPaths.length > 0) {
                const bestPath = foundPaths[0];
                const fullUrl = bestPath.startsWith('http') 
                  ? bestPath 
                  : `${domain}${bestPath.startsWith('/') ? '' : '/'}${bestPath}`;
                
                foundPostUrl = fullUrl;
                queryUsed = query;
                domainUsed = domain;
                break;
              }
            } catch (err: any) {
              if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
                console.warn(`Timeout requesting ${url}. Skipping to next query.`);
              } else {
                console.warn(`Failed requesting ${url}:`, err.message || err);
              }
            }
          }
        } catch (e: any) {
          console.warn(`Error compiling search for ${domain}:`, e.message || e);
        }
      }
    }

    // Try to extract embed iframe url if we got a post URL
    if (foundPostUrl && !foundPostUrl.includes('find?key=')) {
      try {
        const postRes = await fetch(foundPostUrl, { headers, signal: AbortSignal.timeout(2500) });
        if (postRes.ok) {
          const postHtml = await postRes.text();
          // Match iframe sources containing video, play, embed, watch, asd, etc.
          const iframeRegex = /<iframe[^>]+src="([^"]*(?:embed|watch|embeds|player|video|asd|link|stream)[^"]*)"/i;
          const match = iframeRegex.exec(postHtml);
          if (match) {
            let src = match[1];
            if (src.startsWith('//')) src = 'https:' + src;
            foundEmbedUrl = src;
          }
        }
      } catch (e: any) {
        console.warn(`Failed to parse iframe from Arab Seed post page: ${e.message || e}`);
      }
    }

    // If still no URL found, construct a direct search URL so user doesn't hit a wall
    if (!foundPostUrl) {
      const defaultQuery = cleanTitleAr ? `${cleanTitleAr} ${cleanTitle}` : cleanTitle;
      foundPostUrl = `https://asd.ink/find?key=${encodeURIComponent(defaultQuery)}`;
      queryUsed = defaultQuery;
      domainUsed = 'https://asd.ink';
    }

    res.json({
      success: !!foundEmbedUrl || !foundPostUrl.includes('find?key='),
      postUrl: foundPostUrl,
      embedUrl: foundEmbedUrl,
      queryUsed,
      domainUsed
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
