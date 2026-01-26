import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
    currentPage: number
    totalPages: number
    totalItems: number
    onPageChange: (page: number) => void
    hasPrevPage: boolean
    hasNextPage: boolean
    className?: string
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
    hasPrevPage,
    hasNextPage,
    className = "",
}: PaginationProps) {
    const getPageNumbers = () => {
        const pages = []
        const maxVisible = 5

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            let start = Math.max(1, currentPage - 2)
            let end = Math.min(totalPages, start + maxVisible - 1)

            if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1)
            }

            for (let i = start; i <= end; i++) {
                pages.push(i)
            }
        }

        return pages
    }

    const pageNumbers = getPageNumbers()

    return (
        <div className={`flex items-center justify-between ${className}`}>
            <div className="text-sm text-muted-foreground">
                {totalItems} resultado{totalItems !== 1 ? 's' : ''} • Página {currentPage} de {totalPages}
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    disabled={!hasPrevPage || currentPage === 1}
                    className="h-8 w-8 p-0"
                >
                    <ChevronsLeft className="h-4 w-4" />
                    <span className="sr-only">Primera página</span>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Página anterior</span>
                </Button>

                {pageNumbers.map((pageNum) => (
                    <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className="h-8 w-8 p-0 min-w-8"
                    >
                        {pageNum}
                    </Button>
                ))}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Página siguiente</span>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    disabled={!hasNextPage || currentPage === totalPages}
                    className="h-8 w-8 p-0"
                >
                    <ChevronsRight className="h-4 w-4" />
                    <span className="sr-only">Última página</span>
                </Button>
            </div>
        </div>
    )
}