import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

// Opens the native "Take Photo / Choose from Gallery" prompt on Android,
// which triggers Android's real system permission dialogs (camera and/or
// photo library) rather than a browser-style prompt. Returns a data URL
// string, or null if the user cancelled.
export async function pickProductPhoto() {
  if (isNative) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    try {
      const photo = await Camera.getPhoto({
        quality: 60,
        width: 640,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Product Photo',
        promptLabelPhoto: 'Choose from Gallery',
        promptLabelPicture: 'Take Photo',
      });
      return `data:image/${photo.format};base64,${photo.base64String}`;
    } catch (e) {
      // User cancelled the picker, or permission was denied.
      if (e?.message?.toLowerCase().includes('cancel')) return null;
      throw e;
    }
  }
  return pickPhotoWeb();
}

function pickPhotoWeb() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };
    input.click();
  });
}
