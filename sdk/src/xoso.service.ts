/**
 * XoSoService - Orchestrator chính
 * Điều phối toàn bộ luồng:
 *   1. Mua vé: Shelby write → Aptos on-chain confirm
 *   2. Quay số: Đóng kỳ → VRF → Ghi kết quả
 *   3. Đối soát: Đọc Shelby → So sánh → Ghi kết quả
 *   4. Chi thưởng: Đánh dấu thắng → User claim
 */

import type { Account } from "@aptos-labs/ts-sdk";
import { ShelbyStorageService } from "./shelby.service.js";
import { AptosContractService } from "./aptos.service.js";
import { DoiSoatEngine } from "./doi_soat.engine.js";
import type {
  XoSoConfig, DaiId, MuaVeResult, KetQuaKy, DoiSoatResult, GiaiThuong
} from "../types/index.js";

export class XoSoService {
  private shelby: ShelbyStorageService;
  private aptos: AptosContractService;
  private doiSoat: DoiSoatEngine;

  constructor(config: XoSoConfig) {
    this.shelby = new ShelbyStorageService(config);
    this.aptos = new AptosContractService(config);
    this.doiSoat = new DoiSoatEngine();
  }

  // ===================================================
  // LUỒNG 1: MUA VÉ
  // ===================================================
  // Bước 1: Lưu vé lên Shelby → lấy blob_id
  // Bước 2: Submit tx on-chain với blob_id
  // Bước 3: Trả về thông tin vé cho người dùng

  async muaVe(params: {
    buyer: Account;               // Aptos wallet
    so_chon: string;              // "123456"
    dai_id: DaiId;
  }): Promise<MuaVeResult> {
    console.log(`\n🎫 [Mua Vé] Bắt đầu: so=${params.so_chon} dai=${params.dai_id}`);

    // --- Validate số ---
    if (!/^\d{6}$/.test(params.so_chon)) {
      throw new Error("Số chọn phải là 6 chữ số (000000-999999)");
    }

    // --- Lấy kỳ hiện tại ---
    const ky_id = await this.aptos.getCurrentKy();
    console.log(`   Kỳ hiện tại: #${ky_id}`);

    // --- Bước 1: Lưu vé lên Shelby TRƯỚC ---
    // Lý do: blob_id cần thiết để confirm on-chain
    console.log(`   [1/3] Lưu vé lên Shelby...`);
    const { ticket_id, blob_id } = await this.shelby.luuVe({
      so_chon: params.so_chon,
      nguoi_mua: params.buyer.accountAddress.toString(),
      dai_id: params.dai_id,
      ky_id,
    });
    console.log(`   ✅ Shelby blob_id: ${blob_id}`);

    // --- Bước 2: Confirm on-chain (kèm blob_id) ---
    console.log(`   [2/3] Confirm on-chain...`);
    const { tx_hash, success } = await this.aptos.confirmMuaVe({
      buyer: params.buyer,
      ticket_id,
      so_chon: params.so_chon,
      dai_id: params.dai_id,
      shelby_blob_id: blob_id,
    });

    if (!success) {
      // Rollback: cập nhật trạng thái Shelby về "failed"
      // (Shelby blob immutable nên ta ghi blob mới)
      await this.shelby.capNhatTrangThaiVe({
        ticket_id,
        trang_thai: "lost",
      });
      throw new Error("Giao dịch on-chain thất bại");
    }
    console.log(`   ✅ Aptos tx: ${tx_hash}`);

    // --- Bước 3: Trả kết quả ---
    const GIA_VE_APT = 0.0001;
    console.log(`   [3/3] ✅ Mua vé thành công!\n`);

    return {
      success: true,
      ticket_id,
      shelby_blob_id: blob_id,
      aptos_tx_hash: tx_hash,
      so_chon: params.so_chon,
      ky_id,
      gia_ve: GIA_VE_APT * 1e8,
    };
  }

  // ===================================================
  // LUỒNG 2: QUAY SỐ (Admin)
  // ===================================================

  async dongKyVaQuaySo(admin: Account): Promise<void> {
    console.log(`\n🎲 [Quay Số] Admin đóng kỳ và request VRF...`);

    // Đóng kỳ trên Aptos (không nhận vé mới)
    await this.aptos.dongKyVaRequestVRF(admin);

    console.log(`   ✅ Kỳ đã đóng. VRF đang được xử lý...`);
    console.log(`   (Trong production: VRF oracle callback sẽ trigger ghiKetQua)`);
  }

