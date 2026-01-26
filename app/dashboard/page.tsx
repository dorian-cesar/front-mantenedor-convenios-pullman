import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const user = await getSession();

    if (!user) redirect("/");

    return (
        <div>
            <h1>Bienvenido {user.name}</h1>
        </div>
    );
}