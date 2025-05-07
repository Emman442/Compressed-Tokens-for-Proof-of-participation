"use client"
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EventCard from "../../components/ui/EventCard";
import EmptyState from "../../components/ui/EmptyState";
import { PlusCircle, FileText } from "lucide-react";

// Mock data
const mockEvents = [
  {
    id: "1",
    name: "Solana Hacker House",
    date: "May 10, 2025",
    totalMinted: 150,
    totalClaimed: 87,
  },
  {
    id: "2",
    name: "Breakpoint Conference",
    date: "June 15, 2025",
    totalMinted: 300,
    totalClaimed: 142,
  },
  {
    id: "3",
    name: "Web3 Developer Summit",
    date: "July 22, 2025",
    totalMinted: 200,
    totalClaimed: 78,
  },
];

const OrganizerDashboard = () => {
  const router = useRouter();
  const [events, setEvents] = useState(mockEvents);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  const handleCreateEvent = () => {
    if (newEventName && newEventDate) {
      const newEvent = {
        id: `${events.length + 1}`,
        name: newEventName,
        date: newEventDate,
        totalMinted: 0,
        totalClaimed: 0,
      };

      setEvents([...events, newEvent]);
      setNewEventName("");
      setNewEventDate("");

      // Navigate to create event page in a real implementation
      // navigate('/create-event');
    }
  };

  const handleEventClick = (eventId: string) => {
    router.push(`/event-qr/${eventId}`);
  };

  const navigateToCreateEvent = () => {
    router.push("/create-event");
  };

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

      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              {...event}
              onClick={() => handleEventClick(event.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Events Created"
          description="Create your first event to start generating attendance proofs for your participants."
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



//npm install @solana/web3.js@1 @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets