import React, { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

// React Router imports
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation, // Added for selected state
} from "react-router-dom";

// MUI components and icons
import { ThemeProvider } from "@mui/material/styles";
import {
  CssBaseline,
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
  Avatar,
  ListItemButton, // Added for avatar
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import HomeIcon from "@mui/icons-material/Home"; // Added for avatar icon
import { getTheme } from "./theme";
import ClientManagement from "./Components/ClientsComponent";
import ChatWithClient from "./Components/ChatComponent";
import PropertyTable from "./Components/PropertyTable";

const client = generateClient<Schema>();

type ChatRecord = Awaited<ReturnType<typeof client.models.Chat.create>>;

/** Layout Component */
function Layout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const theme = getTheme(darkMode);
  const navigate = useNavigate();
  const location = useLocation(); // Get current route for selected state

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const formFields = {
    signIn: {
      username: {
        label: "Email Address",
        placeholder: "Enter your email",
        order: 1,
      },
      password: {
        label: "Password",
        placeholder: "Enter your password",
        order: 2,
      },
    },
    signUp: {
      email: {
        label: "Email",
        placeholder: "Your email address",
        order: 1,
      },
      password: {
        label: "Password",
        placeholder: "Create a password",
        order: 2,
      },
      confirm_password: {
        label: "Confirm Password",
        order: 3,
      },
    },
  };

  return (
    <Authenticator formFields={formFields} initialState="signIn">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* Sidebar Navigation */}
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
          }}
        >
          <Toolbar>
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <Avatar sx={{ mr: 1 }}>
                <HomeIcon />
              </Avatar>
              <Typography sx={{ width: 'fit-content' }}>Real Estate SaaS</Typography>
            </Box>
            <IconButton color="inherit" onClick={toggleDarkMode}>
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
          <Box sx={{ overflow: "auto" }}>
            <List>
              <ListItem
                key="home"
              >
                <ListItemButton selected={location.pathname === "/home"} onClick={() => navigate("/home")}>
                  <ListItemIcon>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 21V13.6C9 13.0399 9 12.7599 9.109 12.546C9.20487 12.3578 9.35785 12.2049 9.54601 12.109C9.75993 12 10.04 12 10.6 12H13.4C13.9601 12 14.2401 12 14.454 12.109C14.6422 12.2049 14.7951 12.3578 14.891 12.546C15 12.7599 15 13.0399 15 13.6V21M2 9.5L11.04 2.72C11.3843 2.46181 11.5564 2.33271 11.7454 2.28294C11.9123 2.23902 12.0877 2.23902 12.2546 2.28295C12.4436 2.33271 12.6157 2.46181 12.96 2.72L22 9.5M4 8V17.8C4 18.9201 4 19.4802 4.21799 19.908C4.40974 20.2843 4.7157 20.5903 5.09202 20.782C5.51985 21 6.0799 21 7.2 21H16.8C17.9201 21 18.4802 21 18.908 20.782C19.2843 20.5903 19.5903 20.2843 19.782 19.908C20 19.4802 20 18.9201 20 17.8V8L13.92 3.44C13.2315 2.92361 12.8872 2.66542 12.5091 2.56589C12.1754 2.47804 11.8246 2.47804 11.4909 2.56589C11.1128 2.66542 10.7685 2.92361 10.08 3.44L4 8Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </ListItemIcon>
                  <ListItemText primary="Home" />
                </ListItemButton>
              </ListItem>
              <ListItem
                key="dashboard"
              >
                <ListItemButton selected={location.pathname === "/agent/dashboard"}
                  onClick={() => navigate("/agent/dashboard")}>
                  <ListItemIcon>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.4 3H4.6C4.03995 3 3.75992 3 3.54601 3.10899C3.35785 3.20487 3.20487 3.35785 3.10899 3.54601C3 3.75992 3 4.03995 3 4.6V8.4C3 8.96005 3 9.24008 3.10899 9.45399C3.20487 9.64215 3.35785 9.79513 3.54601 9.89101C3.75992 10 4.03995 10 4.6 10H8.4C8.96005 10 9.24008 10 9.45399 9.89101C9.64215 9.79513 9.79513 9.64215 9.89101 9.45399C10 9.24008 10 8.96005 10 8.4V4.6C10 4.03995 10 3.75992 9.89101 3.54601C9.79513 3.35785 9.64215 3.20487 9.45399 3.10899C9.24008 3 8.96005 3 8.4 3Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19.4 3H15.6C15.0399 3 14.7599 3 14.546 3.10899C14.3578 3.20487 14.2049 3.35785 14.109 3.54601C14 3.75992 14 4.03995 14 4.6V8.4C14 8.96005 14 9.24008 14.109 9.45399C14.2049 9.64215 14.3578 9.79513 14.546 9.89101C14.7599 10 15.0399 10 15.6 10H19.4C19.9601 10 20.2401 10 20.454 9.89101C20.6422 9.79513 20.7951 9.64215 20.891 9.45399C21 9.24008 21 8.96005 21 8.4V4.6C21 4.03995 21 3.75992 20.891 3.54601C20.7951 3.35785 20.6422 3.20487 20.454 3.10899C20.2401 3 19.9601 3 19.4 3Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M19.4 14H15.6C15.0399 14 14.7599 14 14.546 14.109C14.3578 14.2049 14.2049 14.3578 14.109 14.546C14 14.7599 14 15.0399 14 15.6V19.4C14 19.9601 14 20.2401 14.109 20.454C14.2049 20.6422 14.3578 20.7951 14.546 20.891C14.7599 21 15.0399 21 15.6 21H19.4C19.9601 21 20.2401 21 20.454 20.891C20.6422 20.7951 20.7951 20.6422 20.891 20.454C21 20.2401 21 19.9601 21 19.4V15.6C21 15.0399 21 14.7599 20.891 14.546C20.7951 14.3578 20.6422 14.2049 20.454 14.109C20.2401 14 19.9601 14 19.4 14Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8.4 14H4.6C4.03995 14 3.75992 14 3.54601 14.109C3.35785 14.2049 3.20487 14.3578 3.10899 14.546C3 14.7599 3 15.0399 3 15.6V19.4C3 19.9601 3 20.2401 3.10899 20.454C3.20487 20.6422 3.35785 20.7951 3.54601 20.891C3.75992 21 4.03995 21 4.6 21H8.4C8.96005 21 9.24008 21 9.45399 20.891C9.64215 20.7951 9.79513 20.6422 9.89101 20.454C10 20.2401 10 19.9601 10 19.4V15.6C10 15.0399 10 14.7599 9.89101 14.546C9.79513 14.3578 9.64215 14.2049 9.45399 14.109C9.24008 14 8.96005 14 8.4 14Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>
              <ListItem
                key="clients"
              >
                <ListItemButton selected={location.pathname === "/agent/clients"}
                  onClick={() => navigate("/agent/clients")}>
                  <ListItemIcon>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M22 21V19C22 17.1362 20.7252 15.5701 19 15.126M15.5 3.29076C16.9659 3.88415 18 5.32131 18 7C18 8.67869 16.9659 10.1159 15.5 10.7092M17 21C17 19.1362 17 18.2044 16.6955 17.4693C16.2895 16.4892 15.5108 15.7105 14.5307 15.3045C13.7956 15 12.8638 15 11 15H8C6.13623 15 5.20435 15 4.46927 15.3045C3.48915 15.7105 2.71046 16.4892 2.30448 17.4693C2 18.2044 2 19.1362 2 21M13.5 7C13.5 9.20914 11.7091 11 9.5 11C7.29086 11 5.5 9.20914 5.5 7C5.5 4.79086 7.29086 3 9.5 3C11.7091 3 13.5 4.79086 13.5 7Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </ListItemIcon>
                  <ListItemText primary="Clients" />
                </ListItemButton>
              </ListItem>
              <ListItem
                key="chats"
              >
                <ListItemButton
                  selected={location.pathname === "/agent/chats"}
                  onClick={() => navigate("/agent/chats")}>

                  <ListItemIcon>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7 8.5H12M7 12H15M9.68375 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V20.3355C3 20.8684 3 21.1348 3.10923 21.2716C3.20422 21.3906 3.34827 21.4599 3.50054 21.4597C3.67563 21.4595 3.88367 21.2931 4.29976 20.9602L6.68521 19.0518C7.17252 18.662 7.41617 18.4671 7.68749 18.3285C7.9282 18.2055 8.18443 18.1156 8.44921 18.0613C8.74767 18 9.0597 18 9.68375 18Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </ListItemIcon>
                  <ListItemText primary="Chat" />

                </ListItemButton>
              </ListItem>
              <ListItem
                key="properties"
              >
                <ListItemButton
                  selected={location.pathname === "/properties"}
                  onClick={() => navigate("/properties")}>

                  <ListItemIcon>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16C13.6569 16 15 14.6568 15 13C15 11.3431 13.6569 9.99998 12 9.99998C10.3431 9.99998 9 11.3431 9 13C9 14.6568 10.3431 16 12 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                      <path d="M3 10.5651C3 9.9907 3 9.70352 3.07403 9.43905C3.1396 9.20478 3.24737 8.98444 3.39203 8.78886C3.55534 8.56806 3.78202 8.39175 4.23539 8.03912L11.0177 2.764C11.369 2.49075 11.5447 2.35412 11.7387 2.3016C11.9098 2.25526 12.0902 2.25526 12.2613 2.3016C12.4553 2.35412 12.631 2.49075 12.9823 2.764L19.7646 8.03913C20.218 8.39175 20.4447 8.56806 20.608 8.78886C20.7526 8.98444 20.8604 9.20478 20.926 9.43905C21 9.70352 21 9.9907 21 10.5651V17.8C21 18.9201 21 19.4801 20.782 19.908C20.5903 20.2843 20.2843 20.5903 19.908 20.782C19.4802 21 18.9201 21 17.8 21H6.2C5.07989 21 4.51984 21 4.09202 20.782C3.71569 20.5903 3.40973 20.2843 3.21799 19.908C3 19.4801 3 18.9201 3 17.8V10.5651Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </ListItemIcon>
                  <ListItemText primary="Property Scrape" />

                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>

        {/* Main content area */}
        <Box
          component="main"
          sx={{ flexGrow: 1, paddingLeft: 0, paddingTop: "20px", mt: 0 }}
        >
          {children}
        </Box>
      </ThemeProvider>
    </Authenticator>
  );
}

