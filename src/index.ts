import OpenAI from "openai";

const openai = new OpenAI();

export interface ResearchOptions {
  days: number;
  format: "text" | "json";
  sources: boolean;
}

export interface ResearchResult {
  topic: string;
  trends: string;
  community: string;
  insights: string;
  sources: { title: string; url: string; source: string }[];
  raw?: any;
}

async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ai-research-cli/1.0" },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return res.json();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "ai-research-cli/1.0" },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  return res.text();
}

async function searchReddit(topic: string): Promise<{ title: string; url: string; selftext: string; score: number; subreddit: string; permalink: string }[]> {
  try {
    const q = encodeURIComponent(topic);
    const url = `https://www.reddit.com/search.json?q=${q}&t=month&sort=relevance&limit=20`;
    const data = await fetchJSON(url);
    const posts = data?.data?.children || [];
    return posts.map((p: any) => ({
      title: p.data.title,
      url: `https://reddit.com${p.data.permalink}`,
      selftext: (p.data.selftext || "").slice(0, 500),
      score: p.data.score,
      subreddit: p.data.subreddit,
      permalink: p.data.permalink,
    }));
  } catch (e: any) {
    console.error(`Reddit search failed: ${e.message}`);
    return [];
  }
}

async function searchHN(topic: string, days: number): Promise<{ title: string; url: string; points: number; objectID: string }[]> {
  try {
    const timestamp = Math.floor(Date.now() / 1000) - days * 86400;
    const q = encodeURIComponent(topic);
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${q}&tags=story&numericFilters=created_at_i>${timestamp}&hitsPerPage=20`;
    const data = await fetchJSON(url);
    return (data.hits || []).map((h: any) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points || 0,
      objectID: h.objectID,
    }));
  } catch (e: any) {
    console.error(`HN search failed: ${e.message}`);
    return [];
  }
}

export async function research(topic: string, options: ResearchOptions): Promise<ResearchResult> {
  // Fetch from both sources in parallel
  const [redditPosts, hnPosts] = await Promise.all([
    searchReddit(topic),
    searchHN(topic, options.days),
  ]);

  // Build context for synthesis
  const redditContext = redditPosts.length > 0
    ? redditPosts.map((p, i) => `${i + 1}. [r/${p.subreddit}] "${p.title}" (score: ${p.score})\n   ${p.selftext ? p.selftext.slice(0, 200) : "(link post)"}`).join("\n")
    : "No Reddit results found.";

  const hnContext = hnPosts.length > 0
    ? hnPosts.map((p, i) => `${i + 1}. "${p.title}" (${p.points} points) - ${p.url}`).join("\n")
    : "No Hacker News results found.";

  // Synthesize with OpenAI
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a research analyst. Synthesize findings from Reddit and Hacker News about a topic into a clear, actionable report. Be specific and quote actual discussions. No fluff.

Output format (use these exact headers):
## Key Trends & Patterns
(What's actually happening with this topic. Concrete patterns, not vague statements.)

## What the Community Is Saying
(Real opinions, debates, consensus. Quote or paraphrase specific discussions.)

## Actionable Insights
(What someone should actually do with this info. Be specific. Include copy-paste-ready prompts or commands if applicable.)

## Top Sources
(List the most valuable discussions with links.)`
      },
      {
        role: "user",
        content: `Research topic: "${topic}" (last ${options.days} days)

REDDIT DISCUSSIONS:
${redditContext}

HACKER NEWS DISCUSSIONS:
${hnContext}

Synthesize these into a research report. If data is thin, say so honestly. Don't make things up.`
      }
    ],
    temperature: 0.3,
  });

  const content = response.choices[0].message.content || "";

  // Extract sections
  const getSection = (header: string, next: string) => {
    const regex = new RegExp(`## ${header}[\\s\\S]*?(?=## ${next}|$)`, "i");
    const match = content.match(regex);
    return match ? match[0].replace(`## ${header}`, "").trim() : "";
  };

  // Collect all sources
  const sources: { title: string; url: string; source: string }[] = [];
  redditPosts.slice(0, 5).forEach((p) => sources.push({ title: p.title, url: p.url, source: `r/${p.subreddit}` }));
  hnPosts.slice(0, 5).forEach((p) => sources.push({ title: p.title, url: p.url, source: "Hacker News" }));

  return {
    topic,
    trends: getSection("Key Trends & Patterns", "What the Community"),
    community: getSection("What the Community Is Saying", "Actionable Insights"),
    insights: getSection("Actionable Insights", "Top Sources"),
    sources,
    raw: options.format === "json" ? { reddit: redditPosts, hn: hnPosts, synthesis: content } : undefined,
  };
}

export function formatResult(result: ResearchResult, options: ResearchOptions): string {
  if (options.format === "json") {
    return JSON.stringify(result, null, 2);
  }

  let output = `\n🔍 Research Report: "${result.topic}"\n${"=".repeat(50)}\n\n`;
  output += `## Key Trends & Patterns\n${result.trends}\n\n`;
  output += `## What the Community Is Saying\n${result.community}\n\n`;
  output += `## Actionable Insights\n${result.insights}\n`;

  if (options.sources && result.sources.length > 0) {
    output += `\n## Top Sources\n`;
    result.sources.forEach((s, i) => {
      output += `${i + 1}. [${s.source}] ${s.title}\n   ${s.url}\n`;
    });
  }

  return output;
}
