import { NextRequest, NextResponse } from 'next/server';
import {
    PublicKey,
    Transaction,
    Keypair,
    ComputeBudgetProgram,
} from '@solana/web3.js';
import axios from 'axios';
import {
    CompressedTokenProgram,
    selectMinCompressedTokenAccountsForTransfer,
} from "@lightprotocol/compressed-token";
import {
    createRpc,
    Rpc
} from '@lightprotocol/stateless.js';

const TOKEN_DECIMALS = 9;

export async function POST(request: NextRequest, { params }: any) {
    const { eventId } = params;

    try {
        const eventRes = await axios.get(`${process.env.BACKEND_BASE_URL}/event/details/${eventId}`);
        const eventData = eventRes.data;

        const body = await request.json();
        const { account } = body;

        if (!account) {
            return NextResponse.json({ error: 'No account provided' }, { status: 400 });
        }

        const RPC_ENDPOINT = `${process.env.NEXT_PUBLIC_HELIUS_DEVNET_URL}`;
        const connection: Rpc = createRpc(RPC_ENDPOINT, RPC_ENDPOINT, RPC_ENDPOINT);
        const userPublicKey = new PublicKey(account);

        const secretKeyUint8 = Uint8Array.from(Buffer.from(eventData.eventKeypair.secretKey, 'base64'));
        const payer = Keypair.fromSecretKey(secretKeyUint8);

        const { blockhash } = await connection.getLatestBlockhash();

        const mint = new PublicKey(eventData.mint);

        const parsedAccounts = await connection.getCompressedTokenAccountsByOwner(userPublicKey, { mint });

        if (!parsedAccounts.items.length) {
            return NextResponse.json({ error: 'No compressed token accounts found for this mint.' }, { status: 404 });
        }

        const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(parsedAccounts.items, 1e5);
        const amount = 1e8;

        const { compressedProof, rootIndices } = await connection.getValidityProofV0(
            inputAccounts.map(account => ({
                hash: account.compressedAccount.hash,
                tree: account.compressedAccount.treeInfo.tree,
                queue: account.compressedAccount.treeInfo.queue
            }))
        );


        const transaction = new Transaction();
        transaction.add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 })
        );
        const transferIx = await CompressedTokenProgram.transfer({
            payer: payer.publicKey,
            inputCompressedTokenAccounts: inputAccounts,
            toAddress: userPublicKey,
            amount,
            recentInputStateRootIndices: rootIndices,
            recentValidityProof: compressedProof,
        });

        transaction.add(transferIx);

        transaction.feePayer = payer.publicKey;

        transaction.recentBlockhash = blockhash;

        transaction.partialSign(payer);

        const serializedTx = transaction.serialize({
            requireAllSignatures: false,
            verifySignatures: false
        }).toString('base64');

        return NextResponse.json({
            transaction: serializedTx,
            message: 'Claim your cToken!',
        });

    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        label: "Claim cToken",
        icon: "https://i.pinimg.com/736x/2a/1d/da/2a1dda36641f15e1ce156a70a5b54b92.jpg",
    });
}