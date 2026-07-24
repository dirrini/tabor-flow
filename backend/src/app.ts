import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import {
  createIntegrationToken,
  hashApiKey
} from "./lib/auth";
import {
  handleAsaasWebhook
} from "./lib/asaas";

export const app = express();

const corsOrigin = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: corsOrigin || true
  })
);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false
  })
);

app.post(
  "/webhooks/asaas",
  handleAsaasWebhook
);

app.post(
  "/api/token",
  async (req, res) => {
    const grantType =
      req.body?.grant_type;
    const clientId =
      req.body?.client_id;
    const clientSecret =
      req.body?.client_secret;

    if (grantType !== "client_credentials") {
      res.status(400).json({
        error:
          "unsupported_grant_type"
      });
      return;
    }

    if (
      typeof clientId !== "string" ||
      !clientId ||
      typeof clientSecret !== "string" ||
      !clientSecret
    ) {
      res.status(401).json({
        error: "invalid_client"
      });
      return;
    }

    const integrationClient =
      await prisma.integrationClient.findUnique({
        where: {
          clientId
        }
      });

    if (
      !integrationClient?.isActive ||
      integrationClient.keyHash !==
        hashApiKey(clientSecret)
    ) {
      res.status(401).json({
        error: "invalid_client"
      });
      return;
    }

    await prisma.integrationClient.update({
      where: {
        id: integrationClient.id
      },
      data: {
        lastUsedAt: new Date()
      }
    });

    res.json(
      createIntegrationToken({
        integrationClientId:
          integrationClient.id,
        scopes:
          integrationClient.scopes,
        type: "integration"
      })
    );
  }
);

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});
