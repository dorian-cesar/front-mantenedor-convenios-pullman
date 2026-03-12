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

        // Log para depuración en Netlify (aparecerá en Function Logs)
        console.log("Kupos API Configuration:", {
            hasUrl: !!URL_KUPOS,
            url: URL_KUPOS,
            hasKey: !!apiKey,
        });

        if (!apiKey || !URL_KUPOS) {
            console.error("KUPOS API environment variables are missing");
            return NextResponse.json(
                { error: "KUPOS API no configurada", details: "Faltan variables de entorno en el servidor" },
                { status: 500 },
            );
        }

        console.log(`Fetching cities from: ${URL_KUPOS}/cities.json`);

        const res = await fetch(`${URL_KUPOS}/cities.json?api_key=${apiKey}`, {
            cache: "no-store", // Cambiado de no-cache por si acaso
        });

        if (!res.ok) {
            const errorText = await res.text().catch(() => "No error text");
            console.error(`KUPOS API error: ${res.status} ${res.statusText}`, errorText);
            return NextResponse.json(
                { 
                    error: "Error en la respuesta de KUPOS", 
                    status: res.status,
                    statusText: res.statusText,
                    details: errorText.substring(0, 100)
                },
                { status: res.status === 401 ? 401 : 502 },
            );
        }

        const data = await res.json();
        if (!data || !data.result) {
            console.warn("Kupos returned empty result");
            return NextResponse.json({ cities: [] });
        }

        const [, ...rows] = data.result || [];

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
        console.error("Kupos catch-all error:", error);
        return NextResponse.json(
            { 
                error: "Error al obtener ciudades",
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack?.split('\n')[0] : null
            },
            { status: 500 },
        );
    }
}
