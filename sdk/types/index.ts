// ===== Types cho Xổ Số Miền Nam on Shelby =====

export type DaiId =
  | "TPHCM" | "DONG_THAP" | "CA_MAU" | "BEN_TRE" | "VUNG_TAU"
  | "BAC_LIEU" | "DONG_NAI" | "CAN_THO" | "SOC_TRANG" | "TPHCM_2"
  | "AN_GIANG" | "BINH_THUAN" | "VINH_LONG" | "BINH_DUONG" | "TRA_VINH"
  | "LONG_AN" | "BINH_PHUOC" | "HAU_GIANG" | "TIEN_GIANG" | "KIEN_GIANG" | "DA_LAT";

export type TicketStatus = "pending" | "won" | "lost" | "claimed";
export type KyStatus = "open" | "closed" | "drawn" | "settled";

export type GiaiThuong =
  | "dac_biet"  // Giải Đặc Biệt - 6 số  - 40% pool
  | "nhat"      // Giải Nhất    - 5 số  - 15%
  | "nhi"       // Giải Nhì     - 5 số  - 10% / 2
  | "ba"        // Giải Ba      - 5 số  - 8%  / 7
  | "tu"        // Giải Tư      - 4 số  - 7%  / 7
  | "nam"       // Giải Năm     - 4 số  - 6%  / 6
  | "sau"       // Giải Sáu     - 3 số  - 5%  / 3
  | "bay"       // Giải Bảy     - 3 số  - 4%  / 4
  | "tam";      // Giải Tám     - 2 số  - 3%  / 2

// Vé số - đây là data lưu trên Shelby
export interface VeSo {
  ticket_id: string;          // UUID v4
  so_chon: string;            // "123456" - 6 chữ số
  nguoi_mua: string;          // Aptos wallet address
  dai_id: DaiId;
  ky_id: number;
  trang_thai: TicketStatus;
  timestamp_mua: number;      // Unix ms
  // Sau khi đối soát:
  giai_trung?: GiaiThuong;
  tien_thuong?: number;       // APT octas
}

// Metadata của vé (lưu on-chain, nhỏ hơn)
export interface VeOnChain {
  ticket_id: string;
  shelby_blob_id: string;     // Tham chiếu tới Shelby
  ky_id: number;
  nguoi_mua: string;
  trang_thai: number;         // 0-3 enum
  tien_thuong: number;
}

// Kết quả kỳ xổ số (lưu cả trên Shelby lẫn on-chain)
export interface KetQuaKy {
  ky_id: number;
  dai_id: DaiId;
  dac_biet: string;           // "123456"
  nhat: string;               // "12345"
  nhi: string[];              // 2 phần tử
  ba: string[];               // 7 phần tử
  tu: string[];               // 7 phần tử
  nam: string[];              // 6 phần tử
  sau: string[];              // 3 phần tử
  bay: string[];              // 4 phần tử
  tam: string[];              // 2 phần tử
  vrf_proof: string;          // hex
  vrf_output: string;         // hex
  timestamp_draw: number;
  aptos_tx_hash: string;      // TX ghi kết quả lên Aptos
}

// Thông tin 1 kỳ
export interface KyXoSo {
  ky_id: number;
  dai_id: DaiId;
  ngay_quay: Date;
  status: KyStatus;
  tong_so_ve: number;
  tong_prize_pool: number;    // APT octas
  ket_qua?: KetQuaKy;
}

// Response khi mua vé
export interface MuaVeResult {
  success: boolean;
  ticket_id: string;
  shelby_blob_id: string;     // ID trên Shelby
  aptos_tx_hash: string;      // TX on-chain
  so_chon: string;
  ky_id: number;
  gia_ve: number;             // APT octas
}

// Kết quả đối soát 1 vé
export interface DoiSoatResult {
  ticket_id: string;
  trung: boolean;
  giai?: GiaiThuong;
  tien_thuong?: number;
  mo_ta?: string;             // "Trúng Giải Ba - 5 số cuối khớp"
}

// Config kết nối
export interface XoSoConfig {
  // Shelby
  shelbyApiKey: string;
  shelbyNetwork: "testnet" | "devnet" | "mainnet";
  // Aptos
  aptosNodeUrl: string;
  contractAddress: string;    // Module address
  adminAddress: string;
  // Lưu trữ (bao nhiêu ngày)
  shelbyStorageDays: number;
}
