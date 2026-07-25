import { defineFunction } from "@aws-amplify/backend";

export const catalog = defineFunction({
  name: "catalog",
  entry: "./handler.ts",
});
