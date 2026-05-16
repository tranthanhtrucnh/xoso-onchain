import { useState } from "react";
import { MuaVePage } from "./components/MuaVePage";
import { KetQuaPage } from "./components/KetQuaPage";
import { VeCuaToiPage } from "./components/VeCuaToiPage";
import { AdminPage } from "./components/AdminPage";
import "./styles/globals.css";

type Page = "mua-ve" | "ket-qua" | "ve-cua-toi" | "admin";

export default function App() {
  const [page, setPage] = useState<Page>("mua-ve");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    // Petra wallet (Aptos)
    if ((window as any).petra) {
      try {
        const response = await (window as any).petra.connect();
        setWalletAddress(response.address);
      } catch (e) {
        console.error("Wallet connect failed", e);
      }
    } else {
      alert("Vui lòng cài Petra Wallet (aptos.dev/wallet)");
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={() => setPage("mua-ve")}>
            <span className="logo-icon">🎴</span>
            <div className="logo-text">
              <span className="logo-main">XỔ SỐ</span>
              <span className="logo-sub">MIỀN NAM · ON-CHAIN</span>
            </div>
          </div>

          <nav className="nav">
            {(["mua-ve", "ket-qua", "ve-cua-toi"] as Page[]).map(p => (
              <button
                key={p}
                className={`nav-btn ${page === p ? "active" : ""}`}
                onClick={() => setPage(p)}
              >
                {{ "mua-ve": "Mua Vé", "ket-qua": "Kết Quả", "ve-cua-toi": "Vé Của Tôi", "admin": "Admin" }[p]}
              </button>
            ))}
          </nav>

          <div className="wallet-area">
            {walletAddress ? (
              <div className="wallet-connected">
                <span className="wallet-dot" />
                <span className="wallet-addr">
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </span>
              </div>
            ) : (
              <button className="connect-btn" onClick={connectWallet}>
                Kết nối ví
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Live ticker */}
      <div className="ticker">
        <div className="ticker-inner">
          <span className="ticker-badge">🔴 TRỰC TIẾP</span>
          <span className="ticker-item">Kỳ #142 · TPHCM · Prize Pool: <strong>2,450 APT</strong></span>
          <span className="ticker-sep">·</span>
          <span className="ticker-item">Đóng vé lúc <strong>18:00</strong> hôm nay</span>
          <span className="ticker-sep">·</span>
          <span className="ticker-item">1,247 vé đã mua</span>
          <span className="ticker-sep">·</span>
          <span className="ticker-item">Kết quả on-chain · 100% minh bạch</span>
        </div>
      </div>

      {/* Main */}
      <main className="main">
        {page === "mua-ve" && <MuaVePage walletAddress={walletAddress} onConnectWallet={connectWallet} />}
        {page === "ket-qua" && <KetQuaPage />}
        {page === "ve-cua-toi" && <VeCuaToiPage walletAddress={walletAddress} />}
        {page === "admin" && <AdminPage />}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <span>Powered by <strong>Shelby</strong> × <strong>Aptos</strong></span>
          <span className="footer-sep">·</span>
          <span>Smart contract: <a href="#" className="footer-link">0x1234…abcd</a></span>
          <span className="footer-sep">·</span>
          <span>Randomness: Aptos VRF · Không thể can thiệp</span>
        </div>
      </footer>
    </div>
  );
}
