import type { Metadata } from "next";
import DashboardLayoutClient from "./layout-client";

export const metadata: Metadata = {
    title: "Administración - Convenios",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
