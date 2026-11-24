import { useState } from "react";
import { login, register } from "./auth";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const user = mode === "login" ? login(email, password) : register(name, email, password);
      onLogin(user);
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <img className="logo-big-img" src="/logo.png" alt="MacTube" />
        <h2>{mode === "login" ? "Hisobga kirish" : "Ro'yxatdan o'tish"}</h2>

        {mode === "register" && (
          <input placeholder="Ismingiz" value={name} onChange={(e) => setName(e.target.value)} />
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} />

        {err && <p className="error">{err}</p>}
        <button className="auth-btn" type="submit">
          {mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
        </button>

        <p className="muted">
          {mode === "login" ? "Hisobingiz yo'qmi? " : "Hisobingiz bormi? "}
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setErr("");
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login" ? "Ro'yxatdan o'ting" : "Kiring"}
          </button>
        </p>
      </form>
    </div>
  );
}
