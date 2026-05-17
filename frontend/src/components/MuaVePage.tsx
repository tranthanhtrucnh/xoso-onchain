import { useState, useCallback } from "react";
import { useLang } from "../i18n";

type DaiId =
  | "TPHCM" | "DONG_THAP" | "CA_MAU" | "BEN_TRE" | "VUNG_TAU"
  | "AN_GIANG" | "BINH_THUAN" | "VINH_LONG" | "LONG_AN" | "CAN_THO";

const DAI_LIST: { id: DaiId; name_vi: string; name_en: string; ngay_vi: string; ngay_en: string }[] = [
  { id: "TPHCM",      name_vi: "TP. Hồ Chí Minh", name_en: "Ho Chi Minh City", ngay_vi: "Thứ 7",  ngay_en: "Saturday" },
  { id: "DONG_THAP",  name_vi: "Đồng Tháp",        name_en: "Dong Thap",        ngay_vi: "Thứ 2",  ngay_en: "Monday" },
  { id: "CA_MAU",     name_vi: "Cà Mau",            name_en: "Ca Mau",           ngay_vi: "Thứ 2",  ngay_en: "Monday" },
  { id: "BEN_TRE",    name_vi: "Bến Tre",           name_en: "Ben Tre",          ngay_vi: "Thứ 3",  ngay_en: "Tuesday" },
  { id: "VUNG_TAU",   name_vi: "Vũng Tàu",          name_en: "Vung Tau",         ngay_vi: "Thứ 3",  ngay_en: "Tuesday" },
  { id: "AN_GIANG",   name_vi: "An Giang",           name_en: "An Giang",         ngay_vi: "Thứ 5",  ngay_en: "Thursday" },
  { id: "BINH_THUAN", name_vi: "Bình Thuận",         name_en: "Binh Thuan",       ngay_vi: "Thứ 5",  ngay_en: "Thursday" },
  { id: "VINH_LONG",  name_vi: "Vĩnh Long",          name_en: "Vinh Long",        ngay_vi: "Thứ 6",  ngay_en: "Friday" },
  { id: "LONG_AN",    name_vi: "Long An",            name_en: "Long An",          ngay_vi: "Thứ 6",  ngay_en: "Friday" },
  { id: "CAN_THO",    name_vi: "Cần Thơ",            name_en: "Can Tho",          ngay_vi: "Thứ 4",  ngay_en: "Wednesday" },
];

const GIAI_LIST = [
  { ten_vi: "Giải Đặc Biệt", ten_en: "Jackpot",   so_chu_so: 6, thuong: "~980 APT" },
  { ten_vi: "Giải Nhất",     ten_en: "1st Prize",  so_chu_so: 5, thuong: "~368 APT" },
  { ten_vi: "Giải Nhì",      ten_en: "2nd Prize",  so_chu_so: 5, thuong: "~122 APT × 2" },
  { ten_vi: "Giải Ba",       ten_en: "3rd Prize",  so_chu_so: 5, thuong: "~28 APT × 7" },
  { ten_vi: "Giải Tư",       ten_en: "4th Prize",  so_chu_so: 4, thuong: "~24 APT × 7" },
  { ten_vi: "Giải Năm",      ten_en: "5th Prize",  so_chu_so: 4, thuong: "~24 APT × 6" },
  { ten_vi: "Giải Sáu",      ten_en: "6th Prize",  so_chu_so: 3, thuong: "~40 APT × 3" },
  { ten_vi: "Giải Bảy",      ten_en: "7th Prize",  so_chu_so: 3, thuong: "~24 APT × 4" },
  { ten_vi: "Giải Tám",      ten_en: "8th Prize",  so_chu_so: 2, thuong: "~36 APT × 2" },
];

interface Props {
  walletAddress: string | null;
  onConnectWallet: () => void;
}

type Step = "chon-so" | "chon-dai" | "xac-nhan" | "thanh-cong";