  /**
   * Được gọi bởi VRF oracle callback sau khi randomness fulfilled
   */
  async nhanKetQuaVRFVaGhiChain(
    admin: Account,
    ky_id: number,
    dai_id: DaiId,
    ket_qua_raw: Omit<KetQuaKy, "ky_id" | "dai_id" | "aptos_tx_hash">,
  ): Promise<KetQuaKy> {
    console.log(`\n📋 [Kết Quả] Ghi kết quả kỳ ${ky_id} lên chain...`);

    // Ghi on-chain
    const tx_hash = await this.aptos.ghiKetQua(admin, {
      ...ket_qua_raw,
      ky_id,
      dai_id,
      aptos_tx_hash: "", // sẽ điền sau
    });

    const ket_qua: KetQuaKy = {
      ...ket_qua_raw,
      ky_id,
      dai_id,
      aptos_tx_hash: tx_hash,
    };

    // Lưu kết quả lên Shelby (để đối soát nhanh)
    const blob_id = await this.shelby.luuKetQuaKy(ket_qua);
    await this.shelby.capNhatIndexKy(`${ky_id}:${dai_id}`, blob_id);

    console.log(`   ✅ Kết quả ghi xong. Đặc biệt: ${ket_qua.dac_biet}`);
    console.log(`   Shelby blob_id: ${blob_id}`);
    console.log(`   Aptos tx: ${tx_hash}\n`);

    return ket_qua;
  }

  // ===================================================
  // LUỒNG 3: ĐỐI SOÁT HÀNG LOẠT
  // ===================================================
  // Đây là bước dùng Shelby nhiều nhất:
  // - Đọc tất cả blob vé của kỳ (fast parallel read)
  // - Đối soát với kết quả
  // - Ghi kết quả từng vé lên Shelby + Aptos

  async doiSoatKy(
    admin: Account,
    ky_id: number,
    dai_id: DaiId,
    ticket_blob_ids: string[],     // blob_ids lấy từ Aptos event logs
  ): Promise<{
    total: number;
    winners: number;
    total_prize_paid: number;
  }> {
    console.log(`\n🔍 [Đối Soát] Kỳ ${ky_id} - ${ticket_blob_ids.length} vé...`);

    // --- Đọc kết quả kỳ ---
    const ket_qua = await this.shelby.docKetQuaKy(ky_id, dai_id);
    if (!ket_qua) throw new Error(`Không tìm thấy kết quả kỳ ${ky_id}`);

    // --- Lấy prize pool ---
    const prize_pool_apt = await this.aptos.getPrizePoolBalance();
    const prize_pool_octas = Math.floor(prize_pool_apt * 1e8);
    console.log(`   Prize pool: ${prize_pool_apt.toFixed(4)} APT`);

    // --- Đọc tất cả vé từ Shelby (song song) ---
    console.log(`   Đọc ${ticket_blob_ids.length} vé từ Shelby...`);
    const ves = await this.shelby.docVeTheoBatch(ticket_blob_ids);

    // --- Đối soát ---
    const { winners, losers, stats } = this.doiSoat.doiSoatBatch(ves, ket_qua);

    // In thống kê
    console.log(`\n   📊 Kết quả đối soát:`);
    for (const [giai, count] of Object.entries(stats)) {
      if (count > 0 && giai !== "total") {
        console.log(`      ${giai}: ${count} vé`);
      }
    }

    // --- Đánh dấu vé thắng on-chain + cập nhật Shelby ---
    let total_prize_paid = 0;

    console.log(`\n   Xử lý ${winners.length} vé thắng...`);
    for (const winner of winners) {
      const giai = winner.giai as GiaiThuong;
      const tien_thuong = this.doiSoat.tinhTienThuong(giai, prize_pool_octas);

      // Đánh dấu on-chain
      await this.aptos.danhDauThang(admin, {
        ticket_id: winner.ticket_id,
        giai: this.giaToNumber(giai),
        tien_thuong,
      });

      // Cập nhật Shelby
      await this.shelby.capNhatTrangThaiVe({
        ticket_id: winner.ticket_id,
        trang_thai: "won",
        giai_trung: giai,
        tien_thuong,
      });

      total_prize_paid += tien_thuong;
      console.log(
        `   💰 Vé ${winner.ticket_id.slice(0,8)}... → ${giai}: ${tien_thuong/1e8} APT`
      );
    }

    // --- Đánh dấu vé thua ---
    console.log(`\n   Đánh dấu ${losers.length} vé thua...`);
    // Batch để tránh quá nhiều tx
    for (let i = 0; i < losers.length; i += 20) {
      const batch = losers.slice(i, i + 20);
      await Promise.allSettled(
        batch.map(l => this.aptos.danhDauThang(admin, {
          ticket_id: l.ticket_id,
          giai: 0, // thua
          tien_thuong: 0,
        }))
      );
    }

    console.log(`\n   ✅ Đối soát hoàn tất!`);
    console.log(`   Tổng thưởng: ${(total_prize_paid/1e8).toFixed(4)} APT\n`);

    return {
      total: ves.length,
      winners: winners.length,
      total_prize_paid,
    };
  }

  // ===================================================
  // LUỒNG 4: NGƯỜI DÙNG CLAIM THƯỞNG
  // ===================================================

