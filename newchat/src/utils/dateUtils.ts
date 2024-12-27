// utils/dateUtils.js
export const formatDate = (date: Date) => {
  const now = new Date();
  const messageDate = new Date(date);

  // Check for today
  if (messageDate.toDateString() === now.toDateString()) {
    return "Today";
  }

  // Check for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  if (messageDate.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  // Check for this week
  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - now.getDay());
  if (messageDate >= startOfWeek) {
    return messageDate.toLocaleDateString(undefined, { weekday: "long" });
  }

  // Return formatted date
  return messageDate.toLocaleDateString();
};
