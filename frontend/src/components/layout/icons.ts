import type { LucideIcon } from "lucide-react";
import {
    BadgeCheck,
    Bell,
    Building2,
    CalendarDays,
    CalendarHeart,
    CalendarRange,
    ClipboardList,
    FileBarChart,
    FileSignature,
    FolderTree,
    Gauge,
    History,
    IdCard,
    KeyRound,
    LogIn,
    LogOut,
    ScanLine,
    ScrollText,
    Settings,
    ShieldAlert,
    ShieldCheck,
    UserRound,
    Users,
    Workflow,
} from "lucide-react";
import type { NavItem } from "./nav";

export const ICONS = {
    dashboard: Gauge,
    employees: Users,
    employee: UserRound,
    profile: IdCard,
    requests: ClipboardList,
    leaves: CalendarRange,
    permissions: CalendarDays,
    absences: ShieldCheck,
    approvals: BadgeCheck,
    scanner: ScanLine,
    attendance: History,
    entries: LogIn,
    exits: LogOut,
    presence: Users,
    planning: FolderTree,
    reports: FileBarChart,
    notifications: Bell,
    settings: Settings,
    organization: Building2,
    badges: BadgeCheck,
    devices: ScanLine,
    workflows: Workflow,
    security: KeyRound,
    roles: ShieldCheck,
    contracts: FileSignature,
    holidays: CalendarHeart,
    journal: ScrollText,
    absencesAdmin: ShieldAlert,
} satisfies Record<string, LucideIcon>;

export type { NavItem };

export function item(href: string, label: string, key: keyof typeof ICONS, exact = false): NavItem {
    return { href, label, icon: ICONS[key], exact };
}

export function itemWithBadge(
    href: string,
    label: string,
    key: keyof typeof ICONS,
    badge: number,
): NavItem {
    return { href, label, icon: ICONS[key], badge };
}