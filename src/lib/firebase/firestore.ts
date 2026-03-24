import { collection, getDocs, limit, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { db } from './client';
import type { Evento } from '../types';

export async function getEvents(count?: number): Promise<Evento[]> {
  if (!db) {
    // This is expected if Firebase is not configured
    return [];
  }
  try {
    const eventsCollection = collection(db, 'events');
    const q = count 
      ? query(eventsCollection, orderBy('date', 'desc'), limit(count))
      : query(eventsCollection, orderBy('date', 'desc'));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No matching documents.');
      return [];
    }

    const events: Evento[] = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        events.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            date: data.date,
            imageUrl: data.imageUrl,
        });
    });

    return events;
  } catch (error) {
    console.error("Error getting documents: ", error);
    // Return empty array on error so UI doesn't break
    return [];
  }
}

export async function getEvent(id: string): Promise<Evento | null> {
    if (!db) {
        // This is expected if Firebase is not configured
        return null;
    }
    try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                title: data.title,
                description: data.description,
                date: data.date,
                imageUrl: data.imageUrl,
            };
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting document:", error);
        return null;
    }
}
