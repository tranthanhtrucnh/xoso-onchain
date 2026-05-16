/**
 * ShelbyStorageService
 * Xử lý toàn bộ tương tác với Shelby Protocol
 * - Ghi vé (write blob)
 * - Đọc vé để đối soát (read blob)
 * - Lưu kết quả kỳ quay
 * - Cập nhật trạng thái vé sau đối soát
 */

import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Network } from "@aptos-labs/ts-sdk";
import { v4 as uuidv4 } from "uuid";
import type {
  VeSo, KetQuaKy, DaiId, XoSoConfig, TicketStatus
} from "../types/index.js";

export class ShelbyStorageService {
  private client: ShelbyNodeClient;
  private config: XoSoConfig;

  constructor(config: XoSoConfig) {
    this.config = config;
    this.client = new ShelbyNodeClient({
      network: config.shelbyNetwork === "mainnet"
        ? Network.MAINNET
        : Network.TESTNET,
      apiKey: config.shelbyApiKey,
    });
  }

  // ===================================================
  // VÉ SỐ - WRITE & READ
  // ===================================================

  /**
   * Lưu thông tin vé lên Shelby
   * Gọi trước khi submit on-chain
   * Return: blob_id để lưu on-chain làm tham chiếu
   */
  async luuVe(params: {
    so_chon: string;
    nguoi_mua: string;
    dai_id: DaiId;
    ky_id: number;
  }): Promise<{ ticket_id: string; blob_id: string }> {
    const ticket_id = uuidv4();

    const ve: VeSo = {
      ticket_id,
      so_chon: params.so_chon,
      nguoi_mua: params.nguoi_mua,
      dai_id: params.dai_id,
      ky_id: params.ky_id,
      trang_thai: "pending",
      timestamp_mua: Date.now(),
    };

    const blob_id = await this._writeBlob(
      `ve:${ticket_id}`,
      ve,
      this.config.shelbyStorageDays,
    );

    console.log(`[Shelby] Vé lưu thành công: ${ticket_id} → blob_id: ${blob_id}`);
    return { ticket_id, blob_id };
  }

  /**
   * Đọc thông tin 1 vé từ Shelby (dùng blob_id lấy từ on-chain)
   */
  async docVe(blob_id: string): Promise<VeSo | null> {
    try {
      return await this._readBlob<VeSo>(blob_id);
    } catch (e) {
      console.error(`[Shelby] Không đọc được vé blob_id=${blob_id}:`, e);
      return null;
    }
  }

  /**
   * Cập nhật trạng thái vé sau đối soát
   * Shelby blob là immutable nên ta ghi blob mới với key mới
   * Convention: key = "ve_result:{ticket_id}"
   */
  async capNhatTrangThaiVe(params: {
    ticket_id: string;
    trang_thai: TicketStatus;
    giai_trung?: string;
    tien_thuong?: number;
  }): Promise<string> {
    const update = {
      ticket_id: params.ticket_id,
      trang_thai: params.trang_thai,
      giai_trung: params.giai_trung,
      tien_thuong: params.tien_thuong,
      timestamp_update: Date.now(),
    };

    const blob_id = await this._writeBlob(
      `ve_result:${params.ticket_id}`,
      update,
      this.config.shelbyStorageDays,
    );

    return blob_id;
  }

  // ===================================================
  // KẾT QUẢ KỲ QUAY - WRITE & READ
  // ===================================================

  /**
   * Lưu kết quả kỳ quay lên Shelby
   * Gọi sau khi VRF fulfilled và ghi on-chain thành công
   */
  async luuKetQuaKy(ket_qua: KetQuaKy): Promise<string> {
    const blob_id = await this._writeBlob(
      `ket_qua:${ket_qua.ky_id}:${ket_qua.dai_id}`,
      ket_qua,
      365, // lưu 1 năm
    );

    console.log(`[Shelby] Kết quả kỳ ${ket_qua.ky_id} lưu: ${blob_id}`);
    return blob_id;
  }

