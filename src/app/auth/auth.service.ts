import { Injectable } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { BehaviorSubject, from, map, Observable } from 'rxjs';
import { AppUser } from './auth.models';
import { UserService } from './user.service';
import { firebaseAuth } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authTimeoutMs = 15000;
  private auth: Auth;
  private currentUserSubject = new BehaviorSubject<AppUser | null>(null);
  private authReadySubject = new BehaviorSubject<boolean>(false);
  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly authReady$ = this.authReadySubject.asObservable();

  constructor(private readonly userService: UserService) {
    this.auth = firebaseAuth;
    console.info('[Auth] service initialized');
    this.auth.onAuthStateChanged(async (firebaseUser) => {
      console.info('[Auth] state changed', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid ?? null,
      });
      if (firebaseUser) {
        this.currentUserSubject.next(
          this.profileFromFirebaseUser(firebaseUser)
        );
        this.authReadySubject.next(true);
        void this.refreshProfile(firebaseUser);
      } else {
        this.currentUserSubject.next(null);
        this.authReadySubject.next(true);
      }
    });
  }

  signUp(
    email: string,
    password: string,
    username: string,
    displayName: string
  ): Observable<AppUser> {
    return from(
      (async () => {
        console.info('[Auth] signUp start');
        void this.logAuthNetworkProbe();
        const credential = await this.withAuthTimeout(
          createUserWithEmailAndPassword(this.auth, email, password),
          'Sign up is taking too long. Check your connection and try again.'
        );
        console.info('[Auth] signUp credential received', {
          uid: credential.user?.uid ?? null,
        });

        if (!credential.user) {
          throw new Error('User registration failed.');
        }

        console.info('[Auth] signUp checking username');
        const existing = await this.userService.getUserByUsername(username);
        if (existing && existing.uid !== credential.user.uid) {
          await deleteUser(credential.user).catch((error) => {
            console.warn(
              'Failed to roll back auth user after duplicate username:',
              error
            );
          });
          throw new Error('Username already taken.');
        }

        console.info('[Auth] signUp updating profile');
        await updateProfile(credential.user, { displayName });

        const user: AppUser = {
          uid: credential.user.uid,
          email,
          username,
          displayName,
          createdAt: new Date().toISOString(),
          friendIds: [],
        };

        console.info('[Auth] signUp creating Firestore user');
        await this.userService.createUser(user);
        this.currentUserSubject.next(user);
        console.info('[Auth] signUp complete');
        return user;
      })()
    );
  }

  signIn(email: string, password: string): Observable<AppUser> {
    return from(
      (async () => {
        console.info('[Auth] signIn start');
        void this.logAuthNetworkProbe();
        const credential = await this.withAuthTimeout(
          signInWithEmailAndPassword(this.auth, email, password),
          'Sign in is taking too long. Check your connection and try again.'
        );
        console.info('[Auth] signIn credential received', {
          uid: credential.user?.uid ?? null,
        });
        return credential;
      })()
        .then((credential) => {
          if (!credential.user) {
            throw new Error('Login failed.');
          }

          const profile = this.profileFromFirebaseUser(credential.user, email);
          this.currentUserSubject.next(profile);
          this.authReadySubject.next(true);
          void this.refreshProfile(credential.user);
          console.info('[Auth] signIn complete');
          return profile;
        })
        .catch((err) => {
          throw err;
        })
    ).pipe(map((user) => user));
  }

  signOut(): Observable<void> {
    return from(firebaseSignOut(this.auth)).pipe(
      map(() => {
        this.currentUserSubject.next(null);
      })
    );
  }

  getCurrentUser(): AppUser | null {
    return this.currentUserSubject.getValue();
  }

  private profileFromFirebaseUser(
    firebaseUser: User,
    fallbackEmail = ''
  ): AppUser {
    const displayName =
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      firebaseUser.uid;

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

  private withAuthTimeout<T>(operation: Promise<T>, message: string): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), this.authTimeoutMs);
    });

    return Promise.race([operation, timeout]).finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
  }

  private async logAuthNetworkProbe(): Promise<void> {
    try {
      const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      console.info('[Auth] network probe reached Firebase Auth', {
        status: response.status,
      });
    } catch (error) {
      console.warn('[Auth] network probe failed before Firebase Auth request', error);
    }
  }
}
