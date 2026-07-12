import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firebaseAuth, firebaseDb } from '../firebase';
import {
  QuestionAuditLog,
  QuestionReport,
  QuestionStats,
} from './admin.models';
@Injectable({ providedIn: 'root' })
export class AdminOperationsService {
  async reports(status = '') {
    const base = collection(firebaseDb, 'questionReports');
    const q = status
      ? query(
          base,
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          limit(100)
        )
      : query(base, orderBy('createdAt', 'desc'), limit(100));
    return (await getDocs(q)).docs.map(
      (d) => ({ id: d.id, ...d.data() } as QuestionReport)
    );
  }
  async resolveReport(
    id: string,
    status: 'reviewing' | 'resolved' | 'dismissed',
    notes = ''
  ) {
    await updateDoc(doc(firebaseDb, 'questionReports', id), {
      status,
      resolutionNotes: notes,
      reviewedBy: firebaseAuth.currentUser?.uid,
      reviewedAt: serverTimestamp(),
    });
  }
  async stats() {
    return (
      await getDocs(query(collection(firebaseDb, 'questionStats'), limit(500)))
    ).docs.map((d) => ({ questionId: d.id, ...d.data() } as QuestionStats));
  }
  async audit(
    questionId: string,
    action: QuestionAuditLog['action'],
    notes = ''
  ) {
    await addDoc(collection(firebaseDb, 'questionAuditLogs'), {
      questionId,
      action,
      notes,
      actorId: firebaseAuth.currentUser?.uid,
      timestamp: serverTimestamp(),
    });
  }
  async logs(questionId: string) {
    const q = query(
      collection(firebaseDb, 'questionAuditLogs'),
      where('questionId', '==', questionId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    return (await getDocs(q)).docs.map(
      (d) => ({ id: d.id, ...d.data() } as QuestionAuditLog)
    );
  }
}
