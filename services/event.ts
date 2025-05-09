import axios from "axios";

export const createEvent = async (eventData: any) => {
    const data = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/event/create`, eventData, {
        headers: {
            "Content-Type": "application/json",
        },
    });
    return data;
};

export const getEventByAddress = async (address: string) => {
    const data = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/event/address/${address}`, {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return data;
};

export const getEventById = async (id: string) => {
    const data = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/event/details/${id}`, {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return data;
};