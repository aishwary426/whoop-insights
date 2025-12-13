export const getApiUrl = (path: string): string => {
  // Use environment variable or default to relative path (for rewrites)
  let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  
  // Ensure URL ends with /v1 to match Next.js rewrite rules if it's the default
  if (apiBaseUrl.endsWith('/api')) {
      apiBaseUrl = `${apiBaseUrl}/v1`;
  }

  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Build full URL
  const fullUrl = `${apiBaseUrl}/${cleanPath}`;
  
  // Ensure trailing slash for all non-file resources (our backend prefers it)
  // But don't add it if there are query parameters
  if (!fullUrl.endsWith('/') && !fullUrl.includes('?') && !fullUrl.includes('.')) {
      return `${fullUrl}/`;
  }
  
  return fullUrl;
};
