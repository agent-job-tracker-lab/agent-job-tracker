import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

import { prisma } from "@/lib/db";

type CreateAuthOptions = {
  allowSignUp?: boolean;
};

export function createAuth({ allowSignUp = false }: CreateAuthOptions = {}) {
  return betterAuth({
    appName: "Agent Job Tracker",
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !allowSignUp,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: false,
    },
    rateLimit: {
      storage: "database",
      modelName: "RateLimit",
      customRules: {
        "/sign-in/email": {
          window: 10,
          max: 3,
        },
      },
    },
    user: {
      modelName: "User",
    },
    session: {
      modelName: "Session",
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    account: {
      modelName: "Account",
    },
    verification: {
      modelName: "Verification",
    },
    advanced: {
      database: {
        generateId: false,
        joins: true,
      },
    },
  });
}

export const auth = createAuth();
