"use client";

import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import { Fragment, ReactNode } from "react";

interface DropdownProps {
  button: ReactNode;
  children: ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

export default function Dropdown({
  button,
  children,
  align = "center",
  width = "w-72",
}: DropdownProps) {
  // position classes
  const positionClass =
    align === "left"
      ? "left-0"
      : align === "right"
      ? "right-0"
      : "left-1/2 transform -translate-x-1/2";

  return (
    <Menu as="div" className="relative">
      <MenuButton>{button}</MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <MenuItems
          className={`absolute ${positionClass} mt-3 ${width} bg-white border border-hub-primary rounded-lg shadow-lg p-3 z-50 focus:outline-none`}
        >
          {children}
        </MenuItems>
      </Transition>
    </Menu>
  );
}
