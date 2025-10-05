/**
 * Crops white borders from an image, leaving only the content
 * @param imagePath - Path to the image file
 * @returns Promise<Blob> - Cropped image as a blob
 */
export const cropWhiteBorders = async (imagePath: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw image to canvas
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Find boundaries of non-white content (with tolerance for slight color variations)
      let top = 0, bottom = canvas.height, left = 0, right = canvas.width;
      
      const isWhitePixel = (r: number, g: number, b: number, a: number) => {
        const threshold = 240; // Allow slight variations from pure white
        return r > threshold && g > threshold && b > threshold && a > 200;
      };
      
      // Find top boundary
      outer: for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (!isWhitePixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
            top = y;
            break outer;
          }
        }
      }
      
      // Find bottom boundary
      outer: for (let y = canvas.height - 1; y >= 0; y--) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (!isWhitePixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
            bottom = y + 1;
            break outer;
          }
        }
      }
      
      // Find left boundary
      outer: for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
          const i = (y * canvas.width + x) * 4;
          if (!isWhitePixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
            left = x;
            break outer;
          }
        }
      }
      
      // Find right boundary
      outer: for (let x = canvas.width - 1; x >= 0; x--) {
        for (let y = 0; y < canvas.height; y++) {
          const i = (y * canvas.width + x) * 4;
          if (!isWhitePixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
            right = x + 1;
            break outer;
          }
        }
      }
      
      // Create new canvas with cropped dimensions
      const croppedWidth = right - left;
      const croppedHeight = bottom - top;
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = croppedWidth;
      croppedCanvas.height = croppedHeight;
      const croppedCtx = croppedCanvas.getContext('2d');
      
      if (!croppedCtx) {
        reject(new Error('Could not get cropped canvas context'));
        return;
      }
      
      // Draw cropped portion
      croppedCtx.drawImage(
        canvas,
        left, top, croppedWidth, croppedHeight,
        0, 0, croppedWidth, croppedHeight
      );
      
      // Convert to blob
      croppedCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.95
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imagePath;
  });
};
