import crypto from 'crypto';
import sanitize from 'sanitize-filename';

export const generateFileName = (originalname: string): string => {
  // Separate name + extension
  const parts = originalname.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop() : '';
  const baseName = sanitize(parts.join('.')) || 'file';

  // Add timestamp + random hex
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex'); // 8 chars

  // Final format: originalName-timestamp-random.ext
  return `${baseName}-${timestamp}-${random}${ext}`;
};
