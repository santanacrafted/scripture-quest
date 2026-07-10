export interface AppUser {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  createdAt: string;
  friendIds: string[];
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}
