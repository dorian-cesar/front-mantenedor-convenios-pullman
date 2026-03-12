"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { useConvenioForm } from "@/hooks/use-convenio-form"
import { Convenio } from "@/services/convenio.service"

interface ConvenioContextType extends ReturnType<typeof useConvenioForm> {
    selectedConvenio: Convenio | null
    setSelectedConvenio: (c: Convenio | null) => void
}

const ConvenioContext = createContext<ConvenioContextType | undefined>(undefined)

export function ConvenioProvider({ children }: { children: ReactNode }) {
    const convenioForm = useConvenioForm()
    const [selectedConvenio, setSelectedConvenio] = useState<Convenio | null>(null)

    return (
        <ConvenioContext.Provider value={{ ...convenioForm, selectedConvenio, setSelectedConvenio }}>
            {children}
        </ConvenioContext.Provider>
    )
}

export function useConvenio() {
    const context = useContext(ConvenioContext)
    if (context === undefined) {
        throw new Error("useConvenio must be used within a ConvenioProvider")
    }
    return context
}
