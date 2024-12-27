const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 9000 });

let clients = [];
const groups = {}; // { groupId: [clientInfo1, clientInfo2, ...] }
const adminId = "admin";

wss.on("connection", (ws) => {
  let clientInfo = {
    ws: ws,
    _id: null,
    avatar: "",
    userusername: "",
    isTyping: false,
    isOnline: true,
    groups: [],
  };



  clients.push(clientInfo);

  // Broadcast online status to all clients
  broadcastOnlineStatus();

  ws.on("message", (message) => {
    const parsedMessage = JSON.parse(message);
    const { type, data } = parsedMessage;
    // console.log("  type : ", type, " data , ", data)
    switch (type) {
      case "login":
        handleLogin(clientInfo, data);
        break;
      case "online_status":
        handleVisibilityChange(clientInfo, data);
        break;
      case "message":
        handleMessage(clientInfo, data);
        break;
      case "adminMessage":
        handleAdminMessage(clientInfo, data);
        break;
      case "userMessage":
        handleUserMessage(clientInfo, data);
        break;
      // case "typingStatus":
      //   handleTypingStatus(clientInfo, data);
      //   break;
      case "messageSeen":
        handleMessageSeen(clientInfo, data);
      case "messagedeliveredStatus":
        handleMessageDelivered(clientInfo, data);
        break;
      case "presenceUpdate":
        handlePresenceUpdate(clientInfo, data);
        break;
      case "userJoin":
        handleUserJoin(clientInfo, data);
        break;
      case "joinGroup":
        handleJoinGroup(clientInfo, data);
        break;
      case "reaction":
        handleReaction(clientInfo, data);
        break;
      case "file":
        handleFileMessage(clientInfo, data);
        break;
      case "voiceMessage":
        handleVoiceMessage(clientInfo, data);
        break;
      case "deleteMessage":
        handleDeleteMessage(clientInfo, data);
        break;
      case "editMessage":
        handleEditMessage(clientInfo, data);
        break;
      // case "typingIndicator":
      //   handleTypingIndicator(clientInfo, data);
      //   break;
      case "getGroupOnlineUsers":
        handleGetGroupOnlineUsers(clientInfo, data);
        break;

      // Add more cases as needed
      default:
        console.log(`Unsupported message type: ${type}`);
        break;
    }
  });

  ws.on("close", () => {
    // Remove client from the list and its groups
    clients = clients.filter((client) => client.ws !== ws);
    clientInfo.groups.forEach(groupId => {
      groups[groupId] = groups[groupId].filter(client => client.ws !== ws);
    });

    // Broadcast updated online status to all clients
    broadcastOnlineStatus();
  });
});

// Event handlers
const handleLogin = (clientInfo, data) => {
  const { _id, groupIds, avatar, username } = data;

  // Check for existing connections with the same user ID
  const existingClient = clients.find((client) => client._id === _id);

  if (existingClient) {
    // Close the previous WebSocket connection
    existingClient.ws.close();
    // Remove the existing client from the clients list
    clients = clients.filter((client) => client._id !== _id);
  }


  clientInfo._id = _id;
  clientInfo.avatar = avatar || "";
  clientInfo.username = username || "";
  clientInfo.groups = groupIds || [];

  // console.log("DATA", data)
  if (groupIds) {
    groupIds.forEach((groupId) => {
      handleJoinGroup(clientInfo, { groupId });
    });
  }
  broadcastOnlineStatus();
};


function handleMessage(clientInfo, data) {
  const { receiver, groupId } = data;
  // console.log("data : fl :", data)
  // console.log("receiverId : ", receiver, " : groupId : ", groupId)
  if (groupId) {
    // Handle group message
    handleGroupMessage(clientInfo, data);
  } else {
    // Handle personal message
    handlePersonalMessage(clientInfo, data);
  }
}

function handleVisibilityChange(clientInfo, data) {
  // console.log("visible event called : .....")
  const { isOnline } = data;
  // console.log("isVisible isOnline : " , isOnline)

  // Update client's online status based on visibility
  clientInfo.isOnline = isOnline;

  // console.log("clientinfor?.isOnline: " , clientInfo?.isOnline)

  // Broadcast updated online status to all clients
  broadcastOnlineStatus();
}

