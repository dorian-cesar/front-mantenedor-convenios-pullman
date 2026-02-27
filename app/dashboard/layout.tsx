import type { Metadata } from "next";
import DashboardLayoutClient from "./layout-client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Administración - Convenios",
};

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        redirect("/");
    }

    return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}