"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Download, Share } from "lucide-react";
import { toast } from "sonner";
import { createQR } from "@solana/pay";
import { useGetEventById } from "@/features/event";
import { useParams } from "next/navigation";
interface Event {
  _id: string;
  name: string;
  date: string;
  description: string,
  minted_tokens: number;
  claimed_tokens: number;
  qr_url: string;
}

const Page = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const params=useParams()
  const [url, setUrl] = useState<string>("");
   const options: Intl.DateTimeFormatOptions = {
     year: "numeric",
     month: "long",
     day: "numeric",
   };
  const {data, isFetching} = useGetEventById(params.id as string)

  useEffect(() => {
    if (data?.data) {
      setEvent(data.data);
      setUrl(data?.data.qr_url)
    }
  }, [data]);
  
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    if (qrRef.current) {
      qrRef.current.innerHTML = ""; 
      const qr = createQR(url, 160, "white", "black");
      qr.append(qrRef.current);
    }
  }, [event?._id, event?.name]);

  const handleCopyLink = () => {

    const claimUrl = `https://solana-proof-pass.com/claim?event=${event?._id}`;

    navigator.clipboard.writeText(claimUrl).then(() => {
      toast("Link copied! Share this link with your attendees.");
    });
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) {
      toast.error("Failed to download QR code.");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qr-code-${event?._id}.png`;
      link.href = pngUrl;
      link.click();
      URL.revokeObjectURL(url);
      toast(
        "QR Code Downloaded! The QR code image has been saved to your device."
      );
    };
    img.src = url;
  };
  return (
    <div className="container py-6 mx-auto w-[90%]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Event QR Code</h1>
        <Button
          className="solana-button-secondary text-[13px]"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Back to Events
        </Button>
      </div>

      <div className="solana-card p-4 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-(--solana-purple)/10 rounded-full flex items-center justify-center">
            <Badge size={28} className="text-(--solana-purple)" />
          </div>
          <h2 className="text-xl font-bold">{event?.name}</h2>
          <p className="text-[#94A3B8] text-[12px]">
            {event?.date
              ? new Date(event.date).toLocaleDateString("en-US", options)
              : "Date not available"}
          </p>
        </div>

        <div className="border-t border-border my-6"></div>

        <div className="text-center mb-4">
          <p className="text-sm text-[#7A879C] text-[13px] max-w-md mx-auto">
            Share this QR code with attendees so they can scan and claim their
            proof of attendance.
          </p>
        </div>

        <div
          id="qr-code"
          className="flex items-center justify-center mb-4"
          ref={qrRef}
        />

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            className="solana-button-secondary flex items-center gap-2 text-[13px]"
            onClick={handleCopyLink}
          >
            <Share size={16} />
            Copy Claim Link
          </Button>

          <Button
            className="solana-button flex items-center gap-2 text-[13px]"
            onClick={handleDownloadQR}
          >
            <Download size={16} />
            Download QR Code
          </Button>
        </div>

        <div className="mt-8 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-[#7A879C] text-[13px]">
              <span className="block sm:inline text-[#7A879C] text-[13px]">
                Tokens claimed:{" "}
              </span>
              <span className="font-medium">
                {event
                  ? `${event.claimed_tokens} of ${event.minted_tokens}`
                  : "Data not available"}
              </span>
            </div>
            <div className="w-full sm:w-48">
              <div className="h-2 bg-[#1B294B] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-(--solana-purple) to-(--solana-purple-dark)"
                  style={{
                    width: `${
                      event?.minted_tokens && event.minted_tokens > 0
                        ? (event.claimed_tokens / event.minted_tokens) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
