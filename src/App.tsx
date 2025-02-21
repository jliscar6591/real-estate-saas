import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useAuthenticator } from "@aws-amplify/ui-react";

// Generate the Amplify Data client using your schema
const client = generateClient<Schema>();

// Define a type alias for the Chat record returned by the create method
type ChatRecord = Awaited<ReturnType<typeof client.models.Chat.create>>;

function App() {
  // Get authentication details and sign-out function
  const { user, signOut } = useAuthenticator();

  // State for Todo items
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  // State for Chat messages
  const [messages, setMessages] = useState<Array<Schema["Message"]["type"]>>([]);
  // State for the Chat record (initially null until created)
  const [chat, setChat] = useState<ChatRecord | null>(null);

  // Create a Chat record when the component mounts
  useEffect(() => {
    async function createChat() {
      try {
        // Create a new Chat record named "General Chat"
        const newChat = await client.models.Chat.create({ name: "General Chat" });
        // Save the created chat record in state
        setChat(newChat);
      } catch (error) {
        console.error("Error creating chat:", error);
      }
    }
    createChat();
  }, []);

  // Subscribe to messages for the created chat once it's available
  useEffect(() => {
    // Only set up the subscription if the chat record exists
    if (!chat) return;

    const subscription = client.models.Message.observeQuery({
      filter: { chatId: { eq: chat.id } }, // Filter messages by the current chat's id
    }).subscribe({
      next: (data) => {
        // Update the state with the new messages when they arrive
        setMessages([...data.items]);
      },
      error: (err) => console.error("Error observing messages:", err),
    });

    // Clean up the subscription on unmount or if chat changes
    return () => subscription.unsubscribe();
  }, [chat]);

  // Subscribe to Todo items (optional)
  useEffect(() => {
    const subscription = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
      error: (err) => console.error("Error observing todos:", err),
    });
    return () => subscription.unsubscribe();
  }, []);

  // Function to create a new Todo item based on user input
  function createTodo() {
    const content = window.prompt("Todo content");
    if (content) {
      client.models.Todo.create({ content });
    }
  }

  // Function to delete a Todo item by its id
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  // Function to create a new message in the current chat
  async function createMessage() {
    // Ensure that the chat record is ready before creating a message
    if (!chat) {
      console.error("Chat is not ready yet.");
      return;
    }

    // Prompt the user to enter a message
    const text = window.prompt("Enter your message:");
    if (!text) return;

    try {
      // Create a new Message record associated with the current chat
      await client.models.Message.create({
        text,
        chatId: chat.id, // Link the message to the chat using its id
      });
    } catch (error) {
      console.error("Error creating message:", error);
    }
  }

  // Render the UI
  return (
    <main>
      <h1>{user?.signInDetails?.loginId}'s Todos</h1>
      <h2>Todo List</h2>
      <button onClick={createTodo}>+ New Todo</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => deleteTodo(todo.id)}>
            {todo.content}
          </li>
        ))}
      </ul>

      <h2>Chat Messages</h2>
      <button onClick={createMessage}>Send Message</button>
      <ul>
        {messages.map((message) => (
          <li key={message.id}>{message.text}</li>
        ))}
      </ul>

      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;
