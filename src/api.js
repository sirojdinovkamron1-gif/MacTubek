import { DEMO_VIDEOS } from "./demo";

const API_KEY = import.meta.env.VITE_YT_API_KEY;
export const HAS_KEY = Boolean(API_KEY);
const BASE = "https://www.googleapis.com/youtube/v3";
const TARGET = 150;

export const CATEGORIES = ["Roblox", "Fudbol", "Dars"];

// Kategoriya bo'yicha qidiruv so'zlari (haqiqiy YouTube uchun)
const CAT_QUERY = { Roblox: "roblox", Fudbol: "futbol", Dars: "dars darslik" };

// API kalitsiz demo rejim: src/demo.js dagi videolar
function demoVideos() {
  return DEMO_VIDEOS.filter((d) => d.id).map((d, i) => ({
    uid: `demo-${i}`,
    id: d.id,
    cat: d.cat ?? "Roblox",
    short: Boolean(d.short),
    title: d.title ?? "Video",
    channel: d.channel ?? "Kanal",
    thumb: `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`,
    publishedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
    description: "",
    views: 0,
  }));
}

export function embedUrl(id) {
  const origin = encodeURIComponent(window.location.origin);
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&origin=${origin}`;
}

async function request(path, params) {
  const url = new URL(`${BASE}/${path}`);
  url.search = new URLSearchParams({ ...params, key: API_KEY }).toString();
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "YouTube API xatosi");
  return data;
}

async function paginate(path, params, target = TARGET) {
  const items = [];
  let token;
  do {
    const d = await request(path, {
      maxResults: 50,
      ...params,
      ...(token ? { pageToken: token } : {}),
    });
    items.push(...d.items);
    token = d.nextPageToken;
  } while (token && items.length < target);
  return items.slice(0, target);
}

const mapVideo = (item) => {
  const id = typeof item.id === "string" ? item.id : item.id.videoId;
  const sn = item.snippet;
  return {
    uid: id,
    id,
    title: sn.title,
    channel: sn.channelTitle,
    thumb: sn.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    publishedAt: sn.publishedAt,
    description: sn.description ?? "",
    views: Number(item.statistics?.viewCount ?? 0),
  };
};

async function getVideosByIds(ids) {
  const out = [];
  for (let i = 0; i < ids.length; i += 50) {
    const d = await request("videos", {
      part: "snippet,statistics",
      id: ids.slice(i, i + 50).join(","),
    });
    out.push(...d.items.map(mapVideo));
  }
  return out;
}

async function searchIds(params) {
  const items = await paginate("search", { part: "snippet", type: "video", ...params });
  return items.map((i) => i.id.videoId).filter(Boolean);
}

export async function getTrending() {
  if (!HAS_KEY) return demoVideos().filter((v) => !v.short);
  const items = await paginate("videos", {
    part: "snippet,statistics",
    chart: "mostPopular",
    regionCode: "UZ",
  });
  return items.map(mapVideo);
}

export async function searchVideos(q) {
  if (!HAS_KEY) {
    const s = q.toLowerCase();
    return demoVideos().filter(
      (v) => !v.short && (v.title.toLowerCase().includes(s) || v.channel.toLowerCase().includes(s))
    );
  }
  const ids = await searchIds({ q, regionCode: "UZ" });
  return ids.length ? getVideosByIds(ids) : [];
}

export async function getCategory(c) {
  if (!HAS_KEY) return demoVideos().filter((v) => !v.short && v.cat === c);
  return searchVideos(CAT_QUERY[c] ?? c);
}

export async function getShorts() {
  if (!HAS_KEY) return demoVideos().filter((v) => v.short);
  const ids = await searchIds({ q: "futbol shorts", videoDuration: "short", regionCode: "UZ" });
  return ids.length ? getVideosByIds(ids) : [];
}

export async function getVideoDetails(id) {
  if (!HAS_KEY) return null;
  const [video] = await getVideosByIds([id]);
  return video ?? null;
}

export async function getComments(id) {
  if (!HAS_KEY) return [];
  const d = await request("commentThreads", {
    part: "snippet",
    videoId: id,
    maxResults: 20,
    order: "relevance",
  });
  return d.items.map((i) => {
    const s = i.snippet.topLevelComment.snippet;
    return { id: i.id, author: s.authorDisplayName, text: s.textOriginal, publishedAt: s.publishedAt };
  });
}

export function formatViews(n) {
  if (!n) return "";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " mln";
  if (n >= 1e3) return Math.round(n / 1e3) + " ming";
  return String(n);
}

export function timeAgo(date) {
  if (!date) return "";
  const sec = (Date.now() - new Date(date)) / 1000;
  const units = [["yil", 31536000], ["oy", 2592000], ["hafta", 604800], ["kun", 86400], ["soat", 3600], ["daqiqa", 60]];
  for (const [name, s] of units) {
    const v = Math.floor(sec / s);
    if (v >= 1) return `${v} ${name} oldin`;
  }
  return "hozirgina";
}
