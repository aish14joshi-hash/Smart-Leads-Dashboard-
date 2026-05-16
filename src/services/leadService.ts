import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter, 
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Lead, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';

const COLLECTION_NAME = 'leads';

export const leadService = {
  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'createdBy'>) {
    const path = COLLECTION_NAME;
    try {
      const docRef = await addDoc(collection(db, path), {
        ...leadData,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateLead(id: string, leadData: Partial<Lead>) {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...leadData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteLead(id: string) {
    const path = `${COLLECTION_NAME}/${id}`;
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getLeads(filters: { 
    status?: string | 'all', 
    source?: string | 'all', 
    search?: string,
    sortOrder?: 'desc' | 'asc',
    lastDoc?: any,
    pageSize?: number
  }) {
    const path = COLLECTION_NAME;
    try {
      const constraints: QueryConstraint[] = [];

      if (filters.status && filters.status !== 'all') {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters.source && filters.source !== 'all') {
        constraints.push(where('source', '==', filters.source));
      }

      // Note: Full text search in Firestore is limited. 
      // For basic search by name or email, we'd need another strategy or external service.
      // We can do simple prefix search for one field if orderBy is same.
      // But for multiple fields, we'll filter on client for search if dataset is small,
      // or just search by a specific field if requested.
      // Given the requirement "Search by Name or Email", I'll try to use a combined filter if possible or just handle it carefully.
      
      constraints.push(orderBy('createdAt', filters.sortOrder || 'desc'));

      if (filters.lastDoc) {
        constraints.push(startAfter(filters.lastDoc));
      }

      const q = query(collection(db, path), ...constraints, limit(filters.pageSize || 10));
      const snapshot = await getDocs(q);
      
      let leads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];

      // Client side search for Name/Email if search term provided
      if (filters.search) {
        const term = filters.search.toLowerCase();
        leads = leads.filter(l => 
          l.name.toLowerCase().includes(term) || 
          l.email.toLowerCase().includes(term) ||
          l.phone.toLowerCase().includes(term)
        );
      }

      return {
        leads,
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
};
