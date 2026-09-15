"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader } from "@/components/dashboard/page-header"
import * as Card from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ConfiguracionService } from "@/services/configuracion.service"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { ImageIcon, UploadIcon, Loader2Icon, SaveIcon, XIcon } from "lucide-react"

export default function AparienciaRegistroPage() {
    const [titulo, setTitulo] = useState<string>("Únete a la red más grande")
    const [texto, setTexto] = useState<string>("Miles de usuarios ya disfrutan de beneficios exclusivos en sus viajes por todo Chile.")
    const [imagenPath, setImagenPath] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user, initialized: authInitialized } = useAuth()

    const isReadOnlyRole = user?.rol?.toUpperCase() === "USUARIO" || user?.rol?.toLowerCase() === "user" || user?.rol?.toUpperCase() === "SISTEMA";

    const fetchConfig = async () => {
        if (!authInitialized) return;
        
        setIsLoading(true)
        try {
            const config = await ConfiguracionService.getParametros()
            if (config.REGISTRO_TITULO) setTitulo(config.REGISTRO_TITULO)
            if (config.REGISTRO_TEXTO) setTexto(config.REGISTRO_TEXTO)
            if (config.REGISTRO_IMAGEN) setImagenPath(config.REGISTRO_IMAGEN)
        } catch (error) {
            console.error('Error fetching config:', error)
            toast.error("No se pudo cargar la configuración")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchConfig()
    }, [authInitialized])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const clearSelectedFile = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleSave = async () => {
        if (!titulo || !texto) {
            toast.error("El título y el texto son obligatorios")
            return
        }

        setIsSaving(true)
        try {
            let finalImagePath = imagenPath

            if (selectedFile) {
                const uploadRes = await ConfiguracionService.uploadImagen(selectedFile)
                finalImagePath = uploadRes.path
                setImagenPath(uploadRes.path)
                clearSelectedFile()
            }

            await ConfiguracionService.updateParametros({
                REGISTRO_TITULO: titulo,
                REGISTRO_TEXTO: texto,
                ...(finalImagePath ? { REGISTRO_IMAGEN: finalImagePath } : {})
            })
            
            toast.success("Apariencia guardada correctamente")
        } catch (error) {
            console.error('Error saving config:', error)
            toast.error("Error al guardar la configuración")
        } finally {
            setIsSaving(false)
        }
    }

    const getDisplayImage = () => {
        if (previewUrl) return previewUrl;
        if (imagenPath) return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${imagenPath}`;
        return null;
    }

    return (
        <div className="flex-1 space-y-6 p-8">
            <PageHeader 
                title="Apariencia Login / Registro" 
                description="Configura el título, texto e imagen del formulario principal del portal."
            />
            
            <Card.Card className="max-w-3xl">
                <Card.CardHeader>
                    <Card.CardTitle>Configuración Visual</Card.CardTitle>
                    <Card.CardDescription>
                        Esta información se mostrará a los usuarios cuando intenten registrarse o iniciar sesión en el portal público.
                    </Card.CardDescription>
                </Card.CardHeader>
                <Card.CardContent className="space-y-6">
                    {isLoading ? (
                        <div className="h-40 flex items-center justify-center">
                            <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="titulo">Título Principal</Label>
                                <Input 
                                    id="titulo"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ej: Únete a la red más grande"
                                    disabled={isReadOnlyRole}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="texto">Texto Descriptivo</Label>
                                <Textarea 
                                    id="texto"
                                    value={texto}
                                    onChange={(e) => setTexto(e.target.value)}
                                    placeholder="Ej: Miles de usuarios ya disfrutan de beneficios exclusivos..."
                                    disabled={isReadOnlyRole}
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Imagen Decorativa (Banner lateral)</Label>
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="flex items-center gap-4">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isReadOnlyRole}
                                                type="button"
                                            >
                                                <UploadIcon className="mr-2 h-4 w-4" />
                                                Seleccionar Imagen
                                            </Button>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            {selectedFile && (
                                                <Button variant="ghost" size="sm" onClick={clearSelectedFile} type="button">
                                                    <XIcon className="mr-2 h-4 w-4" />
                                                    Quitar Selección
                                                </Button>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Formato recomendado: JPG, PNG o WebP. Se mostrará recortada a la izquierda del formulario.
                                        </div>
                                    </div>
                                    
                                    <div className="w-full sm:w-64 h-64 border rounded-xl overflow-hidden bg-muted flex items-center justify-center relative flex-shrink-0">
                                        {getDisplayImage() ? (
                                            <img 
                                                src={getDisplayImage()!} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover object-bottom"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                                                <span className="text-sm">Sin imagen</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Card.CardContent>
                <Card.CardFooter className="flex justify-end border-t p-6">
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving || isReadOnlyRole || isLoading}
                        className="w-full sm:w-auto"
                    >
                        {isSaving ? (
                            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <SaveIcon className="mr-2 h-4 w-4" />
                        )}
                        Guardar Configuración
                    </Button>
                </Card.CardFooter>
            </Card.Card>
        </div>
    )
}
