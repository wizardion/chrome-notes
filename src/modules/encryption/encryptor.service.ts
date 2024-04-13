const _secretKey_ = 'te~st-Sy#nc%K*ey-B-9frItU-mlw=8@9+';

export class CryptoService {
  protected encoder: TextEncoder;
  protected decoder: TextDecoder;

  private password: string;

  constructor(password: string, useSecret?: boolean) {
    if (!crypto || !crypto.subtle) {
      throw Error('The Crypto is not supported by this browser.');
    }

    if (password === null || password === undefined) {
      throw Error('The encryption passphrase is not set properly.');
    }

    if (password) {
      this.password = useSecret ? password : password + _secretKey_;
    }

    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  protected decode(value: string): Uint8Array[] {
    const buff: Uint8Array = this.fromBase(value);
    const method: number = buff[2];
    let salt, iv, data;

    if (method === 1) {
      salt = buff.slice(3, 19);
      iv = buff.slice(19, 19 + 12);
      data = buff.slice(19 + 12);
    }

    if (method === 2) {
      iv = buff.slice(3, 15);
      salt = buff.slice(15, 15 + 16);
      data = buff.slice(15 + 16);
    }

    if (method === 3) {
      const dataLength = buff.length - (16 + 12 + 3);

      iv = buff.slice(3, 15);
      data = buff.slice(15, 15 + dataLength);
      salt = buff.slice(15 + dataLength);
    }

    return [data, salt, iv, new Uint8Array([buff[0], buff[1]])];
  }

  async encrypt(value: string): Promise<string> {
    if (this.password && this.password.length) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const [secret, keys]: Uint8Array[] = this.getSecrets(this.password);

      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          counter: new Uint8Array(16),
          iv: iv,
          length: 128,
        },
        await this.deriveKey(await this.getSecretKey(secret), salt, ['encrypt']),
        this.encoder.encode(value)
      );

      return this.encode(new Uint8Array(encrypted), salt, iv, keys);
    }

    return value;
  }

  async decrypt(value: string): Promise<string> {
    if (this.password && this.password.length) {
      try {
        const [data, salt, iv, buff]: Uint8Array[] = this.decode(value);
        const [secret]: Uint8Array[] = this.getSecrets(this.password, buff[0], buff[1]);

        const decryptedContent = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            counter: new ArrayBuffer(16),
            iv: iv,
            length: 128,
          },
          await this.deriveKey(await this.getSecretKey(secret), salt, ['decrypt']),
          data
        );

        return this.decoder.decode(decryptedContent);
      } catch (error) {
        return value;
      }
    }

    return value;
  }

  async verify(encrypted: string): Promise<boolean> {
    return encrypted !== _secretKey_ && (await this.decrypt(encrypted)) === _secretKey_;
  }

  async generateSecret(): Promise<string> {
    return this.password && this.password.length ? await this.encrypt(_secretKey_) : null;
  }

  get transparent(): boolean {
    return !this.password || !this.password.length;
  }

  static async generateKey(): Promise<string> {
    const key = await crypto.subtle.generateKey({ name: 'AES-CTR', length: 256 }, true, ['encrypt', 'decrypt']);
    const ex = await crypto.subtle.exportKey('jwk', key);

    return ex.k;
  }

  static async validate(password: string): Promise<boolean> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const cryptor = new CryptoService(password);

      const [secret]: Uint8Array[] = cryptor.getSecrets(password);
      const key = await cryptor.deriveKey(await cryptor.getSecretKey(secret), salt, ['encrypt']);

      if (key) {
        const tmp = new CryptoService(password);

        return await tmp.verify(await tmp.generateSecret());
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  //#region  private
  private toBase(buffer: Uint8Array): string {
    return btoa(String.fromCharCode.apply(null, buffer));
  }

  private fromBase(message: string): Uint8Array {
    return Uint8Array.from(atob(message), (c) => c.charCodeAt(null));
  }

  private getSecrets(password: string, code: number = null, position: number = null): Uint8Array[] {
    const buffer: Uint8Array = this.encoder.encode(password);
    const secret: Uint8Array = new Uint8Array(buffer.length + 1);
    const byte: number = code !== null ? code : crypto.getRandomValues(new Uint8Array(1))[0];
    const index: number = position !== null ? position : Math.floor(Math.random() * secret.length);

    for (let i = 0, j = 0; i < secret.length; i++) {
      secret[i] = i !== index ? buffer[j++] : byte;
    }

    return [secret, new Uint8Array([byte, index])];
  }

  private async getSecretKey(secret: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', secret, 'PBKDF2', false, ['deriveKey']);
  }

  private async deriveKey(passwordKey: CryptoKey, salt: any, usage: KeyUsage[]): Promise<CryptoKey> {
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 250000,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      usage
    );
  }

  private encode(data: Uint8Array, salt: Uint8Array, iv: Uint8Array, secrets: Uint8Array): string {
    const method = Math.floor(Math.random() * 3) + 1;
    const buff = new Uint8Array(salt.byteLength + iv.byteLength + data.byteLength + 3);

    buff.set(secrets, 0);
    buff.set([method], 2);

    if (method === 1) {
      buff.set(salt, 3);
      buff.set(iv, 3 + salt.byteLength);
      buff.set(data, 3 + salt.byteLength + iv.byteLength);
    }

    if (method === 2) {
      buff.set(iv, 3);
      buff.set(salt, 3 + iv.byteLength);
      buff.set(data, 3 + salt.byteLength + iv.byteLength);
    }

    if (method === 3) {
      buff.set(iv, 3);
      buff.set(data, 3 + iv.byteLength);
      buff.set(salt, 3 + data.byteLength + iv.byteLength);
    }

    const ld = [];

    for (let i = 0; i < data.length; i++) {
      const element = data[i];

      ld.push(<number>element);
    }

    return this.toBase(buff);
  }
}
