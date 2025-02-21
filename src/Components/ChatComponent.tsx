import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { TextField, Button } from "@mui/material";

const client = generateClient<Schema>();

function ChatWithClient() {
  const [chatName, setChatName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [chat, setChat] = useState<Schema["Chat"]["type"] | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Schema["Message"]["type"][]>([]);
  const [clients, setClients] = useState<Schema["Client"]["type"][]>([]);

  // Subscribe to clients for a dropdown selection
  useEffect(() => {
    const subscription = client.models.Client.observeQuery().subscribe({
      next: (data: any) => setClients([...data.items]),
      error: (err: any) => console.error("Error fetching clients:", err),
    });
    return () => subscription.unsubscribe();
  }, []);

  // Create a new chat tied to a selected client
  async function handleCreateChat() {
    if (!chatName || !selectedClientId) return;
    try {
      const newChat : any = await client.models.Chat.create({
        name: chatName,
        clientId: selectedClientId,
      });
      setChat(newChat);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  }

  // Create a new message in the current chat.
  // The senderType parameter can be "agent" or "client".
  async function handleSendMessage(senderType: string) {
    if (!chat || !messageText) return;
    try {
      await client.models.Message.create({
        text: messageText,
        chatId: chat.id,
        senderType,
      });
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  // Subscribe to messages for the active chat
  useEffect(() => {
    if (!chat) return;
    const subscription = client.models.Message.observeQuery({
      filter: { chatId: { eq: chat.id } },
    }).subscribe({
      next: (data: any) => setMessages([...data.items]),
      error: (err: any) => console.error("Error fetching messages:", err),
    });
    return () => subscription.unsubscribe();
  }, [chat]);

  return (
    <div>
      {!chat ? (
        <div>
          <h2>Create Chat</h2>
          <TextField
            label="Chat Name"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            sx={{ mr: 2 }}
          />
          <TextField
            select
            label="Select Client"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            SelectProps={{ native: true }}
            sx={{ mr: 2 }}
          >
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleCreateChat}>
            Create Chat
          </Button>
        </div>
      ) : (
        <div>
          <h3>Chat: {chat.name}</h3>
          <div>
            {messages.map((m) => (
              <p key={m.id}>
                <strong>{m.senderType}:</strong> {m.text}
              </p>
            ))}
          </div>
          <TextField
            label="Type your message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            sx={{ mr: 2 }}
          />
          <Button variant="contained" onClick={() => handleSendMessage("agent")}>
            Send as Agent
          </Button>
          <Button variant="contained" onClick={() => handleSendMessage("client")} sx={{ ml: 2 }}>
            Send as Client
          </Button>
        </div>
      )}
    </div>
  );
}

export default ChatWithClient;
