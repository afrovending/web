import DashboardHeader from "./components/DashboardHeader";
import AccountSidebar from "./components/AccountSidebar";

export default function AccountPage() {
  return (
    <>
      <DashboardHeader
        title="My Account"
        breadcrumb={[
          { label: "Home", href: "/dasboard" },
          { label: "My Account" },
        ]}
      />

      <div className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 gap-8">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 sticky top-24 self-start h-[calc(100vh-6rem)] overflow-y-auto border-r border-gray-100 bg-white rounded-xl shadow-sm">
          {/* <AccountSidebar /> */}
        </aside>

        {/* Main Content */}
        {/* <AccountPage /> */}
      </div>
    </>
  );
}
