// frontend/src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { getSocket, disconnectSocket } from '../services/socket';
import { useStore } from '../state/store';
import type { Message, ConversationState } from '../types';

export function useSocket(baseUrl: string) {
  const token = useStore((s) => s.token);
  const addMessage = useStore((s) => s.addMessage);
  const setState = useStore((s) => s.setState);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(baseUrl, token);
    socketRef.current = socket;

    socket.on('message:new', (msg: Message) => addMessage(msg));
    socket.on('state:change', (payload: { state: ConversationState }) => setState(payload.state));

    return () => {
      socket.off('message:new');
      socket.off('state:change');
      disconnectSocket();
    };
  }, [baseUrl, token, addMessage, setState]);

  return socketRef;
}
