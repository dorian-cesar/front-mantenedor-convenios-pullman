"use client"

import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
} from "@/components/ui/combobox"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item"

import { NAVIGATION } from "@/constants/navigation"

type SearchItem = {
    label: string
    description?: string
    href: string
    group: string
}

export function GlobalSearch() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")

    // Adaptar NAVIGATION → SearchItem
    const navigation: SearchItem[] = useMemo(
        () =>
            NAVIGATION.map((item) => ({
                label: item.title,
                description: item.description,
                href: item.href,
                group: item.group,
            })),
        []
    )

    // Agrupar por grupo
    const groupedItems = useMemo(() => {
        return navigation.reduce((acc, item) => {
            if (!acc[item.group]) acc[item.group] = []
            acc[item.group].push(item)
            return acc
        }, {} as Record<string, SearchItem[]>)
    }, [navigation])

    // Filtrar según input
    const filteredItems = useMemo(() => {
        return Object.entries(groupedItems).reduce((acc, [group, items]) => {
            const filtered = items.filter(
                (item) =>
                    item.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                    item.description?.toLowerCase().includes(inputValue.toLowerCase()) ||
                    item.group.toLowerCase().includes(inputValue.toLowerCase())
            )

            if (filtered.length > 0) acc[group] = filtered
            return acc
        }, {} as Record<string, SearchItem[]>)
    }, [groupedItems, inputValue])

    const handleSelect = (item: SearchItem | null) => {
        if (item?.href) {
            router.push(item.href)
            setOpen(false)
            setInputValue("")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim()) {
            const firstMatch = navigation.find((item) =>
                item.label.toLowerCase().includes(inputValue.toLowerCase())
            )

            if (firstMatch) handleSelect(firstMatch)
        }
    }

    return (
        <Combobox
            items={navigation}
            itemToStringValue={(item: SearchItem) => item.label}
            onValueChange={handleSelect}
            open={open}
            onOpenChange={setOpen}
        >
            <ComboboxInput
                placeholder="Buscar sección…"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setOpen(true)}
            />

            <ComboboxContent>
                {Object.keys(filteredItems).length === 0 ? (
                    <ComboboxEmpty>No se encontraron resultados</ComboboxEmpty>
                ) : (
                    Object.entries(filteredItems).map(([group, items]) => (
                        <div key={group}>
                            {items.map((item) => (
                                <ComboboxItem
                                    key={item.href}
                                    value={item}
                                    onSelect={() => handleSelect(item)}
                                >
                                    <Item size="sm" className="p-0">
                                        <ItemContent>
                                            <ItemTitle>{item.label}</ItemTitle>
                                            {item.description && (
                                                <ItemDescription>
                                                    {item.description}
                                                </ItemDescription>
                                            )}
                                        </ItemContent>
                                    </Item>
                                </ComboboxItem>
                            ))}
                        </div>
                    ))
                )}
            </ComboboxContent>
        </Combobox>
    )
}
