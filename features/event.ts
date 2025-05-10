import { createEvent, getEventByAddress, getEventById, updateEvent } from "@/services/event";
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
        queryKey: ["my-events", address], 
        queryFn: () => getEventByAddress(address),
        enabled: !!address,
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


export function useUpdateEvent() {
    const queryClient = useQueryClient();
    const { mutate: update, isPending } = useMutation({
        mutationFn: ({ id, data }: {id: string, data: any}) => updateEvent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        }
    });
    return { update, isPending };
}