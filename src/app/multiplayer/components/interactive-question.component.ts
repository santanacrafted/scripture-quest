import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Question } from '../multiplayer.models';

@Component({
  selector: 'app-interactive-question',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  template: `
    <main *ngIf="question" class="interactive-question">
      <header><span>{{ categoryLabel }}</span><b>{{ modeLabel }}</b><span>{{ timerLabel }}</span></header>
      <button *ngIf="closable" class="question-close" type="button" (click)="closed.emit()" aria-label="Close">×</button>
      <section>
        <p class="type">{{ question.questionType.replaceAll('_', ' ') }}</p>
        <h1>{{ question.text }}</h1>
        <button *ngIf="editable" class="question-edit" type="button" (click)="edit.emit()">Edit this question in Studio</button>
        <figure *ngIf="isPictionary" class="pictionary-image"><img *ngIf="question.media; else missing" [src]="question.media.downloadUrl" [alt]="question.media.altText"/><ng-template #missing><span>Image unavailable</span></ng-template></figure>

        <div *ngIf="isSequence" class="sequence-list" cdkDropList [cdkDropListData]="sequenceItems" [cdkDropListDisabled]="answered || submitting" (cdkDropListDropped)="drop($event)">
          <div *ngFor="let item of sequenceItems; let i=index" class="sequence-item" cdkDrag [cdkDragStartDelay]="0" [class.good]="answered && correct" [class.bad]="answered && !correct"><span>{{i+1}}</span><b>{{item}}</b><i>⠿</i><div class="drag-placeholder" *cdkDragPlaceholder></div></div>
        </div>
        <p *ngIf="isSequence && !answered" class="help">Press and drag an item into the correct position.</p>
        <button *ngIf="isSequence && !answered" class="submit" type="button" [disabled]="submitting" (click)="submitSequence()">Submit order</button>

        <div *ngIf="isPairs && question.matchPairs" class="pairs">
          <div><strong>Choose from this side</strong><button *ngFor="let item of question.matchPairs.left" type="button" [disabled]="answered || submitting" [class.selected]="left===item" [class.connected]="!!matches[item]" (click)="chooseLeft(item)">{{item}}<i>{{matches[item]?'✓':'○'}}</i></button></div>
          <div><strong>Match with this side</strong><button *ngFor="let item of question.matchPairs.right" type="button" [disabled]="answered || submitting" [class.selected]="right===item" [class.connected]="rightConnected(item)" (click)="chooseRight(item)">{{item}}<i>{{rightConnected(item)?'✓':'○'}}</i></button></div>
        </div>
        <p *ngIf="isPairs && !answered" class="help">Tap one item on each side to connect them. Tap a connected item to undo it.</p>
        <button *ngIf="isPairs && !answered" class="submit" type="button" [disabled]="submitting || !allPairs" (click)="submitPairs()">Submit matches</button>

        <div *ngIf="isVerse" class="verse-builder"><strong>Your verse</strong><div class="verse-line" cdkDropList cdkDropListOrientation="mixed" [cdkDropListData]="placed" [cdkDropListDisabled]="answered || submitting" (cdkDropListDropped)="dropVerse($event)"><button *ngFor="let segment of placed;let i=index" type="button" cdkDrag [cdkDragStartDelay]="0" (click)="removeSegment(segment)"><small>{{i+1}}</small>{{segment.text}} <i>⠿</i></button><p *ngIf="!placed.length">Tap the tiles below to build the verse.</p></div><strong *ngIf="available.length">Available tiles</strong><div class="verse-bank"><button *ngFor="let segment of available" type="button" (click)="placeSegment(segment)">{{segment.text}}</button></div></div>
        <p *ngIf="isVerse && !answered" class="help">Tap to place or remove a tile. Press briefly and drag a placed tile to rearrange it.</p>
        <button *ngIf="isVerse && !answered" class="submit" type="button" [disabled]="submitting || available.length>0" (click)="submitVerse()">Submit verse</button>

        <div *ngIf="!isSequence && !isPairs && !isVerse" class="answers"><button *ngFor="let choice of question.choices;let i=index" type="button" [disabled]="answered || submitting" [class.good]="answered && choice===question.correctAnswer" [class.bad]="answered && selected===choice && choice!==question.correctAnswer" (click)="choose(choice)"><i *ngIf="question.questionType!=='true_false'">{{letters[i]}}</i>{{choice}}</button></div>
        <article *ngIf="answered"><strong>{{correct?'A LIGHT SPARK!':'KEEP SEEKING'}}</strong><p>{{question.explanation}}</p><small>{{question.reference}}</small><button *ngIf="showContinue" class="submit" type="button" (click)="continued.emit()">{{continueLabel}}</button></article>
      </section>
    </main>`,
  styleUrl: './interactive-question.component.css',
})
export class InteractiveQuestionComponent implements OnChanges {
  @Input({required:true}) question!: Question;
  @Input() categoryLabel=''; @Input() modeLabel=''; @Input() timerLabel='∞ NO TIMER';
  @Input() answered=false; @Input() correct=false; @Input() submitting=false;
  @Input() closable=false; @Input() editable=false; @Input() showContinue=false; @Input() continueLabel='Continue';
  @Output() answerSelected=new EventEmitter<string>(); @Output() closed=new EventEmitter<void>(); @Output() edit=new EventEmitter<void>(); @Output() continued=new EventEmitter<void>();
  readonly letters=['A','B','C','D','E','F']; selected=''; sequenceItems:string[]=[]; matches:Record<string,string>={}; left='';right='';available:{id:string;text:string}[]=[];placed:{id:string;text:string}[]=[];
  ngOnChanges(changes:SimpleChanges){if(changes['question'])this.reset();}
  reset(){this.selected='';this.sequenceItems=[...(this.question?.choices||[])];this.matches={};this.left='';this.right='';this.available=[...(this.question?.verseSegments||[])];this.placed=[];}
  get isSequence(){return this.question.questionType==='sequence'} get isPairs(){return this.question.questionType==='match_pairs'} get isVerse(){return this.question.questionType==='arrange_verse'} get isPictionary(){return this.question.questionType==='pictionary'}
  choose(v:string){this.selected=v;this.answerSelected.emit(v)} drop(e:CdkDragDrop<string[]>){moveItemInArray(this.sequenceItems,e.previousIndex,e.currentIndex)} submitSequence(){this.answerSelected.emit(JSON.stringify(this.sequenceItems.map(x=>x.trim())))}
  chooseLeft(v:string){if(this.matches[v]){delete this.matches[v];this.matches={...this.matches};return}this.left=v;this.connect()} chooseRight(v:string){const l=Object.keys(this.matches).find(k=>this.matches[k]===v);if(l){delete this.matches[l];this.matches={...this.matches};return}this.right=v;this.connect()} private connect(){if(this.left&&this.right){this.matches={...this.matches,[this.left]:this.right};this.left='';this.right=''}} rightConnected(v:string){return Object.values(this.matches).includes(v)} get allPairs(){return !!this.question.matchPairs&&Object.keys(this.matches).length===this.question.matchPairs.left.length} submitPairs(){this.answerSelected.emit(JSON.stringify(Object.entries(this.matches).map(([left,right])=>({left:left.trim(),right:right.trim()})).sort((a,b)=>a.left.localeCompare(b.left))))}
  placeSegment(s:{id:string;text:string}){this.available=this.available.filter(x=>x.id!==s.id);this.placed=[...this.placed,s]} removeSegment(s:{id:string;text:string}){this.placed=this.placed.filter(x=>x.id!==s.id);this.available=[...this.available,s]} dropVerse(e:CdkDragDrop<{id:string;text:string}[]>){moveItemInArray(this.placed,e.previousIndex,e.currentIndex)} submitVerse(){this.answerSelected.emit(JSON.stringify(this.placed.map(x=>x.id)))}
}
