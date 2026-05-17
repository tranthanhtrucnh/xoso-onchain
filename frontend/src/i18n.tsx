import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "vi" | "en";

interface Translations {
  nav_mua_ve: string; nav_ket_qua: string; nav_ve_cua_toi: string;
  connect_wallet: string; live: string; ticker_ky: string;
  ticker_prize: string; ticker_dong_ve: string; ticker_ve_da_mua: string;
  ticker_minh_bach: string; chon_so_title: string; chon_so_sub: string;
  chon_ngau_nhien: string; xoa: string; tiep_theo: string; quay_lai: string;
  chon_dai: string; chon_dai_sub: string; xac_nhan: string; xac_nhan_sub: string;
  so_da_chon: string; ky_quay: string; gia_ve: string; luu_tru: string;
  ket_noi_vi: string; thanh_toan: string; mua_thanh_cong: string;
  mua_thanh_cong_sub: string; mua_them: string; xem_ve: string;
  so_da_mua: string; hint: string; co_cau_giai: string; giai: string;
  so_cuoi: string; thuong: string; dam_bao: string; vrf_desc: string;
  shelby_desc: string; onchain_desc: string; auto_desc: string;
  ket_qua: string; ky_selector: string; xac_minh: string; verify_btn: string;
  ve_cua_toi: string; win_banner: string; win_banner_sub: string;
  nhan_thuong: string; shelby_note: string; no_wallet: string;
  no_wallet_sub: string; footer_random: string; footer_contract: string; today: string;
}

const en: Translations = {
  nav_mua_ve: "Buy Ticket", nav_ket_qua: "Results", nav_ve_cua_toi: "My Tickets",
  connect_wallet: "Connect Wallet", live: "LIVE",
  ticker_ky: "Round #142 · HCMC · Prize Pool:", ticker_prize: "2,450 APT",
  ticker_dong_ve: "Tickets close at", ticker_ve_da_mua: "tickets sold",
  ticker_minh_bach: "On-chain results · 100% transparent",
  chon_so_title: "CHOOSE NUMBER",
  chon_so_sub: "Enter 6 digits · Price:",
  chon_ngau_nhien: "🎲 Random Pick", xoa: "✕ Clear",
  tiep_theo: "NEXT →", quay_lai: "← Back",
  chon_dai: "Choose Province", chon_dai_sub: "Selected number:",
  xac_nhan: "Confirm", xac_nhan_sub: "Review your order before payment",
  so_da_chon: "Selected number", ky_quay: "Draw round",
  gia_ve: "Ticket price", luu_tru: "Storage",
  ket_noi_vi: "Please connect your wallet to pay",
  thanh_toan: "💳 PAY & BUY TICKET",
  mua_thanh_cong: "Ticket Purchased!",
  mua_thanh_cong_sub: "Your ticket is saved on-chain and on Shelby storage",
  mua_them: "🎫 Buy more tickets", xem_ve: "📋 View my tickets",
  so_da_mua: "PURCHASED NUMBER",
  hint: "Ticket stored securely on Shelby · Verified by Aptos blockchain",
  co_cau_giai: "PRIZE STRUCTURE", giai: "Prize", so_cuoi: "Last digits", thuong: "Reward",
  dam_bao: "🔐 TRANSPARENCY GUARANTEE",
  vrf_desc: "Verifiable randomness, no manipulation possible",
  shelby_desc: "Decentralized tickets, immutable and permanent",
  onchain_desc: "All transactions public on Aptos blockchain",
  auto_desc: "Smart contract auto-sends winnings instantly",
  ket_qua: "Results", ky_selector: "Draw Rounds",
  xac_minh: "🔐 Verify Result", verify_btn: "🔍 View on Aptos Explorer",
  ve_cua_toi: "My Tickets",
  win_banner: "🎉 You have unclaimed winning tickets!",
  win_banner_sub: "Smart contract is ready to transfer your winnings",
  nhan_thuong: "💰 Claim Prize",
  shelby_note: "All tickets stored on Shelby decentralized storage · Immutable · Permanent.",
  no_wallet: "Connect wallet to view tickets",
  no_wallet_sub: "Please connect Petra Wallet to view your purchased tickets",
  footer_random: "Randomness: Aptos VRF · Tamper-proof",
  footer_contract: "Smart contract:", today: "today",
};

