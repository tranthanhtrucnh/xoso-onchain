import { useState, useCallback } from "react";
import "./MuaVePage.css";

type DaiId =
  | "TPHCM" | "DONG_THAP" | "CA_MAU" | "BEN_TRE" | "VUNG_TAU"
  | "AN_GIANG" | "BINH_THUAN" | "VINH_LONG" | "LONG_AN" | "CAN_THO";

const DAI_LIST: { id: DaiId; name: string; ngay: string }[] = [
  { id: "TPHCM",      name: "TP. Hồ Chí Minh", ngay: "Thứ 7" },
  { id: "DONG_THAP",  name: "Đồng Tháp",         ngay: "Thứ 2" },
  { id: "CA_MAU",     name: "Cà Mau",             ngay: "Thứ 2" },
  { id: "BEN_TRE",    name: "Bến Tre",            ngay: "Thứ 3" },
  { id: "VUNG_TAU",   name: "Vũng Tàu",           ngay: "Thứ 3" },
  { id: "AN_GIANG",   name: "An Giang",            ngay: "Thứ 5" },
  { id: "BINH_THUAN", name: "Bình Thuận",          ngay: "Thứ 5" },
  { id: "VINH_LONG",  name: "Vĩnh Long",           ngay: "Thứ 6" },
  { id: "LONG_AN",    name: "Long An",             ngay: "Thứ 6" },
  { id: "CAN_THO",    name: "Cần Thơ",             ngay: "Thứ 4" },
];

const GIAI_LIST = [
  { ten: "Giải Đặc Biệt", so_chu_so: 6, pct: "40%",  thuong: "~980 APT" },
  { ten: "Giải Nhất",     so_chu_so: 5, pct: "15%",  thuong: "~368 APT" },
  { ten: "Giải Nhì",      so_chu_so: 5, pct: "10%",  thuong: "~122 APT × 2" },
  { ten: "Giải Ba",       so_chu_so: 5, pct: "8%",   thuong: "~28 APT × 7" },
  { ten: "Giải Tư",       so_chu_so: 4, pct: "7%",   thuong: "~24 APT × 7" },
  { ten: "Giải Năm",      so_chu_so: 4, pct: "6%",   thuong: "~24 APT × 6" },
  { ten: "Giải Sáu",      so_chu_so: 3, pct: "5%",   thuong: "~40 APT × 3" },
  { ten: "Giải Bảy",      so_chu_so: 3, pct: "4%",   thuong: "~24 APT × 4" },
  { ten: "Giải Tám",      so_chu_so: 2, pct: "3%",   thuong: "~36 APT × 2" },
];

interface Props {
  walletAddress: string | null;
  onConnectWallet: () => void;
}

type Step = "chon-so" | "chon-dai" | "xac-nhan" | "thanh-cong";

