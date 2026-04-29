import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pnrNumber = searchParams.get("pnr_number");

        if (!pnrNumber) {
            return NextResponse.json(
                { error: "Se requiere el parámetro pnr_number" },
                { status: 400 },
            );
        }

        const apiKey = process.env.NEXT_PUBLIC_KUPOS_API_KEY_PROD;
        const kuposBaseUrl = "https://gds.kupos.com/gds/api";

        if (!apiKey) {
            console.error("KUPOS API environment variable is missing");
            return NextResponse.json(
                { error: "KUPOS API no configurada", details: "Faltan variables de entorno en el servidor" },
                { status: 500 },
            );
        }

        console.log(`Fetching booking details from Kupos for PNR: ${pnrNumber}`);

        const res = await fetch(`${kuposBaseUrl}/booking_details.json?api_key=${apiKey}&pnr_number=${pnrNumber}`, {
            cache: "no-store",
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
        
        // La API de kupos puede devolver 200 OK pero con un error en el cuerpo si el ticket no es válido
        if (data.response && data.response.code !== 200) {
            return NextResponse.json(
                { error: data.response.message || "Boleto no encontrado o consulta inválida" },
                { status: 404 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Kupos catch-all error:", error);
        return NextResponse.json(
            { 
                error: "Error al obtener detalles del boleto",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
        );
    }
}
