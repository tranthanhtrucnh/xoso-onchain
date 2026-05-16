/**
 * AptosContractService
 * Tương tác với Move smart contract trên Aptos
 * - Confirm mua vé on-chain
 * - Ghi kết quả quay
 * - Trigger chi thưởng
 * - Query trạng thái
 */

import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
  InputEntryFunctionData,
} from "@aptos-labs/ts-sdk";
import type { KetQuaKy, XoSoConfig } from "../types/index.js";

export class AptosContractService {
  private aptos: Aptos;
  private config: XoSoConfig;
  private moduleAddr: string;

  constructor(config: XoSoConfig) {
    this.config = config;
    this.moduleAddr = config.contractAddress;

    const aptosConfig = new AptosConfig({
      network: config.shelbyNetwork === "mainnet"
        ? Network.MAINNET
        : Network.TESTNET,
      fullnode: config.aptosNodeUrl,
    });
    this.aptos = new Aptos(aptosConfig);
  }

  // ===================================================
  // MUA VÉ - Confirm on-chain
  // ===================================================

  /**
   * Sau khi đã lưu Shelby và có blob_id → confirm on-chain
   * Smart contract: prize_pool::mua_ve
   */
  async confirmMuaVe(params: {
    buyer: Account;
    ticket_id: string;
    so_chon: string;
    dai_id: string;
    shelby_blob_id: string;
  }): Promise<{ tx_hash: string; success: boolean }> {
    try {
      const txn = await this.aptos.transaction.build.simple({
        sender: params.buyer.accountAddress,
        data: {
          function: `${this.moduleAddr}::prize_pool::mua_ve`,
          functionArguments: [
            params.ticket_id,
            params.so_chon,
            params.dai_id,
            params.shelby_blob_id,
            this.config.adminAddress,
          ],
        } as InputEntryFunctionData,
      });

      const signed = await this.aptos.transaction.sign({
        signer: params.buyer,
        transaction: txn,
      });

      const submitted = await this.aptos.transaction.submit.simple({
        transaction: txn,
        senderAuthenticator: signed,
      });

      await this.aptos.transaction.waitForTransaction({
        transactionHash: submitted.hash,
      });

      console.log(`[Aptos] Mua vé confirmed: ${params.ticket_id} → tx: ${submitted.hash}`);
      return { tx_hash: submitted.hash, success: true };
    } catch (e) {
      console.error("[Aptos] Lỗi confirm mua vé:", e);
      return { tx_hash: "", success: false };
    }
  }

  // ===================================================
  // QUẢN LÝ KỲ
  // ===================================================

