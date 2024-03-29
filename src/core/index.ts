import { EncryptorService } from 'modules/encryption';
import { IAppConfig } from './models/code.models';


const configs: IAppConfig = {
  delay: 500
};

const encryptor = new EncryptorService(chrome.runtime.id.toString(), true);

export async function applicationId(): Promise<number> {
  configs.applicationId = configs.applicationId ||
    <number>(await chrome.storage.local.get('applicationId')).applicationId;

  if (!configs.applicationId) {
    configs.applicationId = new Date().getTime();
    await chrome.storage.local.set({ applicationId: configs.applicationId });
  }

  return configs.applicationId;
}

export function delay(milliseconds: number = configs.delay): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

export async function encrypt(data: any): Promise<string> {
  return encryptor.encrypt(JSON.stringify(data));
}

export async function decrypt(data: string): Promise<object> {
  return JSON.parse(await encryptor.decrypt(data));
}
