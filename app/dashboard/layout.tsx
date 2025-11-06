import AccountSidebar from "./components/AccountSidebar";

 
export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <main className="flex-1 p-0 overflow-y-auto">{children}</main>
    </div>
  );
}
