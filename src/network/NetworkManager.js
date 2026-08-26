/**
 * NetworkManager for SoulBonker 3D
 * 100% Free WebRTC Peer-to-Peer DataChannel layer via PeerJS.
 */

export class NetworkManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomId = null;
    this.isConnected = false;

    // Event listeners map: eventName -> Array of callbacks
    this.listeners = new Map();

    // Outgoing state throttle
    this.lastStateSentTime = 0;
    this.stateSendInterval = 1000 / 30; // 30 Hz
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  off(eventName, callback) {
    if (!this.listeners.has(eventName)) return;
    const list = this.listeners.get(eventName);
    const idx = list.indexOf(callback);
    if (idx !== -1) list.splice(idx, 1);
  }

  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in network listener for ${eventName}:`, e);
        }
      });
    }
  }

  generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'SB-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async getPeerConstructor() {
    if (window.Peer) return window.Peer;
    if (window.peerjs && window.peerjs.Peer) return window.peerjs.Peer;

    // Load peerjs library dynamically if not yet loaded in window
    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src*="peerjs"]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(e));
        // In case it already loaded
        if (window.Peer || window.peerjs?.Peer) return resolve();
      } else {
        const script = document.createElement('script');
        script.src = 'libs/peerjs.min.js';
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      }
    });

    return window.Peer || window.peerjs?.Peer;
  }

  /**
   * Initialize Peer instance and create a host room
   */
  async createRoom(customCode = null) {
    this.cleanup();
    this.isHost = true;
    this.roomId = customCode || this.generateRoomCode();

    const PeerClass = await this.getPeerConstructor();
    if (!PeerClass) {
      throw new Error('PeerJS library not loaded');
    }

    return new Promise((resolve, reject) => {
      this.peer = new PeerClass(this.roomId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        this.roomId = id;
        this.emit('roomCreated', { roomId: id });
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('Peer error:', err);
        if (err.type === 'unavailable-id') {
          // Retry with fresh random code if collision
          this.createRoom().then(resolve).catch(reject);
        } else {
          this.emit('error', err);
          reject(err);
        }
      });
    });
  }

  /**
   * Connect to an existing host room
   */
  async joinRoom(roomId) {
    this.cleanup();
    this.isHost = false;
    this.roomId = roomId.trim().toUpperCase();

    const PeerClass = await this.getPeerConstructor();
    if (!PeerClass) {
      throw new Error('PeerJS library not loaded');
    }

    return new Promise((resolve, reject) => {
      this.peer = new PeerClass({
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', () => {
        const conn = this.peer.connect(this.roomId, {
          reliable: true
        });
        this.setupConnection(conn);
        resolve(this.roomId);
      });

      this.peer.on('error', (err) => {
        console.warn('Peer join error:', err);
        this.emit('error', err);
        reject(err);
      });
    });
  }

  setupConnection(conn) {
    this.conn = conn;

    this.conn.on('open', () => {
      this.isConnected = true;
      this.emit('connected', { isHost: this.isHost, roomId: this.roomId });

      // Send initial handshake
      this.sendEvent('HANDSHAKE', { isHost: this.isHost });
    });

    this.conn.on('data', (packet) => {
      if (!packet || typeof packet !== 'object') return;

      const { type, data } = packet;
      if (type === 'STATE') {
        this.emit('state', data);
      } else if (type === 'EVENT') {
        this.emit(data.event, data.payload);
      }
    });

    this.conn.on('close', () => {
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.conn.on('error', (err) => {
      console.warn('Connection error:', err);
      this.emit('error', err);
    });
  }

  /**
   * Send throttled player state (position, rotation, state, hp)
   */
  sendState(stateData) {
    if (!this.isConnected || !this.conn || !this.conn.open) return;

    const now = performance.now();
    if (now - this.lastStateSentTime < this.stateSendInterval) return;
    this.lastStateSentTime = now;

    this.conn.send({
      type: 'STATE',
      data: stateData
    });
  }

  /**
   * Send reliable game event (attacks, hits, class change, rematch)
   */
  sendEvent(eventName, payload = {}) {
    if (!this.isConnected || !this.conn || !this.conn.open) return;

    this.conn.send({
      type: 'EVENT',
      data: {
        event: eventName,
        payload
      }
    });
  }

  cleanup() {
    this.isConnected = false;
    if (this.conn) {
      try { this.conn.close(); } catch (e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}
