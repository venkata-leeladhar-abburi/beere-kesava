import { BarChartIcon, CreditCard, Factory, LayoutDashboard, Package, Scissors, ShoppingCart, UserRound } from "lucide-react";

export const FOOTER_QUICK_LINKS = [
  { icon: <LayoutDashboard size={13} />, label: "Dashboard"  },
  { icon: <ShoppingCart size={13} />,   label: "Orders"      },
  { icon: <Scissors size={13} />,       label: "Weavers"     },
  { icon: <Factory size={13} />,        label: "Production"  },
  { icon: <Package size={13} />,        label: "Materials"   },
  { icon: <CreditCard size={13} />,     label: "Payments"    },
  { icon: <BarChartIcon size={13} />,    label: "Reports"     },
  { icon: <UserRound size={13} />,      label: "Customers"   },
];

export const FOOTER_PAYMENT_LINKS = [
  "Record Customer Payment",
  "Weaver Making Charges",
  "Vendor Payments",
  "Customer Collections",
  "Payment History",
];

export const FOOTER_HELP_LINKS = [
  "Help Center",
  "Video Tutorials",
  "Support Chat",
  "Contact Support",
  "Report an Issue",
];

export const FOOTER_COMMITMENTS = [
  "Timely Settlements",
  "100% Transparency",
  "Heritage Since 1999",
  "Traditional Excellence",
];
