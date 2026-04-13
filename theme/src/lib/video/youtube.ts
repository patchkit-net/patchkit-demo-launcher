export function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

export function getYouTubeEmbedUrl(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/);
  if (!match) return url;
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    disablekb: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${match[1]}?${params.toString()}`;
}
