// src/utils/searchConversations.ts
import Conversation from "@/app/models/conversation.model";
import User from "@/app/models/user.model"; // Import your User model

export async function searchConversationsByUsername(senderId: string, searchTerm: string) {
  try {
    // Find users whose usernames match the search term
    const users = await User.find({
      username: { $regex: searchTerm, $options: "i" } // Case-insensitive search
    });

    const userIds = users.map(user => user._id); // Extract user IDs from matched users

    // If no users are found, return an empty array
    if (userIds.length === 0) {
      return [];
    }

    // Perform MongoDB search using the found user IDs
    const conversations = await Conversation.find({
      participants: { $in: [senderId, ...userIds] } // Match conversations involving the sender and found user IDs
    }).populate("participants"); // Optionally populate participant details

    return conversations;
  } catch (error) {
    console.error("Error searching conversations by username:", error);
    throw new Error("Error performing search");
  }
}
