"use client";
import { useState } from "react";
import { LangProvider, useLang } from "./i18n";
import { WalletProvider } from "./WalletProvider";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { MuaVePage } from "./components/MuaVePage";
import { KetQuaPage } from "./components/KetQuaPage";
import { VeCuaToiPage } from "./components/VeCuaToiPage";
import { AdminPage } from "./components/AdminPage";
import "./styles/globals.css";

type Page = "mua-ve" | "ket-qua" | "ve-cua-toi" | "admin";

function WalletButton() {
  const { connect, disconnect, account, connected, wallets } = useWallet();
  const { t, lang } = useLang();

  const handleConnect = async () => {
    try {
      const petra = wallets?.find((w: any) => w.name === "Petra");
      if (petra) {
        await connect(petra.name);
      } else {
        window.open("https://petra.app", "_blank");
      }
    } catch (e) {
      console.error("Connect error:", e);
    }
  };

  if (connected && account) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="wallet-connected">
          <span className="wallet-dot" />
          <span className="wallet-addr">
            {account.address.slice(0, 6)}…{account.address.slice(-4)}
          </span>
        </div>
        <button onClick={() => disconnect()} style={{
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.7)", borderRadius: 6, padding: "4px 10px",
          fontSize: 11, cursor: "pointer",
        }}>
          {lang === "vi" ? "Ngat" : "Disconnect"}
        </button>
      </div>
    );
  }

  return (
    <button className="connect-btn" onClick={handleConnect}>
      {t.connect_wallet}
    </button>
  );
}

function AppInner() {
  const [page, setPage] = useState<Page>("mua-ve");
  const { lang, t, toggleLang } = useLang();
  const { account, connected } = useWallet();
  const walletAddress = connected && account ? account.address : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={() => setPage("mua-ve")}>
            <span className="logo-icon">🎴</span>
            <div className="logo-text">
              <span className="logo-main">
                {lang === "en" ? "MIEN NAM LOTTERY" : "XO SO MIEN NAM"}
              </span>
              <span className="logo-sub">ON-CHAIN · SHELBY x APTOS</span>
            </div>
          </div>
          <nav className="nav">
            {(["mua-ve", "ket-qua", "ve-cua-toi"] as Page[]).map(p => (
              <button key={p} className={`nav-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p)}>
                {p === "mua-ve" ? t.nav_mua_ve : p === "ket-qua" ? t.nav_ket_qua : t.nav_ve_cua_toi}
              </button>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={toggleLang} className="lang-toggle">
              <span className={lang === "en" ? "lang-active" : "lang-inactive"}>EN</span>
              <span className="lang-divider">|</span>
              <span className={lang === "vi" ? "lang-active" : "lang-inactive"}>VI</span>
            </button>
            <WalletButton />
          </div>
        </div>
      </header>
      <div className="ticker">
        <div className="ticker-inner">
          <span className="ticker-badge">🔴 {t.live}</span>
          <span className="ticker-item">{t.ticker_ky} <strong>{t.ticker_prize}</strong></span>
          <span className="ticker-sep">·</span>
          <span className="ticker-item">{t.ticker_dong_ve} <strong>18:00</strong> {t.today}</span>
          <span className="ticker-sep">·</span>
          <span className="ticker-item">1,247 {t.ticker_ve_da_mua}</span>
          <span className="ticker-sep">·</span>
          <span className="ticker-item">{t.ticker_minh_bach}</span>
        </div>
      </div>
      <main className="main">
        {page === "mua-ve" && <MuaVePage walletAddress={walletAddress} onConnectWallet={() => {}} />}
        {page === "ket-qua" && <KetQuaPage />}
        {page === "ve-cua-toi" && <VeCuaToiPage walletAddress={walletAddress} />}
        {page === "admin" && <AdminPage />}
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <span>Powered by <strong>Shelby</strong> x <strong>Aptos</strong></span>
          <span className="footer-sep">·</span>
          <span>{t.footer_contract} <a href="#" className="footer-link">0xaff0...412c</a></span>
          <span className="footer-sep">·</span>
          <span>{t.footer_random}</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <WalletProvider>
        <AppInner />
      </WalletProvider>
    </LangProvider>
  );
}
