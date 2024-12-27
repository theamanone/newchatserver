// Utility function to calculate and format the time difference
export const formatRelativeTime = (timestamp: string | Date): string => {
  const messageTime = new Date(timestamp) // Convert timestamp to a Date object
  const currentTime = new Date()
  const timeDifference = currentTime.getTime() - messageTime.getTime() // Time difference in milliseconds

  // Time units in milliseconds
  const seconds = Math.floor(timeDifference / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30) // Approximation for months
  const years = Math.floor(days / 365) // Approximation for years

  // Relative time logic
  if (seconds < 60) return 'Just now'
  if (minutes < 1) return `${seconds} seconds ago`
  if (minutes === 1) return '1 minute ago'
  if (minutes < 60) return `${minutes} minutes ago`
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (weeks === 1) return 'Last week'
  if (weeks < 4) return `${weeks} weeks ago`
  if (months === 1) return '1 month ago'
  if (months < 12) return `${months} months ago`
  if (years === 1) return '1 year ago'
  return `${years} years ago`
}
