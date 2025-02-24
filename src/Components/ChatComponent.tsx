import { useState, useEffect, useMemo } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import {
  Container,
  CssBaseline,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Stack,
  Typography,
  Avatar,
  TextField,
  Button,
  InputAdornment,
  Box,
  MenuItem,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Select,
  SelectChangeEvent
} from "@mui/material";
import { Search, Delete, Edit, Close, Check } from "@mui/icons-material";

const client = generateClient<Schema>();

type Chat = Schema["Chat"]["type"];
type Message = Schema["Message"]["type"];
type Client = Schema["Client"]["type"];

export default function ChatWithClient() {
  // State declarations with explicit types
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState<string>("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [newChatName, setNewChatName] = useState<string>("");
  const [showNewChatForm, setShowNewChatForm] = useState<boolean>(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState<string>("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // Subscription effects with proper typing
  useEffect(() => {
    const chatSub = client.models.Chat.observeQuery().subscribe({
      next: ({ items }) => setChats([...items]),
      error: (err: Error) => console.error("Chat fetch error:", err),
    });

    const clientSub = client.models.Client.observeQuery().subscribe({
      next: ({ items }) => setClients([...items]),
      error: (err: Error) => console.error("Client fetch error:", err),
    });

    return () => {
      chatSub.unsubscribe();
      clientSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedChat?.id) return;

    const messageSub = client.models.Message.observeQuery({
      filter: { chatId: { eq: selectedChat.id } }
    }).subscribe({
      next: ({ items }) => setMessages([...items]),
      error: (err: Error) => console.error("Message fetch error:", err),
    });

    return () => messageSub.unsubscribe();
  }, [selectedChat?.id]);

  // Memoized chats with proper dependencies
  const filteredChats = useMemo(() =>
    chats.filter(chat =>
      chat.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      chat.clientId?.toLowerCase().includes(searchText.toLowerCase())
    ).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [chats, searchText]);

  // Updated handler with proper typing
  const handleClientSelect = (event: SelectChangeEvent<string>) => {
    setSelectedClientId(event.target.value);
  };

  // Corrected chat creation with type safety
  const handleCreateChat = async () => {
    if (!newChatName || !selectedClientId) return;

    try {
      const newChat: any = await client.models.Chat.create({
        name: newChatName,
        clientId: selectedClientId,
      });

      // Reset form with type-safe empty strings
      setNewChatName("");
      setSelectedClientId("");
    } catch (error) {
      console.error("Chat creation error:", error);
    }
  };


  const handleSendMessage = async (senderType: "agent" | "client") => {
    if (!selectedChat?.id || !messageText) return;
    try {
      await client.models.Message.create({
        text: messageText,
        chatId: selectedChat.id,
        senderType,
      });
      setMessageText("");
    } catch (error) {
      console.error("Message send error:", error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await client.models.Chat.delete({ id: chatId });
      if (selectedChat?.id === chatId) setSelectedChat(null);
    } catch (error) {
      console.error("Chat delete error:", error);
    } finally {
      setDeleteConfirmOpen(false);
      setChatToDelete(null);
    }
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!editingMessageText.trim()) return;
    try {
      await client.models.Message.update({
        id: messageId,
        text: editingMessageText
      });
      setEditingMessageId(null);
      setEditingMessageText("");
    } catch (error) {
      console.error("Message update error:", error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', p: 0 }}>
      <CssBaseline />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Chat?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone and will permanently delete the chat history.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() => chatToDelete && handleDeleteChat(chatToDelete)}
            color="error"
            variant="contained"
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'flex', height: '100%', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Chat List Sidebar */}
        <Box sx={{ width: { md: 320 }, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search chats..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <IconButton
                onClick={() => setShowNewChatForm(!showNewChatForm)}
                color={showNewChatForm ? "primary" : "default"}
              >
                <Edit />
              </IconButton>
            </Box>

            {showNewChatForm && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Stack spacing={2}>
                  <TextField
                    label="Chat Name"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    fullWidth
                  />
                  <Select
                    value={selectedClientId}
                    onChange={handleClientSelect}
                    displayEmpty
                    fullWidth
                    slotProps={{
                      input: {
                        id: 'client-select',
                      },
                    }}
                  >
                    <MenuItem value=""><em>Select Client</em></MenuItem>
                    {clients.map((client) => (
                      <MenuItem
                        key={client.id ?? ''} // Handle potential null/undefined
                        value={client.id ?? ''} // Ensure string value
                      >
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <Button
                    variant="contained"
                    onClick={handleCreateChat}
                    disabled={!newChatName || !selectedClientId}
                  >
                    Create Chat
                  </Button>
                </Stack>
              </Box>
            )}

            <List sx={{ flex: 1, overflow: 'auto' }}>
              {filteredChats.map((chat) => (
                <ListItem
                  key={chat.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setChatToDelete(chat.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  }
                  disablePadding
                >
                  <ListItemButton
                    selected={selectedChat?.id === chat.id}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <ListItemText
                      primary={chat.name}
                      secondary={clients.find(c => c.id === chat.clientId)?.name ?? 'Unknown Client'}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        {/* Chat Messages Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedChat ? (
              <>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar />
                  <Typography variant="h6">{selectedChat.name}</Typography>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'action.hover' }}>
                  {messages.map((message: any) => (
                    <Stack
                      key={message.id}
                      direction="row"
                      justifyContent={message.senderType === 'agent' ? 'flex-end' : 'flex-start'}
                      sx={{ mb: 2 }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '75%',
                          position: 'relative',
                          bgcolor: message.senderType === 'agent' ? 'primary.light' : 'background.paper',
                          borderRadius: 2,
                        }}
                      >
                        {editingMessageId === message.id ? (
                          <TextField
                            autoFocus
                            fullWidth
                            value={editingMessageText}
                            onChange={(e) => setEditingMessageText(e.target.value)}
                            onBlur={() => handleUpdateMessage(message.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateMessage(message.id)}
                            slotProps={{
                              input: {
                                sx: { pr: 6 },
                              },
                            }}
                          />
                        ) : (
                          <Typography>{message.text}</Typography>
                        )}

                        <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5 }}>
                          {editingMessageId === message.id ? (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateMessage(message.id)}
                              >
                                <Check fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditingMessageText("");
                                }}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingMessageId(message.id);
                                setEditingMessageText(message.text);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          )}
                        </Box>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mt={1}
                        >
                          {new Date(message.createdAt ?? Date.now()).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Stack>
                  ))}
                </Box>

                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && messageText) {
                          handleSendMessage("agent");
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleSendMessage("agent")}
                      disabled={!messageText}
                    >
                      Agent
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleSendMessage("client")}
                      disabled={!messageText}
                    >
                      Client
                    </Button>
                  </Stack>
                </Box>
              </>
            ) : (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">
                  Select a chat from the list or create a new one
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}