export function MuaVePage({ walletAddress, onConnectWallet }: Props) {
  const [soChon, setSoChon] = useState("");
  const [daiChon, setDaiChon] = useState<DaiId | null>(null);
  const [step, setStep] = useState<Step>("chon-so");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ticket_id: string; blob_id: string; tx: string } | null>(null);
  const [error, setError] = useState("");

  const handleSoInput = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setSoChon(clean);
    setError("");
  };

  const randomSo = () => {
    const r = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    setSoChon(r);
    setError("");
  };

  const canProceed =
    step === "chon-so" ? soChon.length === 6 :
    step === "chon-dai" ? daiChon !== null : true;

  const nextStep = () => {
    if (step === "chon-so") setStep("chon-dai");
    else if (step === "chon-dai") setStep("xac-nhan");
  };

  const prevStep = () => {
    if (step === "chon-dai") setStep("chon-so");
    else if (step === "xac-nhan") setStep("chon-dai");
  };

  const submitMuaVe = useCallback(async () => {
    if (!walletAddress || !daiChon) return;
    setLoading(true);
    setError("");

    try {
      // Giả lập delay (thực tế gọi XoSoService.muaVe)
      await new Promise(r => setTimeout(r, 2200));

      // Mock result
      const ticket_id = crypto.randomUUID();
      setResult({
        ticket_id,
        blob_id: "shelby_blob_" + Math.random().toString(36).slice(2, 10),
        tx: "0x" + Math.random().toString(16).slice(2, 18) + "...",
      });
      setStep("thanh-cong");
    } catch (e: any) {
      setError(e.message ?? "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, [walletAddress, daiChon, soChon]);

  const reset = () => {
    setSoChon(""); setDaiChon(null); setStep("chon-so");
    setResult(null); setError("");
  };

  return (
    <div className="mua-ve-layout">
      {/* LEFT: Main form */}
      <div className="mua-ve-main fade-in">
        {/* Step indicator */}
        {step !== "thanh-cong" && (
          <div className="steps-row">
            {(["chon-so", "chon-dai", "xac-nhan"] as Step[]).map((s, i) => (
              <div key={s} className={`step-item ${step === s ? "active" : i < ["chon-so","chon-dai","xac-nhan"].indexOf(step) ? "done" : ""}`}>
                <div className="step-dot">{i < ["chon-so","chon-dai","xac-nhan"].indexOf(step) ? "✓" : i + 1}</div>
                <span className="step-label">{{ "chon-so": "Chọn số", "chon-dai": "Chọn đài", "xac-nhan": "Xác nhận" }[s]}</span>
              </div>
            ))}
          </div>
        )}

        {/* ===================== STEP 1: Chọn số ===================== */}
        {step === "chon-so" && (
          <div className="step-panel fade-in">
            <div className="page-header">
              <h1 className="page-title">Chọn số</h1>
              <p className="page-subtitle">Nhập 6 chữ số bạn muốn mua · Giá: <strong>0.0001 APT / vé</strong></p>
            </div>

            <div className="number-input-wrapper">
              <div className="number-display">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`digit-box ${i < soChon.length ? "filled" : ""} ${i === soChon.length ? "cursor" : ""}`}>
                    {soChon[i] ?? ""}
                  </div>
                ))}
              </div>
              <input
                className="number-hidden-input"
                type="tel"
                inputMode="numeric"
                maxLength={6}
                value={soChon}
                onChange={e => handleSoInput(e.target.value)}
                autoFocus
                placeholder=""
              />
            </div>

            <div className="number-actions">
              <button className="btn-outline" onClick={randomSo}>
                🎲 Chọn ngẫu nhiên
              </button>
              <button className="btn-outline" onClick={() => setSoChon("")}>
                ✕ Xóa
              </button>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button
              className="btn-primary mt-24"
              disabled={!canProceed}
              onClick={nextStep}
            >
              TIẾP THEO →
            </button>

            <p className="hint-text mt-16">
              Số vé được lưu bảo mật trên <strong>Shelby</strong> · Mã hóa bởi Aptos blockchain
            </p>
          </div>
        )}

        {/* ===================== STEP 2: Chọn đài ===================== */}
        {step === "chon-dai" && (
          <div className="step-panel fade-in">
            <div className="page-header">
              <h1 className="page-title">Chọn đài</h1>
              <p className="page-subtitle">Số đã chọn: <span className="so-hien-thi">{soChon}</span></p>
            </div>

            <div className="dai-grid">
              {DAI_LIST.map(d => (
                <button
                  key={d.id}
                  className={`dai-card ${daiChon === d.id ? "selected" : ""}`}
                  onClick={() => setDaiChon(d.id)}
                >
                  <span className="dai-name">{d.name}</span>
                  <span className="dai-ngay">{d.ngay}</span>
                  {daiChon === d.id && <span className="dai-check">✓</span>}
                </button>
              ))}
            </div>

            <div className="nav-buttons mt-24">
              <button className="btn-outline" onClick={prevStep}>← Quay lại</button>
              <button className="btn-primary flex-1" disabled={!canProceed} onClick={nextStep}>
                TIẾP THEO →
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 3: Xác nhận ===================== */}
        {step === "xac-nhan" && (
          <div className="step-panel fade-in">
            <div className="page-header">
              <h1 className="page-title">Xác nhận</h1>
              <p className="page-subtitle">Kiểm tra lại thông tin trước khi thanh toán</p>
            </div>

            <div className="confirm-card card-gold">
              <div className="confirm-row">
                <span className="confirm-label">Số đã chọn</span>
                <span className="confirm-value-big">{soChon}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Đài</span>
                <span className="confirm-value">{DAI_LIST.find(d => d.id === daiChon)?.name}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Kỳ quay</span>
                <span className="confirm-value">#142 · Hôm nay lúc 18:00</span>
              </div>
              <hr className="divider-gold" />
              <div className="confirm-row">
                <span className="confirm-label">Giá vé</span>
                <span className="confirm-value"><strong>0.0001 APT</strong></span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Lưu trữ</span>
                <span className="confirm-value text-sm">Shelby decentralized storage</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Xác nhận</span>
                <span className="confirm-value text-sm">Aptos blockchain · On-chain</span>
              </div>
            </div>

            {!walletAddress ? (
              <div className="no-wallet-prompt mt-24">
                <p className="mb-16 text-muted">Bạn cần kết nối ví để thanh toán</p>
                <button className="btn-gold" style={{ width: "100%" }} onClick={onConnectWallet}>
                  🔗 Kết nối Petra Wallet
                </button>
              </div>
            ) : (
              <>
                <div className="wallet-info mt-16">
                  <span className="badge badge-green">● Đã kết nối</span>
                  <span className="text-mono text-sm text-muted ml-8">
                    {walletAddress.slice(0,8)}…{walletAddress.slice(-6)}
                  </span>
                </div>

                {error && <div className="error-msg mt-16">{error}</div>}

                <div className="nav-buttons mt-24">
                  <button className="btn-outline" onClick={prevStep} disabled={loading}>← Quay lại</button>
                  <button
                    className="btn-primary flex-1"
                    disabled={loading}
                    onClick={submitMuaVe}
                  >
                    {loading ? (
                      <span className="loading-text">
                        <span className="spinner" />
                        Đang xử lý…
                      </span>
                    ) : "💳 THANH TOÁN & MUA VÉ"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================== STEP 4: Thành công ===================== */}
        {step === "thanh-cong" && result && (
          <div className="step-panel success-panel fade-in">
            <div className="success-icon">🎉</div>
            <h1 className="page-title" style={{ textAlign: "center", color: "#065F46" }}>
              Mua vé thành công!
            </h1>
            <p className="page-subtitle" style={{ textAlign: "center" }}>
              Vé của bạn đã được lưu on-chain và Shelby storage
            </p>

            <div className="success-ticket card-gold mt-24">
              <div className="ticket-header">
                <span className="ticket-label">SỐ ĐÃ MUA</span>
              </div>
              <div className="ticket-number-row">
                {soChon.split("").map((d, i) => (
                  <div key={i} className="number-ball" style={{ animationDelay: `${i * 0.1}s` }}>
                    {d}
                  </div>
                ))}
              </div>
              <div className="ticket-footer">
                <div className="ticket-info-row">
                  <span>Đài:</span>
                  <strong>{DAI_LIST.find(d => d.id === daiChon)?.name}</strong>
                </div>
                <div className="ticket-info-row">
                  <span>Kỳ quay:</span>
                  <strong>#142 · 18:00 hôm nay</strong>
                </div>
                <hr className="divider-gold" />
                <div className="ticket-info-row">
                  <span className="text-sm text-muted">Ticket ID:</span>
                  <span className="text-mono text-xs text-muted">{result.ticket_id.slice(0, 18)}…</span>
                </div>
                <div className="ticket-info-row">
                  <span className="text-sm text-muted">Shelby Blob:</span>
                  <span className="text-mono text-xs text-muted">{result.blob_id}</span>
                </div>
                <div className="ticket-info-row">
                  <span className="text-sm text-muted">Aptos TX:</span>
                  <span className="text-mono text-xs" style={{ color: "#1E40AF" }}>{result.tx}</span>
                </div>
              </div>
            </div>

            <div className="success-actions mt-24">
              <button className="btn-gold" onClick={reset}>
                🎫 Mua thêm vé
              </button>
              <button className="btn-outline">
                📋 Xem vé của tôi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Prize table */}
      <div className="mua-ve-sidebar fade-in fade-in-delay-2">
        <div className="card">
          <div className="sidebar-header">
            <h3 className="text-display" style={{ fontSize: 20, fontWeight: 900, color: "var(--red)" }}>
              CƠ CẤU GIẢI THƯỞNG
            </h3>
            <p className="text-sm text-muted">Kỳ #142 · Prize Pool: <strong style={{ color: "var(--red)" }}>2,450 APT</strong></p>
          </div>
          <table className="giai-table mt-16">
            <thead>
              <tr>
                <th>Giải</th>
                <th>Số cuối</th>
                <th>Thưởng</th>
              </tr>
            </thead>
            <tbody>
              {GIAI_LIST.map((g, i) => (
                <tr key={i}>
                  <td><span className="giai-name">{g.ten}</span></td>
                  <td><span className="giai-so">{g.so_chu_so} số</span></td>
                  <td>
                    <strong style={{ color: i === 0 ? "var(--red)" : "var(--ink)", fontSize: i === 0 ? 15 : 13 }}>
                      {g.thuong}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card mt-16">
          <h3 className="text-display" style={{ fontSize: 16, fontWeight: 900, color: "var(--ink-soft)", marginBottom: 12 }}>
            🔐 ĐẢM BẢO MINH BẠCH
          </h3>
          <div className="trust-items">
            {[
              { icon: "🎲", title: "Aptos VRF", desc: "Số ngẫu nhiên xác minh được, không ai can thiệp" },
              { icon: "📦", title: "Shelby Storage", desc: "Vé lưu phi tập trung, không mất, không sửa" },
              { icon: "⛓️", title: "On-chain proof", desc: "Mọi giao dịch công khai trên Aptos blockchain" },
              { icon: "⚡", title: "Tự động chi thưởng", desc: "Smart contract tự gửi tiền, không cần đến nhận" },
            ].map((t, i) => (
              <div key={i} className="trust-item">
                <span className="trust-icon">{t.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
                  <div className="text-sm text-muted">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
