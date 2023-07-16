import { Logger } from 'modules/logger/logger';
import { ICloudInfo } from './interfaces';
import { DriveSettings, IFileInfo, TokenError, TokenExpired } from './interfaces'

const __delay: number = 1100;
const logger: Logger = new Logger('drive.ts', 'blue');

//#region testing
Logger.tracing = true;
//#endregion


function getCurrentTime(): string {
  return new Date().toISOString();
}

async function request(token: string, url: string, method: string = 'GET', form?: FormData): Promise<Response> {
  return await fetch(url, {
    method: method,
    headers: new Headers({
      Authorization: `Bearer ${token}`,
    }),
    body: form,
  });
}

function getBlobs(data: object): Blob {
  return new Blob([JSON.stringify(data)], {
    type: 'application/json',
  });
}

async function patch(id: string, token: string, blob: Blob): Promise<string> {
  const form = new FormData();
  const metadataBlob = getBlobs({ modifiedTime: getCurrentTime() });

  form.append('metadata', metadataBlob);
  form.append('file', blob);

  const url = `${DriveSettings.FILE_UPLOAD_API}/${id}?uploadType=multipart&fields=${DriveSettings.FILE_FIELDS}`;
  const response = await request(token, url, 'PATCH', form);
  const file: IFileInfo = await response.json();
  return file.id;
}

async function mkdir(token: string): Promise<string> {
  const form = new FormData();
  const metadata = {
    name: DriveSettings.FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder',
  };

  form.append('metadata', getBlobs(metadata));

  const url = `${DriveSettings.FILE_UPLOAD_API}?uploadType=multipart&fields=${DriveSettings.FILE_FIELDS}`;
  const response = await request(token, url, 'POST', form);
  const file: IFileInfo = await response.json();
  return file.id;
}

async function post(token: string, blob: Blob, folderId: string): Promise<string> {
  const form = new FormData();
  const metadataBlob = getBlobs({
    name: DriveSettings.FILE_NAME,
    parents: [folderId],
    mimeType: 'application/json',
    modifiedTime: getCurrentTime(),
  });

  form.append('metadata', metadataBlob);
  form.append('file', blob);

  const url = `${DriveSettings.FILE_UPLOAD_API}?uploadType=multipart&fields=${DriveSettings.FILE_FIELDS}`;
  const response = await request(token, url, 'POST', form);
  const file: IFileInfo = await response.json();
  return file.id;
}
// ------------------------------------------------------------------------------------------------------------------------
async function getFileMetadata(token: string, id: string): Promise<IFileInfo> {
  const response = await request(token, `${DriveSettings.FILE_GET_API}/${id}?fields=${DriveSettings.FILE_FIELDS}`);

  if (response.ok) {
    return await response.json();
  } else if (response.status === 401) {
    throw new TokenExpired('Token expired');
  } else {
    throw new Error('Unexpected error');
  }
}

async function findDir(token: string): Promise<string> {
  const query = `	mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `${DriveSettings.FILE_GET_API}?q=${encodeURIComponent(query)}&fields=files/id,files/name`;
  const response = await request(token, url);

  if (response.ok) {
    const { files } = await response.json();

    if (!files || files.length === 0 || files[0].name !== DriveSettings.FOLDER_NAME) {
      return null;
    }

    return files[0].id;
  } else if (response.status === 401) {
    throw new TokenExpired('Token expired');
  } else {
    throw new Error('Unexpected error');
  }
}

export async function find(token: string): Promise<string> {
  const query = `	mimeType = 'application/json' and trashed = false`;
  const url = `${DriveSettings.FILE_GET_API}?q=${encodeURIComponent(query)}&fields=${DriveSettings.QUERY_FILE_FIELDS}`;
  const response = await request(token, url);

  if (response.ok) {
    const { files } = await response.json();

    if (!files || files.length === 0) {
      return null;
    }

    return files[0].id;
  } else if (response.status === 401) {
    throw new TokenExpired('Token expired');
  } else {
    throw new Error('Unexpected error');
  }
}
// ------------------------------------------------------------------------------------------------------------------------
export async function deauthorize(token: string): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      await window.fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
      await removeCachedAuthToken(token);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export async function authorize(): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    chrome.identity.getAuthToken({ 'interactive': true }, async (token: string) => {
      if (token) {
        resolve(token);
      } else {
        reject(chrome.runtime.lastError.message);
      }
    });
  });
}

export async function removeCachedAuthToken(token: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    chrome.identity.clearAllCachedAuthTokens(async () => {
      if (!token || chrome.runtime.lastError && chrome.runtime.lastError.message) {
        let message = 'Token has not been provided.';
        return reject(chrome.runtime.lastError && chrome.runtime.lastError.message || message);
      }

      chrome.identity.removeCachedAuthToken({ token: token }, () => {
        logger.info('removed cached auth token');
        resolve();
      });
    });
  });
}

export function renewToken(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    chrome.identity.getAuthToken({ 'interactive': false }, async (token: string) => {
      if (!token && chrome.runtime.lastError && chrome.runtime.lastError.message) {
        return reject(chrome.runtime.lastError.message);
      }

      resolve(token);
    });
  });
}

export async function get(token: string, id: string): Promise<IFileInfo> {
  const file: IFileInfo = await getFileMetadata(token, id);

  if (file && !file.trashed) {
    const response = await request(token, `${DriveSettings.FILE_GET_API}/${id}?alt=media`);

    if (response.ok) {
      file.data = await response.json();

      return file;
    } else if (response.status === 401) {
      throw new TokenExpired('Token expired');
    } else {
      throw new Error('Unexpected error');
    }
  }

  return null;
}

export async function create(token: string, data: ICloudInfo): Promise<string> {
  if (!token) {
    throw new TokenError();
  }

  const blob = getBlobs(data);
  let directoryId = await findDir(token);

  if (!directoryId) {
    directoryId = await mkdir(token);
  }

  return await post(token, blob, directoryId);
}

export async function update(token: string, id: string, data: ICloudInfo): Promise<string> {
  if (!token) {
    throw new TokenError();
  }

  const blob = getBlobs(data);
  return await patch(id, token, blob);
}

//-------------------------------------------------------------------------------------------------------------------------
export class GoogleDrive {
  protected token: string;

  constructor(token: string) {
    this.token = token;
  }

  protected async patch() {

  }

  protected async request() {

  }

  public static renewToken(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      chrome.identity.getAuthToken({ 'interactive': false }, async (token: string) => {
        if (!token && chrome.runtime.lastError && chrome.runtime.lastError.message) {
          return reject(chrome.runtime.lastError.message);
        }

        resolve(token);
      });
    });
  }

  public async get() {

  }

  public async put() {

  }
}
