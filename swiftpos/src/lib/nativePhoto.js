import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

async function uriToDataUrl(webPath) {
  const res = await fetch(webPath);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Opens the native camera or photo gallery on Android (real system
// permission dialogs), returning a data URL, or null if cancelled.
// `source` is 'camera' or 'gallery'.
export async function takeProductPhoto(source = 'camera') {
  if (isNative) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    try {
      const photo = await Camera.getPhoto({
        quality: 60,
        width: 640,
        resultType: CameraResultType.Uri,
        source: source === 'gallery' ? CameraSource.Photos : CameraSource.Camera,
      });
      return await uriToDataUrl(photo.webPath);
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
