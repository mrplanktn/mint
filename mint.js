// multi_wallet_mint.js

// 1. Impor library dan muat variabel dari .env
require('dotenv').config();
const { ethers } = require('ethers');

// 2. Konfigurasi
// Baca string kunci dan pisahkan menjadi array, hapus spasi kosong jika ada
const privateKeys = process.env.PRIVATE_KEYS ? process.env.PRIVATE_KEYS.split(',').map(key => key.trim()) : [];
const rpcUrl = process.env.RPC_URL;

// --- GANTI INFORMASI DI BAWAH INI (SAMA SEPERTI SEBELUMNYA) ---
const contractAddress = "0x...ALAMAT_KONTRAK_TESTNET_CUSD..."; // <-- Ganti dengan alamat kontrak yang Anda temukan
const contractABI = [
    // <-- Tempel seluruh JSON ABI yang Anda salin dari Etherscan di sini
    // { "inputs": [], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
];
const MINT_FUNCTION_NAME = "mint"; // <-- Ganti jika nama fungsinya berbeda
// --- AKHIR BAGIAN YANG PERLU DIGANTI ---

// Validasi konfigurasi
if (privateKeys.length === 0 || !rpcUrl || contractAddress === "0x...ALAMAT_KONTRAK_TESTNET_CUSD...") {
    console.error("🛑 Error: Pastikan Anda sudah mengisi PRIVATE_KEYS (minimal satu), RPC_URL, dan contractAddress di dalam skrip/file .env.");
    process.exit(1);
}

// 3. Setup koneksi provider (cukup satu kali)
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

// 4. Fungsi utama untuk melakukan mint untuk semua wallet
async function mintForAllWallets(jedaAntarWalletDetik = 10) {
    console.log(`🚀 Memulai proses minting untuk ${privateKeys.length} wallet...`);
    console.log(`Kontrak Target: ${contractAddress}`);

    // Kita gunakan for...of loop agar await berfungsi dengan benar (eksekusi berurutan)
    for (const [index, privateKey] of privateKeys.entries()) {
        console.log(`\n================================================================`);
        console.log(`⚙️  Memproses Wallet ke-${index + 1}/${privateKeys.length}`);
        
        try {
            // Buat instance wallet untuk setiap private key di dalam loop
            const wallet = new ethers.Wallet(privateKey, provider);
            const contract = new ethers.Contract(contractAddress, contractABI, wallet);

            console.log(`Alamat Wallet: ${wallet.address}`);

            // Cek saldo ETH untuk gas fee (opsional tapi bagus untuk debugging)
            const balance = await wallet.getBalance();
            console.log(`Saldo ETH: ${ethers.utils.formatEther(balance)} ETH`);
            if (balance.isZero()) {
                console.warn("⚠️  Peringatan: Saldo wallet 0, transaksi kemungkinan akan gagal karena tidak ada dana untuk gas fee.");
            }

            // Memanggil fungsi `mint` pada kontrak
            console.log("Mengirim transaksi mint...");
            const tx = await contract[MINT_FUNCTION_NAME]();

            console.log(`Transaksi terkirim! Hash: ${tx.hash}`);
            console.log("Menunggu konfirmasi transaksi...");

            // Menunggu transaksi selesai
            const receipt = await tx.wait();
            
            console.log(`✅ SUKSES! Transaksi untuk wallet ${wallet.address} dikonfirmasi di blok ${receipt.blockNumber}`);

        } catch (error) {
            // Jika terjadi error pada satu wallet, log error tersebut dan lanjutkan ke wallet berikutnya
            console.error(`❌ GAGAL untuk Wallet ke-${index + 1}:`, error.reason || error.message);
        }

        // Memberi jeda antar wallet untuk menghindari masalah rate-limit
        if (index < privateKeys.length - 1) {
            console.log(`Menunggu ${jedaAntarWalletDetik} detik sebelum lanjut ke wallet berikutnya...`);
            await new Promise(resolve => setTimeout(resolve, jedaAntarWalletDetik * 1000));
        }
    }

    console.log(`\n================================================================`);
    console.log("🏁 Semua wallet telah selesai diproses.");
}

// --- Panggil fungsi di sini ---
// Anda bisa mengatur jeda antar wallet (dalam detik)
mintForAllWallets(5); // Jeda 5 detik antar wallet
