// import {DriveSettings, IDriveInfo, IDriveToken, IFileInfo, TokenException, TokenExpired} from './interfaces'

// const __delay: number = 1100;


// function delay(milliseconds: number = __delay): Promise<void> {
//   return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
// }

// function getCurrentTime(): string {
//   return new Date().toISOString();
// }

// function getHeaders(token: IDriveToken): Headers {
//   return new Headers({
//     Authorization: `Bearer ${token}`,
//   });
// }

// function getBlobs(data: object): Blob {
//   return new Blob([JSON.stringify(data)], {
//     type: 'application/json',
//   });
// }

// async function patch(id: string, token: IDriveToken, blob: Blob): Promise<IDriveInfo> {
//   const form = new FormData();
//   const metadataBlob = getBlobs({modifiedTime: getCurrentTime()});

//   form.append('metadata', metadataBlob);
//   form.append('file', blob);

//   const url = `${DriveSettings.FILE_UPLOAD_API}/${id}?uploadType=multipart&fields=${DriveSettings.FILE_FIELDS}`;
//   const response = await fetch(url, {
//     method: 'PATCH',
//     headers: getHeaders(token),
//     body: form,
//   });

//   return await response.json();
// }

// async function mkdir(token: IDriveToken): Promise<string> {
//   const form = new FormData();
//   const metadata = {
//     name: DriveSettings.FOLDER_NAME,
//     mimeType: 'application/vnd.google-apps.folder',
//   };

//   form.append('metadata', getBlobs(metadata));

//   const url = `${DriveSettings.FILE_UPLOAD_API}?uploadType=multipart&fields=${DriveSettings.FILE_FIELDS}`;
//   const response = await fetch(url, {
//     method: 'POST',
//     headers: getHeaders(token),
//     body: form,
//   });

//   const r = await response.json();

//   console.log('createBackupFolder.response', r);
//   const { id } = r;
//   return id;
// }

// async function post(token: IDriveToken, blob: Blob, folderId: string): Promise<IFileInfo> {
//   const form = new FormData();
//   const metadataBlob = getBlobs({
//     name: DriveSettings.FILE_NAME,
//     parents: [folderId],
//     mimeType: 'application/json',
//     modifiedTime: getCurrentTime(),
//   });

//   form.append('metadata', metadataBlob);
//   form.append('file', blob);

//   const url = `${DriveSettings.FILE_UPLOAD_API}?uploadType=multipart&fields=${DriveSettings.FILE_FIELDS}`;
//   const response = await fetch(url, {
//     method: 'POST',
//     headers: getHeaders(token),
//     body: form,
//   });

//   return await response.json();
// }
// // ------------------------------------------------------------------------------------------------------------------------
// async function getFileMetadata(token: IDriveToken, id: string): Promise<IFileInfo> {
//   const url = `${DriveSettings.FILE_GET_API}/${id}?fields=${DriveSettings.FILE_FIELDS}`;
//   const response = await fetch(url, {
//     method: 'GET',
//     headers: getHeaders(token),
//   });

//   if (response.ok) {
//     return await response.json();
//   } else if (response.status === 401) {
//     throw new TokenExpired('Token expired');
//   } else {
//     throw new Error('Unexpected error');
//   }
// }

// async function findFileId(token: IDriveToken): Promise<string> {
//   const query = `	mimeType = 'application/json' and trashed = false`;
//   const url = `${DriveSettings.FILE_GET_API}?q=${encodeURIComponent(query)}&fields=${DriveSettings.QUERY_FILE_FIELDS}`;

//   const response = await fetch(url, {
//     method: 'GET',
//     headers: getHeaders(token),
//   });

//   if (response.ok) {
//     const {files} = await response.json();
    
//     if (!files || files.length === 0) {
//       return null;
//     }

//     return files[0].id;
//   } else if (response.status === 401) {
//     throw new TokenExpired('Token expired');
//   } else {
//     throw new Error('Unexpected error');
//   }
// }

// // ------------------------------------------------------------------------------------------------------------------------
// // export function authorize() {
// //   this.promise = true;
  
// //   chrome.identity.getAuthToken({'interactive': true}, (token: string) => {
// //     if (!token && chrome.runtime.lastError && chrome.runtime.lastError.message) {
// //       this.promise = false;
// //       return console.warn(chrome.runtime.lastError.message);
// //     }

// //     this.token = token;
// //     this.dispatchEvent(this.event);
// //     this.promise = false;
// //     this.error.innerText = '';
// //   });
// // }

// export function renewToken(): Promise<string> {
//   return new Promise<string>((resolve, reject) => {
//     chrome.identity.getAuthToken({'interactive': false}, async (token: string) => {
//       if (!token && chrome.runtime.lastError && chrome.runtime.lastError.message) {
//         return reject(chrome.runtime.lastError.message);
//       }

//       resolve(token);
//     });
//   });
// }

// // TODO make a request function
// export async function get(token: IDriveToken, id: string): Promise<IFileInfo> {
//   const file: IFileInfo = await getFileMetadata(token, id);
//   const response = await fetch(`${DriveSettings.FILE_GET_API}/${id}?alt=media`, {
//     method: 'GET',
//     headers: getHeaders(token),
//   });

//   if (response.ok) {
//     file.data = await response.json();

//     return file;
//   } else if (response.status === 401) {
//     throw new TokenExpired('Token expired');
//   } else {
//     throw new Error('Unexpected error');
//   }
// }

// export async function write(syncInfo: IDriveInfo, data: object): Promise<IDriveInfo> {
//   if (!syncInfo || !syncInfo.token) {
//     throw new TokenException();
//   }

//   const blob = getBlobs(data);

//   syncInfo.id = await findFileId(syncInfo.token);
//   await delay();

//   if (syncInfo.id) {
//     return await patch(syncInfo.id, syncInfo.token, blob);
//   }

//   syncInfo.id = (await post(syncInfo.token, blob, await mkdir(syncInfo.token))).id;
//   return syncInfo;
// }
