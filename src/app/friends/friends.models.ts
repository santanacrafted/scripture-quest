import { Timestamp } from 'firebase/firestore';

export interface PublicPlayer { uid: string; displayName: string; username: string; friendCode: string; avatarUrl: string | null; lastActiveAt?: Timestamp; }
export interface FriendRequest { id: string; senderId: string; recipientId: string; status: 'pending'|'accepted'|'declined'|'cancelled'|'expired'; createdAt: Timestamp; updatedAt: Timestamp; sender?: PublicPlayer; recipient?: PublicPlayer; }
export interface Friendship { id: string; userIds: string[]; createdAt: Timestamp; profiles?:Record<string,PublicPlayer>; friend?: PublicPlayer; }
