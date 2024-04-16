import { LoggerService } from 'modules/logger';
import { DriveSettings, IFileInfo, TokenError, TokenExpired, ICloudInfo } from './models/sync.models';


// const __delay = 1100;
const logger = new LoggerService('drive.ts', 'blue');

//#region testing
LoggerService.tracing = true;
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

async function post(token: string, blob: Blob): Promise<IFileInfo> {
  const form = new FormData();
  const metadataBlob = getBlobs({
    name: DriveSettings.FILE_NAME,
    mimeType: 'application/json',
    modifiedTime: getCurrentTime(),
  });

  form.append('metadata', metadataBlob);
  form.append('file', blob);

  const url = `${DriveSettings.FILE_UPLOAD_API}?uploadType=multipart&fields=${DriveSettings.FILE_FIELDS}`;
  const response = await request(token, url, 'POST', form);
  const file: IFileInfo = await response.json();

  return file;
}

async function trash(id: string, token: string): Promise<boolean> {
  const form = new FormData();
  const metadataBlob = getBlobs({ trashed: true });

  form.append('metadata', metadataBlob);

  const url = `${DriveSettings.FILE_UPLOAD_API}/${id}?uploadType=multipart&fields=${DriveSettings.FILE_FIELDS}`;
  const response = await request(token, url, 'PATCH', form);
  const file: IFileInfo = await response.json();

  return file.trashed;
}

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


export class GoogleDrive {
  public static async get(token: string, id: string | null, info?: IFileInfo): Promise<IFileInfo> {
    const file: IFileInfo = info || await getFileMetadata(token, id);

    if (file && !file.trashed) {
      const response = await request(token, `${DriveSettings.FILE_GET_API}/${file.id}?alt=media`);

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

  public static async create(token: string, info: ICloudInfo): Promise<IFileInfo> {
    if (!token) {
      throw new TokenError();
    }

    return await post(token, getBlobs(info));
  }

  public static async find(token: string): Promise<IFileInfo | null> {
    const query = `	mimeType = 'application/json' and trashed = false`;
    const url = `${DriveSettings.FILE_GET_API}?q=${encodeURIComponent(query)}&fields=${DriveSettings.QUERY_FIELDS}`;
    const response = await request(token, url);

    if (response.ok) {
      const { files } = await response.json() as { files: IFileInfo[] };

      if (!files || files.length === 0) {
        return null;
      }

      return this.get(token, null, files.shift());
    } else if (response.status === 401) {
      throw new TokenExpired('Token expired');
    } else {
      throw new Error('Unexpected error');
    }
  }

  public static async update(token: string, id: string, info: ICloudInfo): Promise<string> {
    if (!token) {
      throw new TokenError();
    }

    return await patch(id, token, getBlobs(info));
  }

  public static async remove(token: string, id: string | null): Promise<boolean> {
    if (!token) {
      throw new TokenError();
    }

    if (!id) {
      id = (await this.find(token))?.id;
    }

    if (!id) {
      return false;
    }

    return await trash(id, token);
  }

  public static async renewToken(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      chrome.identity.getAuthToken({ 'interactive': false }, async (token: string) => {
        if (!token && chrome.runtime.lastError && chrome.runtime.lastError.message) {
          return reject(chrome.runtime.lastError.message);
        }

        resolve(token);
      });
    });
  }

  public static async authorize(): Promise<string> {
    try {
      const tokenResult = await chrome.identity.getAuthToken({ 'interactive': true });

      if (tokenResult && tokenResult.token) {
        return tokenResult.token;
      } else {
        throw new Error(chrome.runtime.lastError.message);
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  public static async deauthorize(token: string) {
    try {
      await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
      await this.removeCachedAuthToken(token);
    } catch (error) {
      console.log('error', error);
      throw new Error(error);
    }
  }

  public static async removeCachedAuthToken(token: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      chrome.identity.clearAllCachedAuthTokens(async () => {
        if (!token || chrome.runtime.lastError && chrome.runtime.lastError.message) {
          const message = 'Token has not been provided.';

          return reject(chrome.runtime.lastError && chrome.runtime.lastError.message || message);
        }

        chrome.identity.removeCachedAuthToken({ token: token }, () => {
          logger.info('removed cached auth token');
          resolve();
        });
      });
    });
  }
}
