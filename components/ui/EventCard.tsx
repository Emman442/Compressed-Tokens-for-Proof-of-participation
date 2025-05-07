import React from "react";
import { Calendar, User, Badge } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EventProps {
  id: string;
  name: string;
  date: string;
  totalMinted?: number;
  totalClaimed?: number;
  image?: string;
  className?: string;
  isProof?: boolean;
  onClick?: () => void; // Added onClick prop to the interface
}

const EventCard = ({
  id,
  name,
  date,
  totalMinted,
  totalClaimed,
  image,
  className,
  isProof = false,
  onClick,
}: EventProps) => {
  return (
    <div
      className={cn(
        "solana-card overflow-hidden flex flex-col animate-fade-in cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "h-32 bg-gradient-to-r from-(--solana-purple)/80 to-(--solana-purple-dark)",
          image ? "bg-cover bg-center" : ""
        )}
        style={image ? { backgroundImage: `url(${image})` } : {}}
      >
        <div className="w-full h-full backdrop-blur-sm bg-(--solana-dark)/30 flex items-center justify-center">
          {!image && <Badge size={48} className="text-white/70" />}
        </div>
      </div>
      <div className="p-4 flex-grow">
        <h3 className="font-bold text-lg mb-1 truncate">{name}</h3>
        <div className="flex items-center text-sm text-(--muted-foreground) mb-3">
          <Calendar size={14} className="mr-1" />
          <span>{date}</span>
        </div>

        {!isProof &&
          totalMinted !== undefined &&
          totalClaimed !== undefined && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-(--muted-foreground)">Minted:</span>
                <span className="font-medium">{totalMinted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-(--muted-foreground)">Claimed:</span>
                <span className="font-medium">{totalClaimed}</span>
              </div>
              <div className="h-2 bg-[#1B294B] mt-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-(--solana-purple) to-(--solana-purple-dark)"
                  style={{
                    width: `${
                      totalMinted > 0 ? (totalClaimed / totalMinted) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

        {isProof && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center text-sm text-(--muted-foreground)">
              <User size={14} className="mr-1" />
              <span>Verified Attendance</span>
            </div>
            <Badge className="bg-(--solana-purple) text-xs py-1">Claimed</Badge>
          </div>
        )}
      </div>

      {!isProof && (
        <div className="p-4 pt-0 mt-auto">
          <button className="solana-button w-full">View QR Code</button>
        </div>
      )}
    </div>
  );
};

export default EventCard;
