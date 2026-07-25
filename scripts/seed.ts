/**
 * One-time seed script — run AFTER a real deploy/sandbox (`amplify_outputs.json`
 * must be the real generated one, not the build-time placeholder).
 *
 *   npx tsx scripts/seed.ts
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

async function main() {
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
  console.error(err);
  process.exit(1);
});
