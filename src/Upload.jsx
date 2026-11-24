import { useState } from "react";

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

// Videodan kadr olib, kartochka uchun rasm (thumbnail) yasaydi
function captureThumb(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    let done = false;

    const draw = () => {
      if (done) return;
      done = true;
      try {
        const c = document.createElement("canvas");
        c.width = 640;
        c.height = 360;
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        resolve({ url, thumb: c.toDataURL("image/jpeg", 0.8) });
      } catch {
        resolve({ url, thumb: "" });
      }
    };

    v.onloadeddata = () => {
      if (v.duration > 1) v.currentTime = 1;
      else draw();
    };
    v.onseeked = draw;
    v.onerror = () => {
      if (!done) {
        done = true;
        resolve({ url, thumb: "" });
      }
    };
  });
}

// YouTube havolasidan video ID ni ajratadi
function parseYtId(text) {
  const t = text.trim();
  const m = t.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{11}$/.test(t) ? t : null;
}

export default function UploadModal({ author, onClose, onUploaded }) {
  const [mode, setMode] = useState("file"); // file | link
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function pickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) return setErr("Faqat video fayl tanlang");
    if (f.size > MAX_SIZE) return setErr("Fayl 500 MB dan katta bo'lmasin");
    setErr("");
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function submitFile(e) {
    e.preventDefault();
    if (!file) return setErr("Video faylni tanlang");
    if (!title.trim()) return setErr("Sarlavha kiriting");
    setBusy(true);
    const { url: src, thumb } = await captureThumb(file);
    onUploaded({
      uid: `local-${Date.now()}`,
      id: null,
      local: true,
      src,
      title: title.trim(),
      channel: author,
      description: desc.trim(),
      thumb,
      publishedAt: new Date().toISOString(),
      views: 0,
    });
  }

  async function submitLink(e) {
    e.preventDefault();
    const id = parseYtId(url);
    if (!id) return setErr("To'g'ri YouTube havola kiriting (masalan: youtube.com/watch?v=...)");
    setBusy(true);
    setErr("");

    // YouTube'dan haqiqiy sarlavha, kanal nomi va rasmni olamiz
    let info = null;
    try {
      const watch = `https://www.youtube.com/watch?v=${id}`;
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`);
      if (r.status === 401 || r.status === 403 || r.status === 404) {
        setBusy(false);
        return setErr("Bu video topilmadi yoki boshqa joyda ijro etishga ruxsat berilmagan");
      }
      if (r.ok) info = await r.json();
    } catch {
      // Tarmoq xatosi bo'lsa, qo'lda kiritilgan ma'lumot bilan davom etamiz
    }

    const finalTitle = title.trim() || info?.title;
    if (!finalTitle) {
      setBusy(false);
      return setErr("Sarlavha kiriting");
    }

    onUploaded({
      uid: `link-${id}-${Date.now()}`,
      id,
      local: false,
      title: finalTitle,
      channel: info?.author_name || author,
      description: desc.trim(),
      thumb: info?.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      publishedAt: new Date().toISOString(),
      views: 0,
    });
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={mode === "file" ? submitFile : submitLink}
      >
        <h2>Video qo'shish</h2>

        <div className="mode-tabs">
          <button
            type="button"
            className={mode === "file" ? "active" : ""}
            onClick={() => {
              setMode("file");
              setErr("");
            }}
          >
            Fayl yuklash
          </button>
          <button
            type="button"
            className={mode === "link" ? "active" : ""}
            onClick={() => {
              setMode("link");
              setErr("");
            }}
          >
            YouTube havolasi
          </button>
        </div>

        {mode === "file" ? (
          <label className="file-drop">
            {file ? `📁 ${file.name}` : "📁 Video faylni tanlang (MP4, WebM)"}
            <input type="file" accept="video/*" hidden onChange={pickFile} />
          </label>
        ) : (
          <input
            placeholder="YouTube havola (masalan: https://youtube.com/watch?v=...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}

        <input placeholder={mode === "link" ? "Sarlavha (ixtiyoriy, bo'sh qolsa YouTube'dan olinadi)" : "Sarlavha"} value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Tavsif" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />

        {err && <p className="error">{err}</p>}

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose} disabled={busy}>
            Bekor qilish
          </button>
          <button type="submit" className="auth-btn" disabled={busy}>
            {busy ? "Yuklanmoqda..." : mode === "file" ? "Yuklash" : "Qo'shish"}
          </button>
        </div>
      </form>
    </div>
  );
}
