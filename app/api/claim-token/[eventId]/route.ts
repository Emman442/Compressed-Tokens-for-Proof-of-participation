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

export async function POST(request: NextRequest, { params }: { params: { eventId: string } }) {
    console.log('Event ID:', params.eventId);
    const eventRes = await axios.get(`${process.env.BACKEND_BASE_URL}/event/details/${params.eventId}`);
    const eventData = eventRes.data;
    console.log('Fetched event data:', eventData);

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


        // Convert base64 string to Uint8Array
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
        const mint = new PublicKey(eventData.mint);

        // const ata = await getOrCreateAssociatedTokenAccount(
        //     connection,
        //     payer,
        //     mint,
        //     userPublicKey
        // );

        // // Fetch compressed token accounts owned by the user
        // const compressedTokenAccounts = await connection.getCompressedTokenAccountsByOwner(userPublicKey, { mint });

        // if (compressedTokenAccounts.items.length === 0) {
        //     console.error('No compressed token accounts found for decompression');
        //     return NextResponse.json({
        //         transaction: transferTxId,
        //         warning: 'Compressed token transferred but no compressed accounts found for decompression.',
        //     });
        // }

        // // Select the compressed tokens needed for decompression
        // const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(
        //     compressedTokenAccounts.items,
        //     bn(1e8)
        // );

        // // Fetch the validity proof
        // const proof = await connection.getValidityProof(
        //     inputAccounts.map((account: any) => account.compressedAccount.hash)
        // );

        // // Fetch token pool info
        // const tokenPoolInfos = await getTokenPoolInfos(connection, mint);

        // // Select token pools for decompression
        // const selectedTokenPoolInfos = selectTokenPoolInfosForDecompression(
        //     tokenPoolInfos,
        //     1e8 // amount
        // );

        // // Build decompression instruction
        // const ix = await CompressedTokenProgram.decompress({
        //     payer: payer.publicKey,
        //     inputCompressedTokenAccounts: inputAccounts,
        //     toAddress: ata.address,
        //     amount: 1e8,
        //     tokenPoolInfos: selectedTokenPoolInfos,
        //     recentInputStateRootIndices: proof.rootIndices,
        //     recentValidityProof: proof.compressedProof,
        // });

        // // Send decompression transaction
        // const { blockhash } = await connection.getLatestBlockhash();
        // const additionalSigners = dedupeSigner(payer, [payer]);  // in your case payer is also owner

        // const tx = buildAndSignTx(
        //     [ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }), ix],
        //     payer,
        //     blockhash,
        //     additionalSigners
        // );

        // const decompressTxId = await sendAndConfirmTx(connection, tx);

        // console.log('Decompression transaction ID:', decompressTxId);

        return NextResponse.json({
            transaction: transferTxId,
            // decompressionTransaction: decompressTxId,
            message: 'cToken transferred and decompressed successfully!',
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: { eventId: string } }) {
 

    // console.log('Event ID:', params.eventId);
    // const eventRes = await axios.get(`${process.env.BACKEND_BASE_URL}/event/details/${params.eventId}`);
    // const eventData = eventRes.data;
    // console.log('Fetched event data:', eventData);

    try {
    //     const body = await request.json();
    //     const { account } = body;

    //     if (!account) {
    //         return NextResponse.json({ error: 'No account provided' }, { status: 400 });
    //     }

    //     const RPC_ENDPOINT = `${process.env.NEXT_PUBLIC_HELIUS_DEVNET_URL}`;
    //     const COMPRESSION_ENDPOINT = RPC_ENDPOINT;
    //     const PROVER_ENDPOINT = RPC_ENDPOINT;

    //     const connection: Rpc = createRpc(
    //         RPC_ENDPOINT,
    //         COMPRESSION_ENDPOINT,
    //         PROVER_ENDPOINT
    //     );
    //     const userPublicKey = new PublicKey(account);


    //     // Convert base64 string to Uint8Array
    //     const secretKeyUint8 = Uint8Array.from(Buffer.from(eventData.eventKeypair.secretKey, 'base64'));
    //     const payer = Keypair.fromSecretKey(secretKeyUint8);

    //     const transferTxId = await transfer(
    //         connection,
    //         payer,
    //         new PublicKey(eventData.mint),
    //         1e8,
    //         payer,
    //         userPublicKey
    //     );

        return NextResponse.json({
            transaction: "Success",
            message: 'Claim your cToken!',
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

