import { useEffect, useRef, useState } from "react";
import {
  HAS_KEY,
  CATEGORIES,
  getTrending,
  searchVideos,
  getCategory,
  getShorts,
  getVideoDetails,
  getComments,
  embedUrl,
  formatViews,
  timeAgo,
} from "./api";
import { currentUser, logout } from "./auth";
import Login from "./Login";
import UploadModal from "./Upload";
import "./App.css";

const NAV = [
  ["🏠", "Asosiy", "home"],
  ["🎬", "Shorts", "shorts"],
  ["🧱", "Roblox", "Roblox"],
  ["⚽", "Fudbol", "Fudbol"],
  ["📚", "Dars", "Dars"],
];

const handleOf = (name) => "@" + name.replace(/\s+/g, "").toLowerCase();
const meta = (views, date) =>
  [views ? `${formatViews(views)} ko'rish` : "", timeAgo(date)].filter(Boolean).join(" • ");

function VideoCard({ video, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      {video.thumb ? (
        <img className="thumb" src={video.thumb} alt={video.title} loading="lazy" />
      ) : (
        <div className="thumb thumb-empty">▶</div>
      )}
      <div className="card-info">
        <div className="avatar small">{video.channel?.[0] ?? "?"}</div>
        <div>
          <h3>{video.title}</h3>
          <p className="muted">{video.channel}</p>
          <p className="muted">{meta(video.views, video.publishedAt)}</p>
        </div>
      </div>
    </div>
  );
}

