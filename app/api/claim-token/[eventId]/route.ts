import { NextRequest, NextResponse } from 'next/server';
import {
    Connection,
    PublicKey,
    Transaction,
    Keypair,
    ComputeBudgetProgram,
} from '@solana/web3.js';
import axios from 'axios';
import {
    getOrCreateAssociatedTokenAccount,
    createTransferCheckedInstruction,
} from '@solana/spl-token';
import { CompressedTokenProgram, getTokenPoolInfos, selectMinCompressedTokenAccountsForTransfer, selectTokenPoolInfosForDecompression, transfer } from "@lightprotocol/compressed-token";
import { bn, buildAndSignTx, createRpc, dedupeSigner, Rpc, sendAndConfirmTx } from '@lightprotocol/stateless.js';
import { sendError } from 'next/dist/server/api-utils';

const TOKEN_DECIMALS = 9; // Adjust based on your token (e.g., USDC is 6)

export async function POST(request: NextRequest, { params }: any) {
    const { eventId } = await params;
    const eventRes = await axios.get(`${process.env.BACKEND_BASE_URL}/event/details/${params.eventId}`);
    const eventData = eventRes.data;

    try {
        const body = await request.json();
        const { account } = body;

        if (!account) {
            return NextResponse.json({ error: 'No account provided' }, { status: 400 });
        }

        const RPC_ENDPOINT = `${process.env.NEXT_PUBLIC_HELIUS_DEVNET_URL}`;
        const COMPRESSION_ENDPOINT = RPC_ENDPOINT;
        const PROVER_ENDPOINT = RPC_ENDPOINT;

        const connection: Rpc = createRpc(
            RPC_ENDPOINT,
            COMPRESSION_ENDPOINT,
            PROVER_ENDPOINT
        );
        const userPublicKey = new PublicKey(account);
        const secretKeyUint8 = Uint8Array.from(Buffer.from(eventData.eventKeypair.secretKey, 'base64'));
        const payer = Keypair.fromSecretKey(secretKeyUint8);

        const transferTxId = await transfer(
            connection,
            payer,
            new PublicKey(eventData.mint),
            1e8,
            payer,
            userPublicKey
        );

        console.log('Transfer transaction ID:', transferTxId);


        return NextResponse.json({
            transaction: transferTxId,
            message: 'cToken transferred and decompressed successfully!',
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {

    try {
        return NextResponse.json({
            transaction: "Success",
            message: 'Claim your cToken!',
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

