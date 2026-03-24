
import { Timestamp } from "firebase/firestore";

export interface Evento {
    id: string;
    title: string;
    description: string;
    date: Timestamp;
    imageUrl?: string;
}
