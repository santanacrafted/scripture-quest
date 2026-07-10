import { Injectable } from '@angular/core';
import {
  Auth,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { BehaviorSubject, from, map, Observable } from 'rxjs';
import { AppUser } from './auth.models';
import { UserService } from './user.service';
import { firebaseApp } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth;
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  private authReadySubject = new BehaviorSubject<boolean>(false);
  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly authReady$ = this.authReadySubject.asObservable();

  constructor(private readonly userService: UserService) {
    this.auth = getAuth(firebaseApp);
    void setPersistence(this.auth, browserLocalPersistence).catch((error) => {
      console.error('Failed to set auth persistence:', error);
    });
    this.auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        this.currentUserSubject.next(this.profileFromFirebaseUser(firebaseUser));
        this.authReadySubject.next(true);
        void this.refreshProfile(firebaseUser);
      } else {
        this.currentUserSubject.next(null);
        this.authReadySubject.next(true);
      }
    });
  }

  signUp(email: string, password: string, username: string, displayName: string): Observable<AppUser> {
    return from(
      (async () => {
        const existing = await this.userService.getUserByUsername(username);
        if (existing) {
          throw new Error('Username already taken.');
        }

        await setPersistence(this.auth, browserLocalPersistence);
        const credential = await createUserWithEmailAndPassword(this.auth, email, password);

        if (!credential.user) {
          throw new Error('User registration failed.');
        }

        await updateProfile(credential.user, { displayName });

        const user: AppUser = {
          uid: credential.user.uid,
          email,
          username,
          displayName,
          createdAt: new Date().toISOString(),
          friendIds: [],
        };

        await this.userService.createUser(user);
        this.currentUserSubject.next(user);
        return user;
      })(),
    );
  }

  signIn(email: string, password: string): Observable<AppUser> {
    return from(
      signInWithEmailAndPassword(this.auth, email, password)
        .then((credential) => {
          if (!credential.user) {
            throw new Error('Login failed.');
          }

          const profile = this.profileFromFirebaseUser(credential.user, email);
          this.currentUserSubject.next(profile);
          this.authReadySubject.next(true);
          void this.refreshProfile(credential.user);
          return profile;
        })
        .catch((err) => {
          throw err;
        }),
    ).pipe(map((user) => user));
  }

  signOut(): Observable<void> {
    return from(firebaseSignOut(this.auth)).pipe(
      map(() => {
        this.currentUserSubject.next(null);
      }),
    );
  }

  getCurrentUser(): AppUser | null {
    return this.currentUserSubject.getValue();
  }

  private profileFromFirebaseUser(firebaseUser: User, fallbackEmail = ''): AppUser {
    const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || firebaseUser.uid;

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? fallbackEmail,
      username: displayName,
      displayName,
      createdAt: new Date().toISOString(),
      friendIds: [],
    };
  }

  private async refreshProfile(firebaseUser: User): Promise<void> {
    try {
      const profile = await this.userService.getUserByUid(firebaseUser.uid);
      if (profile) {
        this.currentUserSubject.next(profile);
        return;
      }

      const fallbackProfile = this.profileFromFirebaseUser(firebaseUser);
      await this.userService.createUser(fallbackProfile);
      this.currentUserSubject.next(fallbackProfile);
    } catch (error) {
      console.warn('Failed to refresh auth profile:', error);
    }
  }
}