/** Home Component */
function Home() {
  const { user, signOut } = useAuthenticator();
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const [messages, setMessages] = useState<Array<Schema["Message"]["type"]>>([]);
  const [chat, setChat] = useState<ChatRecord | null>(null);
  const [chatName, setChatName] = useState("");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const subscription = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
      error: (err) => console.error("Error observing todos:", err),
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!chat) return;
    const subscription = client.models.Message.observeQuery({
      filter: { and: [{ chatId: { eq: chat.id } }] },
    }).subscribe({
      next: (data) => setMessages([...data.items]),
      error: (err) => console.error("Error observing messages:", err),
    });
    return () => subscription.unsubscribe();
  }, [chat]);

  async function handleCreateChat() {
    if (!chatName.trim()) return;
    try {
      const newChat = await client.models.Chat.create({ name: chatName });
      setChat(newChat);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  }

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

  function handleCreateTodo() {
    const content = window.prompt("Todo content");
    if (content) client.models.Todo.create({ content });
  }

  function handleDeleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  return (
    <Container sx={{ p: 0, ml: 0 }}>
      <Typography variant="h5" gutterBottom>
        Welcome, {user?.signInDetails?.loginId}
      </Typography>
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6">Todo List</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateTodo}
          sx={{ mt: 2 }}
        >
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
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6">Chat</Typography>
        {!chat ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Chat Name"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              variant="outlined"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateChat}
            >
              Create Chat
            </Button>
          </Box>
        ) : (
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
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateMessage}
              >
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

/** Dashboard Component */
function Dashboard() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Agent Dashboard
      </Typography>
      <Typography>
        This is the agent dashboard page. You can add your dashboard content
        here.
      </Typography>
    </Container>
  );
}

/** Main App Component */
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/agent/dashboard" element={<Dashboard />} />
          <Route path="/agent/clients" element={<ClientManagement />} />
          <Route path="/agent/chats" element={<ChatWithClient />} />
          <Route path="/properties" element={<PropertyTable />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;