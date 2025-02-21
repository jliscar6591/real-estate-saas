import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // Existing Todo model (optional)
  Todo: a.model({
    content: a.string(),
  }).authorization(allow => [allow.owner()]),

  // Client model: Represents a client with basic fields and relationships.
  Client: a.model({
    name: a.string(),
    email: a.string(),
    // A client can have many properties.
    properties: a.hasMany('Property', 'clientId'),
    // A client can have many chats.
    chats: a.hasMany('Chat', 'clientId'),
  }).authorization(allow => [allow.owner()]),

  // Property model: Represents a property owned by a client.
  Property: a.model({
    address: a.string(),
    value: a.integer(),
    // Relate the property back to its client.
    client: a.belongsTo('Client', 'clientId'),
    clientId: a.id(),
  }).authorization(allow => [allow.owner()]),

  // Chat model: Now tied to a client.
  Chat: a.model({
    name: a.string(),
    // Each chat belongs to a client.
    client: a.belongsTo('Client', 'clientId'),
    clientId: a.id(),
    messages: a.hasMany('Message', 'chatId'),
  }).authorization(allow => [allow.owner()]),

  // Message model: Includes a senderType to indicate agent or client.
  Message: a.model({
    text: a.string(),
    chat: a.belongsTo('Chat', 'chatId'),
    chatId: a.id(),
    senderType: a.string(), // e.g. "agent" or "client"
  }).authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
