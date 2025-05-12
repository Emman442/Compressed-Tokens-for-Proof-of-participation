"use client";
import React, { useEffect, useRef, useState } from "react";
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
  bn,
  createRpc,
  selectStateTreeInfo,
} from "@lightprotocol/stateless.js";
import {
  CompressedTokenProgram,
  getTokenPoolInfos,
  selectMinCompressedTokenAccountsForTransfer,
  selectTokenPoolInfo,
} from "@lightprotocol/compressed-token";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateGame, useUpdateEvent } from "@/features/event";

const CreateEventPage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [tokenCount, setTokenCount] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publicKey, signTransaction, wallet } = useWallet();
  const { create, isCreating } = useCreateGame();
  const { update, isPending } = useUpdateEvent();
  const eventVault = Keypair.generate();
  const RPC_ENDPOINT = `${process.env.NEXT_PUBLIC_HELIUS_DEVNET_URL}`;
  const COMPRESSION_ENDPOINT = RPC_ENDPOINT;
  const PROVER_ENDPOINT = RPC_ENDPOINT;

  const connection: Rpc = createRpc(
    RPC_ENDPOINT,
    COMPRESSION_ENDPOINT,
    PROVER_ENDPOINT
  );

  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    if (!publicKey || !signTransaction) {
      toast.error("Wallet not connected");
      throw new Error("Wallet not connected");
    }

    const mintKeypair = Keypair.generate();
    const rentExemptBalance =
      await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
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
    toast.success(`Mint created: ${mintKeypair.publicKey.toBase58()}`);

    const outputStateTreeInfo = selectStateTreeInfo(
      await connection.getStateTreeInfos()
    );
    const tokenPoolInfo = selectTokenPoolInfo(
      await getTokenPoolInfos(connection, mintKeypair.publicKey)
    );

    const mintToIx = await CompressedTokenProgram.mintTo({
      feePayer: publicKey,
      mint: mintKeypair.publicKey,
      authority: publicKey,
      toPubkey: publicKey,
      amount: tokenCount * 1e9,
      outputStateTreeInfo,
      tokenPoolInfo,
    });

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
    //Next, Performingg transfer to event vault

    let amount = bn(tokenCount * 1e9);
    const compressedTokenAccounts =
      await connection.getCompressedTokenAccountsByOwner(publicKey, {
        mint: mintKeypair.publicKey,
      });

    const [inputAccounts] = selectMinCompressedTokenAccountsForTransfer(
      compressedTokenAccounts.items,
      amount
    );

    const proof = await connection.getValidityProofV0(
      inputAccounts.map((account) => ({
        hash: account.compressedAccount.hash,
        tree: account.compressedAccount.treeInfo.tree,
        queue: account.compressedAccount.treeInfo.queue,
      }))
    );

    const ix = await CompressedTokenProgram.transfer({
      payer: publicKey,
      inputCompressedTokenAccounts: inputAccounts,
      toAddress: eventVault.publicKey,
      amount,
      recentInputStateRootIndices: proof.rootIndices,
      recentValidityProof: proof.compressedProof,
    });
    const transferTx = new Transaction({
      feePayer: publicKey,
      recentBlockhash: blockhash,
    });

    transferTx.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 500_000 }),
      ix
    );
    const signedTransferTx = await signTransaction(transferTx);
    const transferTxId = await connection.sendRawTransaction(
      signedTransferTx.serialize(),
      { skipPreflight: false }
    );
    await connection.confirmTransaction(transferTxId, "confirmed");

    toast.success("Transferred tokens to event vault!");

    const data = {
      name,
      description,
      date,
      minted_tokens: tokenCount,
      createdBy: publicKey.toBase58(),
      mint: mintKeypair.publicKey.toBase58(),
      keypair: {
        publicKey: eventVault.publicKey.toBase58(),
        secretKey: Buffer.from(eventVault.secretKey).toString("base64"),
      },
    };
    create(data, {
      onSuccess(data) {
        const generateQrCodeUrl = () => {
          const apiUrl = new URL(
            // `${baseUrl}/api/claim-token/${data?.data?._id}`
            `https://compressed-tokens-for-proof-of.onrender.com/api/claim-token/${data?.data?._id}`
          );

          // Encode the Solana Pay transaction request URL
          const solanaPayUrl = encodeURL({
            link: apiUrl,
            label: "Claim cToken",
            message: `Proof of Participation for ${name}`,
          });

          return solanaPayUrl.toString();
        };
        const qrUrl = generateQrCodeUrl();
        const updateData = {
          qr_url: qrUrl,
        };
        update({ id: data?.data?._id, data: updateData });
      },
      onError(err) {
        console.error("create_res", err);
      },
    });
  } catch (err) {
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
