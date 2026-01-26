type StatusValue = string | number | boolean | null | undefined;

const BADGE_STATUS_CLASSES: Record<string, string> = {
    active: "bg-green-100 text-green-800 border-green-200",
    inactive: "bg-red-100 text-red-800 border-red-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export function getBadgeStatusClass(value: StatusValue): string {
    const normalized = normalizeStatus(value);

    const baseClasses = "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium";
    const statusClasses = BADGE_STATUS_CLASSES[normalized] ?? "bg-gray-100 text-gray-800 border-gray-200";

    return `${baseClasses} ${statusClasses}`;
}

function normalizeStatus(value: StatusValue): string {
    if (value === 1 || value === true || value === "active") return "active";
    if (value === 0 || value === false || value === "inactive") return "inactive";
    if (value === "pending") return "pending";

    return "pending";
}
