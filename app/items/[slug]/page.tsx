import { Metadata } from "next";
import ItemDetail from "../components/ItemDetail";
import { getItemDetail } from "@/lib/api/items";

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  // const { slug } = params;
  const awaitedParams = await params;
  const slug = awaitedParams.slug;

  try {
    const response = await getItemDetail(slug);
    const product = response.data.product;

    return {
      title: `${product.title} | Afrovending Online Marketplace`,
      description:
        product.meta_description || product.description?.slice(0, 155),

      openGraph: {
        title: product.title,
        description:
          product.meta_description || product.description?.slice(0, 155),
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
        description:
          product.meta_description || product.description?.slice(0, 155),
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
type PageParams = {
  params: {
    slug: string;
  };
};

export default async function ItemDetailPage({ params }: PageParams) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;

  try {
    const response = await getItemDetail(slug);

    const product = response.data.product;

    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      image: product.images,
      description: product.description,
      sku: product.sku || product.id,
      brand: {
        "@type": "Brand",
        name: "Afrovending Online Marketplace",
      },
      offers: {
        "@type": "Offer",
        url: `https://ayokah.co.uk/items/${product.slug}`,
        priceCurrency: "GBP",
        price: product.sales_price,
        itemCondition: "https://schema.org/NewCondition",
        availability:
          product.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
      },
      aggregateRating:
        product.average_rating > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: product.average_rating,
              reviewCount: product.reviews?.length || 0,
            }
          : undefined,
    };

    return (
      <>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema),
          }}
        />

        <ItemDetail product={product} />
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