export function MuaVePage({ walletAddress, onConnectWallet }: Props) {
  const { lang, t } = useLang();
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
      await new Promise(r => setTimeout(r, 2200));
      const ticket_id = crypto.randomUUID();
      setResult({
        ticket_id,
        blob_id: "shelby_blob_" + Math.random().toString(36).slice(2, 10),
        tx: "0x" + Math.random().toString(16).slice(2, 18) + "...",
      });
      setStep("thanh-cong");
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [walletAddress, daiChon, soChon]);

  const reset = () => {
    setSoChon(""); setDaiChon(null); setStep("chon-so");
    setResult(null); setError("");
  };

  const daiSelected = DAI_LIST.find(d => d.id === daiChon);
  const daiName = daiSelected ? (lang === "vi" ? daiSelected.name_vi : daiSelected.name_en) : "";

  const STEP_LABELS = [t.chon_so_title, t.chon_dai, t.xac_nhan];

  return (
    <div className="mua-ve-layout">
      {/* LEFT */}
      <div className="mua-ve-main fade-in">

        {/* Steps */}
        {step !== "thanh-cong" && (
          <div className="steps-row">
            {(["chon-so", "chon-dai", "xac-nhan"] as Step[]).map((s, i) => {
              const currentIdx = ["chon-so", "chon-dai", "xac-nhan"].indexOf(step);
              return (
                <div key={s} className={`step-item ${step === s ? "active" : i < currentIdx ? "done" : ""}`}>
                  <div className="step-dot">{i < currentIdx ? "✓" : i + 1}</div>
                  <span className="step-label">{STEP_LABELS[i]}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 1 */}
        {step === "chon-so" && (
          <div className="step-panel fade-in">
            <div className="page-header">
              <h1 className="page-title">{t.chon_so_title}</h1>
              <p className="page-subtitle">{t.chon_so_sub} <strong>0.0001 APT / {lang === "vi" ? "vé" : "ticket"}</strong></p>
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
              />
            </div>
            <div className="number-actions">
              <button className="btn-outline" onClick={randomSo}>{t.chon_ngau_nhien}</button>
              <button className="btn-outline" onClick={() => setSoChon("")}>{t.xoa}</button>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button className="btn-primary mt-24" disabled={!canProceed} onClick={nextStep}>
              {t.tiep_theo}
            </button>
            <p className="hint-text mt-16">{t.hint}</p>
          </div>
        )}

        {/* STEP 2 */}
        {step === "chon-dai" && (
          <div className="step-panel fade-in">
            <div className="page-header">
              <h1 className="page-title">{t.chon_dai}</h1>
              <p className="page-subtitle">
                {t.chon_dai_sub} <span className="so-hien-thi">{soChon}</span>
              </p>
            </div>
            <div className="dai-grid">
              {DAI_LIST.map(d => (
                <button
                  key={d.id}
                  className={`dai-card ${daiChon === d.id ? "selected" : ""}`}
                  onClick={() => setDaiChon(d.id)}
                >
                  <span className="dai-name">{lang === "vi" ? d.name_vi : d.name_en}</span>
                  <span className="dai-ngay">{lang === "vi" ? d.ngay_vi : d.ngay_en}</span>
                  {daiChon === d.id && <span className="dai-check">✓</span>}
                </button>
              ))}
            </div>
            <div className="nav-buttons mt-24">
              <button className="btn-outline" onClick={prevStep}>{t.quay_lai}</button>
              <button className="btn-primary flex-1" disabled={!canProceed} onClick={nextStep}>
                {t.tiep_theo}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === "xac-nhan" && (
          <div className="step-panel fade-in">
            <div className="page-header">
              <h1 className="page-title">{t.xac_nhan}</h1>
              <p className="page-subtitle">{t.xac_nhan_sub}</p>
            </div>
            <div className="confirm-card card-gold">
              <div className="confirm-row">
                <span className="confirm-label">{t.so_da_chon}</span>
                <span className="confirm-value-big">{soChon}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">{lang === "vi" ? "Đài" : "Province"}</span>
                <span className="confirm-value">{daiName}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">{t.ky_quay}</span>
                <span className="confirm-value">#142 · {lang === "vi" ? "Hôm nay 18:00" : "Today 18:00"}</span>
              </div>
              <hr className="divider-gold" />
              <div className="confirm-row">
                <span className="confirm-label">{t.gia_ve}</span>
                <span className="confirm-value"><strong>0.0001 APT</strong></span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">{t.luu_tru}</span>
                <span className="confirm-value text-sm">Shelby decentralized storage</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">{lang === "vi" ? "Xác nhận" : "Confirmation"}</span>
                <span className="confirm-value text-sm">Aptos blockchain · On-chain</span>
              </div>
            </div>

            {!walletAddress ? (
              <div className="no-wallet-prompt mt-24">
                <p className="mb-16 text-muted">{t.ket_noi_vi}</p>
                <button className="btn-gold" style={{ width: "100%" }} onClick={onConnectWallet}>
                  🔗 {t.connect_wallet}
                </button>
              </div>
            ) : (
              <>
                <div className="wallet-info mt-16">
                  <span className="badge badge-green">● {lang === "vi" ? "Đã kết nối" : "Connected"}</span>
                  <span className="text-mono text-sm text-muted" style={{ marginLeft: 8 }}>
                    {walletAddress.slice(0, 8)}…{walletAddress.slice(-6)}
                  </span>
                </div>
                {error && <div className="error-msg mt-16">{error}</div>}
                <div className="nav-buttons mt-24">
                  <button className="btn-outline" onClick={prevStep} disabled={loading}>{t.quay_lai}</button>
                  <button className="btn-primary flex-1" disabled={loading} onClick={submitMuaVe}>
                    {loading ? (
                      <span className="loading-text">
                        <span className="spinner" />
                        {lang === "vi" ? "Đang xử lý…" : "Processing…"}
                      </span>
                    ) : t.thanh_toan}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 4 */}
        {step === "thanh-cong" && result && (
          <div className="step-panel success-panel fade-in">
            <div className="success-icon">🎉</div>
            <h1 className="page-title" style={{ textAlign: "center", color: "#065F46" }}>
              {t.mua_thanh_cong}
            </h1>
            <p className="page-subtitle" style={{ textAlign: "center" }}>
              {t.mua_thanh_cong_sub}
            </p>
            <div className="success-ticket card-gold mt-24">
              <div className="ticket-header">
                <span className="ticket-label">{t.so_da_mua} · {lang === "vi" ? "KỲ" : "ROUND"} #142</span>
              </div>
              <div className="ticket-number-row">
                {soChon.split("").map((d, i) => (
                  <div key={i} className="number-ball" style={{ animationDelay: `${i * 0.1}s` }}>{d}</div>
                ))}
              </div>
              <div className="ticket-footer">
                <div className="ticket-info-row">
                  <span>{lang === "vi" ? "Đài:" : "Province:"}</span>
                  <strong>{daiName}</strong>
                </div>
                <div className="ticket-info-row">
                  <span>{t.ky_quay}:</span>
                  <strong>#142 · 18:00 {t.today}</strong>
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
              <button className="btn-gold" onClick={reset}>{t.mua_them}</button>
              <button className="btn-outline">{t.xem_ve}</button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="mua-ve-sidebar fade-in fade-in-delay-2">
        <div className="card">
          <div className="sidebar-header">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900, color: "var(--red)" }}>
              {t.co_cau_giai}
            </h3>
            <p className="text-sm text-muted">
              {lang === "vi" ? "Kỳ #142 · Prize Pool:" : "Round #142 · Prize Pool:"} <strong style={{ color: "var(--red)" }}>2,450 APT</strong>
            </p>
          </div>
          <table className="giai-table mt-16">
            <thead>
              <tr>
                <th>{t.giai}</th>
                <th>{t.so_cuoi}</th>
                <th>{t.thuong}</th>
              </tr>
            </thead>
            <tbody>
              {GIAI_LIST.map((g, i) => (
                <tr key={i}>
                  <td><span className="giai-name">{lang === "vi" ? g.ten_vi : g.ten_en}</span></td>
                  <td><span className="giai-so">{g.so_chu_so} {lang === "vi" ? "số" : "digits"}</span></td>
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
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 16, color: "var(--ink-soft)", marginBottom: 12 }}>
            {t.dam_bao}
          </h3>
          <div className="trust-items">
            {[
              { icon: "🎲", title: "Aptos VRF", desc: t.vrf_desc },
              { icon: "📦", title: "Shelby Storage", desc: t.shelby_desc },
              { icon: "⛓️", title: "On-chain proof", desc: t.onchain_desc },
              { icon: "⚡", title: lang === "vi" ? "Tự động chi thưởng" : "Auto Payout", desc: t.auto_desc },
            ].map((item, i) => (
              <div key={i} className="trust-item">
                <span className="trust-icon">{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                  <div className="text-sm text-muted">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
