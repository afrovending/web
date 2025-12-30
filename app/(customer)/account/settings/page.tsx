"use client";

import {
  InitialSettings,
  NotificationPayload,
  SaveResponse,
  NotificationChannels,
} from "@/interfaces/notification";
import {
  getCommunicationSettings,
  saveCommunicationSettings,
} from "@/lib/api/notifications";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiSettings } from "react-icons/fi";

declare const api: {
  get: (url: string) => Promise<any>;
  post: (url: string, payload: any) => Promise<any>;
};
const ToggleSwitch = ({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex justify-between items-center py-2">
    <span className={`text-gray-700 ${disabled ? "opacity-50" : ""}`}>
      {label}
    </span>
    <label
      className={`relative inline-flex items-center ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        value=""
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div
        className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-400 after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${
          checked
            ? "peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white peer-checked:bg-green-800"
            : ""
        } ${disabled ? "opacity-40" : ""}`}
      ></div>
    </label>
  </div>
);

// Main page component
export default function CommunicationSettingsPage() {
  const [initialSettings, setInitialSettings] =
    useState<InitialSettings | null>(null);
  const [orderSettings, setOrderSettings] = useState<NotificationChannels>({
    push: false,
    emails: false,
    sms: false,
  });
  const [promoSettings, setPromoSettings] = useState<NotificationChannels>({
    push: false,
    emails: false,
    sms: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Load data from the API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getCommunicationSettings();
        setInitialSettings(settings);

        setOrderSettings({
          push: settings.push_notification,
          emails: settings.email_notification,
          sms: settings.sms_notification,
        });

        setPromoSettings({
          push: settings.promotions,
          emails: settings.marketing_emails,
          sms: settings.new_products,
        });
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast.error("Failed to load current settings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleOrderChange = (
    key: keyof NotificationChannels,
    checked: boolean
  ) => {
    setOrderSettings((prev) => ({ ...prev, [key]: checked }));
  };

  const handlePromoChange = (
    key: keyof NotificationChannels,
    checked: boolean
  ) => {
    setPromoSettings((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSave = useCallback(async () => {
    if (!initialSettings || isSaving) return;

    setIsSaving(true);
    toast.loading("Saving preferences...");

    const payload: NotificationPayload = {
      push_notification: orderSettings.push ? "true" : "false",
      email_notification: orderSettings.emails ? "true" : "false",
      sms_notification: orderSettings.sms ? "true" : "false",
      promotions: promoSettings.push ? "true" : "false",
      marketing_emails: promoSettings.emails ? "true" : "false",
      new_products: promoSettings.sms ? "true" : "false",
      events: initialSettings.events ? "true" : "false",
    };

    try {
      const result: SaveResponse = await saveCommunicationSettings(payload);
      toast.dismiss();
      if (result.status === "success") {
        toast.success(result.message || "Preferences saved!");
        setInitialSettings((prevState) => {
          if (!prevState) return null;
          return {
            ...prevState,
            push_notification: orderSettings.push,
            email_notification: orderSettings.emails,
            sms_notification: orderSettings.sms,
            promotions: promoSettings.push,
            marketing_emails: promoSettings.emails,
            new_products: promoSettings.sms,
          };
        });
      } else {
        toast.error(result.message || "Error saving preferences.");
        console.error("Backend Error:", result.error_detail);
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to connect to the server.");
      console.error("API call failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, [orderSettings, promoSettings, initialSettings, isSaving]);

  const settingsHaveChanged = useCallback(() => {
    if (!initialSettings) return false;

    if (orderSettings.push !== initialSettings.push_notification) return true;
    if (orderSettings.emails !== initialSettings.email_notification)
      return true;
    if (orderSettings.sms !== initialSettings.sms_notification) return true;

    if (promoSettings.push !== initialSettings.promotions) return true;
    if (promoSettings.emails !== initialSettings.marketing_emails) return true;
    if (promoSettings.sms !== initialSettings.new_products) return true;

    return false;
  }, [orderSettings, promoSettings, initialSettings]);

  const isSaveDisabled = isLoading || isSaving || !settingsHaveChanged();

  const handleCancel = () => {
    if (!initialSettings) return;

    setOrderSettings({
      push: initialSettings.push_notification,
      emails: initialSettings.email_notification,
      sms: initialSettings.sms_notification,
    });
    setPromoSettings({
      push: initialSettings.promotions,
      emails: initialSettings.marketing_emails,
      sms: initialSettings.new_products,
    });
  };

  if (isLoading) return <SettingsSkeleton />;

  return (
    <>
      {/* Card Header */}
      <div className="card mb-6 hover:shadow-lg transition-all duration-300 rounded-xl bg-white cursor-default p-4">
        <h2 className="text-lg font-semibold flex items-center text-green-800! gap-2">
          <FiSettings />
          Setting
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          From your account dashboard, you can easily check, modify and view
          your
          <span className="text-green-800"> Notification settings</span>
        </p>
      </div>

      {/* Main Card */}
      <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
        {/* Order Status */}
        <section className="mb-8 group transition-all">
          <div className="flex items-start mb-2">
            <h3 className="text-xl font-medium text-gray-800 group-hover:text-green-700 transition-colors">
              Order Status
            </h3>
          </div>
          <p className="text-gray-600 mb-4">
            Receive notifications about the progress of your orders.
          </p>

          <div className="pl-4 space-y-2">
            <div className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <ToggleSwitch
                label="Push Notification (System)"
                checked={orderSettings.push}
                onChange={(checked) => handleOrderChange("push", checked)}
                disabled={isSaving}
              />
            </div>
            <div className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <ToggleSwitch
                label="Emails (Service Updates)"
                checked={orderSettings.emails}
                onChange={(checked) => handleOrderChange("emails", checked)}
                disabled={isSaving}
              />
            </div>
            <div className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <ToggleSwitch
                label="SMS (Delivery Alerts)"
                checked={orderSettings.sms}
                onChange={(checked) => handleOrderChange("sms", checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </section>

        <hr className="my-6 border-gray-200" />

        {/* Promotional Offers */}
        <section className="group transition-all">
          <div className="flex items-start mb-2">
            <h3 className="text-xl font-medium text-gray-800 group-hover:text-green-700 transition-colors">
              Promotional Offers
            </h3>
          </div>
          <p className="text-gray-600 mb-4">
            Be notified about exclusive deals and discounts.
          </p>

          <div className="pl-4 space-y-2">
            <div className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <ToggleSwitch
                label="Push Notification (Promotions)"
                checked={promoSettings.push}
                onChange={(checked) => handlePromoChange("push", checked)}
                disabled={isSaving}
              />
            </div>
            <div className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <ToggleSwitch
                label="Emails (Marketing Campaigns)"
                checked={promoSettings.emails}
                onChange={(checked) => handlePromoChange("emails", checked)}
                disabled={isSaving}
              />
            </div>
            <div className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <ToggleSwitch
                label="SMS (New Product Alerts)"
                checked={promoSettings.sms}
                onChange={(checked) => handlePromoChange("sms", checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </section>

        {/* Buttons */}
        <div className="flex justify-end mt-8 pt-4 border-t border-gray-200">
          <button
            className={`px-4 py-2 font-semibold rounded-lg transition-all duration-200 mr-4 ${
              isSaving || !settingsHaveChanged()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm cursor-pointer"
            }`}
            onClick={handleCancel}
            disabled={isSaving || !settingsHaveChanged()}
          >
            Cancel
          </button>

          <button
            className={`px-4 py-2 font-semibold rounded-lg transition-all duration-200 ${
              isSaveDisabled
                ? "bg-green-300 text-white cursor-not-allowed"
                : "bg-green-800 text-white hover:bg-green-700 hover:shadow-md hover:-translate-y-px cursor-pointer"
            }`}
            onClick={handleSave}
            disabled={isSaveDisabled}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

const SettingsSkeleton = () => (
  <div className="animate-pulse">
    {/* Header Skeleton */}
    <div className="bg-gray-200 h-28 w-full rounded-xl mb-6" />

    {/* Main Card Skeleton */}
    <div className="p-6 bg-white rounded-xl shadow-md space-y-8">
      {[1, 2].map((section) => (
        <div key={section} className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="space-y-3 pl-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="flex justify-between items-center py-2"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded-full w-10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);
