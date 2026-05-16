import { useState, useEffect } from "react";
import "./KetQuaPage.css";

// Mock data kết quả
const MOCK_KET_QUA = {
  ky_id: 141,
  dai: "TP. Hồ Chí Minh",
  ngay: "Thứ 7, 10/05/2025 · 18:15",
  dac_biet: "539214",
  nhat: "39214",
  nhi: ["07891", "42315"],
  ba: ["56789", "67801", "23145", "98765", "12340", "87654", "34512"],
  tu: ["6789", "0123", "4567", "8901", "2345", "6789", "0134"],
  nam: ["1234", "5678", "9012", "3456", "7890", "1235"],
  sau: ["345", "789", "012"],
  bay: ["456", "890", "123", "567"],
  tam: ["56", "90"],
  vrf_proof: "0xab3f4c...e891",
  aptos_tx: "0x7f2a1b...3c45",
};

export function KetQuaPage() {
  const [kySelected, setKySelected] = useState(141);
  const [isLoading, setIsLoading] = useState(false);
  const [revealIndex, setRevealIndex] = useState(-1);

  // Animate reveal các giải từ dưới lên
  useEffect(() => {
    setRevealIndex(-1);
    const timer = setInterval(() => {
      setRevealIndex(prev => {
        if (prev >= 8) { clearInterval(timer); return prev; }
        return prev + 1;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [kySelected]);

  const loadKy = (id: number) => {
    setIsLoading(true);
    setKySelected(id);
    setTimeout(() => setIsLoading(false), 800);
  };

  const giai_rows = [
    { label: "Giải Tám",      color: "gray",  values: MOCK_KET_QUA.tam,     idx: 8 },
    { label: "Giải Bảy",      color: "gray",  values: MOCK_KET_QUA.bay,     idx: 7 },
    { label: "Giải Sáu",      color: "gray",  values: MOCK_KET_QUA.sau,     idx: 6 },
    { label: "Giải Năm",      color: "amber", values: MOCK_KET_QUA.nam,     idx: 5 },
    { label: "Giải Tư",       color: "amber", values: MOCK_KET_QUA.tu,      idx: 4 },
    { label: "Giải Ba",       color: "amber", values: MOCK_KET_QUA.ba,      idx: 3 },
    { label: "Giải Nhì",      color: "gold",  values: MOCK_KET_QUA.nhi,     idx: 2 },
    { label: "Giải Nhất",     color: "gold",  values: [MOCK_KET_QUA.nhat],  idx: 1 },
  ];

  return (
    <div className="ket-qua-layout">
      {/* Sidebar: chọn kỳ */}
      <div className="ky-selector fade-in">
        <div className="card">
          <h3 className="ky-selector-title">Kỳ quay</h3>
          <div className="ky-list">
            {[141, 140, 139, 138, 137].map(k => (
              <button
                key={k}
                className={`ky-item ${kySelected === k ? "active" : ""}`}
                onClick={() => loadKy(k)}
              >
                <span className="ky-num">#{k}</span>
                <span className="ky-info">
                  {k === 141 ? "TPHCM · 10/05" :
                   k === 140 ? "Đồng Tháp · 09/05" :
                   k === 139 ? "Cà Mau · 08/05" :
                   k === 138 ? "Bến Tre · 07/05" :
                               "Vũng Tàu · 06/05"}
                </span>
                {k === 141 && <span className="badge badge-red" style={{ fontSize: 9 }}>MỚI</span>}
              </button>
            ))}
          </div>
        </div>

        {/* VRF Proof */}
        <div className="card mt-16">
          <h3 className="trust-title">🔐 Xác minh kết quả</h3>
          <div className="trust-info">
            <div className="trust-row">
              <span className="trust-key">VRF Proof</span>
              <span className="trust-val mono">{MOCK_KET_QUA.vrf_proof}</span>
            </div>
            <div className="trust-row">
              <span className="trust-key">Aptos TX</span>
              <a href="#" className="trust-val mono link">{MOCK_KET_QUA.aptos_tx}</a>
            </div>
            <div className="trust-row">
              <span className="trust-key">Thời gian</span>
              <span className="trust-val">18:15:42 UTC+7</span>
            </div>
          </div>
          <button className="btn-outline mt-12" style={{ width: "100%", fontSize: 12 }}>
            🔍 Verify trên Aptos Explorer
          </button>
        </div>
      </div>

      {/* Main: kết quả */}
      <div className="ket-qua-main fade-in">
        <div className="ket-qua-header">
          <div>
            <h1 className="page-title">Kết Quả</h1>
            <p className="page-subtitle">{MOCK_KET_QUA.dai} · {MOCK_KET_QUA.ngay}</p>
          </div>
          <div className="ky-badge">Kỳ #{kySelected}</div>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="loading-balls">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ width: 52, height: 52, borderRadius: "50%", animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <p className="text-muted text-sm mt-16">Đang tải kết quả từ Shelby…</p>
          </div>
        ) : (
          <>
            {/* Giải Đặc Biệt */}
            <div className={`dac-biet-section ${revealIndex >= 0 ? "revealed" : ""}`}>
              <div className="dac-biet-label">
                <span className="giai-icon">🏆</span>
                GIẢI ĐẶC BIỆT
              </div>
              <div className="dac-biet-balls">
                {MOCK_KET_QUA.dac_biet.split("").map((d, i) => (
                  <div
                    key={i}
                    className="number-ball dac-biet-ball"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="dac-biet-full">{MOCK_KET_QUA.dac_biet}</div>
            </div>

            {/* Các giải còn lại */}
            <div className="giai-table-wrapper">
              <table className="giai-result-table">
                <thead>
                  <tr>
                    <th className="col-ten">Giải</th>
                    <th className="col-so">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {giai_rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={`giai-row ${row.color} ${revealIndex >= (8 - rowIdx) ? "row-revealed" : ""}`}
                      style={{ transitionDelay: `${rowIdx * 0.05}s` }}
                    >
                      <td className="col-ten">
                        <span className={`giai-label giai-${row.color}`}>{row.label}</span>
                      </td>
                      <td className="col-so">
                        <div className="so-list">
                          {row.values.map((v, vi) => (
                            <span key={vi} className={`so-chip so-chip-${row.color}`}>{v}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Thống kê */}
            <div className="stats-row mt-24">
              <div className="stat-card">
                <div className="stat-num">1,247</div>
                <div className="stat-label">Tổng vé</div>
              </div>
              <div className="stat-card">
                <div className="stat-num" style={{ color: "var(--red)" }}>34</div>
                <div className="stat-label">Vé trúng</div>
              </div>
              <div className="stat-card">
                <div className="stat-num" style={{ color: "var(--gold)" }}>2,450</div>
                <div className="stat-label">APT đã thưởng</div>
              </div>
              <div className="stat-card">
                <div className="stat-num" style={{ color: "#065F46" }}>100%</div>
                <div className="stat-label">Đã chi thưởng</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
