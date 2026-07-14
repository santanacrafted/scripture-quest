import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firebaseAuth, firebaseDb } from '../firebase';
import { firebaseFunctions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { StudioQuestion } from './admin.models';
import { AdminOperationsService } from './admin-operations.service';
@Injectable({ providedIn: 'root' })
export class QuestionRepository {
  private col = collection(firebaseDb, 'questions');
  constructor(private operations: AdminOperationsService) {}
  async list(status?: string) {
    const q = status
      ? query(
          this.col,
          where('status', '==', status),
          orderBy('updatedAt', 'desc')
        )
      : query(this.col, orderBy('updatedAt', 'desc'));
    return (await getDocs(q)).docs.map(
      (d) => ({ id: d.id, ...d.data() } as StudioQuestion)
    );
  }
  async get(id: string) {
    const s = await getDoc(doc(this.col, id));
    return s.exists() ? ({ id: s.id, ...s.data() } as StudioQuestion) : null;
  }
  async save(value: Partial<StudioQuestion>, id?: string) {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw Error('Sign in required.');
    const result = await httpsCallable<
      { questionId?: string; question: Partial<StudioQuestion> },
      { questionId: string }
    >(
      firebaseFunctions,
      'saveContentQuestion'
    )({ questionId: id, question: value });
    return result.data.questionId;
  }
  async publish(id: string, value: Partial<StudioQuestion>) {
    await httpsCallable(
      firebaseFunctions,
      'publishQuestion'
    )({ questionId: id, question: value });
  }
  async updateStatus(
    id: string,
    status: StudioQuestion['status'],
    reason = ''
  ) {
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw Error('Sign in required.');
    await updateDoc(doc(this.col, id), {
      status,
      isActive: status === 'published',
      rejectionReason: reason || null,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    });
    await this.operations.audit(
      id,
      status === 'archived'
        ? 'archived'
        : status === 'rejected'
        ? 'rejected'
        : status === 'review'
        ? 'submitted_for_review'
        : 'restored',
      reason
    );
  }
  async bulkUpdate(ids: string[], changes: Partial<StudioQuestion>) {
    for (const id of ids) {
      await updateDoc(doc(this.col, id), {
        ...changes,
        updatedAt: serverTimestamp(),
        updatedBy: firebaseAuth.currentUser?.uid,
      });
      await this.operations.audit(
        id,
        changes.status === 'archived'
          ? 'archived'
          : changes.isActive === false
          ? 'deactivated'
          : changes.isActive === true
          ? 'activated'
          : 'updated'
      );
    }
  }
  async deleteQuestion(id: string) {
    await deleteDoc(doc(this.col, id));
    await this.operations.audit(
      id,
      'archived',
      'Question permanently deleted.'
    );
  }
  async bulkDelete(ids: string[]) {
    for (const id of ids) await this.deleteQuestion(id);
  }
  async bulkPublish(ids: string[]) {
    const failures: { id: string; message: string }[] = [];
    let published = 0;
    for (const id of ids) {
      try {
        const question = await this.get(id);
        if (!question) throw Error('Question not found.');
        await this.publish(id, question);
        published++;
      } catch (error: any) {
        failures.push({
          id,
          message: String(error?.message || 'Publishing failed.').replace(
            /^FirebaseError:\s*/,
            ''
          ),
        });
      }
    }
    return { published, failures };
  }
  async importQuestions(rows: Partial<StudioQuestion>[], publish = false) {
    const callable = httpsCallable<
      { questions: Partial<StudioQuestion>[]; publish: boolean },
      { imported: number }
    >(
      firebaseFunctions,
      'bulkImportQuestions'
    );
    let imported = 0;
    // Keep each callable request comfortably below payload and Firestore batch
    // limits while allowing the source dataset itself to be any size.
    for (let offset = 0; offset < rows.length; offset += 400) {
      try {
        const result = await callable({ questions: rows.slice(offset, offset + 400), publish });
        imported += result.data.imported;
      } catch (error: any) {
        const code = String(error?.code || '');
        // Older deployed backends may not have bulkImportQuestions yet. Use
        // the established single-question callables until Functions is updated.
        if (!code.endsWith('not-found') && !code.endsWith('unimplemented')) throw error;
        for (const question of rows.slice(offset, offset + 400)) {
          const id = await this.save({ ...question, status: publish ? 'published' : 'draft', isActive: publish });
          if (publish) await this.publish(id, question);
          imported++;
        }
      }
    }
    return imported;
  }
  async duplicateTranslation(question: StudioQuestion) {
    const group = question.translationGroupId || `translation_${question.id}`;
    await updateDoc(doc(this.col, question.id), { translationGroupId: group });
    const copy = {
      ...question,
      language: (question.language === 'en' ? 'es' : 'en') as 'en' | 'es',
      translationGroupId: group,
      prompt: '',
      explanation: '',
      status: 'draft' as const,
      isActive: false,
    };
    delete (copy as Partial<StudioQuestion>).id;
    delete (copy as Partial<StudioQuestion>).createdAt;
    delete (copy as Partial<StudioQuestion>).updatedAt;
    return this.save(copy);
  }
  normalize(value = '') {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñ ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  findDuplicates(
    candidate: Partial<StudioQuestion>,
    existing: StudioQuestion[]
  ) {
    const prompt = this.normalize(candidate.prompt);
    return existing.filter(
      (q) =>
        q.language === candidate.language &&
        this.normalize(q.prompt) === prompt &&
        q.category === candidate.category
    );
  }
}
