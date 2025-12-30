import { CubeIcon } from "@heroicons/react/24/outline";

export default function EmptyItem({
  message = "No items available.",
}: {
  message?: string;
}) {
  return (
    <div className="col-span-full text-center py-10 flex flex-col items-center justify-center gap-4">
      <CubeIcon className="w-16 h-16 text-gray-300 animate-pulse" />
      <p className="text-gray-500 text-lg font-semibold">{message}</p>
    </div>
  );
}
