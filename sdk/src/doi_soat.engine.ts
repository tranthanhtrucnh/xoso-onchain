/**
 * DoiSoatEngine
 * Logic đối soát kết quả xổ số
 * Đọc vé từ Shelby → so sánh với kết quả → xác định giải
 *
 * Cơ cấu giải xổ số miền Nam:
 * - Giải ĐB:  6 số cuối khớp hoàn toàn với dãy đặc biệt
 * - Giải Nhất: 5 số cuối khớp với giải nhất
 * - Giải Nhì:  5 số cuối khớp với 1 trong 2 dãy giải nhì
 * - Giải Ba:   5 số cuối khớp với 1 trong 7 dãy giải ba
 * - Giải Tư:   4 số cuối khớp với 1 trong 7 dãy giải tư
 * - Giải Năm:  4 số cuối khớp với 1 trong 6 dãy giải năm
 * - Giải Sáu:  3 số cuối khớp với 1 trong 3 dãy giải sáu
 * - Giải Bảy:  3 số cuối khớp với 1 trong 4 dãy giải bảy
 * - Giải Tám:  2 số cuối khớp với 1 trong 2 dãy giải tám
 */

import type { VeSo, KetQuaKy, DoiSoatResult, GiaiThuong } from "../types/index.js";

// Tỷ lệ % mỗi giải (basis points / 10000)
const PRIZE_PCT: Record<GiaiThuong, number> = {
  dac_biet: 4000,
  nhat:     1500,
  nhi:      500,   // 1000 / 2 dãy
  ba:       114,   // 800  / 7 dãy
  tu:       100,   // 700  / 7 dãy
  nam:      100,   // 600  / 6 dãy
  sau:      167,   // 500  / 3 dãy
  bay:      100,   // 400  / 4 dãy
  tam:      150,   // 300  / 2 dãy
};

export class DoiSoatEngine {
  /**
   * Đối soát 1 vé với kết quả kỳ
   */
  doiSoat(ve: VeSo, ket_qua: KetQuaKy): DoiSoatResult {
    const so = ve.so_chon;

    // Giải Đặc Biệt - 6 số khớp hoàn toàn
    if (this.khopNSoCuoi(so, ket_qua.dac_biet, 6)) {
      return this.taoKetQua(ve.ticket_id, true, "dac_biet",
        "🎉 TRÚNG GIẢI ĐẶC BIỆT - Khớp hoàn toàn 6 số!");
    }

    // Giải Nhất - 5 số cuối
    if (this.khopNSoCuoi(so, ket_qua.nhat, 5)) {
      return this.taoKetQua(ve.ticket_id, true, "nhat",
        "🥇 Trúng Giải Nhất - 5 số cuối khớp");
    }

    // Giải Nhì - 5 số cuối, 2 dãy
    for (const day of ket_qua.nhi) {
      if (this.khopNSoCuoi(so, day, 5)) {
        return this.taoKetQua(ve.ticket_id, true, "nhi",
          `🥈 Trúng Giải Nhì - 5 số cuối khớp dãy ${day}`);
      }
    }

    // Giải Ba - 5 số cuối, 7 dãy
    for (const day of ket_qua.ba) {
      if (this.khopNSoCuoi(so, day, 5)) {
        return this.taoKetQua(ve.ticket_id, true, "ba",
          `🥉 Trúng Giải Ba - 5 số cuối khớp dãy ${day}`);
      }
    }

    // Giải Tư - 4 số cuối, 7 dãy
    for (const day of ket_qua.tu) {
      if (this.khopNSoCuoi(so, day, 4)) {
        return this.taoKetQua(ve.ticket_id, true, "tu",
          `Trúng Giải Tư - 4 số cuối khớp dãy ${day}`);
      }
    }

    // Giải Năm - 4 số cuối, 6 dãy
    for (const day of ket_qua.nam) {
      if (this.khopNSoCuoi(so, day, 4)) {
        return this.taoKetQua(ve.ticket_id, true, "nam",
          `Trúng Giải Năm - 4 số cuối khớp dãy ${day}`);
      }
    }

    // Giải Sáu - 3 số cuối, 3 dãy
    for (const day of ket_qua.sau) {
      if (this.khopNSoCuoi(so, day, 3)) {
        return this.taoKetQua(ve.ticket_id, true, "sau",
          `Trúng Giải Sáu - 3 số cuối khớp dãy ${day}`);
      }
    }

    // Giải Bảy - 3 số cuối, 4 dãy
    for (const day of ket_qua.bay) {
      if (this.khopNSoCuoi(so, day, 3)) {
        return this.taoKetQua(ve.ticket_id, true, "bay",
          `Trúng Giải Bảy - 3 số cuối khớp dãy ${day}`);
      }
    }

    // Giải Tám - 2 số cuối, 2 dãy
    for (const day of ket_qua.tam) {
      if (this.khopNSoCuoi(so, day, 2)) {
        return this.taoKetQua(ve.ticket_id, true, "tam",
          `Trúng Giải Tám (Khuyến khích) - 2 số cuối khớp dãy ${day}`);
      }
    }

    return { ticket_id: ve.ticket_id, trung: false };
  }