  /**
   * Admin mở kỳ mới
   */
  async moKyMoi(admin: Account, dai_id: string): Promise<string> {
    const txn = await this.aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${this.moduleAddr}::prize_pool::mo_ky_moi`,
        functionArguments: [dai_id],
      } as InputEntryFunctionData,
    });

    const signed = await this.aptos.transaction.sign({
      signer: admin, transaction: txn,
    });
    const result = await this.aptos.transaction.submit.simple({
      transaction: txn, senderAuthenticator: signed,
    });
    await this.aptos.transaction.waitForTransaction({
      transactionHash: result.hash,
    });

    console.log(`[Aptos] Kỳ mới mở: dai=${dai_id} tx=${result.hash}`);
    return result.hash;
  }

  /**
   * Admin đóng kỳ và request VRF
   */
  async dongKyVaRequestVRF(admin: Account): Promise<string> {
    const txn = await this.aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${this.moduleAddr}::prize_pool::dong_ky_va_request_vrf`,
        functionArguments: [],
      } as InputEntryFunctionData,
    });

    const signed = await this.aptos.transaction.sign({
      signer: admin, transaction: txn,
    });
    const result = await this.aptos.transaction.submit.simple({
      transaction: txn, senderAuthenticator: signed,
    });
    await this.aptos.transaction.waitForTransaction({
      transactionHash: result.hash,
    });

    console.log(`[Aptos] Kỳ đóng, VRF requested. tx=${result.hash}`);
    return result.hash;
  }

  /**
   * Admin ghi kết quả sau khi VRF fulfilled
   */
  async ghiKetQua(admin: Account, kq: KetQuaKy): Promise<string> {
    const txn = await this.aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${this.moduleAddr}::prize_pool::ghi_ket_qua`,
        functionArguments: [
          kq.ky_id,
          kq.dac_biet,
          kq.nhat,
          kq.nhi[0], kq.nhi[1],
          kq.ba,
          kq.tu,
          kq.nam,
          kq.sau,
          kq.bay,
          kq.tam,
          Buffer.from(kq.vrf_proof, "hex"),
          Buffer.from(kq.vrf_output, "hex"),
        ],
      } as InputEntryFunctionData,
    });

    const signed = await this.aptos.transaction.sign({ signer: admin, transaction: txn });
    const result = await this.aptos.transaction.submit.simple({
      transaction: txn, senderAuthenticator: signed,
    });
    await this.aptos.transaction.waitForTransaction({ transactionHash: result.hash });

    console.log(`[Aptos] Kết quả kỳ ${kq.ky_id} ghi on-chain. tx=${result.hash}`);
    return result.hash;
  }

  // ===================================================
  // CHI THƯỞNG
  // ===================================================

  /**
   * Admin đánh dấu vé thắng (sau đối soát)
   */
  async danhDauThang(admin: Account, params: {
    ticket_id: string;
    giai: number;         // 1-9
    tien_thuong: number;  // APT octas
  }): Promise<string> {
    const txn = await this.aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${this.moduleAddr}::prize_pool::danh_dau_thang`,
        functionArguments: [params.ticket_id, params.giai, params.tien_thuong],
      } as InputEntryFunctionData,
    });

    const signed = await this.aptos.transaction.sign({ signer: admin, transaction: txn });
    const result = await this.aptos.transaction.submit.simple({
      transaction: txn, senderAuthenticator: signed,
    });
    await this.aptos.transaction.waitForTransaction({ transactionHash: result.hash });
    return result.hash;
  }

  /**
   * Người dùng claim thưởng
   */
  async claimThuong(winner: Account, ticket_id: string): Promise<string> {
    const txn = await this.aptos.transaction.build.simple({
      sender: winner.accountAddress,
      data: {
        function: `${this.moduleAddr}::prize_pool::claim_thuong`,
        functionArguments: [ticket_id, this.config.adminAddress],
      } as InputEntryFunctionData,
    });

    const signed = await this.aptos.transaction.sign({ signer: winner, transaction: txn });
    const result = await this.aptos.transaction.submit.simple({
      transaction: txn, senderAuthenticator: signed,
    });
    await this.aptos.transaction.waitForTransaction({ transactionHash: result.hash });

    console.log(`[Aptos] Thưởng claimed: ${ticket_id} → tx: ${result.hash}`);
    return result.hash;
  }

  // ===================================================
  // QUERIES - View functions
  // ===================================================

  async getKyInfo(ky_id: number) {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddr}::prize_pool::get_ky_info`,
        functionArguments: [this.config.adminAddress, ky_id],
      },
    });
    const [id, status, tong_ve, prize_pool] = result as [number, number, number, number];
    return {
      ky_id: id,
      status: ["open","closed","drawn","settled"][status] ?? "unknown",
      tong_so_ve: tong_ve,
      prize_pool_apt: prize_pool / 1e8, // convert octas → APT
    };
  }

  async getTicketInfo(ticket_id: string) {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddr}::prize_pool::get_ticket`,
        functionArguments: [this.config.adminAddress, ticket_id],
      },
    });
    const [owner, blob_id, status, tien_thuong] = result as [string, string, number, number];
    return {
      owner,
      shelby_blob_id: blob_id,
      status: ["pending","won","lost","claimed"][status] ?? "unknown",
      tien_thuong_apt: tien_thuong / 1e8,
    };
  }

  async getPrizePoolBalance(): Promise<number> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddr}::prize_pool::get_prize_pool_balance`,
        functionArguments: [this.config.adminAddress],
      },
    });
    return (result[0] as number) / 1e8;
  }

  async getCurrentKy(): Promise<number> {
    const result = await this.aptos.view({
      payload: {
        function: `${this.moduleAddr}::prize_pool::get_current_ky`,
        functionArguments: [this.config.adminAddress],
      },
    });
    return result[0] as number;
  }
}
