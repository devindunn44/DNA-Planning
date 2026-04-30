export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  pairingCode: string;
  partnerUid?: string;
  theme?: string;
  settings?: {
    reminders: boolean;
    dailySummary: boolean;
    partnerUpdates: boolean;
    smartSuggest: boolean;
  };
}

export interface SharedEvent {
  id: string;
  title: string;
  tag: string;
  date: string;
  time: string;
  notes?: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export interface WorkEvent {
  id: string;
  title: string;
  sub?: string;
  date: string;
  time: string;
  dur?: string;
  ownerId: string;
}

export interface Pairing {
  id: string;
  uids: string[];
  createdAt: any;
}
