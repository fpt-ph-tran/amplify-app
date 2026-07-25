import { defineFunction } from "@aws-amplify/backend";

export const checkout = defineFunction({
  name: "checkout",
  entry: "./handler.ts",
  // Lives in the data stack: it resolves a custom mutation (so data needs its
  // ARN) while also reading the Product/Order tables (so it needs theirs). In
  // its own stack that's a CloudFormation circular dependency.
  resourceGroupName: "data",
  timeoutSeconds: 6, // deliberately tight — see Bug #8 (shipping-estimate timeout)
  environment: {
    AUDIT_BUCKET_NAME: "PLACEHOLDER", // wired to the real bucket name in backend.ts
  },
});
