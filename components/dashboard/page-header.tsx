"use client"
import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "@/components/ui/card"
import { SearchIcon, XIcon } from "lucide-react"

interface PageHeaderProps {
    title: string
    description?: string
    actionButtons?: Array<{
        label: string
        onClick: () => void
        variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
        icon?: ReactNode
    }>
    showSearch?: boolean
    searchValue?: string
    onSearchChange?: (value: string) => void
    onSearchClear?: () => void
    filters?: ReactNode
    showPagination?: boolean
    paginationComponent?: ReactNode
    children?: ReactNode
}

export function PageHeader({
    title,
    description,
    actionButtons,
    showSearch = false,
    searchValue,
    onSearchChange,
    onSearchClear,
    filters,
    showPagination = false,
    paginationComponent,
    children
}: PageHeaderProps) {
    return (
        <Card>
            <CardHeader>
                    <CardTitle className="text-3xl">{title}</CardTitle>
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                    {actionButtons && actionButtons.length > 0 && (
                        <CardAction className="pt-2">
                            <div className="flex flex-wrap gap-2">
                                {actionButtons.map((button, index) => (
                                    <Button
                                        key={index}
                                        variant={button.variant || "default"}
                                        onClick={button.onClick}
                                    >
                                        {button.icon && <span className="mr-2">{button.icon}</span>}
                                        {button.label}
                                    </Button>
                                ))}
                            </div>
                        </CardAction>
                    )}
            </CardHeader>

            {(showSearch || filters || children) && (
                <CardContent className="space-y-4">
                    {showSearch && (
                        <div className="flex items-center space-x-2 max-w-md">
                            <div className="relative flex-1">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Buscar..."
                                    value={searchValue}
                                    onChange={(e) => onSearchChange?.(e.target.value)}
                                    className="pl-10 pr-10"
                                />
                                {searchValue && onSearchClear && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                                        onClick={onSearchClear}
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <Button type="submit">Buscar</Button>
                        </div>
                    )}

                    {filters && (
                        <div className="flex flex-wrap gap-2">
                            {filters}
                        </div>
                    )}

                    {children}
                </CardContent>
            )}

            {showPagination && paginationComponent && (
                <CardFooter>
                    {paginationComponent}
                </CardFooter>
            )}
        </Card>
    )
}