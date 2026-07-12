import { Injectable } from '@angular/core';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { firebaseApp, firebaseAuth } from '../firebase';
@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly firebaseStorage = getStorage(firebaseApp);
  private allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  async upload(file: File, questionId = 'draft') {
    if (!this.allowed.includes(file.type))
      throw Error('Use a JPEG, PNG, WebP, or GIF image.');
    if (file.size > 10 * 1024 * 1024)
      throw Error('Image must be smaller than 10 MB.');
    const uid = firebaseAuth.currentUser?.uid;
    if (!uid) throw Error('Sign in required.');
    const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
    const path = `question-media/${questionId}/${Date.now()}-${crypto.randomUUID()}-${safe}`;
    const target = ref(this.firebaseStorage, path);
    await uploadBytes(target, file, {
      contentType: file.type,
      customMetadata: { uploadedBy: uid },
    });
    return {
      storagePath: path,
      downloadUrl: await getDownloadURL(target),
      mimeType: file.type,
      altText: '',
    };
  }
  async remove(path: string) {
    if (path) await deleteObject(ref(this.firebaseStorage, path));
  }
}
