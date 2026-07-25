import { defineFunction } from "@aws-amplify/backend";

export const checkout = defineFunction({
  name: "checkout",
  entry: "./handler.ts",
  timeoutSeconds: 6, // deliberately tight — see Bug #8 (shipping-estimate timeout)
  environment: {
    AUDIT_BUCKET_NAME: "PLACEHOLDER", // wired to the real bucket name in backend.ts
  },
});
