import { executeQuery } from "./connection";

interface User {
    name: string;
    password: string;
    id: number;
}

export const getAdmins = async () => executeQuery<User>("SELECT * FROM admins");