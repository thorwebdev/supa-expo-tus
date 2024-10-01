import { Upload } from 'tus-js-client';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

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

export async function uploadFiles(
  bucketName: string,
  pickerResult:
    | ImagePicker.ImagePickerResult
    | DocumentPicker.DocumentPickerResult
) {
  const allUploads = pickerResult.assets.map(
    (
      file: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset
    ) => {
      return new Promise<void>(async (resolve, reject) => {
        const extension = getFileExtension(file.uri);
        // TODO: improve tus-js-client: https://github.com/tus/tus-js-client/blob/main/lib/browser/fileReader.js#L9-L13
        const blob = await fetch(file.uri).then((res) => res.blob());
        let upload = new Upload(blob, {
          endpoint: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`, // or replace with logged in user's access token.
            'x-upsert': 'true', // optionally set upsert to true to overwrite existing files, requires RLS update policy.
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true, // Important if you want to allow re-uploading the same file https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
          metadata: {
            bucketName: bucketName,
            objectName: file?.name ?? file?.fileName ?? Date.now(),
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
            console.log('Download %s', upload.options.metadata.objectName);
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
  );
  await Promise.allSettled(allUploads);
  return;
}