////////////////////////////////////////////////// support 
const handleAdminMessage = (clientInfo, data) => {
  const { repliedTo_id, messageContent, messageType, filePath } = data; // Use repliedTo_id instead of _id

  // Debugging steps
  // console.log("Data received: ", messageContent, "message type : ", messageType);
  // console.log("Clients array: ", clients);
  // console.log("Type of repliedTo_id in data: ", repliedTo_id);

  if (!repliedTo_id) {
    console.error("repliedTo_id is missing in the data payload.");
  }


  const recipient = clients.find((client) => client._id == repliedTo_id);

  if (!recipient) {
    console.log(`Recipient with _id ${repliedTo_id} not found.`);
  } else {
    // console.log("Recipient found: ", recipient);
  }



  if (recipient) {
    recipient.ws.send(
      JSON.stringify({
        type: "adminMessage",
        data: {
          messageContent,
          messageType,
          filePath,
          data,
          senderId: adminId,
          senderusername: "Admin",
          senderAvatar: clientInfo.avatar,
          timestamp: new Date().toISOString(),
        },
      })
    );
  } else {
    console.log("Recipient not found for _id:", repliedTo_id);
  }
};

// Handle user messages to the admin
const handleUserMessage = (clientInfo, data) => {
  const { messageContent, messageType, filePath } = data;
  // console.log("data : for send to admin : ", data)

  // Ensure the message is sent to the admin
  const admin = clients.find((client) => client._id === adminId);
  // console.log(" admin  : ", admin)
  if (admin) {
    admin.ws.send(
      JSON.stringify({
        type: "userMessage",
        data: {
          messageContent,
          messageType,
          filePath,
          data,
          senderId: clientInfo._id,
          senderusername: clientInfo.username,
          senderAvatar: clientInfo.avatar,
          timestamp: new Date().toISOString(),
        },
      })
    );
  } else {
    console.log("Admin not available.");
  }
};

////////////////////////////////////////////////// support  *** 

function handlePersonalMessage(clientInfo, data) {
  // console.log("Received data:", data);

  if (!data || !data.receiver) {
    console.error("Invalid data received:", data);
    return;
  }

  const { receiver } = data;


  // Use JSON.stringify for detailed logging of each client
  const recipient = clients.find((client) => {
    // console.log(`Checking client: ${JSON.stringify(client, null, 2)}`);
    return client._id === String(receiver);
  });

  // console.log("Recipient found:", recipient ? JSON.stringify({
  //   id: recipient._id,
  //   username: recipient.username || "No username",
  //   isOnline: recipient.isOnline,
  // }, null, 2) : "None");

  if (recipient) {
    try {
      console.log("data for send to user : ", data)
      recipient.ws.send(JSON.stringify({ type: "message", data }));
      console.log(`Message successfully sent to recipient: ${recipient._id}`);
    } catch (error) {
      console.error(`Error sending message to recipient: ${recipient._id}`, error);
    }
  } else {
    console.log("Recipient not found for receiverId:", receiver);
  }
}

function handleGroupMessage(clientInfo, data) {
  const { groupId } = data;
  const groupMembers = groups[groupId];

  if (groupMembers) {
    // console.log(`Sending message to group ${groupId} members:`, groupMembers.map(member => member._id));
    groupMembers.forEach((member) => {
      if (member.ws !== clientInfo.ws) {
        member.ws.send(JSON.stringify({ type: "message", data }));
      }
    });
  } else {
    console.log("Group not found for groupId:", groupId);
  }
}

