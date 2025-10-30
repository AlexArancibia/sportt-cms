export function getImageUrl(path: string | null | undefined): string {
  try {
    if (!path) {
      console.log('Path is undefined or null in getImageUrl');
      return '/vercel.svg';
    }

    // If it's already a full URL, return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // If it starts with /, return it as is (relative path)
    if (path.startsWith('/')) {
      return path;
    }

    const savedEndpoint = typeof window !== 'undefined' ? localStorage.getItem('endpoint') || '' : '';

    // Ensure we don't double up on slashes
    const baseUrl = savedEndpoint?.replace(/\/$/, '');
    const filename = path.replace(/^\//, ''); // Remove leading slash if present

    // Construct the full URL
    return `${baseUrl}/uploads/${filename}`;
  } catch (error) {
    console.error('Error in getImageUrl:', error, 'path:', path);
    return '/vercel.svg'; // Fallback to placeholder on error
  }
}

