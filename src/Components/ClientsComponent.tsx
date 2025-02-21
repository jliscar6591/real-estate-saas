import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { TextField, Button, List, ListItem, ListItemText } from "@mui/material";

const client = generateClient<Schema>();

function ClientManagement() {
  const [clients, setClients] = useState<Schema["Client"]["type"][]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [selectedClient, setSelectedClient] = useState<Schema["Client"]["type"] | null>(null);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyValue, setPropertyValue] = useState<number>(0);

  // Subscribe to clients
  useEffect(() => {
    const subscription = client.models.Client.observeQuery().subscribe({
      next: (data) => setClients([...data.items]),
      error: (err) => console.error("Error fetching clients:", err),
    });
    return () => subscription.unsubscribe();
  }, []);

  // Create a new client
  async function handleAddClient() {
    if (!clientName || !clientEmail) return;
    try {
      const newClient: any = await client.models.Client.create({
        name: clientName,
        email: clientEmail,
      });
      setClientName("");
      setClientEmail("");
      setSelectedClient(newClient); // Optionally select the new client
    } catch (error) {
      console.error("Error creating client:", error);
    }
  }

  // Edit an existing client's name (example: update name via prompt)
  async function handleEditClient(clientId: string) {
    const newName = window.prompt("Enter new client name:");
    if (!newName) return;
    try {
      await client.models.Client.update({ id: clientId, name: newName });
    } catch (error) {
      console.error("Error updating client:", error);
    }
  }

  // Add a property to the selected client
  async function handleAddProperty() {
    if (!selectedClient || !propertyAddress) return;
    try {
      await client.models.Property.create({
        address: propertyAddress,
        value: propertyValue,
        clientId: selectedClient.id,
      });
      setPropertyAddress("");
      setPropertyValue(0);
    } catch (error) {
      console.error("Error adding property:", error);
    }
  }

  return (
    <div>
      <h2>Client Management</h2>
      <div>
        <TextField
          label="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          sx={{ mr: 2 }}
        />
        <TextField
          label="Client Email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Button variant="contained" onClick={handleAddClient}>
          Add Client
        </Button>
      </div>

      <List>
        {clients.map((c) => (
          <ListItem key={c.id} onClick={() => setSelectedClient(c)}>
            <ListItemText primary={c.name} secondary={c.email} />
            <Button onClick={() => handleEditClient(c.id)}>Edit</Button>
          </ListItem>
        ))}
      </List>

      {selectedClient && (
        <div>
          <h3>Properties for {selectedClient.name}</h3>
          <div>
            <TextField
              label="Property Address"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              sx={{ mr: 2 }}
            />
            <TextField
              label="Property Value"
              type="number"
              value={propertyValue}
              onChange={(e) => setPropertyValue(parseFloat(e.target.value))}
              sx={{ mr: 2 }}
            />
            <Button variant="contained" onClick={handleAddProperty}>
              Add Property
            </Button>
          </div>
          {/* You could also subscribe to and render the client's properties here */}
        </div>
      )}
    </div>
  );
}

export default ClientManagement;
