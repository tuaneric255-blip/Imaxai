
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // The result is a data URL like "data:image/png;base64,iVBORw0KGgo...".
        // We need to strip the "data:[<mediatype>];base64," prefix.
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const processImageForGemini = async (file: File): Promise<{ data: string; mimeType: string }> => {
  // Gemini supports: PNG, JPEG, WEBP, HEIC, HEIF.
  // It does NOT support AVIF directly yet based on error logs.
  const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
  
  // If supported, return as is
  if (supportedTypes.includes(file.type)) {
      try {
        const data = await fileToBase64(file);
        return { data, mimeType: file.type };
      } catch (e) {
          throw e;
      }
  }

  // Attempt conversion for unsupported types (AVIF, etc.) to JPEG via Canvas
  return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
          URL.revokeObjectURL(url);
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
              reject(new Error('Could not get canvas context for image conversion'));
              return;
          }
          ctx.drawImage(img, 0, 0);
          // Convert to JPEG for maximum compatibility
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          const base64 = dataUrl.split(',')[1];
          resolve({ data: base64, mimeType: 'image/jpeg' });
      };
      
      img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error(`Browser failed to load image type: ${file.type}. Please upload a JPEG or PNG.`));
      };
      
      img.src = url;
  });
};
