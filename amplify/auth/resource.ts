import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource.
 * This configuration uses email as the primary login method and
 * includes a custom user attribute "custom:type" so that users can
 * specify their type (developer, admin, agent, client) during signup.
 * After signup, an email is sent for verification.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  // Define the attributes that Cognito will use.
  // Standard attributes like email are defined here (and become required by loginWith).
  // Custom attributes must use the "custom:" prefix.
  userAttributes: {
    email: {
      required: true,
    },
    "custom:type": {
      dataType: "String",
      mutable: true,
      // You can add further constraints (minLen, maxLen) if desired.
    },
  },
});