// function handleTypingStatus(clientInfo, data) {
//   const { _id, isTyping, groupId } = data;
//   // console.log("id : ", _id, " isTyping : ", isTyping, " groupId : ", groupId)
//   if (groupId) {
//     const groupMembers = groups[groupId];
//     if (groupMembers) {
//       groupMembers.forEach((member) => {
//         if (member.ws !== clientInfo.ws) {
//           member.ws.send(JSON.stringify({ type: "typingStatus", data: { _id, isTyping, groupId } }));
//         }
//       });
//     }
//   } else {
//     clientInfo.isTyping = isTyping;
//     broadcastTypingStatus(_id, isTyping);
//   }
// }

const handleMessageSeen = (clientInfo, data) => {
  const { messageId, senderId, groupId, receiverId } = data;

  if (groupId) {
    // Handle group message seen
    const groupMembers = groups[groupId];
    if (groupMembers) {
      groupMembers.forEach((member) => {
        if (member.ws !== clientInfo.ws) {
          member.ws.send(
            JSON.stringify({
              type: "messageSeen",
              data: { messageId, userId: clientInfo._id, groupId },
            })
          );
        }
      });
    }
  } else {
    console.log(`Message Seen:`, data);

    // Broadcast the "messageSeen" event to the sender
    [...clients.entries()].forEach(([ws, userId]) => {
      if (userId === senderId && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "messageSeen",
            data: {
              messageId,
              receiverId,
            },
          })
        );
      }
    })
  }
};



const handleMessageDelivered = (client, data) => {
  const { messageId, senderId, receiverId } = data;

  // Log the event for debugging
  console.log(`Message Delivered Attempt:`, data);

  // Check if the receiver is currently online
  const receiverClient = clients.find((client) => client._id === receiverId);

  if (receiverClient && receiverClient.isOnline && receiverClient.ws.readyState === WebSocket.OPEN) {
    console.log(`Receiver ${receiverId} is online. Delivering message.`);

    // Notify the receiver about the delivered message
    receiverClient.ws.send(
      JSON.stringify({
        type: "messagedeliveredStatus",
        data: {
          messageId,
          senderId,
        },
      })
    );

    // Optional: Update the message status in the database
    // updateMessageStatusInDB(messageId, receiverId, "delivered");
  } else {
    console.log(`Receiver ${receiverId} is offline. Message remains "sent".`);

    // Optional: Update the message status in the database as "sent"
    // updateMessageStatusInDB(messageId, receiverId, "sent");
  }
};




function handlePresenceUpdate(clientInfo, data) {
  const { _id, isOnline } = data;

  // Update client's online status
  clientInfo.isOnline = isOnline;

  // Broadcast updated online status to all clients
  broadcastOnlineStatus();
}

function handleUserJoin(clientInfo, data) {
  const { _id, groupId } = data;

  if (!groups[groupId]) {
    groups[groupId] = [];
  }
  groups[groupId].push(clientInfo);
  clientInfo.groups.push(groupId);

  // console.log(`User ${_id} joined group ${groupId}`);

  // Broadcast user join event to all clients
  broadcastToAllClients({
    type: "userJoin",
    data: { _id, groupId },
  });
}

function handleReaction(clientInfo, data) {
  const { messageId, reaction } = data;
  // Logic to handle reactions to messages
  broadcastToAllClients({
    type: "reaction",
    data: { messageId, reaction },
  });
}

function handleFileMessage(clientInfo, data) {
  // Logic to handle file messages
  broadcastToAllClients({
    type: "file",
    data,
  });
}

function handleVoiceMessage(clientInfo, data) {
  // Logic to handle voice messages
  broadcastToAllClients({
    type: "voiceMessage",
    data,
  });
}

/**
 * The function `handleDeleteMessage` deletes a message and broadcasts the deletion to all clients.
 * @param clientInfo - Client information such as client ID, username, IP address, etc.
 * @param data - The `data` parameter in the `handleDeleteMessage` function likely contains information
 * related to the message that needs to be deleted. In this case, it specifically includes the
 * `messageId` property, which is used to identify the message that should be deleted. This `messageId`
 * is then used
 */
function handleDeleteMessage(clientInfo, data) {
  const { messageId } = data;
  // Logic to handle message deletion
  broadcastToAllClients({
    type: "deleteMessage",
    data: { messageId },
  });
}

