import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

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

  // --- ELKING SERVERS (XTREAM IPTV & VOD CONTROLLER) ---
  let elkingVodCache: any[] | null = null;
  let lastElkingVodFetch = 0;

  let elkingSeriesCache: any[] | null = null;
  let lastElkingSeriesFetch = 0;

  const elkingSeriesInfoCache = new Map<string, { data: any; timestamp: number }>();

  function normalizeText(text: string): string {
    if (!text) return "";
    let clean = text.toLowerCase();
    
    // Normalize Arabic letters & characters to facilitate unified matches
    clean = clean.replace(/[أإآ]/g, "ا");
    clean = clean.replace(/ة/g, "ه");
    clean = clean.replace(/ى/g, "ي");
    clean = clean.replace(/[ًٌٍَُِّْ]/g, ""); // strip accents/diacritics
    
    // Remove symbols/marks, collapse white space
    clean = clean.replace(/[^a-z0-9ا-ي\s]/g, "");
    clean = clean.replace(/\s+/g, " ");
    return clean.trim();
  }

  function findBestElkingMatch(items: any[], queryText: string, targetYear?: string) {
    if (!items || items.length === 0) return null;
    const target = normalizeText(queryText);
    const yearStr = targetYear ? String(targetYear) : "";

    let bestItem: any = null;
    let maxScore = -1;

    for (const item of items) {
      if (!item.name) continue;
      const itemNameClean = normalizeText(item.name);
      
      // Fuzzy contains/overlap containment check
      if (itemNameClean.includes(target) || target.includes(itemNameClean)) {
        let score = 10;
        
        // Match exact characters perfectly
        if (itemNameClean === target) {
          score += 50;
        }
        
        // Prioritize releases of matching year
        if (yearStr && item.name.includes(yearStr)) {
          score += 30;
        }
        
        if (score > maxScore) {
          maxScore = score;
          bestItem = item;
        }
      }
    }
    
    return bestItem;
  }

  app.get("/api/elking/search", async (req, res) => {
    const { title, titleAr, year, mediaType, season, episode } = req.query as {
      title?: string;
      titleAr?: string;
      year?: string;
      mediaType?: string;
      season?: string;
      episode?: string;
    };

    if (!title && !titleAr) {
      return res.status(400).json({ error: "Title parameter is required" });
    }

    const host = "http://vod4k.cc";
    const username = "3143771383105485";
    const password = "5846751342";
    const cacheTTL = 10 * 60 * 1000; // 10 minutes cache TTL

    try {
      if (mediaType === "tv" && season && episode) {
        // --- TV SHOW / SERIES PIPELINE ---
        const now = Date.now();
        if (!elkingSeriesCache || (now - lastElkingSeriesFetch > cacheTTL)) {
          console.log("Fetching new Series list from ELKING...");
          const listRes = await fetch(`${host}/player_api.php?username=${username}&password=${password}&action=get_series`);
          if (listRes.ok) {
            elkingSeriesCache = await listRes.json();
            lastElkingSeriesFetch = now;
          }
        }

        if (!elkingSeriesCache || elkingSeriesCache.length === 0) {
          return res.status(404).json({ error: "No Series catalog available on ELKING" });
        }

        let matchedSeries = findBestElkingMatch(elkingSeriesCache, title || "", year);
        if (!matchedSeries && titleAr) {
          matchedSeries = findBestElkingMatch(elkingSeriesCache, titleAr, year);
        }

        if (!matchedSeries) {
          return res.status(404).json({ error: "Series not found on ELKING" });
        }

        const seriesId = String(matchedSeries.series_id);
        
        // Fetch specific metadata and episodes map
        let seriesInfo = elkingSeriesInfoCache.get(seriesId);
        if (!seriesInfo || (now - seriesInfo.timestamp > cacheTTL)) {
          const infoRes = await fetch(`${host}/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${seriesId}`);
          if (infoRes.ok) {
            const data = await infoRes.json();
            seriesInfo = { data, timestamp: now };
            elkingSeriesInfoCache.set(seriesId, seriesInfo);
          }
        }

        if (!seriesInfo || !seriesInfo.data || !seriesInfo.data.episodes) {
          return res.status(404).json({ error: "Episodes map missing on ELKING indexer" });
        }

        const seasonsMap = seriesInfo.data.episodes;
        let matchedEpisode: any = null;
        
        const seasonKey = String(season);
        const seasonEpisodes = seasonsMap[seasonKey] || seasonsMap[season];
        
        if (seasonEpisodes && Array.isArray(seasonEpisodes)) {
          matchedEpisode = seasonEpisodes.find((ep: any) => ep.episode_num === parseInt(episode) || String(ep.episode_num) === episode);
        }

        if (!matchedEpisode) {
          // Fallback searching across all indices
          for (const sKey of Object.keys(seasonsMap)) {
            const epList = seasonsMap[sKey];
            if (Array.isArray(epList)) {
              matchedEpisode = epList.find((ep: any) => 
                (ep.episode_num === parseInt(episode) || String(ep.episode_num) === episode) &&
                String(ep.season) === seasonKey
              );
              if (matchedEpisode) break;
            }
          }
        }

        if (!matchedEpisode) {
          return res.status(404).json({ error: `Episode S${season}E${episode} not indexed on ELKING` });
        }

        const streamId = matchedEpisode.id;
        const extension = matchedEpisode.container_extension || "mp4";
        const proxyUrl = `/api/elking/stream/series/${streamId}/${extension}`;
        const directUrl = `${host}/series/${username}/${password}/${streamId}.${extension}`;

        return res.json({
          success: true,
          streamId,
          extension,
          proxyUrl,
          directUrl,
          title: matchedEpisode.title || `${matchedSeries.name} - S${season}E${episode}`
        });

      } else {
        // --- MOVIE / VOD PIPELINE ---
        const now = Date.now();
        if (!elkingVodCache || (now - lastElkingVodFetch > cacheTTL)) {
          console.log("Fetching new Movies list from ELKING...");
          const listRes = await fetch(`${host}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`);
          if (listRes.ok) {
            elkingVodCache = await listRes.json();
            lastElkingVodFetch = now;
          }
        }

        if (!elkingVodCache || elkingVodCache.length === 0) {
          return res.status(404).json({ error: "No Movie catalog available on ELKING" });
        }

        let matchedMovie = findBestElkingMatch(elkingVodCache, title || "", year);
        if (!matchedMovie && titleAr) {
          matchedMovie = findBestElkingMatch(elkingVodCache, titleAr, year);
        }

        if (!matchedMovie) {
          return res.status(404).json({ error: "Movie not found on ELKING" });
        }

        const streamId = matchedMovie.stream_id;
        const extension = matchedMovie.container_extension || "mp4";
        const proxyUrl = `/api/elking/stream/movie/${streamId}/${extension}`;
        const directUrl = `${host}/movie/${username}/${password}/${streamId}.${extension}`;

        return res.json({
          success: true,
          streamId,
          extension,
          proxyUrl,
          directUrl,
          title: matchedMovie.name
        });
      }
    } catch (error: any) {
      console.error("ELKING Search error:", error);
      res.status(500).json({ error: error.message || "Failed to search content on ELKING server" });
    }
  });

  app.get("/api/elking/stream/:streamType/:streamId/:extension", async (req, res) => {
    const { streamType, streamId, extension } = req.params;
    const username = "3143771383105485";
    const password = "5846751342";
    const remoteUrl = `http://vod4k.cc/${streamType}/${username}/${password}/${streamId}.${extension}`;

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    };

    if (req.headers.range) {
      headers['range'] = req.headers.range;
    }

    try {
      const response = await fetch(remoteUrl, { headers });
      
      res.status(response.status);
      
      response.headers.forEach((value, name) => {
        const lowerName = name.toLowerCase();
        if (['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-disposition'].includes(lowerName)) {
          res.setHeader(name, value);
        }
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

      if (response.body) {
        const { Readable } = await import("stream");
        Readable.fromWeb(response.body as any).pipe(res);
      } else {
        res.end();
      }
    } catch (error: any) {
      console.error(`Error piping stream (falling back to redirect): ${error.message}`);
      res.redirect(remoteUrl);
    }
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
