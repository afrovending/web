import { Metadata } from "next";
import ItemDetail from "../components/ItemDetail";
import { getItemDetail } from "@/lib/api/items";
import { IoChevronForward } from "react-icons/io5";
import Link from "next/link";

type PageParams = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;

  try {
    const response = await getItemDetail(slug);
    const product = response.data.product;

    const description = product.description
      ?.replace(/<\/?[^>]+(>|$)/g, "")
      .slice(0, 155);

    const seoKeywords = Array.isArray(product.keywords)
      ? product.keywords
      : product.keywords?.split(",").map((k: any) => k.trim()) || [];

    return {
      title: `${product.title} | Afrovending Online Marketplace`,
      description: description,
      keywords: seoKeywords,
      alternates: {
        canonical: `https://afrovending.com/items/${slug}`,
      },
      openGraph: {
        title: product.title,
        description: product.meta_description || description,
        type: "website",
        images: product.images?.map((img: string) => ({
          url: img,
          width: 1200,
          height: 630,
        })),
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description: product.meta_description || description,
        images: product.images?.[0] ? [product.images[0]] : [],
      },
    };
  } catch {
    return {
      title: "Product not found",
      description: "This product does not exist.",
    };
  }
}

export default async function ItemDetailPage({ params }: PageParams) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;

  try {
    const response = await getItemDetail(slug);

    const product = response.data.product;
    const reviews = response.data.star_rating?.reviews ?? [];
    const recommended = response.data.recommended ?? [];
    const frequentlyBoughtTogether =
      response.data.frequently_bought_together ?? [];
    const otherViews = response.data.otherViews ?? [];
    const customerAlsoViewed = response.data.customerAlsoViewed ?? [];

    const star_rating = response.data.star_rating ?? { total: 0, reviews: [] };

    // --- Unified Structured Data ---
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      image: product.images,
      description: product.description?.replace(/<\/?[^>]+(>|$)/g, ""),
      sku: product.sku || `SKU-${product.id}`,
      brand: {
        "@type": "Brand",
        name: "Afrovending Online Marketplace",
      },
      offers: {
        "@type": "Offer",
        url: `https://afrovending.com/items/${product.slug}`,
        priceCurrency: "GBP", // Use your actual currency
        price: product.sales_price,
        itemCondition: "https://schema.org/NewCondition",
        availability:
          product.quantity > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
      },
      // Only include AggregateRating if there are actually ratings
      ...(star_rating.total > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.average_rating || 0,
          reviewCount: star_rating.total,
        },
      }),
    };

    // Breadcrumb Schema helps Google show the path in search results
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://afrovending.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: product.category.name,
          item: `https://afrovending.com/items?category=${product.category.slug}`,
        },
        { "@type": "ListItem", position: 3, name: product.title },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <nav
          className="text-sm text-gray-500 my-4 px-4 overflow-hidden"
          aria-label="Breadcrumb"
        >
          <ol className="list-none flex items-center w-full">
            {/* Home - Fixed width */}
            <li className="shrink-0 flex items-center">
              <Link
                href="/"
                className="text-hub-primary hover:text-hub-secondary"
              >
                Home
              </Link>
              <span className="mx-2 text-gray-400">
                <IoChevronForward />
              </span>
            </li>

            {/* Category - Truncated */}
            <li className="flex items-center min-w-0 max-w-[100px] sm:max-w-none">
              <Link
                href={`/items?category=${product.category.slug}`}
                className="text-hub-primary hover:text-hub-secondary truncate block"
              >
                {product.category.name}
              </Link>
              <span className="mx-2 shrink-0 text-gray-400">
                <IoChevronForward />
              </span>
            </li>

            {/* Product Title - Truncated */}
            <li
              className="text-hub-primary font-semibold truncate min-w-0 flex-1"
              aria-current="page"
              title={product.title} // Shows full name on hover
            >
              {product.title}
            </li>
          </ol>
        </nav>
        <ItemDetail
          product={product}
          reviews={reviews}
          star_rating={star_rating}
          recommended={recommended}
          frequentlyBoughtTogether={frequentlyBoughtTogether}
          otherViews={otherViews}
          customerAlsoViewed={customerAlsoViewed}
        />
      </>
    );
  } catch {
    return (
      <div className="p-10 text-center text-red-500 font-medium">
        Failed to load product.
      </div>
    );
  }
}
