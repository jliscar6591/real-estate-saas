import { useState, useEffect, useMemo } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { 
  TextField, 
  Button, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TableSortLabel,
  InputAdornment
} from "@mui/material";
import { Search } from "@mui/icons-material";

const client = generateClient<Schema>();

type Client = Schema["Client"]["type"];
type Property = Schema["Property"]["type"];

type SortConfig<T> = {
  field: keyof T;
  direction: 'asc' | 'desc';
};

function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyValue, setPropertyValue] = useState<number>(0);
  const [properties, setProperties] = useState<Property[]>([]);
  
  // Client table state
  const [clientsSearch, setClientsSearch] = useState("");
  const [clientsSort, setClientsSort] = useState<SortConfig<Client>>({
    field: 'name',
    direction: 'asc'
  });

  // Property table state
  const [propertiesSearch, setPropertiesSearch] = useState("");
  const [propertiesSort, setPropertiesSort] = useState<SortConfig<Property>>({
    field: 'address',
    direction: 'asc'
  });

  // Subscribe to clients
  useEffect(() => {
    const subscription = client.models.Client.observeQuery().subscribe({
      next: (data) => setClients([...data.items]),
      error: (err) => console.error("Error fetching clients:", err),
    });
    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to properties for selected client
  useEffect(() => {
    if (!selectedClient) return;

    const subscription = client.models.Property.observeQuery({
      filter: { clientId: { eq: selectedClient.id } }
    }).subscribe({
      next: (data) => setProperties([...data.items]),
      error: (err) => console.error("Error fetching properties:", err),
    });

    return () => subscription.unsubscribe();
  }, [selectedClient?.id]);

  // Sorted and filtered clients
  const processedClients = useMemo(() => {
    return clients
      .filter(client => 
        client.name?.toLowerCase().includes(clientsSearch.toLowerCase()) ||
        client.email?.toLowerCase().includes(clientsSearch.toLowerCase())
      )
      .sort((a: any, b: any) => {
        const aValue = a[clientsSort.field];
        const bValue = b[clientsSort.field];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) return clientsSort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return clientsSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [clients, clientsSearch, clientsSort]);

  // Sorted and filtered properties
  const processedProperties = useMemo(() => {
    return properties
      .filter(property => 
        property.address?.toLowerCase().includes(propertiesSearch.toLowerCase())
      )
      .sort((a: any, b: any) => {
        const aValue = a[propertiesSort.field];
        const bValue = b[propertiesSort.field];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return propertiesSort.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        if (aValue < bValue) return propertiesSort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return propertiesSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [properties, propertiesSearch, propertiesSort]);

  const handleClientSort = (field: keyof Client) => {
    setClientsSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePropertySort = (field: keyof Property) => {
    setPropertiesSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  async function handleAddClient() {
    if (!clientName || !clientEmail) return;
    try {
      const newClient = await client.models.Client.create({
        name: clientName,
        email: clientEmail,
      });
      setClientName("");
      setClientEmail("");
    } catch (error) {
      console.error("Error creating client:", error);
    }
  }

  async function handleEditClient(clientId: string) {
    const newName = window.prompt("Enter new client name:");
    if (!newName) return;
    try {
      await client.models.Client.update({ id: clientId, name: newName });
    } catch (error) {
      console.error("Error updating client:", error);
    }
  }

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
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Client Management</Typography>
      
      {/* Add Client Form */}
      <div style={{ marginBottom: '30px' }}>
        <TextField
          label="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          sx={{ mr: 2, width: 300 }}
        />
        <TextField
          label="Client Email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          sx={{ mr: 2, width: 300 }}
        />
        <Button variant="contained" onClick={handleAddClient}>
          Add Client
        </Button>
      </div>

      {/* Clients Search */}
      <TextField
        fullWidth
        placeholder="Search clients..."
        variant="outlined"
        value={clientsSearch}
        onChange={(e) => setClientsSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* Clients Table */}
      <TableContainer component={Paper} sx={{ marginBottom: '30px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={clientsSort.field === 'name' ? clientsSort.direction : false}>
                <TableSortLabel
                  active={clientsSort.field === 'name'}
                  direction={clientsSort.direction}
                  onClick={() => handleClientSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={clientsSort.field === 'email' ? clientsSort.direction : false}>
                <TableSortLabel
                  active={clientsSort.field === 'email'}
                  direction={clientsSort.direction}
                  onClick={() => handleClientSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processedClients.map((client) => (
              <TableRow 
                key={client.id}
                onClick={() => setSelectedClient(client)}
                sx={{ 
                  cursor: 'pointer',
                  backgroundColor: selectedClient?.id === client.id ? '#f5f5f5' : 'inherit'
                }}
              >
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>
                  <Button 
                    variant="outlined" 
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleEditClient(client.id);
                    }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Properties Section */}
      {selectedClient && (
        <div>
          <Typography variant="h5" gutterBottom>
            Properties for {selectedClient.name}
          </Typography>

          {/* Properties Search */}
          <TextField
            fullWidth
            placeholder="Search properties..."
            variant="outlined"
            value={propertiesSearch}
            onChange={(e) => setPropertiesSearch(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {/* Add Property Form */}
          <div style={{ marginBottom: '20px' }}>
            <TextField
              label="Property Address"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              sx={{ mr: 2, width: 300 }}
            />
            <TextField
              label="Property Value"
              type="number"
              value={propertyValue}
              onChange={(e) => setPropertyValue(parseFloat(e.target.value))}
              sx={{ mr: 2, width: 200 }}
            />
            <Button variant="contained" onClick={handleAddProperty}>
              Add Property
            </Button>
          </div>

          {/* Properties Table */}
          {processedProperties.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sortDirection={propertiesSort.field === 'address' ? propertiesSort.direction : false}>
                      <TableSortLabel
                        active={propertiesSort.field === 'address'}
                        direction={propertiesSort.direction}
                        onClick={() => handlePropertySort('address')}
                      >
                        Address
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={propertiesSort.field === 'value' ? propertiesSort.direction : false}>
                      <TableSortLabel
                        active={propertiesSort.field === 'value'}
                        direction={propertiesSort.direction}
                        onClick={() => handlePropertySort('value')}
                      >
                        Value
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>${property.value?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              No properties found {propertiesSearch && `matching "${propertiesSearch}"`}
            </Typography>
          )}
        </div>
      )}
    </div>
  );
}

export default ClientManagement;