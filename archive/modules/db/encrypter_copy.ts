/* const _syncKey_: string = 'te~st-Sy#nc%K*ey';
var _internalKey_: CryptoKey;


function toBase64(buff: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, buff));
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(null));
}

function toString(buff: Uint8Array): string {
  return new TextDecoder().decode(buff);
}

// function canEncrypt(): boolean {
//   return !!crypto && !!crypto.subtle && !!_internalKey_;
// }

async function createKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {name: "AES-CTR", length: 256},
    true,
    ["encrypt", "decrypt"]
  );
}

async function exportKey(key: CryptoKey): Promise<string> {
  var ex:JsonWebKey = await crypto.subtle.exportKey("jwk", key);
  return ex.k;
}

async function importKey(key: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "jwk",
    {kty: "oct", k: key, alg: "A256CTR", ext: true},
    {name: "AES-CTR",},
    false,
    ["encrypt", "decrypt"]
  );
}

export async function generateKey(): Promise<string> {
  let key: CryptoKey = await createKey();
  return await exportKey(key);
}

export async function setKey(publicKey: string): Promise<boolean> {
  _internalKey_ = await importKey(publicKey);
  return Promise.resolve(true);
}

export async function checkKey(publicKey: string): Promise<boolean> {
  await importKey(publicKey);
  return Promise.resolve(true);
}

export async function checkSyncKey(encryptedKey: string): Promise<boolean> {
  return await decrypt(encryptedKey) === _syncKey_;
}

export async function getSyncKey(): Promise<string> {
  return await encrypt(_syncKey_);
}

export async function encrypt(value: string): Promise<string> {
  if (!crypto || !crypto.subtle) {
    console.warn('The crypto functionality is not specified!');
    return value;
  }

  if (!_internalKey_) {
    throw Error('The Crypto Key is not specified!');
  }

  var encrypted = await crypto.subtle.encrypt({
        name: "AES-CTR",
        counter: new Uint8Array(16),
        length: 128,
    },
    _internalKey_,
    new TextEncoder().encode(value)
  )

  return toBase64(new Uint8Array(encrypted));
}

export async function decrypt(value: string): Promise<string> {
  if (!crypto || !crypto.subtle) {
    console.warn('The crypto functionality is not specified!');
    return value;
  }

  if (!_internalKey_) {
    throw Error('The Crypto Key is not specified!');
  }

  var decrypted2 = await crypto.subtle.decrypt(
    {
      name: "AES-CTR",
      counter: new ArrayBuffer(16),
      length: 128
    },
    _internalKey_,
    fromBase64(value)
  )

  return toString(decrypted2);
}
*/
