/**
 * Semantic icon registry — design-system/03-PRIMITIVES.md Part E.4.
 * ═══════════════════════════════════════════════════════════════════════════
 * One name per concept, app-wide. Stops `Trash` / `Trash2` / `Delete` / `X`
 * all meaning "remove", and is the single point of truth once the app-wide
 * migration off @phosphor-icons/react (36 files, Step 6) lands — importing
 * from this file instead of `lucide-react` directly means a future icon-set
 * swap is a one-file change, the same reasoning as the font/colour tokens.
 *
 * Rules (Part E.3):
 *   - stroke width 1.5 at xs/sm, 2 at md/lg/xl (set via <Icon strokeWidth>)
 *   - colour is always currentColor — never a hardcoded hex
 *   - decorative icons get aria-hidden="true" (the <Icon> wrapper below sets
 *     this by default; pass `decorative={false}` for a meaningful icon that
 *     needs its own accessible name via aria-label on the icon itself)
 */
import {
  Plus, Pencil, Trash2, Eye, Download, Upload, Printer, Search,
  SlidersHorizontal, ArrowUpDown, X, ArrowLeft, ArrowUpRight,
  MoreHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  CheckCircle2, AlertTriangle, AlertCircle, Info, Clock, Check, Minus,
  Users, Factory, Shirt, Layers, FileText, IndianRupee,
  Bell, Calendar, Filter, LogOut, UserRound, Loader2,
  Palette, UserCircle2, Building2, Wrench, IdCard,
  FileSignature, ClipboardList, PackageCheck, Truck, ShoppingCart,
  WifiOff, ShieldAlert, TimerOff,
  type LucideIcon,
} from "lucide-react";

export const Icons = {
  // actions
  add: Plus,
  edit: Pencil,
  delete: Trash2,
  view: Eye,
  download: Download,
  upload: Upload,
  print: Printer,
  search: Search,
  filter: Filter,
  sort: ArrowUpDown,
  close: X,
  back: ArrowLeft,
  external: ArrowUpRight,
  more: MoreHorizontal,
  logout: LogOut,

  // disclosure
  expandDown: ChevronDown,
  expandUp: ChevronUp,
  expandLeft: ChevronLeft,
  expandRight: ChevronRight,

  // status
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  pending: Clock,
  check: Check,
  minus: Minus,
  spinner: Loader2,
  offline: WifiOff,
  accessDenied: ShieldAlert,
  sessionExpired: TimerOff,

  // chrome
  notification: Bell,
  calendar: Calendar,
  profile: UserRound,
  columns: SlidersHorizontal,

  // domain — entities
  weaver: Users,
  loom: Factory,
  saree: Shirt,
  batch: Layers,
  design: Palette,
  customer: UserCircle2,
  supplier: Building2,
  vendor: Wrench,
  employee: IdCard,

  // domain — documents (design-system/06-DOMAIN.md Part C.1)
  invoice: FileText,
  payment: IndianRupee,
  quotation: FileSignature,
  purchaseOrder: ClipboardList,
  goodsReceipt: PackageCheck,
  challan: Truck,
  order: ShoppingCart,
} as const;

export type IconName = keyof typeof Icons;
export type { LucideIcon };

/** design-system/03-PRIMITIVES.md Part E.2 — 14 sizes collapsed to 5. */
export const ICON_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export type IconSize = keyof typeof ICON_SIZE;
