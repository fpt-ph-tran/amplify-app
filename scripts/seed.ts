/**
 * Seeds the catalog with demo products. Runs automatically at the end of every
 * Amplify backend build (see `amplify.yml`), and can be run by hand after a
 * sandbox:
 *
 *   npx tsx scripts/seed.ts
 *
 * Requires the REAL `amplify_outputs.json` — `ampx sandbox` and
 * `ampx pipeline-deploy` both write it; the copy committed to git is a
 * placeholder so local builds typecheck.
 *
 * Idempotent on purpose: it runs on every deploy, so it must not pile up a
 * second set of products each time. Set SEED_FORCE=true to add another batch
 * anyway.
 */
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient<Schema>();

const ADJECTIVES = ["Cozy", "Rustic", "Modern", "Vintage", "Compact", "Deluxe", "Classic", "Minimal"];
const NOUNS = [
  "Desk Lamp", "Ceramic Mug", "Backpack", "Wireless Mouse", "Notebook", "Water Bottle",
  "Bluetooth Speaker", "Desk Organizer", "Throw Pillow", "Wall Clock", "Plant Pot",
  "Phone Stand", "Yoga Mat", "Travel Mug", "Bookend Set", "Candle",
];

function randomPrice(): number {
  return Math.round((5 + Math.random() * 95) * 100) / 100;
}

/** Cheap "is the catalog already populated?" probe — one item is enough. */
async function catalogIsEmpty(): Promise<boolean> {
  const { data, errors } = await client.models.Product.list({ limit: 1 });
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join("; "));
  }
  return (data?.length ?? 0) === 0;
}

async function main() {
  const force = process.env.SEED_FORCE === "true";

  if (!force && !(await catalogIsEmpty())) {
    console.log("Catalog already has products — skipping seed. (SEED_FORCE=true to add more.)");
    return;
  }

  console.log("Seeding QuickCart products + ratings…");
  let created = 0;
  for (const noun of NOUNS) {
    for (const adjective of ADJECTIVES.slice(0, 2)) {
      const name = `${adjective} ${noun}`;
      const price = randomPrice();
      const stock = Math.random() < 0.15 ? 1 : Math.floor(5 + Math.random() * 40); // some low-stock items for Bug #1 demos
      const { data: product, errors } = await client.models.Product.create({
        name,
        description: `A ${adjective.toLowerCase()} ${noun.toLowerCase()} for everyday use.`,
        price,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/400/300`,
        stock,
      });
      if (errors?.length || !product) {
        console.error(`Failed to create "${name}":`, errors);
        continue;
      }
      await client.models.Rating.create({
        productId: product.id,
        value: Math.round((3 + Math.random() * 2) * 10) / 10,
        count: Math.floor(Math.random() * 250),
      });
      created += 1;
    }
  }
  console.log(`Seeded ${created} products (+ matching ratings).`);
}

main().catch((err) => {
  // Deliberately exit 0: this runs inside the deploy, and an empty catalog is
  // not a reason to fail a build that otherwise shipped a working backend.
  // The message is loud so it is obvious in the build log.
  console.error("!!! SEED FAILED — the backend deployed fine, but the catalog was not populated.");
  console.error(err);
  console.error("!!! Re-run manually with: npx tsx scripts/seed.ts");
});
