import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Match, MatchCategory, MatchTurn, MULTIPLAYER_CATEGORIES } from './multiplayer.models';
import { QuestionService } from './question.service';
@Injectable({providedIn:'root'})
export class MultiplayerService {
 private readonly key='scripture-quest.light-matches'; private readonly turnKey='scripture-quest.light-turns';
 private readonly matchesSubject=new BehaviorSubject<Match[]>(this.load<Match[]>(this.key,[])); readonly matches$=this.matchesSubject.asObservable();
 private readonly turnsSubject=new BehaviorSubject<MatchTurn[]>(this.load<MatchTurn[]>(this.turnKey,[])); readonly turns$=this.turnsSubject.asObservable();
 constructor(private questions:QuestionService){}
 createRandomMatch(playerId='player-1', playerName='You'):Match { return this.createMatch(playerId,playerName,'quick'); }
 createFriendMatch(playerId:string,_invite?:string,friendId='friend-1'):Match { const m=this.createMatch(playerId,'You','friend'); m.playerIds[1]=friendId;m.playerNames[friendId]='Friend';m.playerState[friendId]={sparks:0,lights:[]};this.save(m);return m; }
 private createMatch(id:string,name:string,mode:'quick'|'friend'):Match { const now=new Date().toISOString(), opponent='opponent-1'; const m:Match={id:`light-${Date.now()}`,playerIds:[id,opponent],playerNames:{[id]:name,[opponent]:'GraceSeeker'},currentPlayerId:id,winnerId:null,status:'active',phase:'spin',selectedCategory:null,playerState:{[id]:{sparks:0,lights:[]},[opponent]:{sparks:0,lights:[]}},trial:null,createdAt:now,updatedAt:now,completedAt:null,lastTurnSummary:'Your lantern is ready. Spin the wheel!',mode};this.save(m);return m; }
 getMatchById(id:string){return this.matchesSubject.value.find(m=>m.id===id)}
 getActiveMatches(){return this.matchesSubject.value.filter(m=>m.status==='active').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))}
 spinWheel(matchId:string,playerId:string):Match { const m=this.must(matchId); this.assertTurn(m,playerId); if(m.phase!=='spin')throw Error('The wheel cannot be spun during this phase.'); const category=MULTIPLAYER_CATEGORIES[Math.floor(Math.random()*5)]; return this.update({...m,selectedCategory:category,phase:'question',lastTurnSummary:`The wheel landed on ${category}.`}); }
 simulateOpponent(matchId:string,playerId:string):Match { let m=this.must(matchId);if(m.currentPlayerId===playerId||m.status!=='active')return m;const opponentId=m.currentPlayerId!;if(m.phase==='spin')m=this.spinWheel(matchId,opponentId);const q=this.questions.getRandomQuestionByCategory(m.selectedCategory!,m.phase!=='question');const choice=Math.random()<.48?q.correctAnswer:q.choices.find(x=>x!==q.correctAnswer)!;return this.submitAnswer(matchId,opponentId,q.id,choice).match; }
 submitAnswer(matchId:string,playerId:string,questionId:string,answer:string){ const m=this.must(matchId),q=this.questions.getQuestionById(questionId);if(!q||m.currentPlayerId!==playerId)throw Error('Invalid turn.'); const correct=q.correctAnswer===answer; const turn:MatchTurn={id:`turn-${Date.now()}`,matchId,playerId,questionId,selectedAnswer:answer,isCorrect:correct,category:q.category,startedAt:m.updatedAt,answeredAt:new Date().toISOString(),timeExpired:false};this.saveTurn(turn);
  let next={...m,playerState:{...m.playerState,[playerId]:{...m.playerState[playerId],lights:[...m.playerState[playerId].lights]}}}; const state=next.playerState[playerId];
  if(m.phase==='question'){ if(correct){state.sparks++; if(state.sparks>=3){state.sparks=3;next.phase='light_challenge';next.lastTurnSummary='Lantern charged! A Light Challenge begins.';}else{next.phase='spin';next.selectedCategory=null;next.lastTurnSummary='Correct! You earned a Light Spark and keep your turn.';}}else{next=this.pass(next,'Incorrect. The turn passes.');}}
  else if(m.phase==='light_challenge'){state.sparks=0;if(correct&&!state.lights.includes(q.category)){state.lights.push(q.category);next.lastTurnSummary=`You captured the ${q.category} Light!`;next.phase='spin';next.selectedCategory=null;if(state.lights.length===5){next.status='completed';next.phase='complete';next.winnerId=playerId;next.currentPlayerId=null;next.completedAt=new Date().toISOString();}}else if(!correct){next=this.pass(next,'The Light Challenge was missed. Your charge is gone.');}else{const defender=next.playerIds.find(x=>x!==playerId)!;next.trial={category:q.category,challengerId:playerId,defenderId:defender,question:1,challengerScore:1,defenderScore:0};next.phase='trial';next.lastTurnSummary='Trial of Light started.';}}
  else { next.phase='spin'; next.selectedCategory=null; next.trial=null; next=this.pass(next,correct?'Trial answer recorded. Defender keeps the Light on a tie.':'Trial ended. The Light remains defended.'); }
  return {match:this.update(next),turn}; }
 forfeitMatch(id:string,p:string){const m=this.must(id),winner=m.playerIds.find(x=>x!==p)||null;return this.update({...m,status:'abandoned',phase:'complete',winnerId:winner,currentPlayerId:null,completedAt:new Date().toISOString()});}
 requestRematch(id:string,p:string){const old=this.must(id);return this.createMatch(p,old.playerNames[p]||'You',old.mode)}
 deleteLocalMatch(id:string){this.matchesSubject.next(this.matchesSubject.value.filter(m=>m.id!==id));this.persist();}
 private pass(m:Match,msg:string):Match { const next=m.playerIds.find(x=>x!==m.currentPlayerId)!; return {...m,currentPlayerId:next,phase:'spin',selectedCategory:null,lastTurnSummary:msg}; }
 private assertTurn(m:Match,playerId:string){if(!m.currentPlayerId||m.status!=='active')throw Error('This match is not active.');if(m.currentPlayerId!==playerId)throw Error('It is the opponent’s turn.');}
 private must(id:string){const m=this.getMatchById(id);if(!m)throw Error('Match not found');return m;}
 private update(m:Match){m.updatedAt=new Date().toISOString();this.save(m);return m;}
 private save(m:Match){this.matchesSubject.next([...this.matchesSubject.value.filter(x=>x.id!==m.id),m]);this.persist();}
 private saveTurn(t:MatchTurn){this.turnsSubject.next([...this.turnsSubject.value,t]);if(typeof localStorage!=='undefined')localStorage.setItem(this.turnKey,JSON.stringify(this.turnsSubject.value));}
 private persist(){if(typeof localStorage!=='undefined')localStorage.setItem(this.key,JSON.stringify(this.matchesSubject.value));}
 private load<T>(key:string,fallback:T):T{try{return typeof localStorage==='undefined'?fallback:JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}}
}
