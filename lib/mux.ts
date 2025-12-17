export function generateSignedPlaybackUrl(playbackId: string): string {
  // For now, return the basic playback URL
  // In production, implement JWT signing for secure video access
  return `https://stream.mux.com/${playbackId}.m3u8`
}

/**
 * Validate Mux playback ID format
 */
export function isValidMuxPlaybackId(playbackId: string): boolean {
  // Mux playback IDs are typically alphanumeric strings
  return /^[a-zA-Z0-9]+$/.test(playbackId)
}

/**
 * Format video duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${secs}초`
  }
  return `${minutes}분 ${secs}초`
}
