import ServiceChatPage from "@/app/(customer)/account/chat/page";

interface PageProps {
  searchParams: Promise<{ item?: string }>;
}

export default function SellerChatPage({ searchParams }: PageProps) {
  return <ServiceChatPage searchParams={searchParams} />;
}
