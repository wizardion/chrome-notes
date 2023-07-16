
// // import { format } from 'date-fns';


// type AccessToken = string;
// type Style = {
//   url: string;
//   css: string;
//   enabled: boolean;
//   readability: boolean;
//   modifiedTime: string;
// };
// type GoogleDriveSyncMetadata = {
//   id: string;
//   modifiedTime: string;
//   webViewLink: string;
//   webContentLink: string;
// };
// type StyleMap = {
//   [url: string]: Omit<Style, 'url'>;
// };

// // const getCurrentTimestamp = (): string => format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
// const getCurrentTimestamp = (): string => new Date().toISOString();

// const GOOGLE_DRIVE_FILE_GET_API = `https://www.googleapis.com/drive/v3/files`;
// const GOOGLE_DRIVE_FILE_UPLOAD_API = `https://www.googleapis.com/upload/drive/v3/files`;
// const GOOGLE_DRIVE_FILE_FIELDS = [
//   'id',
//   'webViewLink',
//   'modifiedTime',
//   'webContentLink',
// ].join(',');

// const SYNC_FOLDER_NAME = 'workNote';
// const SYNC_FILE_NAME = 'workNote_v3_backup.json';

// const getAuthorizationHeaders = (accessToken: AccessToken) => {
//   return new Headers({
//     Authorization: `Bearer ${accessToken}`,
//   });
// };

// export const getFileMetadata = async (id: string, accessToken: AccessToken): Promise<GoogleDriveSyncMetadata | null> => {
//   const url = `${GOOGLE_DRIVE_FILE_GET_API}/${id}?fields=${GOOGLE_DRIVE_FILE_FIELDS}`;
//   const response = await fetch(url, {
//     method: 'GET',
//     headers: getAuthorizationHeaders(accessToken),
//   });

//   return await response.json();
// };

// const createBackupFolder = async (accessToken: AccessToken): Promise<string> => {
//   const form = new FormData();
//   const metadata = {
//     name: SYNC_FOLDER_NAME,
//     mimeType: 'application/vnd.google-apps.folder',
//   };

//   form.append(
//     'metadata',
//     new Blob([JSON.stringify(metadata)], { type: 'application/json' })
//   );

//   const url = `${GOOGLE_DRIVE_FILE_UPLOAD_API}?uploadType=multipart&fields=${GOOGLE_DRIVE_FILE_FIELDS}`;
//   const response = await fetch(url, {
//     method: 'POST',
//     headers: getAuthorizationHeaders(accessToken),
//     body: form,
//   });

//   const r = await response.json();

//   console.log('createBackupFolder.response', r);
//   const { id } = r;
//   return id;
// };

// const createBackup = async (accessToken: AccessToken, blob: Blob, folderId: string): Promise<GoogleDriveSyncMetadata> => {
//   const form = new FormData();
//   const metadata = {
//     name: SYNC_FILE_NAME,
//     parents: [folderId],
//     mimeType: 'application/json',
//     modifiedTime: getCurrentTimestamp(),
//   };
//   const metadataBlob = new Blob([JSON.stringify(metadata)], {
//     type: 'application/json',
//   });

//   form.append('metadata', metadataBlob);
//   form.append('file', blob);

//   const url = `${GOOGLE_DRIVE_FILE_UPLOAD_API}?uploadType=multipart&fields=${GOOGLE_DRIVE_FILE_FIELDS}`;
//   const response = await fetch(url, {
//     method: 'POST',
//     headers: getAuthorizationHeaders(accessToken),
//     body: form,
//   });

//   return await response.json();
// };

// const patchBackup = async (id: string, accessToken: AccessToken, blob: Blob): Promise<GoogleDriveSyncMetadata> => {
//   const form = new FormData();
//   const metadata = {
//     modifiedTime: getCurrentTimestamp(),
//   };

//   const metadataBlob = new Blob([JSON.stringify(metadata)], {
//     type: 'application/json',
//   });

//   form.append('metadata', metadataBlob);
//   form.append('file', blob);

//   const url = `${GOOGLE_DRIVE_FILE_UPLOAD_API}/${id}?uploadType=multipart&fields=${GOOGLE_DRIVE_FILE_FIELDS}`;
//   const response = await fetch(url, {
//     method: 'PATCH',
//     headers: getAuthorizationHeaders(accessToken),
//     body: form,
//   });

//   return await response.json();
// };

// /**
//  * Search for backup JSON on Google Drive and return it's metadata
//  * If not found, returns null
//  */
// export const getSyncFileMetadata = async (accessToken: AccessToken): Promise<GoogleDriveSyncMetadata | null> => {
//   const query = `	mimeType = 'application/json'`;
//   const url = `${GOOGLE_DRIVE_FILE_GET_API}?q=${encodeURIComponent(query)}`;

//   try {
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: getAuthorizationHeaders(accessToken),
//     });
  
//     if (response.ok) {
//       const { files } = await response.json();
  
//       if (!files || files.length === 0) {
//         return null;
//       }
    
//       console.log('files', files);
//       const syncMetadata = await getFileMetadata(files[0].id, accessToken);
//       return syncMetadata || null;
//     } else {
//       console.log('ERROR with Authorization');
//       return null;
//     }
//   } catch (error) {
//     console.log('ERROR', error);
//     return null;
//   }
// };

// /**
//  * Download styles JSON from Google Drive
//  */
// export const downloadSyncFile = async (accessToken: string, id: string): Promise<StyleMap> => {
//   const url = `${GOOGLE_DRIVE_FILE_GET_API}/${id}?alt=media`;
//   const response = await fetch(url, {
//     method: 'GET',
//     headers: getAuthorizationHeaders(accessToken),
//   });

//   return await response.json();
// };

// /**
//  * Write to backup JSON on Google Drive
//  */
// export const writeSyncFile = async (accessToken: AccessToken, blob: Blob, fileId?: string): Promise<GoogleDriveSyncMetadata> => {
//   let syncMetadata;

//   console.log({
//     'fileId': fileId,
//     'fileId?': !!fileId,
//   });

//   if (fileId) {
//     syncMetadata = await patchBackup(fileId, accessToken, blob);
//   } else {
//     const folderId = await createBackupFolder(accessToken);
//     console.log('writeSyncFile.folderId', folderId);
//     syncMetadata = await createBackup(accessToken, blob, folderId);
//   }

//   return syncMetadata;
// };