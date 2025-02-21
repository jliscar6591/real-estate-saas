import React, { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";

// Import react-router-dom components for routing
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

// MUI components and icons
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  TextField,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ChatIcon from "@mui/icons-material/Chat";
import ClientManagement from "./Components/ClientsComponent";
import ChatWithClient from "./Components/ChatComponent";

// Generate the Amplify Data client using your schema
const client = generateClient<Schema>();

// Define a type alias for the Chat record returned by the create method
type ChatRecord = Awaited<ReturnType<typeof client.models.Chat.create>>;

/*────────────────────────────
  Layout Component
────────────────────────────*/
// This component provides the AppBar at the top, a persistent Drawer (sidebar),
// and a main content area where child routes are rendered.
function Layout({ children }: { children: React.ReactNode }) {
  // Local state for dark/light mode
  const [darkMode, setDarkMode] = useState(false);
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  // useNavigate hook to programmatically navigate
  const navigate = useNavigate();

  // Toggle dark/light theme
  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* AppBar at the top */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Amplify App
          </Typography>
          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            {/* Navigate to Agent Dashboard */}
            <ListItem onClick={() => navigate("/agent/dashboard")}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem onClick={() => navigate("/agent/clients")}>
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Clients" />
            </ListItem>
            {/* Navigate to Home (Chat) */}
            <ListItem onClick={() => navigate("/agent/chats")}>
              <ListItemIcon>
                <ChatIcon />
              </ListItemIcon>
              <ListItemText primary="Chat" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main content area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: 30, mt: 8 }}>
        {children}
      </Box>
    </ThemeProvider>
  );
}

/*────────────────────────────
  Home Component
────────────────────────────*/
// This component includes your Todo and Chat functionality.
// Users can create a chat (if one doesn’t exist) and then send messages.
function Home() {
  const { user, signOut } = useAuthenticator();

  // State for Todo items (optional)
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  // State for Chat messages
  const [messages, setMessages] = useState<Array<Schema["Message"]["type"]>>([]);
  // State for the Chat record; null until created
  const [chat, setChat] = useState<ChatRecord | null>(null);
  // State for chat name input (for creating a new chat)
  const [chatName, setChatName] = useState("");
  // State for new message text input
  const [messageText, setMessageText] = useState("");

  // Subscribe to Todo items (optional)
  useEffect(() => {
    const subscription = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
      error: (err) => console.error("Error observing todos:", err),
    });
    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to messages once a chat exists
  useEffect(() => {
    console.log('chat being created', chat);
    if (!chat) return;
    const subscription = client.models.Message.observeQuery({
      filter: { and: [{ chatId: { eq: chat.id } }] },
    }).subscribe({
      next: (data) => {
        setMessages([...data.items]);
      },
      error: (err) => console.error("Error observing messages:", err),
    });
    
    return () => subscription.unsubscribe();
  }, [chat]);

  // Create a new chat based on user input
  async function handleCreateChat() {
    if (!chatName.trim()) return;
    try {
      const newChat = await client.models.Chat.create({ name: chatName });
      setChat(newChat);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  }

  // Create a new message in the current chat
  async function handleCreateMessage() {
    if (!chat) {
      console.error("Chat is not ready yet.");
      return;
    }
    if (!messageText.trim()) return;
    try {
      await client.models.Message.create({
        text: messageText,
        chatId: chat.id,
      });
      setMessageText("");
    } catch (error) {
      console.error("Error creating message:", error);
    }
  }

  // Optional: Create and delete todos
  function handleCreateTodo() {
    const content = window.prompt("Todo content");
    if (content) {
      client.models.Todo.create({ content });
    }
  }
  function handleDeleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  return (
    <Container>
      <Typography variant="h5" gutterBottom>
        Welcome, {user?.signInDetails?.loginId}
      </Typography>

      {/* Todo Section (Optional) */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6">Todo List</Typography>
        <Button variant="contained" color="primary" onClick={handleCreateTodo} sx={{ mt: 2 }}>
          + New Todo
        </Button>
        <List>
          {todos.map((todo) => (
            <ListItem key={todo.id} onClick={() => handleDeleteTodo(todo.id)}>
              <ListItemText primary={todo.content} />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Chat Section */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6">Chat</Typography>
        {!chat ? (
          // Chat creation form: display if no chat exists yet
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Chat Name"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              variant="outlined"
            />
            <Button variant="contained" color="primary" onClick={handleCreateChat}>
              Create Chat
            </Button>
          </Box>
        ) : (
          // Chat messages and message input: display once a chat has been created
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Chat: {chat.name}</Typography>
            <List>
              {messages.map((message) => (
                <ListItem key={message.id}>
                  <ListItemText primary={message.text} />
                </ListItem>
              ))}
            </List>
            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Type your message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                variant="outlined"
              />
              <Button variant="contained" color="primary" onClick={handleCreateMessage}>
                Send Message
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Button variant="outlined" color="secondary" onClick={signOut}>
        Sign Out
      </Button>
    </Container>
  );
}

/*────────────────────────────
  Dashboard Component
────────────────────────────*/
// A placeholder component for the Agent Dashboard page.
function Dashboard() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Agent Dashboard
      </Typography>
      <Typography>
        This is the agent dashboard page. You can add your dashboard content here.
      </Typography>
    </Container>
  );
}

/*────────────────────────────
  Main App Component with Routing
────────────────────────────*/
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/agent/dashboard" element={<Dashboard />} />
          <Route path="/agent/clients" element={<ClientManagement />} />
          <Route path="/agent/chats" element={<ChatWithClient />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
