// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { Role, Plan } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      plan: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: Role;
    plan: Plan;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    plan: string;
    provider?: string;
  }
}