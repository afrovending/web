
export default function ItemDetailSkeleton() {
  return (
    <div className="bg-white animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left: Image preview area */}
        <div className="flex gap-4 lg:col-span-1">
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-20 h-20 bg-gray-200 rounded-md"
              />
            ))}
          </div>
          <div className="flex-1">
            <div className="w-full h-100 bg-gray-200 rounded-lg shadow-md" />
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="flex flex-col space-y-4">
          <div className="w-2/3 h-6 bg-gray-200 rounded" /> {/* title */}
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-5 h-5 bg-gray-200 rounded-full" />
            ))}
          </div>
          <div className="w-1/3 h-6 bg-gray-200 rounded" /> {/* price */}
          <div className="w-full h-24 bg-gray-200 rounded" /> {/* description */}

          <div className="flex items-center gap-4 mt-5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
            </div>
            <div className="w-32 h-10 bg-gray-200 rounded-full" /> {/* Add to cart */}
            <div className="w-10 h-10 bg-gray-200 rounded-full" /> {/* Favorite */}
          </div>
        </div>
      </div>
    </div>
  );
}
