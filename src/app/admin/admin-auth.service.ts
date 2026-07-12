import { Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import { firebaseAuth, firebaseFunctions } from '../firebase';
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  async ensureAdmin() {
    const user = firebaseAuth.currentUser;
    if (!user) return false;
    let token = await user.getIdTokenResult();
    if (token.claims['admin'] === true) return true;
    try {
      await httpsCallable(firebaseFunctions, 'bootstrapContentAdmin')({});
      token = await user.getIdTokenResult(true);
      return token.claims['admin'] === true;
    } catch (error) {
      console.warn('[Admin] Could not bootstrap Content Studio access.', error);
      return false;
    }
  }
}
