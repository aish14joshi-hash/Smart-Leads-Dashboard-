export type UserRole = 'Admin' | 'Sales User';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name?: string;
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Lost';
export type LeadSource = 'Website' | 'Instagram' | 'Referral' | 'LinkedIn' | 'Facebook' | 'Cold Call';

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: LeadStatus;
  source: LeadSource;
  qualityScore?: number; // 1-10
  createdAt: any; // Firestore Timestamp
  updatedAt?: any;
  createdBy: string;
  smartInsight?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
