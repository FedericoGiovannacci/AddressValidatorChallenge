import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import process from 'process';

// Configs from env
const mnemonic = process.env.MNEMONIC_PHRASE ?? '';
const SEARCH_LIMIT = Number(process.env.SEARCH_LIMIT) || 1000;
const MAX_ACCOUNT = Number(process.env.MAX_ACCOUNT) || 5;
const MAX_CHANGE = Number(process.env.MAX_CHANGE) || 2;
const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 10;

// Type definitions
type EthTarget = {
    label: string;
    type: 'eth';
    pathBase: string;
    target: string;
};

type BtcTarget = {
    label: string;
    type: 'btc-segwit' | 'btc-legacy';
    purpose: number;
    target: string;
};

type TargetConfig = EthTarget | BtcTarget;

// Target definitions
const targets: TargetConfig[] = [
    {
        label: 'Ethereum',
        type: 'eth',
        pathBase: `m/44'/60'/0'/0/`,
        target: process.env.ETH_TARGET?.toLowerCase() ?? ''
    },
    {
        label: 'Bitcoin SegWit',
        type: 'btc-segwit',
        purpose: 84,
        target: process.env.SEGWIT_BTC_TARGET ?? ''
    },
    {
        label: 'Bitcoin Legacy',
        type: 'btc-legacy',
        purpose: 44,
        target: process.env.LEGACY_BTC_TARGET ?? ''
    }
];

// Entry point
async function main() {
    try {
        bip39.mnemonicToEntropy(mnemonic);
        console.log('✅ Seed phrase is valid.');
    } catch {
        console.error('❌ Invalid seed phrase.');
        return;
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const root = bip32.fromSeed(seed);

    for (const config of targets) {
        if (!config.target) continue;

        console.log(`\n🔍 Searching for ${config.label} address...`);

        if (config.type === 'eth') {
            await searchEthereum(root, config);
        } else {
            await searchBitcoin(root, config);
        }
    }
}

// ETH serach helper function
async function searchEthereum(root: ReturnType<typeof bip32.fromSeed>, config: EthTarget) {
    for (let batchStart = 0; batchStart < SEARCH_LIMIT; batchStart += BATCH_SIZE) {
        const tasks = Array.from({ length: BATCH_SIZE }, (_, i) => batchStart + i).map(async index => {
            const path = config.pathBase + index;
            const child = root.derivePath(path);
            const wallet = new ethers.Wallet(child.privateKey!.toString('hex'));
            const address = (await wallet.getAddress()).toLowerCase();

            if (address === config.target) {
                console.log(`✅ Found ${config.label} address at path: ${path}`);
                return true;
            }
            return false;
        });

        const results = await Promise.all(tasks);
        if (results.includes(true)) return;

        if (batchStart % 100 === 0) {
            console.log(`...Checked ${batchStart + BATCH_SIZE} Ethereum addresses`);
        }
    }

    console.log(`❌ ${config.label} address not found within search limit.`);
}

// BTC search helper function for both SegWit and Legacy, also work with Taproot if config is changed accordingly
async function searchBitcoin(root: ReturnType<typeof bip32.fromSeed>, config: BtcTarget) {
    const network = bitcoin.networks.bitcoin;

    for (let account = 0; account < MAX_ACCOUNT; account++) {
        for (let change = 0; change < MAX_CHANGE; change++) {
            for (let batchStart = 0; batchStart < SEARCH_LIMIT; batchStart += BATCH_SIZE) {
                const tasks = Array.from({ length: BATCH_SIZE }, (_, i) => batchStart + i).map(async index => {
                    const path = `m/${config.purpose}'/0'/${account}'/${change}/${index}`;
                    const child = root.derivePath(path);

                    let address: string;
                    if (config.type === 'btc-segwit') {
                        address = bitcoin.payments.p2wpkh({ pubkey: child.publicKey, network })?.address!;
                    } else {
                        address = bitcoin.payments.p2pkh({ pubkey: child.publicKey, network })?.address!;
                    }

                    if (address === config.target) {
                        console.log(`✅ Found ${config.label} address at path: ${path}`);
                        return true;
                    }

                    return false;
                });

                const results = await Promise.all(tasks);
                if (results.includes(true)) return;

                if (batchStart % 100 === 0 && account === 0 && change === 0) {
                    console.log(`...Checked ${batchStart + BATCH_SIZE} ${config.label} addresses`);
                }
            }
        }
    }

    console.log(`❌ ${config.label} address not found within search limits.`);
}

main().catch(console.error);
