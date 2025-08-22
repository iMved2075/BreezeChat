/** @jest-environment node */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { CallProvider, useCall } from '@/context/call-context.jsx';

// Minimal Auth context mock wrapper by monkey-patching useAuth used inside CallProvider
jest.mock('@/context/auth-context.jsx', () => {
  const React = require('react');
  const Ctx = React.createContext({ user: { uid: 'u1', displayName: 'Test', email: 't@e.com' } });
  return {
    __esModule: true,
    useAuth: () => ({ user: { uid: 'u1', displayName: 'Test', email: 't@e.com' }, getAllUsers: async () => [] }),
    AuthProvider: ({ children }) => <Ctx.Provider value={{ user: { uid: 'u1' } }}>{children}</Ctx.Provider>,
  };
});

// Mock firebase to avoid real network
jest.mock('@/lib/firebase.js', () => ({ db: {}, auth: {} }));
// Mock Firestore functions used in provider
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  onSnapshot: jest.fn(() => () => {}),
  serverTimestamp: jest.fn(() => new Date()),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
}));

// Mock WebRTCService to avoid media/devices
jest.mock('@/lib/webrtc.js', () => {
  return jest.fn().mockImplementation(() => ({
    setCallbacks: jest.fn(),
    initializeMedia: jest.fn(() => Promise.resolve()),
    createPeerConnection: jest.fn(),
    handleSignalData: jest.fn(),
    toggleAudio: jest.fn(),
    toggleVideo: jest.fn(),
    endCall: jest.fn(),
  }));
});

function wrapper({ children }) {
  return <CallProvider>{children}</CallProvider>;
}

describe('CallContext transitions (minimal)', () => {
  test.skip('endCall moves to ended', async () => {
    const { result } = renderHook(() => useCall(), { wrapper });

    // Seed: act as if a call is active
    await act(async () => {
      // Use exposed actions to set into a call
      result.current.startCall('u2', { uid: 'u2', name: 'Peer' }, 'voice');
    });

    // End the call
    await act(async () => {
      result.current.endCall();
    });

    expect(result.current.callStatus).toBe('ended');
    expect(result.current.isInCall).toBe(false);
  });
});
