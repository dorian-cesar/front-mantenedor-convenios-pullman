import { useEffect, useState } from 'react'
import { ConveniosService, type Convenio } from '@/services/convenio.service'

export interface CategoriaBeneficioMenu {
    id: number | string
    nombre: string
    convenios: {
        id: number
        nombre: string
    }[]
}

export interface EmpresaBeneficioMenu {
    id: number
    nombre: string
    categorias: CategoriaBeneficioMenu[]
}

/**
 * Fetches all "beneficio" convenios and groups them by empresa and categoria
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

                const rows: Convenio[] = (res.rows || []).filter(c => c.beneficio === true)

                // Group by empresa and then by categoria
                const map = new Map<number, EmpresaBeneficioMenu>()

                rows.forEach((convenio) => {
                    const empresaId = convenio.empresa_id
                    const empresaNombre = convenio.empresa_nombre || convenio.empresa?.nombre || 'Sin Empresa'
                    if (!empresaId) return

                    if (!map.has(empresaId)) {
                        map.set(empresaId, {
                            id: empresaId,
                            nombre: empresaNombre,
                            categorias: [],
                        })
                    }

                    const empresa = map.get(empresaId)!
                    
                    // Categoria info
                    const catId = convenio.categoria_id || 'sin-categoria'
                    const catNombre = convenio.categoria?.nombre || 'General'

                    let categoria = empresa.categorias.find(c => c.id === catId)
                    
                    if (!categoria) {
                        categoria = {
                            id: catId,
                            nombre: catNombre,
                            convenios: []
                        }
                        empresa.categorias.push(categoria)
                    }

                    categoria.convenios.push({
                        id: convenio.id,
                        nombre: convenio.nombre,
                    })
                })

                // Sort everything
                const sorted = Array.from(map.values()).sort((a, b) =>
                    a.nombre.localeCompare(b.nombre)
                )

                sorted.forEach(emp => {
                    emp.categorias.sort((a, b) => {
                        if (a.id === 'sin-categoria') return 1
                        if (b.id === 'sin-categoria') return -1
                        return a.nombre.localeCompare(b.nombre)
                    })
                })

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
