export default async function DashboardPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[140px] gap-4">
            
            {/* KPI principal */}
            <div className="md:col-span-2 row-span-2 rounded-2xl bg-zinc-900 p-6 flex flex-col justify-between">
                <div>
                    <p className="text-sm text-zinc-400">Balance Total</p>
                    <h2 className="text-3xl font-bold text-white mt-2">$12.450.000</h2>
                </div>
                <span className="text-sm text-emerald-400">▲ +8.2% este mes</span>
            </div>

            {/* KPI */}
            <div className="rounded-2xl bg-zinc-900 p-5 flex flex-col justify-between">
                <p className="text-sm text-zinc-400">Ingresos</p>
                <h3 className="text-xl font-semibold text-white">$3.200.000</h3>
                <span className="text-xs text-emerald-400">▲ +12%</span>
            </div>

            {/* KPI */}
            <div className="rounded-2xl bg-zinc-900 p-5 flex flex-col justify-between">
                <p className="text-sm text-zinc-400">Gastos</p>
                <h3 className="text-xl font-semibold text-white">$1.850.000</h3>
                <span className="text-xs text-red-400">▼ −4%</span>
            </div>

            {/* KPI ancho */}
            <div className="md:col-span-2 rounded-2xl bg-zinc-900 p-5 flex flex-col justify-between">
                <p className="text-sm text-zinc-400">Ahorro Mensual</p>
                <h3 className="text-2xl font-semibold text-white">$1.350.000</h3>
                <span className="text-xs text-emerald-400">Objetivo alcanzado 🎯</span>
            </div>

            {/* KPI pequeño */}
            <div className="rounded-2xl bg-zinc-900 p-5 flex flex-col justify-between">
                <p className="text-sm text-zinc-400">Cuentas</p>
                <h3 className="text-xl font-semibold text-white">7</h3>
                <span className="text-xs text-zinc-400">Activas</span>
            </div>

            {/* KPI pequeño */}
            <div className="rounded-2xl bg-zinc-900 p-5 flex flex-col justify-between">
                <p className="text-sm text-zinc-400">Tarjetas</p>
                <h3 className="text-xl font-semibold text-white">3</h3>
                <span className="text-xs text-zinc-400">En uso</span>
            </div>

        </div>
    );
}
