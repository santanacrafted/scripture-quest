import { Injectable } from '@angular/core';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Observable, of } from 'rxjs';
import { firebaseAuth, firebaseDb, firebaseFunctions } from '../firebase';
import { FriendRequest, Friendship, PublicPlayer } from './friends.models';

@Injectable({providedIn:'root'})
export class FriendsService {
  private call<T,R>(name:string, data:T) { return httpsCallable<T,R>(firebaseFunctions,name)(data).then(r=>r.data); }
  searchPlayers(query:string) { return this.call<{query:string},{players:PublicPlayer[]}>('searchPlayers',{query}); }
  sendFriendRequest(recipientId:string) { return this.call('sendFriendRequest',{recipientId}); }
  respondToFriendRequest(requestId:string, action:'accept'|'decline') { return this.call('respondToFriendRequest',{requestId,action}); }
  cancelFriendRequest(requestId:string) { return this.call('cancelFriendRequest',{requestId}); }
  removeFriend(friendshipId:string) { return this.call('removeFriend',{friendshipId}); }
  blockPlayer(userId:string) { return this.call('blockPlayer',{userId}); }
  observeFriends() { const uid=firebaseAuth.currentUser?.uid; return uid ? new Observable<Friendship[]>(subscriber=>listen<Friendship>('friendships',query(collection(firebaseDb,'friendships'),where('userIds','array-contains',uid))).subscribe({next:items=>subscriber.next(items.map(item=>{const friendId=item.userIds.find(id=>id!==uid);return {...item,friend:friendId?(item.profiles?.[friendId]??(item.friend?.uid===friendId?item.friend:undefined)):undefined}})),error:error=>subscriber.error(error)})) : of([]); }
  observeIncomingRequests() { return this.requests('recipientId'); }
  observeOutgoingRequests() { return this.requests('senderId'); }
  private requests(field:string):Observable<FriendRequest[]> { const uid=firebaseAuth.currentUser?.uid; return uid ? listen<FriendRequest>('friendRequests',query(collection(firebaseDb,'friendRequests'),where(field,'==',uid)),request=>request.status==='pending') : of([]); }
}
function listen<T extends {createdAt?:{toMillis?:()=>number}}>(_name:string,q:any,filter:(item:T)=>boolean=()=>true):Observable<T[]> { return new Observable(sub=>onSnapshot(q,(s:any)=>sub.next(s.docs.map((d:any)=>({id:d.id,...d.data()} as T)).filter(filter).sort((a:T,b:T)=>(b.createdAt?.toMillis?.()??0)-(a.createdAt?.toMillis?.()??0))),e=>sub.error(e))); }
