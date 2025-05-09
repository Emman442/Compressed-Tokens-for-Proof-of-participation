import { createEvent, getEventByAddress, getEventById } from "@/services/event";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateGame() {
    const queryClient = useQueryClient();

    const { mutate: create, isPending: isCreating } = useMutation({
        mutationFn: (gameData: any) => createEvent(gameData),
    });

    return { isCreating, create };
}


export function useGetEvent(address: string) {

    const queryClient = useQueryClient();
    const { data, isFetching } = useQuery({
        queryKey: ["my-events", address], // ✅ now includes ID
        queryFn: () => getEventByAddress(address), // ✅ direct access to ID
        enabled: !!address, // ✅ optional: prevent running if ID is undefined/null
    });



    return { data, isFetching };

}


export function useGetEventById(id: string) {
    const queryClient = useQueryClient();
    const { data, isFetching } = useQuery({
        queryKey: ["event", id],
        queryFn: () => getEventById(id),
        enabled: !!id,
    });



    return { data, isFetching };
}