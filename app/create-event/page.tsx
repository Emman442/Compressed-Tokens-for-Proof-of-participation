"use client";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge, CalendarIcon, Users } from "lucide-react";
import { toast } from "sonner";
import { MINT_SIZE, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { encodeURL, createQR } from "@solana/pay";

import {
  Rpc,
  buildAndSignTx,
  createRpc,
  dedupeSigner,
  selectStateTreeInfo,
} from "@lightprotocol/stateless.js";
import {
  CompressedTokenProgram,
  getTokenPoolInfos,
  selectTokenPoolInfo,
} from "@lightprotocol/compressed-token";
import { ComputeBudgetProgram, Keypair, Transaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateGame } from "@/features/event";

const CreateEventPage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [tokenCount, setTokenCount] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { publicKey, signTransaction, wallet } = useWallet();
  const {create, isCreating} = useCreateGame()
  const [qrCodeUrl, setQrCodeUrl] = useState("");
    const qrRef = useRef<HTMLDivElement>(null);
  
  // Create a hidden QR ref for generating the QR code
  const hiddenQrRef = useRef  <HTMLDivElement>(null);

  const RPC_ENDPOINT = `${process.env.NEXT_PUBLIC_HELIUS_DEVNET_URL}`;
  const COMPRESSION_ENDPOINT = RPC_ENDPOINT;
  const PROVER_ENDPOINT = RPC_ENDPOINT;

  const connection: Rpc = createRpc(
    RPC_ENDPOINT,
    COMPRESSION_ENDPOINT,
    PROVER_ENDPOINT
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);  
    
    const generateQrCodeUrl = () => {
    // Backend API endpoint for transaction requests
    // Replace with your actual backend URL
    const apiUrl = new URL("https://883e-102-215-57-182.ngrok-free.app/api/claim-token");
    
    // Encode the Solana Pay transaction request URL
    const solanaPayUrl = encodeURL({
      link: apiUrl,
      label: "Claim cToken",
      message: `Proof of Participation for ${name}`,
    });

    return solanaPayUrl.toString();
  };

  // Generate QR code SVG and convert to data URL
//   const generateQrCodeDataUrl = async (url: string): Promise<string> => {
//     return new Promise((resolve) => {
//       if (hiddenQrRef.current) {
//         hiddenQrRef.current.innerHTML = ""; // Clear previous QR code
//         const qr = createQR(url, 256, "white", "black");
//         qr.append(hiddenQrRef.current);
        
//         // Convert QR code SVG to data URL
//         setTimeout(() => {
//           const svg = hiddenQrRef.current?.querySelector("svg");
//           if (!svg) {
//             resolve("");
//             return;
//           }
          
//           const svgData = new XMLSerializer().serializeToString(svg);
//           const svgBlob = new Blob([svgData], {
//             type: "image/svg+xml;charset=utf-8",
//           });
//           const url = URL.createObjectURL(svgBlob);
          
//           const canvas = document.createElement("canvas");
//           const ctx = canvas.getContext("2d");
//           const img = new Image();
          
//           img.onload = () => {
//             canvas.width = img.width;
//             canvas.height = img.height;
//             ctx?.drawImage(img, 0, 0);
//             const dataUrl = canvas.toDataURL("image/png");
//             URL.revokeObjectURL(url);
//             resolve(dataUrl);
//           };
          
//           img.src = url;
//         }, 100);
//       } else {
//         resolve("");
//       }
//     });
//   };


    try {
      if (!publicKey || !signTransaction) {
        toast.error("Wallet not connected");
        throw new Error("Wallet not connected");        
      }

      const mintKeypair = Keypair.generate();
      const rentExemptBalance =
        await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

      // 1️⃣ Create mint instructions
      const createMintIxs = await CompressedTokenProgram.createMint({
        feePayer: publicKey,
        mint: mintKeypair.publicKey,
        decimals: 9,
        authority: publicKey,
        freezeAuthority: null,
        rentExemptBalance,
        tokenProgramId: TOKEN_PROGRAM_ID,
      });

      const { blockhash } = await connection.getLatestBlockhash();

      const transaction = new Transaction({
        feePayer: publicKey,
        recentBlockhash: blockhash,
      });

      createMintIxs.forEach((ix) => transaction.add(ix));
      transaction.partialSign(mintKeypair);

      const signedTx = await signTransaction(transaction);
      const txId = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
      });
      await connection.confirmTransaction(txId, "confirmed");

      console.log("✅ Mint created:", mintKeypair.publicKey.toBase58());
      toast.success(`Mint created: ${mintKeypair.publicKey.toBase58()}`);

      // 2️⃣ Initialize RPC for LightProtocol

      const outputStateTreeInfo = selectStateTreeInfo(
        await connection.getStateTreeInfos()
      );
      const tokenPoolInfo = selectTokenPoolInfo(
        await getTokenPoolInfos(connection, mintKeypair.publicKey)
      );

      // 3️⃣ Build mintTo instruction
      const mintToIx = await CompressedTokenProgram.mintTo({
        feePayer: publicKey,
        mint: mintKeypair.publicKey,
        authority: publicKey,
        toPubkey: publicKey,
        amount: tokenCount * 1e9, // if 9 decimals
        outputStateTreeInfo,
        tokenPoolInfo,
      });

      // 4️⃣ Build new tx for mintTo
      const { blockhash: newBlockhash } = await connection.getLatestBlockhash();
      const mintToTx = new Transaction({
        feePayer: publicKey,
        recentBlockhash: newBlockhash,
      });
      mintToTx.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
        mintToIx
      );

      const signedMintToTx = await signTransaction(mintToTx);
      const mintToTxId = await connection.sendRawTransaction(
        signedMintToTx.serialize(),
        { skipPreflight: false }
      );
      await connection.confirmTransaction(mintToTxId, "confirmed");

      toast.success(`Minted ${tokenCount} tokens!`);
      const qrUrl = generateQrCodeUrl();
      setQrCodeUrl(qrUrl);

      const data={
        name,
        description,
        date,
        minted_tokens: tokenCount,
        createdBy: publicKey.toBase58(),
        mint: mintKeypair.publicKey.toBase58(),
        qr_url: qrUrl
      }
      console.log(data)

      create(data)
    } catch (err) {
      console.error(err);
      toast.error("Failed to create mint or mint tokens.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6 mx-auto w-[90%]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Event</h1>
      </div>

      <div className="solana-card p-6 max-w-2xl mx-auto">
        <div className="w-16 h-16 mb-6 bg-(--solana-purple)/10 rounded-full flex items-center justify-center">
          <Badge size={28} className="text-(--solana-purple)" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name*</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Solana Hacker House"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Event Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target?.value || "")
              }
              placeholder="A brief description of your event..."
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Event Date*</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tokenCount">Number of Proof Tokens</Label>
              <div className="relative">
                <Input
                  id="tokenCount"
                  type="number"
                  min="1"
                  max="10000"
                  value={tokenCount}
                  onChange={(e) => setTokenCount(parseInt(e.target.value))}
                />
                <Users className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              className="solana-button w-full"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Creating Event..."
                : "Create Event & Mint Tokens"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;
