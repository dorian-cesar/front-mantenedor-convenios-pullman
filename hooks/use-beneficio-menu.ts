import { useEffect, useState } from 'react'
import { ConveniosService, type Convenio } from '@/services/convenio.service'

export interface EmpresaBeneficioMenu {
    id: number
    nombre: string
    convenios: {
        id: number
        nombre: string
    }[]
}

/**
 * Fetches all "beneficio" convenios and groups them by empresa
 * for building the dynamic sidebar menu.
 */
export function useBeneficioMenu() {
    const [empresas, setEmpresas] = useState<EmpresaBeneficioMenu[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const res = await ConveniosService.getConvenios({
                    beneficio: true,
                    status: 'ACTIVO',
                    limit: 500,
                })
                console.log('[useBeneficioMenu] API Response:', res)

                const rows: Convenio[] = (res.rows || []).filter(c => c.beneficio === true)
                console.log('[useBeneficioMenu] Filtered convenios array:', rows)

                // Group convenios by empresa
                const map = new Map<number, EmpresaBeneficioMenu>()

                rows.forEach((convenio) => {
                    const empresaId = convenio.empresa_id
                    const empresaNombre = convenio.empresa_nombre || 'Sin Empresa'
                    if (!empresaId) return

                    if (!map.has(empresaId)) {
                        map.set(empresaId, {
                            id: empresaId,
                            nombre: empresaNombre,
                            convenios: [],
                        })
                    }

                    map.get(empresaId)!.convenios.push({
                        id: convenio.id,
                        nombre: convenio.nombre,
                    })
                })

                // Sort empresas alphabetically
                const sorted = Array.from(map.values()).sort((a, b) =>
                    a.nombre.localeCompare(b.nombre)
                )

                setEmpresas(sorted)
            } catch (err) {
                console.error('[useBeneficioMenu] Error fetching beneficio convenios:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    return { empresas, isLoading }
}