  /**
   * Đối soát hàng loạt (batch)
   * Ứng dụng: sau khi đọc tất cả vé từ Shelby
   */
  doiSoatBatch(ves: VeSo[], ket_qua: KetQuaKy): {
    winners: DoiSoatResult[];
    losers: DoiSoatResult[];
    stats: Record<GiaiThuong | "total", number>;
  } {
    const winners: DoiSoatResult[] = [];
    const losers: DoiSoatResult[] = [];
    const stats: Record<string, number> = {
      dac_biet: 0, nhat: 0, nhi: 0, ba: 0, tu: 0,
      nam: 0, sau: 0, bay: 0, tam: 0, total: ves.length,
    };

    for (const ve of ves) {
      const result = this.doiSoat(ve, ket_qua);
      if (result.trung && result.giai) {
        winners.push(result);
        stats[result.giai] = (stats[result.giai] ?? 0) + 1;
      } else {
        losers.push(result);
      }
    }

    console.log(
      `[DoiSoat] ${ves.length} vé → ${winners.length} thắng, ${losers.length} thua`
    );

    return { winners, losers, stats: stats as Record<GiaiThuong | "total", number> };
  }

  /**
   * Tính tiền thưởng cho 1 giải dựa trên tổng pool
   */
  tinhTienThuong(giai: GiaiThuong, total_pool_octas: number): number {
    const pct = PRIZE_PCT[giai];
    return Math.floor((total_pool_octas * pct) / 10000);
  }

  // ===== Helpers =====

  /**
   * Kiểm tra n chữ số cuối của `so_chon` có khớp với `ket_qua` không
   * "123456".suffix(5) = "23456"
   * "23456" == "23456" → true
   */
  private khopNSoCuoi(so_chon: string, ket_qua: string, n: number): boolean {
    if (so_chon.length < n || ket_qua.length < n) return false;
    const suffix_chon = so_chon.slice(-n);
    const suffix_kq = ket_qua.slice(-n);
    return suffix_chon === suffix_kq;
  }

  private taoKetQua(
    ticket_id: string,
    trung: boolean,
    giai: GiaiThuong,
    mo_ta: string,
  ): DoiSoatResult {
    return { ticket_id, trung, giai, mo_ta };
  }
}

// ===== Unit tests inline =====
// Chạy: npx tsx doi_soat.engine.ts
if (process.argv[1]?.endsWith("doi_soat.engine.ts")) {
  const engine = new DoiSoatEngine();

  const mockKetQua: Partial<KetQuaKy> = {
    dac_biet: "123456",
    nhat: "23456",
    nhi: ["34567", "45678"],
    ba: ["56789", "67890", "78901", "89012", "90123", "01234", "12345"],
    tu: ["6789", "7890", "8901", "9012", "0123", "1234", "2345"],
    nam: ["789", "890", "901", "012", "123", "234"].map(s => s.padStart(4, "0")),
    sau: ["789", "890", "901"],
    bay: ["789", "890", "901", "012"],
    tam: ["89", "90"],
  };

  const testCases = [
    { so: "123456", expected: "dac_biet" },
    { so: "023456", expected: "nhat" },     // 5 số cuối "23456"
    { so: "034567", expected: "nhi" },
    { so: "000056", expected: "ba" },        // "56789"? nope → "12345" → ba idx6
    { so: "999999", expected: null },        // thua
  ];

  console.log("=== Kiểm tra đối soát ===");
  for (const tc of testCases) {
    const ve = { ticket_id: "test", so_chon: tc.so } as VeSo;
    const result = engine.doiSoat(ve, mockKetQua as KetQuaKy);
    const pass = result.giai === tc.expected || (!result.trung && !tc.expected);
    console.log(
      `${pass ? "✅" : "❌"} so=${tc.so} → giai=${result.giai ?? "thua"} (expect: ${tc.expected ?? "thua"})`,
      result.mo_ta ? `| ${result.mo_ta}` : ""
    );
  }
}