  async claimThuong(winner: Account, ticket_id: string): Promise<{
    success: boolean;
    tien_thuong: number;
    tx_hash: string;
  }> {
    console.log(`\n💸 [Claim] Ticket: ${ticket_id}`);

    // Kiểm tra on-chain trước
    const info = await this.aptos.getTicketInfo(ticket_id);
    if (info.status !== "won") {
      throw new Error(`Vé không ở trạng thái "won" (hiện: ${info.status})`);
    }

    const tx_hash = await this.aptos.claimThuong(winner, ticket_id);
    console.log(`   ✅ Nhận ${info.tien_thuong_apt} APT. tx: ${tx_hash}\n`);

    return {
      success: true,
      tien_thuong: info.tien_thuong_apt * 1e8,
      tx_hash,
    };
  }

  // ===================================================
  // ADMIN: Setup kỳ mới
  // ===================================================

  async moKyMoi(admin: Account, dai_id: DaiId): Promise<number> {
    const tx = await this.aptos.moKyMoi(admin, dai_id);
    const ky_id = await this.aptos.getCurrentKy();
    console.log(`\n🚀 Kỳ #${ky_id} (${dai_id}) đã mở. tx: ${tx}\n`);
    return ky_id;
  }

  // ===== Helpers =====

  private giaToNumber(giai: GiaiThuong): number {
    const map: Record<GiaiThuong, number> = {
      dac_biet: 1, nhat: 2, nhi: 3, ba: 4,
      tu: 5, nam: 6, sau: 7, bay: 8, tam: 9,
    };
    return map[giai];
  }
}

// ===================================================
// DEMO: Chạy thử toàn bộ luồng
// npx tsx xoso.service.ts
// ===================================================

async function demoLuong() {
  console.log("=".repeat(60));
  console.log("🎯 Demo Xổ Số Miền Nam on Shelby + Aptos");
  console.log("=".repeat(60));

  const config: XoSoConfig = {
    shelbyApiKey: process.env.SHELBY_API_KEY ?? "aptoslabs_test_key",
    shelbyNetwork: "testnet",
    aptosNodeUrl: "https://fullnode.testnet.aptoslabs.com/v1",
    contractAddress: process.env.CONTRACT_ADDRESS ?? "0x1234",
    adminAddress: process.env.ADMIN_ADDRESS ?? "0x1234",
    shelbyStorageDays: 90,
  };

  const service = new XoSoService(config);

  // ---- Bước 1: Mô phỏng mua vé (cần wallet thật để chạy)
  console.log("\n[DEMO] Luồng mua vé:");
  console.log("1. Validate số chọn (6 chữ số)");
  console.log("2. shelby.luuVe() → blob_id");
  console.log("3. aptos.confirmMuaVe(blob_id) → tx_hash");
  console.log("4. Trả ticket_id + blob_id cho người dùng");

  console.log("\n[DEMO] Luồng quay số:");
  console.log("1. admin: dong_ky_va_request_vrf() → VRF pending");
  console.log("2. Aptos VRF oracle xử lý → fulfilled");
  console.log("3. admin: ghi_ket_qua(dac_biet, nhat, ...) → on-chain");
  console.log("4. shelby.luuKetQuaKy() → blob_id index");

  console.log("\n[DEMO] Luồng đối soát:");
  console.log("1. Đọc tất cả blob_ids từ Aptos events");
  console.log("2. shelby.docVeTheoBatch(blob_ids) → parallel reads");
  console.log("3. doiSoatBatch(ves, ket_qua) → winners/losers");
  console.log("4. aptos.danhDauThang(ticket_id, giai, tien)");

  // ---- Test đối soát logic (không cần network)
  const { DoiSoatEngine } = await import("./doi_soat.engine.js");
  const engine = new DoiSoatEngine();

  const mockKQ: Partial<KetQuaKy> = {
    dac_biet: "123456",
    nhat: "23456",
    nhi: ["34567", "45678"],
    ba: ["56789", "67890", "78901", "89012", "90123", "01234", "12345"],
    tu: ["6789", "7890", "8901", "9012", "0123", "1234", "2345"],
    nam: ["0789", "0890", "0901", "0012", "0123", "0234"],
    sau: ["789", "890", "901"],
    bay: ["789", "890", "901", "012"],
    tam: ["89", "90"],
  };

  const testVes = [
    { ticket_id: "ve-1", so_chon: "123456" }, // Đặc biệt
    { ticket_id: "ve-2", so_chon: "023456" }, // Nhất
    { ticket_id: "ve-3", so_chon: "034567" }, // Nhì
    { ticket_id: "ve-4", so_chon: "099999" }, // Thua
  ];

  console.log("\n[DEMO] Kết quả đối soát test:");
  console.log(`Kết quả kỳ - Đặc biệt: ${mockKQ.dac_biet}\n`);

  for (const ve of testVes) {
    const r = engine.doiSoat(ve as any, mockKQ as KetQuaKy);
    console.log(
      `  Vé ${ve.so_chon}: ${r.trung ? "✅ " + r.mo_ta : "❌ Không trúng"}`
    );
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Demo hoàn tất!");
}

if (process.argv[1]?.endsWith("xoso.service.ts")) {
  demoLuong().catch(console.error);
}
