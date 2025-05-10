"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import EventCard from "../../components/ui/EventCard";
import EmptyState from "../../components/ui/EmptyState";
import { FileText, Loader, PlusCircle } from "lucide-react";
import { useGetEvent } from "@/features/event";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";


export interface Event {
  id: string;
  name: string;
  date: string;
  total_minted: number;
  total_claimed: number;
  qr_url: string;
}


const OrganizerDashboard = () => {
  const { publicKey } = useWallet();
  if (!publicKey) {
    return (
      <div className="container py-4 mx-auto w-[90%] flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState
          title="Connect Your Wallet"
          description="Please connect your wallet to view your events."
          icon={<FileText size={24} className="text-muted-foreground" />}
        />
        <WalletMultiButton style={{ height: "40px", borderRadius: "6px" }} />
      </div>
    );  
  }
  const { data, isFetching } =  useGetEvent(publicKey.toString()) 
  const router = useRouter();
  const [events, setEvents] = useState<Event[] | null>(null);

  // Update events when data changes
  useEffect(() => {
    if (data) {
      console.log("data", data)
      setEvents(data.data);
    }
  }, [data]);

  const handleEventClick = (eventId:any) => {
    router.push(`dashboard/my-events/${eventId}`);
  };

  const navigateToCreateEvent = () => {
    router.push("/create-event");
  };

  // Loading state
  if (isFetching) {
    return (
      <div className="container py-6 mx-auto w-[90%] flex flex-col items-center justify-center min-h-[60vh]">
        <Loader className="h-8 w-8 animate-spin text-solana-purple mb-4" />
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="container py-6 mx-auto w-[90%]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Organizer Dashboard</h1>

        <Button
          className="solana-button flex items-center gap-2"
          onClick={navigateToCreateEvent}
        >
          <PlusCircle size={16} />
          <span>Create Event</span>
        </Button>
      </div>

      {events && events?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => (
            <EventCard
              key={event?._id}
              {...event}
              onClick={() => handleEventClick(event._id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Events Created"
          description="Connect your wallet and create your first event to start generating attendance proofs for your participants."
          icon={<FileText size={24} className="text-muted-foreground" />}
          action={
            <Button className="solana-button" onClick={navigateToCreateEvent}>
              Create Your First Event
            </Button>
          }
        />
      )}
    </div>
  );
};

export default OrganizerDashboard;

