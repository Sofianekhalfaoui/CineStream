import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

interface RoomState {
  hostId: string;
  mediaId: string;
  mediaType: string;
  currentTime: number;
  isPlaying: boolean;
  participants: string[];
  lastUpdated: number;
  currentServerIndex?: number;
  lastReaction?: {
    emoji: string;
    userId: string;
    timestamp: number;
  };
}

interface WatchPartyContextType {
  roomId: string | null;
  roomState: RoomState | null;
  createRoom: (mediaId: string, mediaType: string) => Promise<string>;
  joinRoom: (roomId: string) => Promise<RoomState>;
  leaveRoom: () => Promise<void>;
  updateRoomState: (updates: Partial<RoomState>) => Promise<void>;
  sendReaction: (emoji: string) => Promise<void>;
}

const WatchPartyContext = createContext<WatchPartyContextType | undefined>(undefined);

export const WatchPartyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!roomId) {
      setRoomState(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'rooms', roomId), (doc) => {
      if (doc.exists()) {
        setRoomState(doc.data() as RoomState);
      } else {
        setRoomId(null);
        setRoomState(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${roomId}`);
    });

    return () => unsub();
  }, [roomId]);

  const createRoom = async (mediaId: string, mediaType: string) => {
    const activeUser = user || auth.currentUser;
    if (!activeUser) throw new Error('Auth required');
    const newRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    const initialState: RoomState = {
      hostId: activeUser.uid,
      mediaId,
      mediaType,
      currentTime: 0,
      isPlaying: false,
      participants: [activeUser.uid],
      currentServerIndex: 0,
      lastUpdated: Date.now(),
    };
    try {
      await setDoc(doc(db, 'rooms', newRoomId), initialState);
      setRoomId(newRoomId);
      return newRoomId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `rooms/${newRoomId}`);
      throw error;
    }
  };

  const joinRoom = async (id: string): Promise<RoomState> => {
    const activeUser = user || auth.currentUser;
    if (!activeUser) throw new Error('Auth required');
    
    let roomDoc;
    try {
      roomDoc = await getDoc(doc(db, 'rooms', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `rooms/${id}`);
      throw error;
    }

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }
    
    const data = roomDoc.data() as RoomState;
    if (!data.participants.includes(activeUser.uid)) {
      try {
        await updateDoc(doc(db, 'rooms', id), {
          participants: [...data.participants, activeUser.uid]
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `rooms/${id}`);
        throw error;
      }
    }
    setRoomId(id);
    return data;
  };

  const leaveRoom = async () => {
    const activeUser = user || auth.currentUser;
    if (!activeUser || !roomId) return;
    try {
      const roomDoc = await getDoc(doc(db, 'rooms', roomId));
      if (roomDoc.exists()) {
        const data = roomDoc.data() as RoomState;
        const newParticipants = data.participants.filter(p => p !== activeUser.uid);
        if (newParticipants.length === 0) {
          await deleteDoc(doc(db, 'rooms', roomId));
        } else {
          await updateDoc(doc(db, 'rooms', roomId), {
            participants: newParticipants,
            hostId: data.hostId === activeUser.uid ? newParticipants[0] : data.hostId
          });
        }
      }
      setRoomId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rooms/${roomId}`);
    }
  };

  const updateRoomState = async (updates: Partial<RoomState>) => {
    const activeUser = user || auth.currentUser;
    if (!roomId || !activeUser) return;
    // Only host can update play/time
    if (roomState?.hostId !== activeUser.uid && (updates.isPlaying !== undefined || updates.currentTime !== undefined)) {
      return;
    }
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        ...updates,
        lastUpdated: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  const sendReaction = async (emoji: string) => {
    const activeUser = user || auth.currentUser;
    if (!roomId || !activeUser) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        lastReaction: {
          emoji,
          userId: activeUser.uid,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
    }
  };

  return (
    <WatchPartyContext.Provider value={{ roomId, roomState, createRoom, joinRoom, leaveRoom, updateRoomState, sendReaction }}>
      {children}
    </WatchPartyContext.Provider>
  );
};

export const useWatchParty = () => {
  const context = useContext(WatchPartyContext);
  if (context === undefined) {
    throw new Error('useWatchParty must be used within a WatchPartyProvider');
  }
  return context;
};
