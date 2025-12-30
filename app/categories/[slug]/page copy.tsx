import { getCategoryWithChildren } from "@/lib/api/category";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import Category from "@/interfaces/category";
import { notFound } from "next/navigation";
import toast from "react-hot-toast";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ type?: string }>;
}

interface CategoryData {
  parent: Category;
  children: Category[];
}

type PageParams = {
  params: {
    slug: string;
  };
  searchParams?: {
    type?: string;
  };
};

export async function generateMetadata({
  params,
  searchParams,
}: PageParams): Promise<Metadata> {
  const slug = params.slug;
  const type = searchParams?.type;

  if (!slug || !type || !["products", "services"].includes(type)) {
    return {
      title: "Category not found",
      description: "The requested category does not exist.",
    };
  }

  try {
    const categoryData = await getCategoryWithChildren(type, slug);
    const parent = categoryData.parent;

    if (!parent) {
      return {
        title: "Category not found",
        description: "The requested category does not exist.",
      };
    }

    // Prepare description, strip HTML, limit to 155 chars
    const description = parent.description
      ?.replace(/<\/?[^>]+(>|$)/g, "")
      .slice(0, 155);

    // Optional: use banner image as SEO image
    const seoImage = parent.image ? [parent.image] : [];

    return {
      title: `${parent.name} | Afrovending Online Marketplace`,
      description:
        description ||
        `Explore ${parent.name} on Afrovending Online Marketplace`,

      openGraph: {
        title: parent.name,
        description:
          description ||
          `Explore ${parent.name} on Afrovending Online Marketplace`,
        type: "website",
        images: seoImage.map((img) => ({
          url: img,
          width: 1200,
          height: 630,
        })),
      },

      twitter: {
        card: "summary_large_image",
        title: parent.name,
        description:
          description ||
          `Explore ${parent.name} on Afrovending Online Marketplace`,
        images: seoImage,
      },
    };
  } catch (err) {
    console.error("SEO metadata error:", err);
    return {
      title: "Category not found",
      description: "The requested category does not exist.",
    };
  }
}

export default async function CategoriesSlugPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};

  const slug = resolvedParams.slug;
  const type = resolvedSearch?.type;

  // Validate type
  if (!type) {
    return toast.error("Category type is required");
  }
  if (!["products", "services"].includes(type)) {
    return toast.error("Invalid category type");
  }
  if (!slug) return notFound();

  // Fetch category and children
  let data: CategoryData | null = null;
  try {
    data = await getCategoryWithChildren(type, slug);
    if (!data?.parent) {
      return toast.error("Category not found");
    }
  } catch (err) {
    console.error("API error:", err);
    return toast.error("Failed to fetch category data");
  }

  const { parent, children } = data;
  const linkBase = "/items";
  const parentLink = `${linkBase}?category=${parent.slug}&type=${type}`;

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-50 min-h-screen">
      <header className="mb-10 p-6 bg-white shadow-xl rounded-xl border-t-8 border-hub-secondary">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
          {parent.name}
        </h1>
        {parent.description && (
          <p className="text-gray-600 mb-4 text-lg">{parent.description}</p>
        )}
        <Link
          href={parentLink}
          className="inline-flex items-center text-lg font-semibold text-hub-primary hover:text-hub-secondary transition"
        >
          View all items in {parent.name}
          <ChevronRightIcon className="w-5 h-5 ml-1" />
        </Link>
      </header>

      <section>
        {children.length === 0 ? (
          <div className="p-10 bg-white rounded-xl shadow text-center">
            <p className="text-gray-500 text-lg">No subcategories found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {children.map((sub) => (
              <Link
                key={sub.slug}
                href={`${linkBase}?category=${sub.slug}&type=${type}`}
                className="group block p-5 bg-white border rounded-lg shadow hover:shadow-xl hover:border-hub-primary transition"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-20 h-20 mb-3">
                    {sub.image ? (
                      <Image
                        src={sub.image}
                        alt={sub.name}
                        fill
                        sizes="80px"
                        className="rounded-full object-cover border-4 border-hub-secondary/50 group-hover:border-hub-primary transition"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-hub-secondary/10 flex items-center justify-center">
                        <ChevronRightIcon className="w-8 h-8 text-hub-secondary" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 group-hover:text-hub-primary line-clamp-2">
                    {sub.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
