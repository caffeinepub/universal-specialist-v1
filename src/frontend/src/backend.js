/**
 * Stub backend module — replaced by generated bindings during deployment.
 * This file exists only to satisfy the build system in environments where
 * the Motoko backend hasn't been compiled yet.
 */

export class ExternalBlob {
  constructor(bytesOrUrl) {
    this._bytes = bytesOrUrl instanceof Uint8Array ? bytesOrUrl : null;
    this._url = typeof bytesOrUrl === "string" ? bytesOrUrl : null;
    this.onProgress = undefined;
  }

  static fromURL(url) {
    return new ExternalBlob(url);
  }

  static fromBytes(bytes) {
    return new ExternalBlob(bytes);
  }

  async getBytes() {
    if (this._bytes) return this._bytes;
    if (this._url) {
      const res = await fetch(this._url);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    }
    return new Uint8Array(0);
  }
}

export function createActor(_canisterId, _uploadFile, _downloadFile, _options) {
  return Promise.resolve(
    new Proxy(
      {},
      {
        get: (_target, prop) => {
          if (typeof prop === "string") {
            return (..._args) => Promise.resolve(null);
          }
        },
      },
    ),
  );
}
