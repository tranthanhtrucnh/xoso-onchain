// VeCuaToiPage.tsx
import { useState } from "react";

const MOCK_VES = [
  { id: "ve-001", so: "539214", dai: "TPHCM", ky: 141, status: "won", giai: "Giải Đặc Biệt", thuong: "980 APT", date: "10/05/2025" },
  { id: "ve-002", so: "123456", dai: "TPHCM", ky: 141, status: "lost",  giai: null, thuong: null, date: "10/05/2025" },
  { id: "ve-003", so: "987654", dai: "Đồng Tháp", ky: 140, status: "claimed", giai: "Giải Tám", thuong: "36 APT", date: "09/05/2025" },
  { id: "ve-004", so: "456789", dai: "Cà Mau",    ky: 139, status: "pending", giai: null, thuong: null, date: "08/05/2025" },
];

export function VeCuaToiPage({ walletAddress }: { walletAddress: string | null }) {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    await new Promise(r => setTimeout(r, 1800));
    setClaimingId(null);
    alert("Đã nhận thưởng thành công! TX: 0x" + Math.random().toString(16).slice(2,12));
  };

  if (!walletAddress) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎴</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--red)", marginBottom: 8 }}>
          Kết nối ví để xem vé
        </h2>
        <p style={{ color: "var(--ink-muted)" }}>Bạn cần kết nối Petra Wallet để xem danh sách vé đã mua</p>
      </div>
    );
  }

  const won = MOCK_VES.filter(v => v.status === "won");

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Vé Của Tôi</h1>
        <p className="page-subtitle">{walletAddress.slice(0,10)}…{walletAddress.slice(-8)}</p>
      </div>

      {/* Win banner */}
      {won.length > 0 && (
        <div style={{
          background: "linear-gradient(135deg, #065F46, #047857)",
          borderRadius: "var(--radius-lg)",
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#fff",
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900 }}>
              🎉 Bạn có {won.length} vé trúng thưởng chưa nhận!
            </div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
              Smart contract sẵn sàng chuyển tiền cho bạn
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 24, color: "#FCD34D" }}>
            {won.reduce((s, v) => s + parseFloat(v.thuong || "0"), 0).toFixed(0)} APT
          </div>
        </div>
      )}

      {/* Ticket list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MOCK_VES.map(ve => (
          <div key={ve.id} style={{
            background: "var(--surface)",
            border: `1px solid ${ve.status === "won" ? "var(--gold)" : "var(--border)"}`,
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto auto",
            alignItems: "center",
            gap: 16,
            boxShadow: ve.status === "won" ? "var(--shadow-gold)" : "var(--shadow-sm)",
          }}>
            {/* Số */}
            <div style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "0.12em",
              color: ve.status === "won" ? "var(--red)" : "var(--ink)",
            }}>
              {ve.so}
            </div>

            {/* Info */}
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{ve.dai} · Kỳ #{ve.ky}</div>
              <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{ve.date}</div>
              {ve.giai && (
                <div style={{ marginTop: 4, fontSize: 13, color: "#065F46", fontWeight: 600 }}>
                  🏆 {ve.giai} · {ve.thuong}
                </div>
              )}
            </div>

            {/* Status badge */}
            <div>
              <span className={`badge badge-${
                ve.status === "won" ? "gold" :
                ve.status === "claimed" ? "green" :
                ve.status === "lost" ? "gray" : "blue"
              }`}>
                {{ won: "✦ TRÚNG THƯỞNG", lost: "Không trúng", claimed: "✓ Đã nhận", pending: "⏳ Chờ kết quả" }[ve.status]}
              </span>
            </div>

            {/* Action */}
            <div>
              {ve.status === "won" && (
                <button
                  className="btn-gold"
                  disabled={claimingId === ve.id}
                  onClick={() => handleClaim(ve.id)}
                >
                  {claimingId === ve.id ? (
                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{
                        width: 12, height: 12, borderRadius: "50%",
                        border: "2px solid rgba(139,11,31,0.3)", borderTopColor: "var(--red-dark)",
                        animation: "spin 0.7s linear infinite", display: "inline-block"
                      }} />
                      Đang nhận…
                    </span>
                  ) : "💰 Nhận thưởng"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: "16px", background: "var(--surface-2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--ink-muted)", display: "flex", gap: 8 }}>
        <span>📦</span>
        <span>Tất cả vé được lưu trữ trên <strong>Shelby decentralized storage</strong> · Không thể xóa hay sửa · Có giá trị vĩnh viễn.</span>
      </div>
    </div>
  );
}
