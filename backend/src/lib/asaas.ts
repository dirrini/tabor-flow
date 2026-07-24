import {
  randomUUID,
  timingSafeEqual
} from "node:crypto";
import type {
  Request,
  Response
} from "express";
import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";

export type BillingCycle =
  | "MONTHLY"
  | "YEARLY";

function extendPremiumPeriod(
  currentExpiration: Date | null,
  billingCycle: BillingCycle
) {
  const now = new Date();
  const expiration =
    currentExpiration &&
    currentExpiration > now
      ? new Date(currentExpiration)
      : now;

  if (billingCycle === "YEARLY") {
    expiration.setUTCFullYear(
      expiration.getUTCFullYear() + 1
    );
  } else {
    expiration.setUTCMonth(
      expiration.getUTCMonth() + 1
    );
  }

  return expiration;
}

type CheckoutResponse = {
  id?: string;
  link?: string;
  status?: string;
};

type PaymentResponse = {
  id?: string;
  status?: string;
  invoiceUrl?: string;
};

type PixQrCodeResponse = {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
};

type AsaasWebhook = {
  id?: string;
  event?: string;
  checkout?: {
    id?: string;
    status?: string;
  };
  payment?: {
    id?: string;
    status?: string;
  };
};

function requiredEnvironment(
  name: string
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is required for Asaas billing.`
    );
  }

  return value;
}

function priceForCycle(
  billingCycle: BillingCycle
) {
  const variable =
    billingCycle === "MONTHLY"
      ? "PREMIUM_MONTHLY_PRICE"
      : "PREMIUM_ANNUAL_PRICE";
  const value = Number(
    requiredEnvironment(variable)
  );

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      `${variable} must be a positive number.`
    );
  }

  return value;
}

function safeTokenMatches(
  received: string | undefined,
  expected: string
) {
  if (!received) return false;

  const receivedBuffer =
    Buffer.from(received);
  const expectedBuffer =
    Buffer.from(expected);

  return (
    receivedBuffer.length ===
      expectedBuffer.length &&
    timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    )
  );
}

function asaasConfiguration() {
  return {
    apiKey:
      requiredEnvironment("ASAAS_API_KEY"),
    apiUrl: (
      process.env.ASAAS_API_URL?.trim() ||
      "https://api-sandbox.asaas.com/v3"
    ).replace(/\/$/, "")
  };
}

async function asaasRequest<T>(
  path: string,
  init?: RequestInit
) {
  const { apiKey, apiUrl } =
    asaasConfiguration();
  const response = await fetch(
    `${apiUrl}${path}`,
    {
      ...init,
      headers: {
        accept: "application/json",
        access_token: apiKey,
        ...(init?.body
          ? {
              "Content-Type":
                "application/json"
            }
          : {}),
        ...init?.headers
      }
    }
  );
  const body = await response.json() as
    T & {
      errors?: Array<{
        description?: string;
      }>;
    };

  if (!response.ok) {
    const description = body.errors
      ?.map((error) =>
        error.description
      )
      .filter(Boolean)
      .join("; ");

    throw new Error(
      description ||
      `Asaas request failed with status ${response.status}.`
    );
  }

  return body;
}

async function applyCheckoutEntitlement(
  transaction: Prisma.TransactionClient,
  checkout: {
    id: number;
    tenantId: number;
    billingCycle: string;
    entitlementAppliedAt: Date | null;
  }
) {
  if (checkout.entitlementAppliedAt) {
    return;
  }

  const tenant =
    await transaction.tenant.findUnique({
      where: {
        id: checkout.tenantId
      },
      select: {
        premiumExpiresAt: true
      }
    });

  await transaction.tenant.update({
    where: {
      id: checkout.tenantId
    },
    data: {
      plan: "PREMIUM",
      subscriptionStatus: "ACTIVE",
      premiumExpiresAt:
        extendPremiumPeriod(
          tenant?.premiumExpiresAt ?? null,
          checkout.billingCycle as
            BillingCycle
        )
    }
  });
  await transaction.billingCheckout.update({
    where: {
      id: checkout.id
    },
    data: {
      status: "PAID",
      entitlementAppliedAt: new Date()
    }
  });
}

export async function createAsaasCheckout(input: {
  tenantId: number;
  billingCycle: BillingCycle;
}) {
  const recentCheckout =
    await prisma.billingCheckout.findFirst({
      where: {
        tenantId: input.tenantId,
        billingCycle:
          input.billingCycle,
        paymentMethod: "CARD",
        status: "ACTIVE",
        createdAt: {
          gte: new Date(
            Date.now() -
              55 * 60 * 1000
          )
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

  if (recentCheckout) {
    return {
      id: recentCheckout.asaasCheckoutId,
      url: recentCheckout.checkoutUrl
    };
  }

  const apiKey =
    requiredEnvironment("ASAAS_API_KEY");
  const apiUrl = (
    process.env.ASAAS_API_URL?.trim() ||
    "https://api-sandbox.asaas.com/v3"
  ).replace(/\/$/, "");
  const appUrl =
    requiredEnvironment("APP_URL")
      .replace(/\/$/, "");
  const amount =
    priceForCycle(input.billingCycle);
  const externalReference =
    `taborflow-${input.tenantId}-${randomUUID()}`;
  const callbackBase =
    `${appUrl}/app/workspace`;

  const response = await fetch(
    `${apiUrl}/checkouts`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        access_token: apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        billingTypes: [
          "CREDIT_CARD"
        ],
        chargeTypes: [
          "DETACHED"
        ],
        minutesToExpire: 60,
        externalReference,
        callback: {
          successUrl:
            `${callbackBase}?checkout=success`,
          cancelUrl:
            `${callbackBase}?checkout=cancel`,
          expiredUrl:
            `${callbackBase}?checkout=expired`
        },
        items: [
          {
            externalReference:
              `premium-${input.billingCycle.toLowerCase()}`,
            name: "TaborFlow Premium",
            description:
              input.billingCycle === "MONTHLY"
                ? "Assinatura mensal do TaborFlow Premium"
                : "Assinatura anual do TaborFlow Premium",
            quantity: 1,
            value: amount
          }
        ]
      })
    }
  );

  const responseBody =
    await response.json() as
      CheckoutResponse & {
        errors?: Array<{
          description?: string;
        }>;
      };

  if (
    !response.ok ||
    !responseBody.id ||
    !responseBody.link
  ) {
    const description =
      responseBody.errors
        ?.map((error) =>
          error.description
        )
        .filter(Boolean)
        .join("; ");

    throw new Error(
      description ||
      `Asaas checkout failed with status ${response.status}.`
    );
  }

  await prisma.billingCheckout.create({
    data: {
      tenantId: input.tenantId,
      asaasCheckoutId:
        responseBody.id,
      externalReference,
      billingCycle:
        input.billingCycle,
      amount,
      paymentMethod: "CARD",
      status:
        responseBody.status ||
        "ACTIVE",
      checkoutUrl:
        responseBody.link
    }
  });

  return {
    id: responseBody.id,
    url: responseBody.link
  };
}

export async function createAsaasPixPayment(
  input: {
    tenantId: number;
    customerName: string;
    customerEmail: string;
    cpfCnpj: string;
    billingCycle: BillingCycle;
  }
) {
  const tenant =
    await prisma.tenant.findUnique({
      where: {
        id: input.tenantId
      },
      select: {
        asaasCustomerId: true
      }
    });

  if (!tenant) {
    throw new Error(
      "Workspace not found."
    );
  }

  let customerId =
    tenant.asaasCustomerId;

  if (!customerId) {
    const customer =
      await asaasRequest<{
        id?: string;
      }>("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: input.customerName,
          cpfCnpj: input.cpfCnpj,
          email: input.customerEmail,
          externalReference:
            `taborflow-tenant-${input.tenantId}`,
          notificationDisabled: true
        })
      });

    if (!customer.id) {
      throw new Error(
        "Asaas did not return a customer id."
      );
    }

    customerId = customer.id;
    await prisma.tenant.update({
      where: {
        id: input.tenantId
      },
      data: {
        asaasCustomerId: customerId
      }
    });
  }

  const amount =
    priceForCycle(input.billingCycle);
  const externalReference =
    `taborflow-${input.tenantId}-${randomUUID()}`;
  const dueDate =
    new Date().toISOString().slice(0, 10);
  const payment =
    await asaasRequest<PaymentResponse>(
      "/payments",
      {
        method: "POST",
        body: JSON.stringify({
          customer: customerId,
          billingType: "PIX",
          value: amount,
          dueDate,
          description:
            input.billingCycle === "MONTHLY"
              ? "TaborFlow Premium - 1 mês"
              : "TaborFlow Premium - 1 ano",
          externalReference
        })
      }
    );

  if (!payment.id) {
    throw new Error(
      "Asaas did not return a payment id."
    );
  }

  const qrCode =
    await asaasRequest<PixQrCodeResponse>(
      `/payments/${encodeURIComponent(
        payment.id
      )}/pixQrCode`
    );

  if (
    !qrCode.encodedImage ||
    !qrCode.payload
  ) {
    throw new Error(
      "Asaas did not return Pix QR Code data."
    );
  }

  await prisma.billingCheckout.create({
    data: {
      tenantId: input.tenantId,
      asaasCheckoutId: payment.id,
      externalReference,
      billingCycle:
        input.billingCycle,
      amount,
      paymentMethod: "PIX",
      status:
        payment.status || "PENDING",
      checkoutUrl:
        payment.invoiceUrl || ""
    }
  });

  return {
    id: payment.id,
    encodedImage:
      qrCode.encodedImage,
    payload: qrCode.payload,
    expirationDate:
      qrCode.expirationDate ?? null,
    status:
      payment.status || "PENDING"
  };
}

export async function getAsaasPaymentStatus(
  tenantId: number,
  paymentId: string
) {
  const checkout =
    await prisma.billingCheckout.findFirst({
      where: {
        tenantId,
        asaasCheckoutId: paymentId,
        paymentMethod: "PIX"
      }
    });

  if (!checkout) {
    throw new Error(
      "Payment not found."
    );
  }

  const payment =
    await asaasRequest<PaymentResponse>(
      `/payments/${encodeURIComponent(
        paymentId
      )}`
    );
  const paid =
    payment.status === "RECEIVED";

  if (
    paid &&
    !checkout.entitlementAppliedAt
  ) {
    await prisma.$transaction(
      async (transaction) => {
        const current =
          await transaction
            .billingCheckout
            .findUnique({
              where: {
                id: checkout.id
              }
            });

        if (current) {
          await applyCheckoutEntitlement(
            transaction,
            current
          );
        }
      }
    );
  } else if (payment.status) {
    await prisma.billingCheckout.update({
      where: {
        id: checkout.id
      },
      data: {
        status: payment.status
      }
    });
  }

  return {
    id: paymentId,
    status:
      paid ? "PAID" : payment.status ||
        checkout.status,
    paid
  };
}

export async function handleAsaasWebhook(
  req: Request,
  res: Response
) {
  const expectedToken =
    process.env.ASAAS_WEBHOOK_TOKEN
      ?.trim();

  if (
    !expectedToken ||
    !safeTokenMatches(
      req.header(
        "asaas-access-token"
      ),
      expectedToken
    )
  ) {
    res.status(401).json({
      error: "invalid_webhook_token"
    });
    return;
  }

  const payload =
    req.body as AsaasWebhook;
  const eventId = payload.id;
  const eventType = payload.event;
  const resourceId =
    payload.checkout?.id ||
    payload.payment?.id;

  if (
    !eventId ||
    !eventType ||
    !resourceId
  ) {
    res.status(400).json({
      error: "invalid_webhook_payload"
    });
    return;
  }

  try {
    await prisma.$transaction(
      async (transaction) => {
        await transaction
          .billingWebhookEvent
          .create({
            data: {
              id: eventId,
              eventType
            }
          });

        const checkout =
          await transaction
            .billingCheckout
            .findUnique({
              where: {
                asaasCheckoutId:
                  resourceId
              }
            });

        if (!checkout) return;

        const checkoutStatus =
          eventType === "CHECKOUT_PAID" ||
          eventType === "PAYMENT_RECEIVED"
            ? "PAID"
            : eventType ===
                "CHECKOUT_CANCELED"
              ? "CANCELED"
              : eventType ===
                  "CHECKOUT_EXPIRED" ||
                  eventType ===
                    "PAYMENT_OVERDUE"
                ? "EXPIRED"
                : payload.checkout
                    ?.status ||
                  payload.payment
                    ?.status ||
                  checkout.status;

        await transaction
          .billingCheckout.update({
            where: {
              id: checkout.id
            },
            data: {
              status: checkoutStatus
            }
          });

        if (
          eventType ===
            "CHECKOUT_PAID" ||
          eventType ===
            "PAYMENT_RECEIVED"
        ) {
          await applyCheckoutEntitlement(
            transaction,
            checkout
          );
        }
      }
    );
  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(200).json({
        received: true,
        duplicate: true
      });
      return;
    }

    console.error(
      "Unable to process Asaas webhook.",
      error
    );
    res.status(500).json({
      error:
        "webhook_processing_failed"
    });
    return;
  }

  res.status(200).json({
    received: true
  });
}
