export function getImageUrl(path: string | null | undefined): string {
  if (!path) {
    console.log('Path is undefined or null in getImageUrl');
    return '';
  }

  // If it's already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
      const savedEndpoint = typeof window !== 'undefined' ? localStorage.getItem('endpoint') || '' : '';

  // Ensure we don't double up on slashes
  const baseUrl = savedEndpoint?.replace(/\/$/, '');
  const filename = path.replace(/^\//, ''); // Remove leading slash if present

  // Construct the full URL
  return `${baseUrl}/uploads/${filename}`;
}

