module xoso::randomness_engine {
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::timestamp;

    const E_INVALID_RANGE: u64 = 1;

    struct KyRandomResult has drop {
        ky_id: u64,
        dac_biet: vector<u8>,
        nhat: vector<u8>,
        nhi: vector<vector<u8>>,
        ba: vector<vector<u8>>,
        tu: vector<vector<u8>>,
        nam: vector<vector<u8>>,
        sau: vector<vector<u8>>,
        bay: vector<vector<u8>>,
        tam: vector<vector<u8>>,
        raw_entropy: vector<u8>,
        timestamp: u64,
    }

    struct CommitReveal has store, drop {
        ky_id: u64,
        admin_commit: vector<u8>,
        user_commits: vector<vector<u8>>,
        phase: u8,
        final_seed: vector<u8>,
    }

    public fun generate_seed(ky_id: u64): vector<u8> {
        let seed = vector::empty<u8>();
        let ts = timestamp::now_microseconds();
        vector::push_back(&mut seed, ((ts >> 56) as u8));
        vector::push_back(&mut seed, ((ts >> 48) as u8));
        vector::push_back(&mut seed, ((ts >> 40) as u8));
        vector::push_back(&mut seed, ((ts >> 32) as u8));
        vector::push_back(&mut seed, ((ts >> 24) as u8));
        vector::push_back(&mut seed, ((ts >> 16) as u8));
        vector::push_back(&mut seed, ((ts >> 8)  as u8));
        vector::push_back(&mut seed, (ts as u8));
        vector::push_back(&mut seed, ((ky_id >> 24) as u8));
        vector::push_back(&mut seed, ((ky_id >> 16) as u8));
        vector::push_back(&mut seed, ((ky_id >> 8)  as u8));
        vector::push_back(&mut seed, (ky_id as u8));
        seed
    }

    public fun sinh_n_so_tu_bytes(bytes: &vector<u8>, offset: u64, n: u64): vector<u8> {
        let result = vector::empty<u8>();
        let i = 0;
        while (i < n) {
            let byte_idx = offset + i;
            if (byte_idx < vector::length(bytes)) {
                let raw = *vector::borrow(bytes, byte_idx);
                let digit = (raw % 10);
                vector::push_back(&mut result, digit);
            };
            i = i + 1;
        };
        result
    }

    public fun digits_to_string(digits: &vector<u8>): String {
        let s = string::utf8(b"");
        let i = 0;
        while (i < vector::length(digits)) {
            let d = *vector::borrow(digits, i);
            let char_byte = d + 48;
            let char_vec = vector::singleton(char_byte);
            string::append(&mut s, string::utf8(char_vec));
            i = i + 1;
        };
        s
    }

    public fun check_suffix_match(
        so_chon: &String,
        ket_qua: &String,
        n_suffix: u64,
    ): bool {
        let len_chon = string::length(so_chon);
        let len_kq = string::length(ket_qua);

        if (len_chon < n_suffix || len_kq < n_suffix) {
            return false
        };

        let bytes_chon = string::bytes(so_chon);
        let bytes_kq = string::bytes(ket_qua);

        let i = 0;
        while (i < n_suffix) {
            let idx_chon = len_chon - n_suffix + i;
            let idx_kq = len_kq - n_suffix + i;
            if (*vector::borrow(bytes_chon, idx_chon) != *vector::borrow(bytes_kq, idx_kq)) {
                return false
            };
            i = i + 1;
        };
        true
    }
}