function handleEditMessage(clientInfo, data) {
  const { messageId, newContent } = data;
  // Logic to handle message editing
  broadcastToAllClients({
    type: "editMessage",
    data: { messageId, newContent },
  });
}


/**
 * The function `handleNewChat` sends a new chat message to a specific recipient based on the
 * receiver's ID.
 * @param clientInfo - The `clientInfo` parameter likely contains information about the client
 * initiating the chat, such as their user ID, connection details, and any other relevant data. This
 * information is used to identify the sender of the chat message.
 * @param data - The `data` parameter in the `handleNewChat` function likely contains information about
 * the new chat message being sent, such as the `receiverId` which is extracted from it. This data is
 * used to find the recipient client based on their `_id` and send the new chat message to them
 */

function handleNewChat(clientInfo, data) {
  const { receiverId } = data;
  const recipient = clients.find((client) => client._id === String(receiverId));
  if (recipient) {
    recipient.ws.send(JSON.stringify({ type: "newChat", data }))
  }
}

function handleJoinGroup(clientInfo, data) {
  const { groupId } = data;

  if (!groups[groupId]) {
    groups[groupId] = [];
  }
  if (!groups[groupId].includes(clientInfo)) {
    groups[groupId].push(clientInfo);
    clientInfo.groups.push(groupId);

    // console.log(`Client joined group ${groupId}`);

    // Broadcast user join event to all clients
    broadcastToAllClients({
      type: "userJoin",
      data: { _id: clientInfo._id, groupId },
    });

    // Notify the client of current group online users
    handleGetGroupOnlineUsers(clientInfo, { groupId });
  }
}



// Define more event handlers as needed

function broadcastOnlineStatus() {
  const activeUsers = clients.map((client) => ({
    _id: client._id,
    isOnline: client.isOnline,
    groups: client.groups,
    userusername: client.username
  }));

  clients.forEach((client) => {
    // console.log("online status : ", activeUsers)
    client.ws.send(
      JSON.stringify({
        type: "onlineStatus",
        data: activeUsers,
      })
    );
  });
}


function handleGetGroupOnlineUsers(clientInfo, data) {
  const { groupId } = data;

  if (groupId) {
    const onlineUsers = groups[groupId]?.filter((member) => member.isOnline) || [];

    const onlineUsersData = onlineUsers.map((member) => ({
      _id: member._id,
      isOnline: member.isOnline,
    }));

    clientInfo.ws.send(
      JSON.stringify({
        type: "groupOnlineUsers",
        data: { groupId, onlineUsers: onlineUsersData },
      })
    );
  } else {
    console.log("groupId is required to get online users");
  }
}

function broadcastOnlineStatus() {
  const activeUsers = clients.map((client) => ({
    _id: client._id,
    avatar: client.avatar,
    username: client.username,
    isOnline: client.isOnline,
    groups: client.groups,
  }));

  clients.forEach((client) => {
    client.ws.send(
      JSON.stringify({
        type: "onlineStatus",
        data: activeUsers,
      })
    );
  });
}

function handleGetGroupOnlineUsers(clientInfo, data) {
  const { groupId } = data;

  if (groupId) {
    const onlineUsers = groups[groupId]?.filter((member) => member.isOnline) || [];

    const onlineUsersData = onlineUsers.map((member) => ({
      _id: member._id,
      avatar: member.avatar,
      username: member.username,
      isOnline: member.isOnline,
    }));

    clientInfo.ws.send(
      JSON.stringify({
        type: "groupOnlineUsers",
        data: { groupId, onlineUsers: onlineUsersData },
      })
    );
  } else {
    console.log("groupId is required to get online users");
  }
}


// function broadcastTypingStatus(_id, isTyping) {
//   clients.forEach((client) => {
//     client.ws.send(JSON.stringify({ type: "typingStatus", data: { _id, isTyping } }));
//   });
// }

function broadcastToAllClients(message) {
  clients.forEach((client) => {
    client.ws.send(JSON.stringify(message));
  });
}

console.log("WebSocket server running on ws://localhost:9000");
