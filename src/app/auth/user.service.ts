import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  orderBy,
  limit,
  DocumentData,
} from 'firebase/firestore';
import { firebaseDb } from '../firebase';
import { AppUser } from './auth.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersCollection = collection(firebaseDb, 'users');

  async createUser(user: AppUser): Promise<void> {
    await setDoc(doc(firebaseDb, 'users', user.uid), {...user,usernameLowercase:user.username.trim().toLowerCase(),displayNameLowercase:user.displayName.trim().toLowerCase()});
  }

  async getUserByUid(uid: string): Promise<AppUser | null> {
    const snapshot = await getDoc(doc(firebaseDb, 'users', uid));
    return snapshot.exists() ? (snapshot.data() as AppUser) : null;
  }

  async getUserByUsername(username: string): Promise<AppUser | null> {
    const q = query(this.usersCollection, where('username', '==', username), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : (snapshot.docs[0].data() as AppUser);
  }

  async searchUsersByUsername(term: string, excludeUid?: string): Promise<AppUser[]> {
    if (!term.trim()) {
      return [];
    }

    const q = query(
      this.usersCollection,
      orderBy('username'),
      where('username', '>=', term),
      where('username', '<=', term + '\uf8ff'),
      limit(10),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => doc.data() as AppUser)
      .filter((user) => user.uid !== excludeUid);
  }

  async addFriend(currentUid: string, friendUid: string): Promise<void> {
    if (currentUid === friendUid) {
      throw new Error('Cannot add yourself as a friend.');
    }

    const currentRef = doc(firebaseDb, 'users', currentUid);
    const friendRef = doc(firebaseDb, 'users', friendUid);
    await updateDoc(currentRef, { friendIds: [...(await this.getUserByUid(currentUid))?.friendIds ?? [], friendUid] });
    await updateDoc(friendRef, { friendIds: [...(await this.getUserByUid(friendUid))?.friendIds ?? [], currentUid] });
  }

  async getFriends(uid: string): Promise<AppUser[]> {
    const user = await this.getUserByUid(uid);
    if (!user || !user.friendIds.length) {
      return [];
    }

    const friends = await Promise.all(
      user.friendIds.map(async (friendUid) => this.getUserByUid(friendUid)),
    );
    return friends.filter((friend): friend is AppUser => !!friend);
  }
}
