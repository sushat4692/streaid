export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString()
}
