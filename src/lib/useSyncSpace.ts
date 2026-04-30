import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, SharedEvent, WorkEvent, Pairing } from '../types';

export function useSyncSpace() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [sharedEvents, setSharedEvents] = useState<SharedEvent[]>([]);
  const [myWorkEvents, setMyWorkEvents] = useState<WorkEvent[]>([]);
  const [partnerWorkEvents, setPartnerWorkEvents] = useState<WorkEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setPairing(null);
        setPartnerProfile(null);
        setSharedEvents([]);
        setMyWorkEvents([]);
        setPartnerWorkEvents([]);
        setLoading(false);
      }
    });
  }, []);

  // Profile Listener
  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    return onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
      } else {
        // Create initial profile if it doesn't exist
        const pairingCode = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
        const newProfile: Partial<UserProfile> = {
          displayName: user.displayName || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || '',
          pairingCode,
          settings: {
            reminders: true,
            dailySummary: true,
            partnerUpdates: true,
            smartSuggest: true
          }
        };
        setDoc(profileRef, newProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
      }
    }, (e) => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`));
  }, [user]);

  // Pairing & Shared Events Listener
  useEffect(() => {
    if (!user || !profile?.partnerUid) {
      setPairing(null);
      setSharedEvents([]);
      return;
    }

    const pairingId = [user.uid, profile.partnerUid].sort().join('_');
    const pairingRef = doc(db, 'pairings', pairingId);
    
    // Check/Create pairing doc if it doesn't exist
    getDoc(pairingRef).then(snap => {
      if (!snap.exists()) {
        setDoc(pairingRef, {
          uids: [user.uid, profile.partnerUid],
          createdAt: serverTimestamp()
        }).catch(e => handleFirestoreError(e, OperationType.WRITE, `pairings/${pairingId}`));
      }
    });

    const unsubscribePairing = onSnapshot(pairingRef, (snap) => {
      if (snap.exists()) {
        setPairing({ id: snap.id, ...snap.data() } as Pairing);
      }
    });

    const eventsRef = collection(db, 'pairings', pairingId, 'events');
    const eventsQuery = query(eventsRef, orderBy('date', 'asc'), orderBy('time', 'asc'));
    const unsubscribeEvents = onSnapshot(eventsQuery, (snap) => {
      const evs = snap.docs.map(d => ({ id: d.id, ...d.data() }) as SharedEvent);
      setSharedEvents(evs);
      setLoading(false);
    }, (e) => handleFirestoreError(e, OperationType.GET, `pairings/${pairingId}/events`));

    // Partner Profile Listener
    const partnerRef = doc(db, 'users', profile.partnerUid);
    const unsubscribePartner = onSnapshot(partnerRef, (snap) => {
      if (snap.exists()) {
        setPartnerProfile({ uid: snap.id, ...snap.data() } as UserProfile);
      }
    });

    return () => {
      unsubscribePairing();
      unsubscribeEvents();
      unsubscribePartner();
    };
  }, [user, profile?.partnerUid]);

  // Work Events Listener
  useEffect(() => {
    if (!user) return;
    const workRef = collection(db, 'users', user.uid, 'work_events');
    const unsubscribeMyWork = onSnapshot(workRef, (snap) => {
      setMyWorkEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }) as WorkEvent));
    });

    let unsubscribePartnerWork = () => {};
    if (profile?.partnerUid) {
      const partnerWorkRef = collection(db, 'users', profile.partnerUid, 'work_events');
      unsubscribePartnerWork = onSnapshot(partnerWorkRef, (snap) => {
        setPartnerWorkEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }) as WorkEvent));
      });
    }

    return () => {
      unsubscribeMyWork();
      unsubscribePartnerWork();
    };
  }, [user, profile?.partnerUid]);

  const createSharedEvent = async (event: Omit<SharedEvent, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !profile?.partnerUid) return;
    const pairingId = [user.uid, profile.partnerUid].sort().join('_');
    const eventsRef = collection(db, 'pairings', pairingId, 'events');
    await addDoc(eventsRef, {
      ...event,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const updateSharedEvent = async (id: string, updates: Partial<SharedEvent>) => {
    if (!user || !profile?.partnerUid) return;
    const pairingId = [user.uid, profile.partnerUid].sort().join('_');
    const eventRef = doc(db, 'pairings', pairingId, 'events', id);
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  };

  const deleteSharedEvent = async (id: string) => {
    if (!user || !profile?.partnerUid) return;
    const pairingId = [user.uid, profile.partnerUid].sort().join('_');
    const eventRef = doc(db, 'pairings', pairingId, 'events', id);
    await deleteDoc(eventRef);
  };

  const linkPartner = async (partnerCode: string) => {
    if (!user) return;
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('pairingCode', '==', partnerCode.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("Invalid partner code");
    
    const partnerDoc = snap.docs[0];
    const partnerUid = partnerDoc.id;
    
    // Update both profiles
    await updateDoc(doc(db, 'users', user.uid), { partnerUid });
    await updateDoc(doc(db, 'users', partnerUid), { partnerUid: user.uid });
  };

  return {
    user,
    profile,
    pairing,
    partnerProfile,
    sharedEvents,
    myWorkEvents,
    partnerWorkEvents,
    loading,
    createSharedEvent,
    updateSharedEvent,
    deleteSharedEvent,
    linkPartner
  };
}
