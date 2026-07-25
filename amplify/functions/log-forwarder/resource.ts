import { defineFunction } from "@aws-amplify/backend";

export const logForwarder = defineFunction({
  name: "log-forwarder",
  entry: "./handler.ts",
  environment: {
    // Points at Cowork Local's Bugs Hunter webhook — a Cloudflare tunnel URL
    // like https://<random>.trycloudflare.com/hook/<project_token>. This is
    // the ONLY thing that needs updating between demo sessions (the tunnel
    // URL changes every time the desktop app restarts) — see docs/DEPLOY.md.
    COWORK_WEBHOOK_URL: process.env.COWORK_WEBHOOK_URL ?? "",
  },
});
