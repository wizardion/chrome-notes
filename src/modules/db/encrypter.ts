export class BaseEncrypter {
  private readonly secretKey: string = 'te~st-Sy#nc%K*ey';
  private password: string;
  protected internalKey: CryptoKey;
  protected encoder: TextEncoder;
  protected decoder: TextDecoder;

  constructor(password: string) {
    this.password = password;
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  //#region  private
  protected toBase64(buff: Uint8Array): string {
    return btoa(String.fromCharCode.apply(null, buff));
  }
  
  protected fromBase64(b64: string): ArrayBuffer {
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(null));
  }
  
  protected toString(buff: ArrayBuffer): string {
    return new TextDecoder().decode(buff);
  }

  private async getPasswordKey(password: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      "raw",
      this.encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
  }

  private async deriveKey(passwordKey: CryptoKey, salt: any, usage: KeyUsage[]): Promise<CryptoKey> {
    return crypto.subtle.deriveKey({
        name: "PBKDF2",
        salt: salt,
        iterations: 250000,
        hash: "SHA-256",
      },
      passwordKey,
      {name: "AES-CTR", length: 256},
      false,
      usage
    );
  }
  //#endregion


  public async encrypt(value: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    var encrypted = await crypto.subtle.encrypt({
        name: "AES-CTR",
        counter: new Uint8Array(16),
        length: 128
      },
      await this.deriveKey(await this.getPasswordKey(this.password), salt, ["encrypt"]),
      new TextEncoder().encode(value)
    )

    const encryptedContentArr = new Uint8Array(encrypted);
    let buff = new Uint8Array(salt.byteLength + encryptedContentArr.byteLength);
    buff.set(salt, 0);
    buff.set(encryptedContentArr, salt.byteLength);

    return this.toBase64(buff);
  }

  public async decrypt(value: string): Promise<string> {
    const encryptedDataBuff = this.fromBase64(value);
    const salt = encryptedDataBuff.slice(0, 16);
    const data = encryptedDataBuff.slice(16);

    var decrypted2 = await crypto.subtle.decrypt(
      {
        name: "AES-CTR",
        counter: new ArrayBuffer(16),
        length: 128
      },
      await this.deriveKey(await this.getPasswordKey(this.password), salt, ["decrypt"]),
      data
    )
    
    return this.toString(decrypted2);
  }
}