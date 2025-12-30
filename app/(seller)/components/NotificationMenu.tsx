"use client";

import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import { LuBell } from "react-icons/lu";
import { Fragment, useState, useEffect, useMemo } from "react";
import { listNotifications } from "@/lib/api/seller/notification";
import { NotificationItem } from "@/interfaces/notification";
import { formatTimeAgo } from "@/utils/formatDate";

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function NotificationMenu() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listNotifications();
        setNotifications(response || []);
      } catch (err) {
        console.error("API call failed:", err);
        setError("Could not connect to the notification service.");
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const hasUnread = useMemo(() => {
    return notifications.length > 0;
  }, [notifications]);

  return (
    <Menu as="div" className="relative">
      <MenuButton className="p-2 text-gray-500 hover:text-green-500 relative transition-colors duration-150 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer">
        <LuBell className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </MenuButton>

      {/* Notification Panel */}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 z-50 mt-2 w-80 max-w-[95vw] md:w-96 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-green-50 ring-opacity-5 focus:outline-none">
          {/* Static Header - "All notifications" */}
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="lg:text-lg sm:text-xs font-semibold text-gray-800">
              All Notifications
            </h3>
          </div>

          {/* Notification List Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            )}

            {!isLoading && error && (
              <div className="p-4 text-center text-red-500 text-sm">
                Error: {error}
              </div>
            )}

            {!isLoading && !error && notifications.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                You have no new notifications.
              </div>
            )}

            {!isLoading &&
              notifications.length > 0 &&
              notifications.map((notif) => (
                <span
                  key={notif.id}
                  className={classNames(
                    true ? "bg-green-50" : "bg-white",
                    "flex items-start p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  )}
                >
                  {/* Icon */}
                  <div
                    className={classNames(
                      true ? "text-green-600" : "text-gray-500",
                      "mt-1 mr-3 shrink-0"
                    )}
                  >
                    <LuBell className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p
                      className={classNames(
                        true ? "font-semibold" : "font-medium",
                        "text-sm text-gray-900"
                      )}
                    >
                      {notif.body}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatTimeAgo(notif.created_at)}
                    </p>
                  </div>

                  {/* Unread Dot */}
                  {true && (
                    <span className="h-2 w-2 bg-green-500 rounded-full mt-2 ml-2" />
                  )}
                </span>
              ))}

            {/* Footer Link */}
            {/* <div className="border-t border-gray-100">
              <Link
                href="/seller/notifications"
                className="block w-full text-center py-2 text-sm font-medium text-green-600 hover:bg-gray-50"
              >
                View all notifications
              </Link>
            </div> */}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
