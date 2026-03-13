import useSWR from 'swr';
import { ConveniosService } from '@/services/convenio.service';

export function useConvenios() {
    const { data: response, error, isLoading } = useSWR(
        ['convenios', 'list-all'],
        () => ConveniosService.getConvenios({ limit: 1000 }), // Fetch a large enough number to get most convenios
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // 1 minute
        }
    );

    const convenios = response?.rows || [];
    
    const convenioMap = convenios.reduce((acc, convenio) => {
        acc[convenio.id] = convenio.nombre;
        return acc;
    }, {} as Record<number, string>);

    return {
        convenios,
        convenioMap,
        isLoading,
        error
    };
}
