import { CryptoService } from 'modules/encryption';
import { IAppConfig } from './models/code.models';


export const applicationConfigs: IAppConfig = {
  delayedInterval: 400
};

const encryptor = new CryptoService(chrome.runtime.id.toString(), true);

export async function getApplicationId(): Promise<number> {
  applicationConfigs.applicationId = applicationConfigs.applicationId ||
    <number>(await chrome.storage.local.get('applicationId')).applicationId;

  if (!applicationConfigs.applicationId) {
    applicationConfigs.applicationId = new Date().getTime();
    await chrome.storage.local.set({ applicationId: applicationConfigs.applicationId });
  }

  return applicationConfigs.applicationId;
}

export function delay(milliseconds: number = applicationConfigs.delayedInterval): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

export async function encrypt(data?: any): Promise<string | null> {
  return data ? encryptor.encrypt(JSON.stringify(data)) : null;
}

export async function decrypt(data?: string): Promise<object | null> {
  return data ? JSON.parse(await encryptor.decrypt(data)) : null;
}
