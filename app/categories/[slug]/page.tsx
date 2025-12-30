import { getCategoryWithChildren } from "@/lib/api/category";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import Category from "@/interfaces/category";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ type?: string }>;
}

interface CategoryData {
  parent: Category;
  children: Category[];
}

type PageMetadataParams = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ type?: string }>;
};

// --------------------- METADATA ---------------------
export async function generateMetadata({
  params,
  searchParams,
}: PageMetadataParams): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};

  const slug = resolvedParams.slug;
  const type = resolvedSearch?.type;

  if (!slug || !type || !["products", "services"].includes(type)) {
    return {
      title: "Category not found",
      description: "The requested category does not exist.",
    };
  }

  try {
    const categoryData = await getCategoryWithChildren(type, slug);
    const parent = categoryData?.parent;

    if (!parent) {
      return {
        title: "Category not found",
        description: "The requested category does not exist.",
      };
    }

    const description = parent.description
      ?.replace(/<\/?[^>]+(>|$)/g, "")
      .slice(0, 155);

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

// --------------------- PAGE COMPONENT ---------------------
export default async function CategoriesSlugPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};

  const slug = resolvedParams.slug;
  const type = resolvedSearch?.type;

  if (!slug || !type || !["products", "services"].includes(type))
    return notFound();

  // Fetch category and children
  let data: CategoryData;
  try {
    data = await getCategoryWithChildren(type, slug);
    if (!data?.parent) return notFound();
  } catch (err) {
    console.error("API error:", err);
    return notFound();
  }

  const { parent, children } = data;
  const linkBase = "/items";
  const parentLink = `${linkBase}?category=${parent.slug}&type=${type}`;

  return (
    <div className="container mx-auto px-4 py-12 bg-gray-50 min-h-screen">
      <header className="relative mb-10 rounded-xl overflow-hidden shadow-xl">
        {/* Background Image */}
        {parent.image && (
          <div className="absolute inset-0">
            <Image
              src={parent.image}
              alt={parent.name}
              fill
              className="object-cover w-full h-full brightness-75"
            />
            <div className="absolute inset-0 bg-black/40"></div>{" "}
          </div>
        )}

        {/* Caption Content */}
        <div className="relative z-10 p-6 flex flex-col justify-end h-64">
          <h1 className="sm:text-4xl text-sm font-extrabold text-white! mb-2">
            {parent.name}
          </h1>
          {parent.description && (
            <p className="sm:text-lg text-xs text-white/80! mb-4 line-clamp-2">
              {parent.description}
            </p>
          )}
          <Link
            href={parentLink}
            className="inline-flex items-center sm:text-lg text-[9px] font-semibold text-white hover:text-gray-200 transition truncate"
          >
            View all items in {parent.name}
            <ChevronRightIcon className="sm:w-5 sm:h-5 h-3 w-3 ml-1" />
          </Link>
        </div>
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
                        className="rounded-full object-cover border border-hub-secondary/50 group-hover:border-hub-primary transition"
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
