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
} from 'firebase/auth';
import { BehaviorSubject, catchError, defer, from, map, Observable, switchMap, throwError } from 'rxjs';
import { AppUser } from './auth.models';
import { UserService } from './user.service';
import { firebaseApp } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth: Auth;
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly userService: UserService) {
    this.auth = getAuth(firebaseApp);
    void setPersistence(this.auth, browserLocalPersistence).catch((error) => {
      console.error('Failed to set auth persistence:', error);
    });
    this.auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await this.userService.getUserByUid(firebaseUser.uid);
        this.currentUserSubject.next(profile ?? null);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  signUp(email: string, password: string, username: string): Observable<AppUser> {
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

        await updateProfile(credential.user, { displayName: username });

        const user: AppUser = {
          uid: credential.user.uid,
          email,
          username,
          displayName: username,
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
    console.log('AuthService.signIn called', email);
    return from(
      signInWithEmailAndPassword(this.auth, email, password)
        .then(async (credential) => {
          if (!credential.user) {
            throw new Error('Login failed.');
          }
          let profile = null;
          try {
            profile = await this.userService.getUserByUid(credential.user.uid);
          } catch (err) {
            console.warn('AuthService.signIn: failed to load profile from Firestore', err);
            // If Firestore is offline, fall back to a minimal in-memory profile
            profile = {
              uid: credential.user.uid,
              email: credential.user.email ?? email,
              username: credential.user.displayName ?? credential.user.uid,
              displayName: credential.user.displayName ?? credential.user.uid,
              createdAt: new Date().toISOString(),
              friendIds: [],
            } as AppUser;
          }

          if (!profile) {
            // If profile wasn't found in Firestore (null) try to create one, but tolerate failures
            try {
              const newProfile: AppUser = {
                uid: credential.user.uid,
                email: credential.user.email ?? email,
                username: credential.user.displayName ?? credential.user.uid,
                displayName: credential.user.displayName ?? credential.user.uid,
                createdAt: new Date().toISOString(),
                friendIds: [],
              };
              await this.userService.createUser(newProfile);
              profile = newProfile;
            } catch (err) {
              console.warn('AuthService.signIn: failed to create profile in Firestore', err);
              profile = {
                uid: credential.user.uid,
                email: credential.user.email ?? email,
                username: credential.user.displayName ?? credential.user.uid,
                displayName: credential.user.displayName ?? credential.user.uid,
                createdAt: new Date().toISOString(),
                friendIds: [],
              } as AppUser;
            }
          }

          this.currentUserSubject.next(profile);
          console.log('AuthService.signIn success', credential.user.uid);
          return profile;
        })
        .catch((err) => {
          console.error('AuthService.signIn failed', err);
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
}
