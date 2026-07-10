import { Injectable } from '@angular/core';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Observable, of } from 'rxjs';
import { firebaseAuth, firebaseDb, firebaseFunctions } from '../firebase';
import { BattleInvitation, FriendBattleMatch } from './friend-battle.models';
@Injectable({providedIn:'root'}) export class FriendBattleService {
 private call<T,R>(n:string,d:T){return httpsCallable<T,R>(firebaseFunctions,n)(d).then(x=>x.data);}
 sendInvitation(recipientId:string,rounds=6){return this.call('sendFriendBattleInvitation',{recipientId,rounds});}
 cancelInvitation(invitationId:string){return this.call('cancelBattleInvitation',{invitationId});}
 acceptInvitation(invitationId:string){return this.call<{invitationId:string;action:string},{matchId:string}>('respondToBattleInvitation',{invitationId,action:'accept'});}
 declineInvitation(invitationId:string){return this.call('respondToBattleInvitation',{invitationId,action:'decline'});}
 setReady(matchId:string,ready:boolean){return this.call('setLobbyReady',{matchId,ready});}
 startMatch(matchId:string){return this.call('startFriendBattle',{matchId});}
 hydrateMatchPlayerProfiles(matchId:string){return this.call('hydrateMatchPlayerProfiles',{matchId});}
 observeIncomingInvitations(){return this.invitations('recipientId');} observeOutgoingInvitations(){return this.invitations('challengerId');}
 observeMatches(){const u=firebaseAuth.currentUser?.uid;return u?listen<FriendBattleMatch>(query(collection(firebaseDb,'matches'),where('playerIds','array-contains',u))):of([]);}
 observeLobby(id:string){return new Observable<FriendBattleMatch|null>(s=>onSnapshot(doc(firebaseDb,'matches',id),d=>s.next(d.exists()?{id:d.id,...d.data()} as FriendBattleMatch:null),e=>s.error(e)));}
 private invitations(f:string){const u=firebaseAuth.currentUser?.uid;return u?listen<BattleInvitation>(query(collection(firebaseDb,'battleInvitations'),where(f,'==',u))):of([]);}
}
function listen<T extends {createdAt?:{toMillis?:()=>number};updatedAt?:{toMillis?:()=>number}}>(q:any):Observable<T[]>{return new Observable(s=>onSnapshot(q,(x:any)=>s.next(x.docs.map((d:any)=>({id:d.id,...d.data()} as T)).sort((a:T,b:T)=>(b.updatedAt?.toMillis?.()??b.createdAt?.toMillis?.()??0)-(a.updatedAt?.toMillis?.()??a.createdAt?.toMillis?.()??0))),e=>s.error(e)));}