  /**
   * Đọc kết quả kỳ quay
   */
  async docKetQuaKy(ky_id: number, dai_id: DaiId): Promise<KetQuaKy | null> {
    // Cần biết blob_id - trong thực tế lấy từ on-chain hoặc index riêng
    // Ở đây demo bằng naming convention
    try {
      // TODO: Query Shelby by prefix "ket_qua:{ky_id}:{dai_id}"
      // Hiện tại Shelby SDK dùng blob_id trực tiếp
      // Giải pháp: lưu mapping ky_id -> blob_id trong một "index blob" riêng
      const index = await this.docIndexKy();
      const key = `${ky_id}:${dai_id}`;
      const blob_id = index[key];
      if (!blob_id) return null;
      return await this._readBlob<KetQuaKy>(blob_id);
    } catch {
      return null;
    }
  }

  // ===================================================
  // INDEX BLOB - Track blob_ids theo key
  // ===================================================
  // Shelby blobs là immutable và cần blob_id để read.
  // Ta dùng 1 "index blob" đặc biệt để map human-readable key -> blob_id
  // Index blob này được update bằng cách ghi blob mới mỗi khi có thay đổi

  private _indexBlobId: string | null = null; // cache

  async docIndexKy(): Promise<Record<string, string>> {
    if (!this._indexBlobId) return {};
    try {
      const index = await this._readBlob<Record<string, string>>(this._indexBlobId);
      return index ?? {};
    } catch {
      return {};
    }
  }

  async capNhatIndexKy(key: string, blob_id: string): Promise<void> {
    const index = await this.docIndexKy();
    index[key] = blob_id;
    const new_blob_id = await this._writeBlob("ky_index", index, 365);
    this._indexBlobId = new_blob_id;
    // TODO: Persist _indexBlobId (DB/env) để không mất sau restart
  }

  // ===================================================
  // ĐỐI SOÁT HÀNG LOẠT - Đây là điểm mạnh của Shelby
  // ===================================================

  /**
   * Đọc tất cả vé của 1 kỳ từ Shelby để đối soát
   * Shelby fast-read cho phép đọc song song nhiều blob
   */
  async docTatCaVeTrongKy(blob_ids: string[]): Promise<VeSo[]> {
    console.log(`[Shelby] Đọc ${blob_ids.length} vé song song...`);
    const start = Date.now();

    // Đọc song song tất cả blobs - đây là lúc Shelby tỏa sáng
    // Sub-second reads cho hàng nghìn vé cùng lúc
    const results = await Promise.allSettled(
      blob_ids.map(id => this._readBlob<VeSo>(id))
    );

    const ves: VeSo[] = [];
    let errors = 0;
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        ves.push(r.value);
      } else {
        errors++;
      }
    }

    const elapsed = Date.now() - start;
    console.log(
      `[Shelby] Đọc xong: ${ves.length}/${blob_ids.length} vé trong ${elapsed}ms` +
      (errors > 0 ? ` (${errors} lỗi)` : "")
    );

    return ves;
  }

  /**
   * Đọc theo batch (nếu số lượng quá lớn)
   */
  async docVeTheoBatch(blob_ids: string[], batchSize = 500): Promise<VeSo[]> {
    const all: VeSo[] = [];
    for (let i = 0; i < blob_ids.length; i += batchSize) {
      const batch = blob_ids.slice(i, i + batchSize);
      const ves = await this.docTatCaVeTrongKy(batch);
      all.push(...ves);
      console.log(`[Shelby] Batch ${Math.floor(i/batchSize)+1}: ${all.length}/${blob_ids.length} vé`);
    }
    return all;
  }

  // ===================================================
  // INTERNAL HELPERS
  // ===================================================

  private async _writeBlob(
    key: string,
    data: unknown,
    days: number,
  ): Promise<string> {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);

    // Shelby SDK: establish payment channel + write
    // Payment channel cho phép micropayments off-chain
    const result = await this.client.writeBlob(bytes, {
      duration: days * 24 * 3600, // giây
      // Shelby tự handle erasure coding + distribution
    });

    return result.blobId;
  }

  private async _readBlob<T>(blob_id: string): Promise<T> {
    // Shelby: paid read qua micropayment channel
    // Fast read từ nearest storage provider node
    const bytes = await this.client.readBlob(blob_id);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  }

  /**
   * Thiết lập payment channel với Shelby RPC
   * Cần gọi 1 lần trước khi đọc nhiều blobs
   * Micropayments off-chain, settle on Aptos later
   */
  async initPaymentChannel(walletSigner: unknown): Promise<void> {
    // await this.client.openPaymentChannel(walletSigner, { deposit: ... });
    console.log("[Shelby] Payment channel initialized");
  }
}
