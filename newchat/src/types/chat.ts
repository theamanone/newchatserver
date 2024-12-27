export interface User {
    user_id: string;
    username: string;
    avatar?: string;
}

export interface Message {
    text: string;
    timestamp: string;
}

export interface Conversation {
    conversation_id: string;
    type: 'group' | 'chat';
    group_id?: string;
    groupName?: string;
    groupImage?: string;
    otherUser?: User;
    latestMessage?: Message;
    unreadCount?: number;
    timestamp?: string;
}
    