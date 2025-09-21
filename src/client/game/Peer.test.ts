import { describe, it, expect } from 'vitest';
import { PeerManager, type Peer, type Vector3 } from './Peer';

describe('PeerManager', () => {
  it('should create a local peer', () => {
    const peerManager = new PeerManager();
    const peer = peerManager.createLocalPeer('TestPlayer', 'levelTest');
    
    expect(peer).toBeDefined();
    expect(peer.name).toBe('TestPlayer');
    expect(peer.environment).toBe('levelTest');
    expect(peer.id).toBeDefined();
  });

  it('should update local peer position', () => {
    const peerManager = new PeerManager();
    peerManager.createLocalPeer('TestPlayer', 'levelTest');
    
    const newPosition: Vector3 = { x: 10, y: 5, z: -3 };
    const newRotation: Vector3 = { x: 0, y: Math.PI, z: 0 };
    
    peerManager.updateLocalPeer(newPosition, newRotation);
    
    const updatedPeer = peerManager.getLocalPeer();
    expect(updatedPeer?.position).toEqual(newPosition);
    expect(updatedPeer?.rotation).toEqual(newRotation);
  });

  it('should add and remove remote peers', () => {
    const peerManager = new PeerManager();
    
    const remotePeer: Peer = {
      id: 'remote-1',
      name: 'RemotePlayer',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      environment: 'levelTest',
      lastUpdate: Date.now()
    };
    
    peerManager.addRemotePeer(remotePeer);
    expect(peerManager.getPeerCount()).toBe(1);
    expect(peerManager.getPeer('remote-1')).toEqual(remotePeer);
    
    peerManager.removePeer('remote-1');
    expect(peerManager.getPeerCount()).toBe(0);
    expect(peerManager.getPeer('remote-1')).toBeUndefined();
  });

  it('should filter peers by environment', () => {
    const peerManager = new PeerManager();
    
    const peer1: Peer = {
      id: 'peer-1',
      name: 'Player1',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      environment: 'levelTest',
      lastUpdate: Date.now()
    };
    
    const peer2: Peer = {
      id: 'peer-2',
      name: 'Player2',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      environment: 'islandTown',
      lastUpdate: Date.now()
    };
    
    peerManager.addRemotePeer(peer1);
    peerManager.addRemotePeer(peer2);
    
    const levelTestPeers = peerManager.getPeersInEnvironment('levelTest');
    const islandTownPeers = peerManager.getPeersInEnvironment('islandTown');
    
    expect(levelTestPeers).toHaveLength(1);
    expect(levelTestPeers[0]).toEqual(peer1);
    
    expect(islandTownPeers).toHaveLength(1);
    expect(islandTownPeers[0]).toEqual(peer2);
  });

  it('should identify local peer correctly', () => {
    const peerManager = new PeerManager();
    const peer = peerManager.createLocalPeer('TestPlayer', 'levelTest');
    
    expect(peerManager.isLocalPeer(peer.id)).toBe(true);
    expect(peerManager.isLocalPeer('some-other-id')).toBe(false);
  });
});
