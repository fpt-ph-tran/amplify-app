"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

export const client = generateClient<Schema>();

/**
 * Custom operations declared with `a.json()` map to AppSync's AWSJSON scalar,
 * which comes back over the wire as a JSON-encoded STRING — reading `.items`
 * off it silently yields undefined rather than throwing, which is why an empty
 * catalog looked like an empty database. Parse it before use.
 */
/**
 * Puts the catalogue back to a sellable state. Demo runs deliberately drive
 * stock negative, so without this the shop is unusable after a session and the
 * only way back is editing rows by hand.
 *
 * Restores the same distribution the initial seed uses — mostly healthy stock
 * with a few single-unit products, which are what make a race on the last unit
 * demonstrable.
 */
export async function restockCatalog(): Promise<{ restocked: number; failed: number }> {
  const res = await client.models.Product.list({ limit: 1000 });
  const products = res.data ?? [];
  let restocked = 0;
  let failed = 0;
  for (const p of products) {
    const stock = Math.random() < 0.15 ? 1 : Math.floor(5 + Math.random() * 40);
    const { errors } = await client.models.Product.update({ id: p.id, stock });
    if (errors?.length) failed += 1;
    else restocked += 1;
  }
  return { restocked, failed };
}

export interface CheckoutInput {
  sessionId: string;
  items: { productId: string; quantity: number }[];
  couponCode?: string;
  idempotencyKey?: string;
  simulateSlowShipping?: boolean;
  simulateExpiredToken?: boolean;
}

/**
 * `items` is declared `a.json()`, which becomes an AWSJSON argument — and
 * AWSJSON travels as a JSON-ENCODED STRING. Passing the array raw makes
 * AppSync reject the whole request with "Variable 'items' has an invalid
 * value" before the Lambda is ever invoked, so nothing shows up in its logs
 * and the failure looks like the backend is down. Always go through here.
 */
export function checkoutMutation(input: CheckoutInput) {
  return client.mutations.checkout({
    ...input,
    items: JSON.stringify(input.items),
  });
}

export function parseJson<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/** A stable per-browser "session id" standing in for real auth — good enough
 * for a demo cart/checkout flow without wiring up a full login UI. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const key = "quickcart_session_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

const CART_KEY = "quickcart_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function setCart(items: CartItem[]): void {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("quickcart:cart-changed"));
}

export function addToCart(item: CartItem): void {
  const cart = getCart();
  const existing = cart.find((i) => i.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  setCart(cart);
}
