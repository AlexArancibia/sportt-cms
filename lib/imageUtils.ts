export function getImageUrl(path: string | null | undefined): string {
  if (!path) {
    console.log('Path is undefined or null in getImageUrl');
    return '';
  }

  // If it's already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Ensure we don't double up on slashes
  const baseUrl = process.env.NEXT_PUBLIC_ENDPOINT?.replace(/\/$/, '');
  const filename = path.replace(/^\//, ''); // Remove leading slash if present

  // Construct the full URL
  return `${baseUrl}/uploads/${filename}`;
}