function Watch({ video, related, onSelect }) {
  const [details, setDetails] = useState(video);
  const [comments, setComments] = useState([]);
  const [commentsOff, setCommentsOff] = useState(false);

  useEffect(() => {
    let alive = true;
    setDetails(video);
    setComments([]);
    setCommentsOff(false);
    window.scrollTo(0, 0);

    if (!video.local) {
      getVideoDetails(video.id)
        .then((d) => alive && d && setDetails(d))
        .catch(() => {});
      getComments(video.id)
        .then((c) => alive && setComments(c))
        .catch(() => alive && setCommentsOff(true));
    }
    return () => {
      alive = false;
    };
  }, [video.uid]);

  return (
    <div className="watch">
      <div className="watch-main">
        {video.local ? (
          <video key={video.uid} className="player" src={video.src} controls playsInline />
        ) : (
          <iframe
            key={video.uid}
            className="player"
            src={embedUrl(video.id)}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={video.title}
          />
        )}
        <h1>{details.title}</h1>
        <p className="muted">
          {details.channel} • {meta(details.views, details.publishedAt)}
        </p>
        {!video.local && (
          <a className="yt-link" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer">
            YouTube'da ochish ↗
          </a>
        )}
        <div className="desc">{details.description || "Tavsif yo'q"}</div>

        {!video.local && (
          <>
            <h2>{comments.length} ta izoh</h2>
            {commentsOff && <p className="muted">Izohlar o'chirilgan yoki yuklanmadi.</p>}
            {comments.map((c) => (
              <div className="comment" key={c.id}>
                <div className="avatar small">{c.author?.[0] ?? "?"}</div>
                <div>
                  <b>{c.author}</b> <span className="muted">{timeAgo(c.publishedAt)}</span>
                  <p className="comment-text">{c.text}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="related">
        {related.map((v) => (
          <div className="rel" key={v.uid} onClick={() => onSelect(v)}>
            {v.thumb ? <img src={v.thumb} alt="" loading="lazy" /> : <div className="rel-empty">▶</div>}
            <div>
              <div className="rel-title">{v.title}</div>
              <p className="muted">{v.channel}</p>
              <p className="muted">{formatViews(v.views)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShortsView({ items }) {
  return (
    <div className="shorts-wrap">
      {items.map((s) => (
        <div className="short" key={s.uid}>
          <iframe
            src={embedUrl(s.id)}
            title={s.title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <p className="short-title">{s.title}</p>
        </div>
      ))}
    </div>
  );
}

function ChannelView({ user, myVideos, onOpen, onUpload }) {
  return (
    <div className="channel">
      <div className="channel-head">
        <div className="avatar big">{user.name[0].toUpperCase()}</div>
        <div>
          <h1>{user.name}</h1>
          <p className="muted">
            {handleOf(user.name)} • {myVideos.length} ta video
          </p>
        </div>
      </div>
      <h2 className="tab">Videolar</h2>
      {myVideos.length === 0 ? (
        <div className="empty-state">
          <p className="muted">Hech qanday content topilmadi</p>
          <button className="auth-btn pill" onClick={onUpload}>
            Video yuklash
          </button>
        </div>
      ) : (
        <div className="grid">
          {myVideos.map((v) => (
            <VideoCard key={v.uid} video={v} onClick={() => onOpen(v)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AccountMenu({ user, onChannel, onLogout }) {
  return (
    <div className="acc-menu">
      <div className="acc-head">
        <div className="avatar big">{user.name[0].toUpperCase()}</div>
        <div>
          <b>{user.name}</b>
          <p className="muted">{handleOf(user.name)}</p>
        </div>
      </div>
      <hr />
      <button className="acc-item" onClick={onChannel}>
        👤 Kanalingiz
      </button>
      <a className="acc-item" href="https://www.youtube.com" target="_blank" rel="noreferrer">
        ▶ YouTube
      </a>
      <button className="acc-item" onClick={onLogout}>
        🔁 Hisobni almashtirish
      </button>
      <button className="acc-item" onClick={onLogout}>
        ↪ Chiqish
      </button>
    </div>
  );
}

function MacTube({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(true);
  const [view, setView] = useState("home"); // home | watch | shorts | channel
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Hammasi");
  const [videos, setVideos] = useState([]);
  const [myVideos, setMyVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const reqId = useRef(0);
  const accRef = useRef(null);

  async function run(fetcher, setter) {
    const id = ++reqId.current;
    setLoading(true);
    setError("");
    try {
      const list = await fetcher();
      if (id === reqId.current) setter(list);
    } catch (e) {
      if (id === reqId.current) {
        setter([]);
        setError(e.message);
      }
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }

  useEffect(() => {
    run(getTrending, setVideos);
  }, []);

  // Profil menyusi tashqarisiga bosilganda yopiladi
  useEffect(() => {
    if (!accountOpen) return;
    const close = (e) => {
      if (accRef.current && !accRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [accountOpen]);

  const goHome = () => {
    setQuery("");
    setSelected(null);
    setCategory("Hammasi");
    setView("home");
    run(getTrending, setVideos);
  };

  const openShorts = () => {
    setSelected(null);
    setView("shorts");
    run(getShorts, setShorts);
  };

  const openChannel = () => {
    setAccountOpen(false);
    setSelected(null);
    setView("channel");
  };

  const openVideo = (v) => {
    setSelected(v);
    setView("watch");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSelected(null);
    setView("home");
    setCategory("");
    run(() => searchVideos(q), setVideos);
  };

  const pickCategory = (c) => {
    setSelected(null);
    setView("home");
    setCategory(c);
    run(() => getCategory(c), setVideos);
  };

  const onNav = (key) => {
    if (key === "shorts") openShorts();
    else if (key === "home") goHome();
    else pickCategory(key);
  };

  const isActive = (key) => {
    if (key === "shorts") return view === "shorts";
    if (key === "home") return view === "home" && category === "Hammasi";
    return view === "home" && category === key;
  };

  const showMine = view === "home" && category === "Hammasi" && !query;
  const homeList = showMine ? [...myVideos, ...videos] : videos;

  const onUploaded = (v) => {
    setMyVideos((list) => [v, ...list]);
    setUploadOpen(false);
    setSelected(v);
    setView("watch");
  };

  const chips = ["Hammasi", ...CATEGORIES];

  return (
    <div className="app">
      <header className="header">
        <div className="left">
          <button className="icon-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <img className="logo-img" src="/logo.png" alt="MacTube" onClick={goHome} />
        </div>

        <form className="search" onSubmit={handleSearch}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Qidiruv" />
          <button type="submit">🔍</button>
        </form>

        <div className="right">
          <button className="create-btn" onClick={() => setUploadOpen(true)}>
            + Yaratish
          </button>
          <div className="acc-wrap" ref={accRef}>
            <div className="avatar" title={user.name} onClick={() => setAccountOpen(!accountOpen)}>
              {user.name[0].toUpperCase()}
            </div>
            {accountOpen && <AccountMenu user={user} onChannel={openChannel} onLogout={onLogout} />}
          </div>
        </div>
      </header>

      <div className="body">
        {menuOpen && (
          <aside className="sidebar">
            {NAV.map(([icon, label, key]) => (
              <button key={label} className={`nav-item ${isActive(key) ? "active" : ""}`} onClick={() => onNav(key)}>
                <span>{icon}</span>
                {label}
              </button>
            ))}
            <hr />
            <button className={`nav-item ${view === "channel" ? "active" : ""}`} onClick={openChannel}>
              <span>👤</span>Kanalingiz
            </button>
            <hr />
            <p className="muted">MacTube © 2026</p>
          </aside>
        )}

        <main className={`content ${menuOpen ? "" : "full"}`}>
          {view === "watch" && selected ? (
            <Watch
              video={selected}
              related={homeList.filter((v) => v.uid !== selected.uid)}
              onSelect={openVideo}
            />
          ) : view === "channel" ? (
            <ChannelView user={user} myVideos={myVideos} onOpen={openVideo} onUpload={() => setUploadOpen(true)} />
          ) : (
            <>
              {view === "home" && !HAS_KEY && (
                <p className="banner">
                  Demo rejim: videolar <b>src/demo.js</b> faylidan olinadi. Haqiqiy avtomatik qidiruv uchun <b>.env</b> ga API kalit yozing.
                </p>
              )}
              {view === "home" && (
                <div className="chips">
                  {chips.map((c) => (
                    <button
                      key={c}
                      className={`chip ${(c === "Hammasi" ? category === "Hammasi" : c === category) ? "active" : ""}`}
                      onClick={() => (c === "Hammasi" ? goHome() : pickCategory(c))}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {loading && <p className="muted">Yuklanmoqda...</p>}
              {error && <p className="error">Xatolik: {error}</p>}

              {view === "shorts" ? (
                !loading && !error && shorts.length === 0 ? (
                  <p className="muted">Shorts topilmadi.</p>
                ) : (
                  <ShortsView items={shorts} />
                )
              ) : (
                <>
                  {!loading && !error && homeList.length === 0 && <p className="muted">Natija topilmadi.</p>}
                  <div className="grid">
                    {homeList.map((v) => (
                      <VideoCard key={v.uid} video={v} onClick={() => openVideo(v)} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {uploadOpen && (
        <UploadModal author={user.name} onClose={() => setUploadOpen(false)} onUploaded={onUploaded} />
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(currentUser());
  if (!user) return <Login onLogin={setUser} />;
  return (
    <MacTube
      user={user}
      onLogout={() => {
        logout();
        setUser(null);
      }}
    />
  );
}
