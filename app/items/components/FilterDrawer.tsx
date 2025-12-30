"use client";

import { FC, Fragment, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { FiFilter } from "react-icons/fi";
import SelectDropdown from "@/app/(seller)/dashboard/components/commons/Fields/SelectDropdown";

interface FilterDrawerProps {
  filters: any;
  setFilters: (filters: any) => void;
  debouncedSetSearch: (value: string) => void;
  type: string;
}

const FilterDrawer: FC<FilterDrawerProps> = ({
  filters,
  setFilters,
  debouncedSetSearch,
  type,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { label: "Price: Low to High", value: "asc" },
    { label: "Price: High to Low", value: "desc" },
  ];

  const availabilityOptions = [
    { label: "All Availability", value: "" },
    { label: "In Stock", value: "in_stock" },
    { label: "Out of Stock", value: "out_of_stock" },
  ];

  const ratingOptions = [
    { label: "All Ratings", value: "" },
    { label: "5 Stars", value: "5" },
    { label: "4 Stars & Up", value: "4" },
    { label: "3 Stars & Up", value: "3" },
  ];

  return (
    <>
      <button
        className="flex items-center gap-2 btn btn-primary transition"
        onClick={() => setIsOpen(true)}
      >
        <FiFilter className="w-4 h-4" />
        Filters
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsOpen(false)}
        >
          {/* Backdrop */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-40"
            leave="ease-in duration-150"
            leaveFrom="opacity-40"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/10 backdrop-blur-xs" />
          </TransitionChild>

          {/* Drawer Panel */}
          <div className="fixed inset-0 flex justify-end">
            <TransitionChild
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <DialogPanel className="w-72 max-w-full bg-white h-full p-6 overflow-y-auto shadow-xl">
                <DialogTitle className="text-lg font-bold mb-4">
                  Filters
                </DialogTitle>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Search..."
                  className="input mb-6"
                  defaultValue={filters.search}
                  onChange={(e) => debouncedSetSearch(e.target.value)}
                />

                {/* Sorting */}
                <SelectDropdown
                  options={sortOptions}
                  value={
                    sortOptions.find((o) => o.value === filters.sort) ||
                    sortOptions[0]
                  }
                  onChange={(val) =>
                    setFilters((prev: any) => ({
                      ...prev,
                      sort: val.value,
                      offset: 0,
                    }))
                  }
                />
                <br />

                {/* Type-specific filters */}
                {type === "products" && (
                  <SelectDropdown
                    options={availabilityOptions}
                    value={
                      availabilityOptions.find(
                        (o) => o.value === filters.availability
                      ) || availabilityOptions[0]
                    }
                    onChange={(val) =>
                      setFilters((prev: any) => ({
                        ...prev,
                        availability: val.value || undefined,
                        offset: 0,
                      }))
                    }
                  />
                )}

                {type === "services" && (
                  <SelectDropdown
                    options={ratingOptions}
                    value={
                      ratingOptions.find(
                        (o) => o.value === String(filters.rating)
                      ) || ratingOptions[0]
                    }
                    onChange={(val) =>
                      setFilters((prev: any) => ({
                        ...prev,
                        rating: val.value ? Number(val.value) : undefined,
                        offset: 0,
                      }))
                    }
                  />
                )}

                {/* Reset & Close */}
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="btn btn-gray w-full! transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        search: "",
                        sort: "asc",
                        availability: undefined,
                        rating: undefined,
                        offset: 0,
                      })
                    }
                    className="btn btn-primary w-full! transition"
                  >
                    Reset
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default FilterDrawer;
