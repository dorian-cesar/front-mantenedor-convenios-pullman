import * as Dialog from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { FileText, Table } from "lucide-react";

interface ExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onExport: (type: "csv" | "excel") => void;
}

export default function ExportModal({ open, onOpenChange, onExport }: ExportModalProps) {
    const handleClose = () => onOpenChange(false);

    const handleExport = (type: "csv" | "excel") => {
        onExport(type);
        onOpenChange(false);
    };

    return (
        <Dialog.Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.DialogContent className="sm:max-w-md p-0 overflow-hidden">
                <Dialog.DialogHeader className="px-6 pt-6">
                    <Dialog.DialogTitle className="text-lg font-semibold">
                        Exportar Datos
                    </Dialog.DialogTitle>
                    <Dialog.DialogDescription className="text-sm text-muted-foreground">
                        Selecciona el formato de exportación
                    </Dialog.DialogDescription>
                </Dialog.DialogHeader>

                <div className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleExport("csv")}
                            className="flex flex-col items-center justify-center p-4 border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <FileText className="h-6 w-6 mb-2" />
                            <span className="font-medium">CSV</span>
                            <span className="text-xs text-muted-foreground mt-1">
                                Archivo de texto
                            </span>
                        </button>

                        <button
                            onClick={() => handleExport("excel")}
                            className="flex flex-col items-center justify-center p-4 border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <Table className="h-6 w-6 mb-2" />
                            <span className="font-medium">Excel</span>
                            <span className="text-xs text-muted-foreground mt-1">
                                Hoja de cálculo
                            </span>
                        </button>
                    </div>
                </div>

                <Dialog.DialogFooter className="px-6 pb-6">
                    <Button variant="ghost" onClick={handleClose} className="w-full">
                        Cancelar
                    </Button>
                </Dialog.DialogFooter>
            </Dialog.DialogContent>
        </Dialog.Dialog>
    );
}
