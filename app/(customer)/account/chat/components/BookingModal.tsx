"use client";

import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import {
  format,
  addMonths,
  startOfToday,
  setHours,
  setMinutes,
} from "date-fns";
import { LuCalendar, LuMapPin, LuDollarSign, LuTruck } from "react-icons/lu";
import "react-day-picker/dist/style.css";
import Modal from "@/app/components/common/Modal";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export default function BookingModal({
  isOpen,
  onClose,
  ticketId,
  onSubmit,
  loading,
}: BookingModalProps) {
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [deliveryMethod, setDeliveryMethod] = useState("onsite");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startDate = setMinutes(setHours(selectedDate, hours), minutes);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    onSubmit({
      ticket_id: ticketId,
      delivery_method: deliveryMethod,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      address: address,
      amount: parseFloat(amount),
    });
  };

return (
  <Modal isOpen={isOpen} onClose={onClose} title="Finalize Booking">
    <style>{customCalendarStyles}</style>

    <form
      onSubmit={handleBookingSubmit}
      className="flex flex-col h-full overflow-hidden"
    >
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-0 py-2 space-y-3 scrollbar-hide">
        {/* Date Selection - Compacted */}
        <section className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1">
            <LuCalendar size={12} className="text-hub-primary" /> Appointment
            Date
          </label>
          <div className="bg-black rounded-xl flex flex-col items-center">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={{ before: today }}
              startMonth={today}
              endMonth={addMonths(today, 3)}
            />
            <div className="w-full border-t border-hub-light-primary/10 flex items-center justify-between p-2">
              <span className="text-sm  text-white font-semibold">
                Time
              </span>
              <input
                type="time"
                required
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-white rounded-md border border-hub-secondary px-1.5 py-0.5 text-[12px] font-bold text-hub-primary focus:ring-1 focus:ring-hub-primary outline-none"
              />
            </div>
          </div>
        </section>

        {/* Delivery Method - Smaller buttons */}
        <section className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight flex items-center gap-1">
            <LuTruck size={12} className="text-hub-primary" /> Delivery
          </label>
          <div className="flex gap-1">
            {["onsite", "pickup", "remote"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setDeliveryMethod(method)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize border transition-all ${
                  deliveryMethod === method
                    ? "border-hub-primary bg-hub-primary text-white"
                    : "border-hub-secondary bg-white text-gray-400"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </section>

        {/* Amount & Location Row - Super Tight */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-hub-primary font-bold">
                CA$
              </span>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8! pr-2! py-1.5! input"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
              Address
            </label>
            <input
              placeholder="Address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-2! py-1.5! input"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-white ">
        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary"
        >
          {loading ? "Processing..." : "Send Proposal"}
        </button>
      </div>
    </form>
  </Modal>
);
}

const customCalendarStyles = `
  .rdp {
    --rdp-cell-size: 32px; /* Reduces the size of each day circle */
    --rdp-caption-font-size: 13px; /* Shrinks the Month/Year header */
    --rdp-accent-color: #F28C0D;
    --rdp-background-color: #fff7ed;
    margin: 0;
  }
  
  /* Make the day numbers smaller */
  .rdp-day {
    font-size: 11px;
    height: var(--rdp-cell-size);
    width: var(--rdp-cell-size);
  }

  .rdp-day_selected { 
    background-color: #F28C0D !important; 
    border-radius: 8px !important; 
    color: white !important;
  }

  .rdp-day_today { 
    color: #F28C0D; 
    font-weight: 900; 
  }

  /* Tighten the header height */
  .rdp-caption {
    height: 30px;
  }

  /* Shrink the navigation arrows */
  .rdp-nav_button {
    width: 24px;
    height: 24px;
    padding: 0;
  }
`;