const vi: Translations = {
  nav_mua_ve: "Mua Vé", nav_ket_qua: "Kết Quả", nav_ve_cua_toi: "Vé Của Tôi",
  connect_wallet: "Kết nối ví", live: "TRỰC TIẾP",
  ticker_ky: "Kỳ #142 · TPHCM · Prize Pool:", ticker_prize: "2,450 APT",
  ticker_dong_ve: "Đóng vé lúc", ticker_ve_da_mua: "vé đã mua",
  ticker_minh_bach: "Kết quả on-chain · 100% minh bạch",
  chon_so_title: "CHỌN SỐ",
  chon_so_sub: "Nhập 6 chữ số · Giá:",
  chon_ngau_nhien: "🎲 Chọn ngẫu nhiên", xoa: "✕ Xóa",
  tiep_theo: "TIẾP THEO →", quay_lai: "← Quay lại",
  chon_dai: "Chọn đài", chon_dai_sub: "Số đã chọn:",
  xac_nhan: "Xác nhận", xac_nhan_sub: "Kiểm tra lại trước khi thanh toán",
  so_da_chon: "Số đã chọn", ky_quay: "Kỳ quay",
  gia_ve: "Giá vé", luu_tru: "Lưu trữ",
  ket_noi_vi: "Bạn cần kết nối ví để thanh toán",
  thanh_toan: "💳 THANH TOÁN & MUA VÉ",
  mua_thanh_cong: "Mua vé thành công!",
  mua_thanh_cong_sub: "Vé của bạn đã được lưu on-chain và Shelby storage",
  mua_them: "🎫 Mua thêm vé", xem_ve: "📋 Xem vé của tôi",
  so_da_mua: "SỐ ĐÃ MUA",
  hint: "Số vé lưu bảo mật trên Shelby · Mã hóa bởi Aptos blockchain",
  co_cau_giai: "CƠ CẤU GIẢI THƯỞNG", giai: "Giải", so_cuoi: "Số cuối", thuong: "Thưởng",
  dam_bao: "🔐 ĐẢM BẢO MINH BẠCH",
  vrf_desc: "Số ngẫu nhiên xác minh được, không ai can thiệp",
  shelby_desc: "Vé phi tập trung, không mất, không sửa",
  onchain_desc: "Mọi giao dịch công khai trên Aptos blockchain",
  auto_desc: "Smart contract tự gửi tiền, không cần đến nhận",
  ket_qua: "Kết Quả", ky_selector: "Kỳ quay",
  xac_minh: "🔐 Xác minh kết quả", verify_btn: "🔍 Verify trên Aptos Explorer",
  ve_cua_toi: "Vé Của Tôi",
  win_banner: "🎉 Bạn có vé trúng thưởng chưa nhận!",
  win_banner_sub: "Smart contract sẵn sàng chuyển tiền cho bạn",
  nhan_thuong: "💰 Nhận thưởng",
  shelby_note: "Tất cả vé lưu trên Shelby · Không thể xóa hay sửa · Vĩnh viễn.",
  no_wallet: "Kết nối ví để xem vé",
  no_wallet_sub: "Bạn cần kết nối Petra Wallet để xem danh sách vé đã mua",
  footer_random: "Randomness: Aptos VRF · Không thể can thiệp",
  footer_contract: "Smart contract:", today: "hôm nay",
};

interface LangContextType { lang: Lang; t: Translations; toggleLang: () => void; }

const LangContext = createContext<LangContextType>({ lang: "en", t: en, toggleLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en"); // Default: English
  const toggleLang = () => setLang(l => l === "en" ? "vi" : "en");
  return (
    <LangContext.Provider value={{ lang, t: lang === "en" ? en : vi, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
