import { useState } from "react";

type AdminStep = "idle" | "mo_ky" | "dong_ky" | "cho_vrf" | "ghi_ket_qua" | "doi_soat" | "hoan_tat";

export function AdminPage() {
  const [step, setStep] = useState<AdminStep>("idle");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [kyId, setKyId] = useState(142);

  const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const runStep = async (action: AdminStep, fn: () => Promise<void>) => {
    setLoading(true);
    setStep(action);
    await fn();
    setLoading(false);
  };

  const moKy = () => runStep("mo_ky", async () => {
    addLog("Gọi prize_pool::mo_ky_moi(\"TPHCM\")...");
    await new Promise(r => setTimeout(r, 1200));
    addLog("✅ Kỳ #142 đã mở. Bắt đầu nhận vé.");
    setStep("dong_ky");
  });

  const dongKy = () => runStep("dong_ky", async () => {
    addLog("Gọi prize_pool::dong_ky_va_request_vrf()...");
    await new Promise(r => setTimeout(r, 1000));
    addLog("✅ Kỳ đóng. VRF request submitted.");
    addLog("⏳ Chờ Aptos VRF oracle fulfill...");
    setStep("cho_vrf");
    setTimeout(() => {
      addLog("🎲 Aptos VRF fulfilled! Random bytes nhận được.");
      addLog("   VRF output: 0x" + Math.random().toString(16).slice(2, 18) + "...");
      setStep("ghi_ket_qua");
    }, 2500);
  });

  const ghiKetQua = () => runStep("ghi_ket_qua", async () => {
    addLog("Sinh kết quả từ VRF bytes...");
    await new Promise(r => setTimeout(r, 600));
    addLog("   Giải ĐB:  539214");
    addLog("   Giải Nhất: 39214");
    addLog("   Giải Nhì:  07891 · 42315");
    addLog("   ... (7 giải ba, tư, năm, sáu, bảy, tám)");
    await new Promise(r => setTimeout(r, 600));
    addLog("Gọi prize_pool::ghi_ket_qua()...");
    await new Promise(r => setTimeout(r, 1200));
    addLog("✅ Kết quả ghi on-chain. TX: 0x7f2a1b...3c45");
    addLog("📦 Lưu kết quả lên Shelby Storage...");
    await new Promise(r => setTimeout(r, 500));
    addLog("✅ Shelby blob_id: blob_kq_142_tphcm");
    setStep("doi_soat");
  });

  const doiSoat = () => runStep("doi_soat", async () => {
    addLog("🔍 Bắt đầu đối soát 1,247 vé...");
    addLog("📡 Đọc blob_ids từ Aptos event logs...");
    await new Promise(r => setTimeout(r, 500));
    addLog("📦 shelby.docVeTheoBatch(1247 blobs)...");
    await new Promise(r => setTimeout(r, 1500));
    addLog("✅ Đọc xong 1,247 vé trong 1.2s (Shelby fast-read)");
    addLog("⚙️  Chạy doiSoatBatch()...");
    await new Promise(r => setTimeout(r, 800));
    addLog("📊 Kết quả đối soát:");
    addLog("   - Giải Đặc Biệt: 1 vé");
    addLog("   - Giải Nhất: 0 vé");
    addLog("   - Giải Nhì: 3 vé");
    addLog("   - Giải Ba-Tám: 30 vé");
    addLog("   - Không trúng: 1,213 vé");
    await new Promise(r => setTimeout(r, 400));
    addLog("💰 Đánh dấu 34 vé thắng on-chain...");
    await new Promise(r => setTimeout(r, 1200));
    addLog("✅ Đối soát hoàn tất!");
    addLog("💸 Tổng thưởng: 2,450 APT sẵn sàng để claim");
    setStep("hoan_tat");
  });

  const reset = () => { setStep("idle"); setLog([]); };

  const STEPS_INFO = [
    { id: "idle",       label: "Chờ",          icon: "⏸️" },
    { id: "mo_ky",      label: "Mở kỳ",        icon: "🚀" },
    { id: "dong_ky",    label: "Đóng kỳ",      icon: "🔒" },
    { id: "cho_vrf",    label: "Chờ VRF",       icon: "🎲" },
    { id: "ghi_ket_qua",label: "Ghi kết quả",  icon: "📋" },
    { id: "doi_soat",   label: "Đối soát",      icon: "🔍" },
    { id: "hoan_tat",   label: "Hoàn tất",      icon: "✅" },
  ];

  const currentIdx = STEPS_INFO.findIndex(s => s.id === step);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Quản lý kỳ xổ số · Quyền admin required</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left: Controls */}
        <div>
          {/* Progress */}
          <div className="card mb-16" style={{ marginBottom: 16 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
              Tiến trình kỳ #{kyId}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {STEPS_INFO.slice(1).map((s, i) => (
                <div key={s.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  borderRadius: "var(--radius)",
                  background: currentIdx > i + 1 ? "#D1FAE5" : currentIdx === i + 1 ? "#FEF3C7" : "transparent",
                  border: currentIdx === i + 1 ? "1px solid #FCD34D" : "1px solid transparent",
                }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span style={{
                    fontWeight: currentIdx === i + 1 ? 600 : 400,
                    fontSize: 14,
                    color: currentIdx > i + 1 ? "#065F46" : currentIdx === i + 1 ? "#92400E" : "var(--ink-muted)",
                    flex: 1,
                  }}>
                    {s.label}
                  </span>
                  {currentIdx > i + 1 && <span style={{ color: "#065F46", fontWeight: 600 }}>✓</span>}
                  {currentIdx === i + 1 && loading && (
                    <span style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: "2px solid #FCD34D", borderTopColor: "#92400E",
                      animation: "spin 0.7s linear infinite", display: "inline-block"
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              Thao tác
            </h3>

            <button className="btn-primary" disabled={loading || step !== "idle"} onClick={moKy}
              style={{ fontSize: 15, padding: "12px 24px" }}>
              🚀 Mở kỳ #{kyId}
            </button>

            <button className="btn-primary" disabled={loading || step !== "dong_ky"} onClick={dongKy}
              style={{ fontSize: 15, padding: "12px 24px", background: step === "dong_ky" ? "var(--amber)" : undefined }}>
              🔒 Đóng kỳ & Request VRF
            </button>

            <button className="btn-primary" disabled={loading || step !== "ghi_ket_qua"} onClick={ghiKetQua}
              style={{ fontSize: 15, padding: "12px 24px", background: step === "ghi_ket_qua" ? "#065F46" : undefined }}>
              📋 Ghi kết quả on-chain
            </button>

            <button className="btn-primary" disabled={loading || step !== "doi_soat"} onClick={doiSoat}
              style={{ fontSize: 15, padding: "12px 24px" }}>
              🔍 Đối soát & Đánh dấu thắng
            </button>

            {step === "hoan_tat" && (
              <button className="btn-outline" onClick={reset}>↺ Reset (kỳ mới)</button>
            )}
          </div>
        </div>

        {/* Right: Console log */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            background: "var(--ink)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: 10, color: "#4ade80" }}>●</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              xoso-admin console
            </span>
          </div>
          <div style={{
            background: "#0f1117",
            minHeight: 420,
            padding: 16,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            lineHeight: 1.8,
            overflow: "auto",
            maxHeight: 500,
          }}>
            {log.length === 0 ? (
              <span style={{ color: "rgba(255,255,255,0.3)" }}>
                Chờ lệnh từ admin…<span style={{ animation: "blink-cursor 1s step-end infinite", display: "inline-block" }}>▌</span>
              </span>
            ) : log.map((l, i) => (
              <div key={i} style={{
                color: l.includes("✅") ? "#4ade80" :
                       l.includes("❌") ? "#f87171" :
                       l.includes("⏳") || l.includes("🎲") ? "#fcd34d" :
                       l.includes("📊") || l.includes("💰") || l.includes("💸") ? "#60a5fa" :
                       "rgba(255,255,255,0.8)",
                animation: "fadeInUp 0.2s ease",
              }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 24 }}>
        {[
          { label: "Tổng vé kỳ hiện tại", val: "1,247" },
          { label: "Prize Pool", val: "2,450 APT" },
          { label: "Vé đã đối soát", val: step === "hoan_tat" ? "1,247" : "0" },
          { label: "Trạng thái VRF", val: ["cho_vrf","ghi_ket_qua","doi_soat","hoan_tat"].includes(step) ? "Fulfilled" : "Chờ" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "16px",
            textAlign: "center",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 22, color: "var(--red)" }}>
              {s.val}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
