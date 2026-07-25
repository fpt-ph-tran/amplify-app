import { defineFunction } from "@aws-amplify/backend";

export const catalog = defineFunction({
  name: "catalog",
  entry: "./handler.ts",
  // Same reason as checkout — resolves getCatalog and reads the Product/Rating
  // tables, so it has to sit in the data stack to stay acyclic.
  resourceGroupName: "data",
});
