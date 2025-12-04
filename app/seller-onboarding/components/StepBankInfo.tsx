"use client";

import { useState } from "react";
import { saveBankInfo } from "@/lib/api/seller/bank";
import { FaCashRegister } from "react-icons/fa";
import toast from "react-hot-toast";
import { StepProps } from "@/interfaces/StepProps";

export default function StepBankInfo({ onNext }: StepProps) {
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [institutionNumber, setInstitutionNumber] = useState("");
  const [transitNumber, setTransitNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      name: bankName,
      code: bankCode,
      institution_number: institutionNumber,
      transit_number: transitNumber,
      account_number: accountNumber,
      account_name: accountName,
    };

    try {
      const res = await saveBankInfo(payload);

      if (res.status === "success") {
        setSuccessMsg(res.message);
        onNext && onNext();
      }
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ??
          "Unable to update bank information. Try again."
      );
      toast.error(
        err?.response?.data?.message ??
          "Unable to update bank information. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border border-red-100 p-4 rounded-md mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <FaCashRegister className="text-red-800 text-xl mr-2" size={24} />
          Bank Information
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          Please provide your correct personal/corporate bank details to receive
          payments.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 text-gray-800">
        {errorMsg && (
          <div className="p-3 bg-red-100 text-red-700 rounded">{errorMsg}</div>
        )}
        {successMsg && (
          <div className="p-3 bg-green-100 text-green-700 rounded">
            {successMsg}
          </div>
        )}

        {/* Two-column wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Bank Name */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Bank Name</label>
            <input
              className="input"
              placeholder="Enter bank name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
          </div>

          {/* Bank Code */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">
              Bank Code (SWIFT)
            </label>
            <input
              className="input"
              placeholder="e.g. ABCDGB2L"
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              required
              maxLength={10}
            />
          </div>

          {/* Institution Number */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">
              Institution Number (3 digits)
            </label>
            <input
              className="input"
              placeholder="123"
              value={institutionNumber}
              onChange={(e) => setInstitutionNumber(e.target.value)}
              maxLength={3}
              required
            />
          </div>

          {/* Transit Number */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">
              Transit Number (5 digits)
            </label>
            <input
              className="input"
              placeholder="12345"
              value={transitNumber}
              onChange={(e) => setTransitNumber(e.target.value)}
              maxLength={5}
              required
            />
          </div>

          {/* Account Number */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">
              Account Number (7–12 digits)
            </label>
            <input
              className="input"
              placeholder="123456789"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              maxLength={12}
              minLength={7}
              required
            />
          </div>

          {/* Account Holder Name */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">
              Account Holder Name
            </label>
            <input
              className="input"
              placeholder="John Doe"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </>
  );
}
