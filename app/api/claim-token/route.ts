import { NextRequest, NextResponse } from 'next/server';
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
} from '@solana/web3.js';
import {
    getOrCreateAssociatedTokenAccount,
    createTransferCheckedInstruction,
} from '@solana/spl-token';
import base58 from 'bs58';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { account } = body;

        if (!account) {
            return NextResponse.json({ error: 'No account provided' }, { status: 400 });
        }
        console.log('account: ', account);

        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const userPublicKey = new PublicKey(account);

        




        // // Your platform's wallet (holds or mints cTokens)
        // const platformPrivateKey = process.env.PLATFORM_PRIVATE_KEY;
        // if (!platformPrivateKey) {
        //     return NextResponse.json({ error: 'Platform private key not available' }, { status: 500 });
        // }
        // const platformKeypair = Keypair.fromSecretKey(base58.decode(platformPrivateKey));
        // const platformPublicKey = platformKeypair.publicKey;

        // // Your cToken's mint address
        // const cTokenMint = new PublicKey('YOUR_CTOKEN_MINT_ADDRESS');
        // // Token decimals - replace with your token's decimal places
        // const TOKEN_DECIMALS = 9; // Example: 9 for many SPL tokens

        // // Get or create the user's associated token account for cToken
        // const userTokenAccount = await getOrCreateAssociatedTokenAccount(
        //     connection,
        //     platformKeypair, // Pays for account creation if needed
        //     cTokenMint,
        //     userPublicKey
        // );

        // // Get the platform's associated token account for cToken
        // const platformTokenAccount = await getOrCreateAssociatedTokenAccount(
        //     connection,
        //     platformKeypair,
        //     cTokenMint,
        //     platformPublicKey
        // );

        // // Create the transaction
        // const transaction = new Transaction();
        // const { blockhash } = await connection.getLatestBlockhash('finalized');
        // transaction.recentBlockhash = blockhash;
        // transaction.feePayer = platformKeypair.publicKey; // Platform pays the fee

        // // Add instruction to transfer 1 cToken
        // transaction.add(
        //     createTransferCheckedInstruction(
        //         platformTokenAccount.address, // Source (platform's token account)
        //         cTokenMint, // Token mint address
        //         userTokenAccount.address, // Destination (user's token account)
        //         platformKeypair.publicKey, // Source owner
        //         [], // No additional signers
        //         1, // Amount (1 token, adjust based on token decimals)
        //         TOKEN_DECIMALS // Token decimals
        //     )
        // );

        // // Sign the transaction (partial sign by platform)
        // transaction.partialSign(platformKeypair);

        // // Serialize the transaction
        // const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
        // const transactionBase64 = serializedTransaction.toString('base64');

        // // Return the transaction to the wallet
        // return NextResponse.json({
        //     transaction: transactionBase64,
        //     message: 'Claim your cToken for Proof of Participation',
        // });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

