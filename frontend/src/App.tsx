import { useState } from "react";
import { LangProvider, useLang } from "./i18n";
import { MuaVePage } from "./components/MuaVePage";
import { KetQuaPage } from "./components/KetQuaPage";
import { VeCuaToiPage } from "./components/VeCuaToiPage";
import { AdminPage } from "./components/AdminPage";
import "./styles/globals.css";

type Page = "mua-ve" | "ket-qua" | "ve-cua-toi" | "admin";

function AppInner() {
  const [page, setPage] = useState<Page>("mua-ve");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { lang, t, toggleLang } = useLang();

  const connectWallet = async () => {
    if ((window as any).petra) {
      try {
        const response = await (window as any).petra.connect();
        setWalletAddress(response.address);
      } catch (e) {
        console.error("Wallet connect failed", e);
      }
    } else {
      alert("Please install Petra Wallet at aptos.dev/wallet");
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={() => setPage("mua-ve")}>
            <span className="logo-icon">🎴</span>
            <div className="logo-text">
              <span className="logo-main">
                {lang === "en" ? "MIEN NAM LOTTERY" : "XỔ SỐ MIỀN NAM"}
              </span>
              <span className="logo-sub">ON-CHAIN · SHELBY × APTOS</span>
            </div>
          </div>

          <nav className="nav">
            {(["mua-ve", "ket-qua", "ve-cua-toi"] as Page[]).map(p => (
              <button
                key={p}
                className={`nav-btn ${page === p ? "active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p === "mua-ve" ? t.nav_mua_ve
                  : p === "ket-qua" ? t.nav_ket_qua
                  : t.nav_ve_cua_toi}
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="lang-toggle"
              title={lang === "en" ? "Chuyen sang tieng Viet" : "Switch to English"}
            >
              <span className={lang === "en" ? "lang-active" : "lang-inactive"}>EN</span>
              <span className="lang-divider">|</span>
              <span className={lang === "vi" ? "lang-active" : "lang-inactive"}>VI</span>
            </button>

            {/* Wallet */}
            {walletAddress ? (
              <div className="wallet-connected">
                <span className="wallet-dot" />
                <span className="wallet-addr">
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <button className="connect-btn" onClick={connectWallet}>
                {t.connect_wallet}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Ticker */}
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
        {page === "mua-ve" && <MuaVePage walletAddress={walletAddress} onConnectWallet={connectWallet} />}
        {page === "ket-qua" && <KetQuaPage />}
        {page === "ve-cua-toi" && <VeCuaToiPage walletAddress={walletAddress} />}
        {page === "admin" && <AdminPage />}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>Powered by <strong>Shelby</strong> × <strong>Aptos</strong></span>
          <span className="footer-sep">·</span>
          <span>{t.footer_contract} <a href="#" className="footer-link">0xaff0…412c</a></span>
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
      <AppInner />
    </LangProvider>
  );
}
