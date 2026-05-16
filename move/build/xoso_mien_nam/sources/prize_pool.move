module xoso::prize_pool {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use aptos_std::table::{Self, Table};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;

    const E_NOT_ADMIN: u64 = 1;
    const E_POOL_NOT_ACTIVE: u64 = 2;
    const E_KY_NOT_FOUND: u64 = 4;
    const E_TICKET_NOT_FOUND: u64 = 5;
    const E_TICKET_ALREADY_CLAIMED: u64 = 6;
    const E_INVALID_TICKET_NUMBER: u64 = 7;
    const E_KY_NOT_CLOSED: u64 = 11;

    const TICKET_PRICE: u64 = 10_000;

    const PCT_JACKPOT: u64 = 4000;
    const PCT_NHAT: u64   = 1500;
    const PCT_NHI: u64    = 1000;
    const PCT_BA: u64     = 800;
    const PCT_TU: u64     = 700;
    const PCT_NAM: u64    = 600;
    const PCT_SAU: u64    = 500;
    const PCT_BAY: u64    = 400;
    const PCT_TAM: u64    = 300;

    const KY_STATUS_OPEN: u8 = 0;
    const KY_STATUS_CLOSED: u8 = 1;
    const KY_STATUS_DRAWN: u8 = 2;
    const KY_STATUS_SETTLED: u8 = 3;

    const TICKET_PENDING: u8 = 0;
    const TICKET_WON: u8 = 1;
    const TICKET_LOST: u8 = 2;
    const TICKET_CLAIMED: u8 = 3;

    struct Ticket has store, drop, copy {
        ticket_id: String,
        so_chon: String,
        nguoi_mua: address,
        dai_id: String,
        ky_id: u64,
        shelby_blob_id: String,
        trang_thai: u8,
        giai_trung: u8,
        tien_thuong: u64,
        timestamp_mua: u64,
    }

    struct KetQuaKy has store, drop, copy {
        ky_id: u64,
        dai_id: String,
        dac_biet: String,
        nhat: String,
        nhi: vector<String>,
        ba: vector<String>,
        tu: vector<String>,
        nam: vector<String>,
        sau: vector<String>,
        bay: vector<String>,
        tam: vector<String>,
        vrf_proof: vector<u8>,
        vrf_output: vector<u8>,
        timestamp_draw: u64,
    }

    struct KyXoSo has store {
        ky_id: u64,
        dai_id: String,
        ngay_quay: u64,
        tong_so_ve: u64,
        tong_prize_pool: u64,
        trang_thai: u8,
        ket_qua: vector<KetQuaKy>,
    }

    struct VRFRequest has store, drop {
        ky_id: u64,
        request_id: vector<u8>,
        fulfilled: bool,
        result: vector<u8>,
    }

    struct TicketPurchasedEvent has drop, store {
        ticket_id: String,
        nguoi_mua: address,
        ky_id: u64,
        shelby_blob_id: String,
        timestamp: u64,
    }

    struct KyDrawnEvent has drop, store {
        ky_id: u64,
        dai_id: String,
        dac_biet: String,
        so_winners: u64,
        total_prize_paid: u64,
        timestamp: u64,
    }

    struct PrizeClaimedEvent has drop, store {
        ticket_id: String,
        nguoi_thang: address,
        giai: u8,
        tien_thuong: u64,
        timestamp: u64,
    }

    struct VRFRequestedEvent has drop, store {
        ky_id: u64,
        request_id: vector<u8>,
        timestamp: u64,
    }

    struct XoSoState has key {
        admin: address,
        cac_ky: Table<u64, KyXoSo>,
        cac_ve: Table<String, Ticket>,
        ve_theo_ky: Table<u64, vector<String>>,
        ve_theo_nguoi: Table<address, vector<String>>,
        vrf_requests: Table<u64, VRFRequest>,
        prize_vault: Coin<AptosCoin>,
        ky_hien_tai: u64,
        carry_over_pool: u64,
        ticket_purchase_events: EventHandle<TicketPurchasedEvent>,
        ky_drawn_events: EventHandle<KyDrawnEvent>,
        prize_claimed_events: EventHandle<PrizeClaimedEvent>,
        vrf_requested_events: EventHandle<VRFRequestedEvent>,
    }

    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        let state = XoSoState {
            admin: admin_addr,
            cac_ky: table::new(),
            cac_ve: table::new(),
            ve_theo_ky: table::new(),
            ve_theo_nguoi: table::new(),
            vrf_requests: table::new(),
            prize_vault: coin::zero<AptosCoin>(),
            ky_hien_tai: 0,
            carry_over_pool: 0,
            ticket_purchase_events: account::new_event_handle<TicketPurchasedEvent>(admin),
            ky_drawn_events: account::new_event_handle<KyDrawnEvent>(admin),
            prize_claimed_events: account::new_event_handle<PrizeClaimedEvent>(admin),
            vrf_requested_events: account::new_event_handle<VRFRequestedEvent>(admin),
        };
        move_to(admin, state);
    }

    public entry fun mo_ky_moi(
        admin: &signer,
        dai_id: String,
    ) acquires XoSoState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<XoSoState>(admin_addr);
        assert!(state.admin == admin_addr, E_NOT_ADMIN);

        let ky_id = state.ky_hien_tai + 1;
        state.ky_hien_tai = ky_id;

        let ky = KyXoSo {
            ky_id,
            dai_id,
            ngay_quay: timestamp::now_seconds(),
            tong_so_ve: 0,
            tong_prize_pool: 0,
            trang_thai: KY_STATUS_OPEN,
            ket_qua: vector::empty(),
        };

        table::add(&mut state.cac_ky, ky_id, ky);
        table::add(&mut state.ve_theo_ky, ky_id, vector::empty());
    }

    public entry fun mua_ve(
        buyer: &signer,
        ticket_id: String,
        so_chon: String,
        dai_id: String,
        shelby_blob_id: String,
        admin_addr: address,
    ) acquires XoSoState {
        let buyer_addr = signer::address_of(buyer);
        let state = borrow_global_mut<XoSoState>(admin_addr);

        let ky_id = state.ky_hien_tai;
        assert!(table::contains(&state.cac_ky, ky_id), E_KY_NOT_FOUND);

        let ky = table::borrow_mut(&mut state.cac_ky, ky_id);
        assert!(ky.trang_thai == KY_STATUS_OPEN, E_POOL_NOT_ACTIVE);
        assert!(string::length(&so_chon) == 6, E_INVALID_TICKET_NUMBER);

        let payment = coin::withdraw<AptosCoin>(buyer, TICKET_PRICE);
        coin::merge(&mut state.prize_vault, payment);

        ky.tong_so_ve = ky.tong_so_ve + 1;
        ky.tong_prize_pool = ky.tong_prize_pool + TICKET_PRICE;

        let ve = Ticket {
            ticket_id: copy ticket_id,
            so_chon,
            nguoi_mua: buyer_addr,
            dai_id,
            ky_id,
            shelby_blob_id: copy shelby_blob_id,
            trang_thai: TICKET_PENDING,
            giai_trung: 0,
            tien_thuong: 0,
            timestamp_mua: timestamp::now_seconds(),
        };

        table::add(&mut state.cac_ve, copy ticket_id, ve);

        let ve_trong_ky = table::borrow_mut(&mut state.ve_theo_ky, ky_id);
        vector::push_back(ve_trong_ky, copy ticket_id);

        if (!table::contains(&state.ve_theo_nguoi, buyer_addr)) {
            table::add(&mut state.ve_theo_nguoi, buyer_addr, vector::empty());
        };
        let ve_cua_nguoi = table::borrow_mut(&mut state.ve_theo_nguoi, buyer_addr);
        vector::push_back(ve_cua_nguoi, copy ticket_id);

        event::emit_event(&mut state.ticket_purchase_events, TicketPurchasedEvent {
            ticket_id,
            nguoi_mua: buyer_addr,
            ky_id,
            shelby_blob_id,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun dong_ky_va_request_vrf(
        admin: &signer,
    ) acquires XoSoState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<XoSoState>(admin_addr);
        assert!(state.admin == admin_addr, E_NOT_ADMIN);

        let ky_id = state.ky_hien_tai;
        let ky = table::borrow_mut(&mut state.cac_ky, ky_id);
        assert!(ky.trang_thai == KY_STATUS_OPEN, E_POOL_NOT_ACTIVE);
        ky.trang_thai = KY_STATUS_CLOSED;

        let seed = vector::empty<u8>();
        let ts_bytes = timestamp::now_microseconds();
        vector::push_back(&mut seed, ((ts_bytes >> 56) as u8));
        vector::push_back(&mut seed, ((ts_bytes >> 48) as u8));
        vector::push_back(&mut seed, ((ts_bytes >> 40) as u8));
        vector::push_back(&mut seed, ((ts_bytes >> 32) as u8));
        vector::push_back(&mut seed, ((ts_bytes >> 24) as u8));
        vector::push_back(&mut seed, ((ts_bytes >> 16) as u8));
        vector::push_back(&mut seed, ((ts_bytes >> 8)  as u8));
        vector::push_back(&mut seed, (ts_bytes as u8));

        let vrf_req = VRFRequest {
            ky_id,
            request_id: copy seed,
            fulfilled: false,
            result: vector::empty(),
        };
        table::add(&mut state.vrf_requests, ky_id, vrf_req);

        event::emit_event(&mut state.vrf_requested_events, VRFRequestedEvent {
            ky_id,
            request_id: seed,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun ghi_ket_qua(
        admin: &signer,
        ky_id: u64,
        dac_biet: String,
        nhat: String,
        nhi_1: String, nhi_2: String,
        ba_raw: vector<String>,
        tu_raw: vector<String>,
        nam_raw: vector<String>,
        sau_raw: vector<String>,
        bay_raw: vector<String>,
        tam_raw: vector<String>,
        vrf_proof: vector<u8>,
        vrf_output: vector<u8>,
    ) acquires XoSoState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<XoSoState>(admin_addr);
        assert!(state.admin == admin_addr, E_NOT_ADMIN);

        let ky = table::borrow_mut(&mut state.cac_ky, ky_id);
        assert!(ky.trang_thai == KY_STATUS_CLOSED, E_KY_NOT_CLOSED);

        let mut_nhi = vector::empty<String>();
        vector::push_back(&mut mut_nhi, nhi_1);
        vector::push_back(&mut mut_nhi, nhi_2);

        let ket_qua = KetQuaKy {
            ky_id,
            dai_id: *&ky.dai_id,
            dac_biet: copy dac_biet,
            nhat: copy nhat,
            nhi: mut_nhi,
            ba: ba_raw,
            tu: tu_raw,
            nam: nam_raw,
            sau: sau_raw,
            bay: bay_raw,
            tam: tam_raw,
            vrf_proof,
            vrf_output,
            timestamp_draw: timestamp::now_seconds(),
        };

        vector::push_back(&mut ky.ket_qua, ket_qua);
        ky.trang_thai = KY_STATUS_DRAWN;
    }

    public entry fun claim_thuong(
        winner: &signer,
        ticket_id: String,
        admin_addr: address,
    ) acquires XoSoState {
        let winner_addr = signer::address_of(winner);
        let state = borrow_global_mut<XoSoState>(admin_addr);

        assert!(table::contains(&state.cac_ve, copy ticket_id), E_TICKET_NOT_FOUND);
        let ve = table::borrow_mut(&mut state.cac_ve, copy ticket_id);
        assert!(ve.nguoi_mua == winner_addr, E_NOT_ADMIN);
        assert!(ve.trang_thai == TICKET_WON, E_TICKET_ALREADY_CLAIMED);

        let tien = ve.tien_thuong;
        let giai = ve.giai_trung;
        ve.trang_thai = TICKET_CLAIMED;

        let payout = coin::extract(&mut state.prize_vault, tien);
        coin::deposit(winner_addr, payout);

        event::emit_event(&mut state.prize_claimed_events, PrizeClaimedEvent {
            ticket_id,
            nguoi_thang: winner_addr,
            giai,
            tien_thuong: tien,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun danh_dau_thang(
        admin: &signer,
        ticket_id: String,
        giai: u8,
        tien_thuong: u64,
    ) acquires XoSoState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<XoSoState>(admin_addr);
        assert!(state.admin == admin_addr, E_NOT_ADMIN);

        assert!(table::contains(&state.cac_ve, copy ticket_id), E_TICKET_NOT_FOUND);
        let ve = table::borrow_mut(&mut state.cac_ve, ticket_id);
        assert!(ve.trang_thai == TICKET_PENDING, E_TICKET_ALREADY_CLAIMED);

        ve.trang_thai = TICKET_WON;
        ve.giai_trung = giai;
        ve.tien_thuong = tien_thuong;
    }

    public entry fun danh_dau_thua(
        admin: &signer,
        ticket_id: String,
    ) acquires XoSoState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<XoSoState>(admin_addr);
        assert!(state.admin == admin_addr, E_NOT_ADMIN);

        assert!(table::contains(&state.cac_ve, copy ticket_id), E_TICKET_NOT_FOUND);
        let ve = table::borrow_mut(&mut state.cac_ve, ticket_id);
        ve.trang_thai = TICKET_LOST;
    }

    #[view]
    public fun get_ky_info(admin_addr: address, ky_id: u64): (u64, u8, u64, u64) acquires XoSoState {
        let state = borrow_global<XoSoState>(admin_addr);
        let ky = table::borrow(&state.cac_ky, ky_id);
        (ky.ky_id, ky.trang_thai, ky.tong_so_ve, ky.tong_prize_pool)
    }

    #[view]
    public fun get_ticket(admin_addr: address, ticket_id: String): (address, String, u8, u64) acquires XoSoState {
        let state = borrow_global<XoSoState>(admin_addr);
        let ve = table::borrow(&state.cac_ve, ticket_id);
        (ve.nguoi_mua, ve.shelby_blob_id, ve.trang_thai, ve.tien_thuong)
    }

    #[view]
    public fun get_prize_pool_balance(admin_addr: address): u64 acquires XoSoState {
        let state = borrow_global<XoSoState>(admin_addr);
        coin::value(&state.prize_vault)
    }

    #[view]
    public fun get_current_ky(admin_addr: address): u64 acquires XoSoState {
        let state = borrow_global<XoSoState>(admin_addr);
        state.ky_hien_tai
    }

    public fun tinh_tien_thuong(total_pool: u64, giai: u8): u64 {
        let pct = if (giai == 1) { PCT_JACKPOT }
            else if (giai == 2) { PCT_NHAT }
            else if (giai == 3) { PCT_NHI / 2 }
            else if (giai == 4) { PCT_BA / 7 }
            else if (giai == 5) { PCT_TU / 7 }
            else if (giai == 6) { PCT_NAM / 6 }
            else if (giai == 7) { PCT_SAU / 3 }
            else if (giai == 8) { PCT_BAY / 4 }
            else { PCT_TAM / 2 };
        (total_pool * pct) / 10000
    }
}
