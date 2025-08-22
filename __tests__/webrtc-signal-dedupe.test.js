/** @jest-environment node */
import WebRTCService from '@/lib/webrtc.js';

describe('WebRTCService signaling dedupe', () => {
  test('drops duplicate remote signals', () => {
    const svc = new WebRTCService();
    // stub peer to avoid actual simple-peer
    svc.peer = { signal: jest.fn(), on: jest.fn() };

    const payload = { type: 'offer', sdp: 'abc' };
    svc.handleSignalData(payload);
    svc.handleSignalData(payload); // duplicate

    expect(svc.peer.signal).toHaveBeenCalledTimes(1);
  });
});
