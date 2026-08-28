import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { admins } from "./schema";
import type { Credentials } from "./models";

export const getAdmins = async () => db.select().from(admins).all();

export const verify_admin = async (name: string, password: string): Promise<Credentials | null> => {
    const [admin] = await db.select().from(admins).where(eq(admins.name, name)).limit(1);
    if (!admin) return null;
    const ok = await bcrypt.compare(password, admin.password);
    return ok ? { id: admin.id, name: admin.name } : null;
};