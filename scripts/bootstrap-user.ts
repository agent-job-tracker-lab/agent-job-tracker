import "dotenv/config";

import { createAuth } from "../src/lib/auth";
import { prisma } from "../src/lib/db";

async function main() {
  const email = process.env.BOOTSTRAP_USER_EMAIL;
  const name = process.env.BOOTSTRAP_USER_NAME;
  const password = process.env.BOOTSTRAP_USER_PASSWORD;

  if (!email || !name || !password) {
    throw new Error(
      "BOOTSTRAP_USER_EMAIL, BOOTSTRAP_USER_NAME and BOOTSTRAP_USER_PASSWORD are required",
    );
  }

  const userCount = await prisma.user.count();

  if (userCount > 0) {
    throw new Error(
      "Bootstrap stopped because a user already exists. Existing users are not overwritten.",
    );
  }

  const bootstrapAuth = createAuth({ allowSignUp: true });

  await bootstrapAuth.api.signUpEmail({
    body: {
      email,
      name,
      password,
    },
  });

  console.info("Initial user was created successfully.");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
