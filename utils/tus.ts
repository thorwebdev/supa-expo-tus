import { Upload } from 'tus-js-client';
import * as ImagePicker from 'expo-image-picker';

const SUPABASE_PROJECT_ID = '';
const SUPABASE_ANON_KEY = '';

function getFileExtension(uri: string): string {
  const match = /\.([a-zA-Z]+)$/.exec(uri);
  if (match !== null) {
    return match[1];
  }

  return '';
}

function getMimeType(extension: string): string {
  if (extension === 'jpg') return 'image/jpeg';
  return `image/${extension}`;
}

export async function uploadFile(
  bucketName: string,
  file: ImagePicker.ImagePickerResult
) {
  return new Promise<void>((resolve, reject) => {
    const extension = getFileExtension(file.assets[0].uri);
    console.log({ extension });
    // The reason this works is this hidden magic: https://github.com/tus/tus-js-client/blob/main/lib/browser/fileReader.js#L9-L13
    // @ts-ignore TODO: fix tus types
    let upload = new Upload(file.assets[0], {
      endpoint: `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-upsert': 'true', // optionally set upsert to true to overwrite existing files
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true, // Important if you want to allow re-uploading the same file https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
      metadata: {
        bucketName: bucketName,
        objectName: file.assets[0].fileName,
        contentType: getMimeType(extension),
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
      onError: function (error) {
        console.log('Failed because: ' + error);
        reject(error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        var percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(bytesUploaded, bytesTotal, percentage + '%');
      },
      onSuccess: function () {
        console.log('Download %s from %s', upload.file.name, upload.url);
        resolve();
      },
    });

    // Check if there are any previous uploads to continue.
    return upload.findPreviousUploads().then(function (previousUploads) {
      // Found previous uploads so we select the first one.
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }

      // Start the upload
      upload.start();
    });
  });
}
