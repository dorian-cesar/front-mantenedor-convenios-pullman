"use client"
import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, SearchIcon, XIcon, RefreshCcw } from "lucide-react"

interface PageHeaderProps {
    title: string
    description?: string
    actionButtons?: Array<{
        label: string
        onClick: () => void
        variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
        icon?: ReactNode
    }>
    actionMenu?: {
        title: string;
        items: Array<{
            label: string
            onClick: () => void
            icon?: ReactNode
        }>
    }
    showSearch?: boolean
    searchValue?: string
    onSearchChange?: (value: string) => void
    onSearchClear?: () => void
    filters?: ReactNode
    showPagination?: boolean
    paginationComponent?: ReactNode
    showRefreshButton?: boolean
    onRefresh?: () => void
    children?: ReactNode
}

export function PageHeader({
    title,
    description,
    actionButtons,
    actionMenu,
    showSearch = false,
    searchValue,
    onSearchChange,
    onSearchClear,
    filters,
    showPagination = false,
    paginationComponent,
    showRefreshButton = false,
    onRefresh,
    children
}: PageHeaderProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold tracking-tight text-foreground">{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
                {(actionButtons || actionMenu) && (
                    <CardAction className="pt-2">
                        <div className="flex flex-wrap items-center gap-2">

                            {actionButtons?.map((button, index) => (
                                <Button
                                    key={index}
                                    variant={button.variant || "default"}
                                    onClick={button.onClick}
                                >
                                    {button.icon && <span className="mr-2">{button.icon}</span>}
                                    {button.label}
                                </Button>
                            ))}

                            {actionMenu && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="gap-2">
                                            {actionMenu.title}
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end">
                                        {actionMenu.items.map((item, index) => (
                                            <DropdownMenuItem key={index} onClick={item.onClick}>
                                                {item.icon && <span className="mr-2">{item.icon}</span>}
                                                {item.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                        </div>
                    </CardAction>
                )}

            </CardHeader>

            {(showSearch || filters || children) && (
                <CardContent className="space-y-4">
                    {showSearch && (
                        <div className="flex items-center space-x-2 max-w-md w-full">
                            <div className="relative flex-1">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Buscar..."
                                    type="search"
                                    value={searchValue}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    className="pl-10 pr-10 h-10 w-full"
                                />
                                {searchValue && onSearchClear && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onSearchClear();
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {filters && (
                        <div className="flex flex-wrap gap-4">
                            {filters}
                        </div>
                    )}

                    {children}
                </CardContent>
            )}

            <CardFooter>
                {showPagination && paginationComponent && (
                    <div className="w-full">
                        {paginationComponent}
                    </div>
                )}
                {showRefreshButton && (
                    <div>
                        <Button variant="outline" className="ml-2" onClick={onRefresh}>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Actualizar
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}