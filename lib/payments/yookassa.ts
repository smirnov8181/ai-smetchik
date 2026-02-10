/**
 * YooKassa (ЮKassa) payment module
 * API docs: https://yookassa.ru/developers/api
 *
 * Used for RU market payments (Stripe doesn't work in Russia).
 * Creates one-time payments for verification reports (990 RUB).
 */

const YOOKASSA_API_URL = "https://api.yookassa.ru/v3";

interface YooKassaPaymentAmount {
  value: string; // e.g. "990.00"
  currency: "RUB";
}

interface YooKassaConfirmation {
  type: "redirect";
  return_url: string;
  confirmation_url?: string; // returned in response
}

interface YooKassaMetadata {
  verification_id?: string;
  estimate_id?: string;
  payment_type?: "verification" | "estimate";
  user_id: string;
}

export interface YooKassaPayment {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  amount: YooKassaPaymentAmount;
  confirmation?: YooKassaConfirmation;
  metadata?: YooKassaMetadata;
  created_at: string;
  paid: boolean;
  description?: string;
}

export interface CreatePaymentParams {
  amount: number; // in rubles, e.g. 990
  description: string;
  returnUrl: string;
  metadata: YooKassaMetadata;
  idempotencyKey: string;
}

/**
 * Get YooKassa credentials from environment.
 * Throws if not configured.
 */
function getCredentials(): { shopId: string; secretKey: string } {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error(
      "YooKassa credentials not configured. Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY env vars."
    );
  }

  return { shopId, secretKey };
}

/**
 * Make an authenticated request to YooKassa API.
 */
async function yookassaFetch<T>(
  endpoint: string,
  options: {
    method: "GET" | "POST";
    body?: Record<string, unknown>;
    idempotencyKey?: string;
  }
): Promise<T> {
  const { shopId, secretKey } = getCredentials();
  const authHeader = Buffer.from(`${shopId}:${secretKey}`).toString("base64");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Basic ${authHeader}`,
  };

  if (options.idempotencyKey) {
    headers["Idempotence-Key"] = options.idempotencyKey;
  }

  const response = await fetch(`${YOOKASSA_API_URL}${endpoint}`, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `YooKassa API error: ${response.status} ${response.statusText} — ${errorBody}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Create a payment in YooKassa.
 * Returns the payment object with `confirmation.confirmation_url` for redirect.
 */
export async function createPayment(
  params: CreatePaymentParams
): Promise<YooKassaPayment> {
  const payment = await yookassaFetch<YooKassaPayment>("/payments", {
    method: "POST",
    idempotencyKey: params.idempotencyKey,
    body: {
      amount: {
        value: params.amount.toFixed(2),
        currency: "RUB",
      },
      capture: true, // auto-capture, no need for two-step
      confirmation: {
        type: "redirect",
        return_url: params.returnUrl,
      },
      description: params.description,
      metadata: params.metadata,
    },
  });

  return payment;
}

/**
 * Get payment status by ID.
 * Useful for verifying webhook data or checking payment manually.
 */
export async function getPayment(paymentId: string): Promise<YooKassaPayment> {
  return yookassaFetch<YooKassaPayment>(`/payments/${paymentId}`, {
    method: "GET",
  });
}

/**
 * Verify that a webhook notification is legitimate.
 * YooKassa recommends fetching the payment by ID to confirm status,
 * rather than trusting the webhook body directly.
 */
export async function verifyPaymentFromWebhook(
  paymentId: string
): Promise<{ verified: boolean; payment: YooKassaPayment }> {
  const payment = await getPayment(paymentId);
  return {
    verified: payment.status === "succeeded" && payment.paid === true,
    payment,
  };
}
