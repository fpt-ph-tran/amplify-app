import { defineAuth } from "@aws-amplify/backend";

/**
 * Minimal email/password auth — exists mainly so Bug #9 (stale session /
 * expired token losing the cart mid-checkout) has a real Cognito token to
 * expire. Not the focus of this demo, kept as small as possible.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
