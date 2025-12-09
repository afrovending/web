import { FaDhl } from "react-icons/fa6";
import { SiFedex, SiUps, SiUsps, SiAmazon, SiDeliveroo } from "react-icons/si";
import { MdLocalShipping } from "react-icons/md";
import { AiOutlineWechatWork } from "react-icons/ai";

import {
  FiUser,
  FiPackage,
  FiHeart,
  FiMapPin,
  FiSettings,
  FiLifeBuoy,
  FiBell,
} from "react-icons/fi";

import {
  LuLayoutDashboard,
  LuPackage,
  LuShoppingCart,
  LuMessageCircle,
  LuWallet,
  LuSettings,
  LuUsers,
  LuShoppingBag,
  LuMegaphone,
  LuList,
} from "react-icons/lu";

interface NavItem {
  id: number;
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

export const NAVIGATION: NavItem[] = [
  { id: 1, label: "Dashboard", href: "/dashboard", icon: LuLayoutDashboard },
  {
    id: 2,
    label: "Item Management",
    href: "/item-management",
    icon: LuPackage,
    children: [],
  },
  {
    id: 3,
    label: "Order Management",
    href: "/order-management",
    icon: LuShoppingCart,
  },
  {
    id: 4,
    label: "Customer Feedback",
    href: "/customer-feedback",
    icon: LuMessageCircle,
  },
  {
    id: 5,
    label: "Finance & Payment",
    href: "/finance-payment",
    icon: LuWallet,
  },
  {
    id: 9,
    label: "Shop Management",
    href: "/shop-management",
    icon: LuShoppingBag,
    children: [
      {
        id: 91,
        label: "Shop Profile & Branding",
        href: "/shop-management/profile",
        icon: LuShoppingBag,
      },
      {
        id: 92,
        label: "Promotions & Discounts",
        href: "/shop-management/promotions",
        icon: LuMegaphone,
      },
      {
        id: 93,
        label: "Store Policies",
        href: "/shop-management/policies",
        icon: LuList,
      },
    ],
  },
  {
    id: 7,
    label: "Accounts & Settings",
    href: "/account-settings",
    icon: LuSettings,
    children: [
      // Assuming sub-settings links
    ],
  },
  {
    id: 8,
    label: "Seller Copilot",
    href: "/seller-copilot",
    icon: AiOutlineWechatWork,
  },
];

export const CUSTOMER_MENU = [
  { name: "Account Overview", href: "/account", icon: FiUser },
  { name: "Orders", href: "/account/orders", icon: FiPackage },
  { name: "Track Order", href: "/account/tracking-order", icon: FiMapPin },
  { name: "Wishlist", href: "/account/wishlists", icon: FiHeart },
  { name: "Address", href: "/account/address", icon: FiMapPin },
  { name: "Notifications", href: "/account/notifications", icon: FiBell },
  { name: "Support", href: "/account/support", icon: FiLifeBuoy },
  { name: "Setting", href: "/account/settings", icon: FiSettings },
];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DIMENSION_OPTIONS = [
  { label: "pound", value: "lbs" }, // ShipEngine expects "pound"
  { label: "ounce", value: "oz" }, // ShipEngine expects "ounce"
];

export const SIZE_UNIT_OPTIONS = [
  { label: "inch", value: "in" }, // ShipEngine expects "inch"
];

export const PRICING_MODEL_OPTIONS = [
  { value: "fixed", label: "Fixed" },
  { value: "negotiable", label: "Negotiable" },
];

export const DELIVERY_METHOD_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
];

export const MAX_IMAGES = 7;
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
export const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const CARRIER_ICONS: Record<
  string,
  { icon: React.ComponentType<any>; color: string }
> = {
  dhl: { icon: FaDhl, color: "#FFCC00" },
  fedex: { icon: SiFedex, color: "#4D148C" },
  ups: { icon: SiUps, color: "#180B02" },
  usps: { icon: SiUsps, color: "#3333CC" },
  amazon: { icon: SiAmazon, color: "#FF9900" },

  // fallback carriers you may add later
  deliveroo: { icon: SiDeliveroo, color: "#00CCBC" },

  // default fallback
  default: { icon: MdLocalShipping, color: "#FF9920" },
};

export const UK_TIMEZONE = "Europe/London";

export const ALLOWED_COUNTRIES = [
  "GB", // United Kingdom
  "KE", // Kenya
  "NG", // Nigeria
  "GH", // Ghana
  "ZA", // South Africa
  "MA", // Morocco
  "UG", // Uganda
  "TZ", // Tanzania
  "RW", // Rwanda
];
export const COMPANY_CONTACT_INFO = {
  address: "77 The Lakes, Larkfield, Aylesford, Kent ME20 6SJ, UK",
  phone: "+44 7930 173135",
  email: "info@ayokah.co.uk",
  companyName: "Afrovending Online Marketplace",
  about: `
Afrovending Online Marketplace is a modern, people-focused food and service marketplace created to make everyday living simpler, faster, and more convenient. Built with the needs of today’s consumers in mind, Afrovending connects individuals, families, and communities with high-quality foods, trusted sellers, essential products, and reliable home services — all through one easy-to-use digital platform.

From freshly prepared meals to groceries, home essentials, and professional services, Afrovending brings everything closer to you. Our platform empowers local vendors, supports small businesses, and ensures that customers enjoy competitive pricing, verified quality, and seamless delivery experiences.

Whether you're shopping for daily essentials, placing a food order, booking a service professional, or exploring new offerings, Afrovending is designed to save you time, reduce stress, and enhance convenience. We are committed to redefining lifestyle simplicity by merging technology, trust, and real human need into a single ecosystem that works for everyone.

At Afrovending Online Marketplace, we don't just deliver products — we deliver comfort, reliability, and a better way to live every day.
`,
  companyDescription: `
Afrovending Online Marketplace is a modern food and service marketplace designed to make everyday living simpler, faster, and more convenient. We connect customers with a wide range of quality foods, trusted sellers, home services, and essential products — all in one easy-to-use platform.
  `,
};

// ADD ABOVE RETURN
export const ROLE_OPTIONS = [
  { value: "customer", label: "Register as Customer" },
  { value: "vendor", label: "Register as Seller" },
];
