import { NextResponse } from "next/server";

type City = {
    id: number;
    name: string;
    origin_count: number;
    destination_count: number;
};

const normalizeText = (text: string): string => {
    if (!text) return "";
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get("q") || "";

        const apiKey = process.env.NEXT_PUBLIC_KUPOS_API_KEY_PROD;
        const URL_KUPOS = process.env.NEXT_PUBLIC_URL_KUPOS_PROD;

        if (!apiKey || !URL_KUPOS) {
            return NextResponse.json(
                { error: "KUPOS API no configurada" },
                { status: 500 },
            );
        }

        const res = await fetch(`${URL_KUPOS}/cities.json?api_key=${apiKey}`, {
            cache: "no-cache",
        });

        const data = await res.json();
        const [, ...rows] = data.result;

        let cities: City[] = rows.map((row: any[]) => ({
            id: row[0],
            name: row[1],
            origin_count: row[2],
            destination_count: row[3],
        }));

        cities = cities.filter(
            (c) => !c.name.toLowerCase().includes("hackedbykode"),
        );

        if (searchQuery) {
            const normalizedSearch = normalizeText(searchQuery);
            cities = cities.filter((city) =>
                normalizeText(city.name).includes(normalizedSearch),
            );
        }

        return NextResponse.json({ cities });
    } catch (error) {
        console.error("Kupos error:", error);
        return NextResponse.json(
            { error: "Error al obtener ciudades" },
            { status: 500 },
        );
    }
}
