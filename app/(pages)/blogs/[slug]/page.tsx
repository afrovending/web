"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaChevronLeft, FaYoutube } from "react-icons/fa";
import { motion } from "framer-motion";
import { getTutorialBySlug, listTutorials } from "@/lib/api/contact";
import { formatHumanReadable } from "@/utils/formatDate";
import Skeleton from "react-loading-skeleton";

interface Tutorial {
  id: number;
  title: string;
  slug: string;
  description: string;
  video_url: string | null;
  image_url: string;
  updated_at: string;
}

export default function TutorialDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [related, setRelated] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getTutorialBySlug(slug);
        const currentData = response.data;
        setTutorial(currentData);

        const listResponse = await listTutorials(0, 4);
        const filtered = listResponse.data.filter(
          (t: Tutorial) => t.slug !== slug
        );
        setRelated(filtered.slice(0, 6));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug]);

  // --- SKELETON LOADING STATE ---
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumb Skeleton */}
        <div className="mb-8">
          <Skeleton width={120} height={24} borderRadius={8} />
        </div>

        {/* Hero Image Skeleton */}
        <div className="mb-10">
          <Skeleton height={400} borderRadius={24} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2">
            <Skeleton
              height={48}
              width="80%"
              className="mb-4"
              borderRadius={12}
            />
            <Skeleton width={200} className="mb-10" />

            <div className="space-y-4">
              <Skeleton count={5} height={18} />
              <Skeleton width="70%" height={18} />
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <Skeleton height={32} width={150} className="mb-6" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 mb-6">
                <Skeleton width={96} height={80} borderRadius={12} />
                <div className="flex-1">
                  <Skeleton count={2} height={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Tutorial not found
        </h2>
        <Link
          href="/blogs"
          className="text-green-500 flex items-center justify-center gap-2"
        >
          <FaChevronLeft /> Back to tutorials
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto p-6 pb-20"
      >
        {/* Navigation */}
        <Link
          href="/blogs"
          className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors mb-8 group"
        >
          <FaChevronLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to all tutorials
        </Link>

        {/* Hero Section */}
        <div className="relative h-75 md:h-125 w-full rounded-3xl overflow-hidden mb-10 shadow-lg">
          <Image
            src={tutorial.image_url}
            alt={tutorial.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
              {tutorial.title}
            </h1>
            <p className="text-gray-400 mb-10">
              Last updated: {formatHumanReadable(tutorial.updated_at)}
            </p>

            <div
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-12 prose-img:rounded-3xl prose-headings:text-gray-900 prose-orange"
              dangerouslySetInnerHTML={{ __html: tutorial.description }}
            />

            {tutorial.video_url && (
              <div className="bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-100 mb-12">
                <h3 className="text-2xl font-bold flex items-center gap-3 mb-6 text-gray-800">
                  <FaYoutube className="text-red-600" /> Watch Video Tutorial
                </h3>
                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
                  <iframe
                    className="w-full h-full"
                    src={tutorial.video_url.replace("watch?v=", "embed/")}
                    title="YouTube video player"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Latest Tutorials */}
          <div className="lg:col-span-1">
            <div className="sticky top-10">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 border-l-4 border-green-500 pl-4">
                Latest Tutorials
              </h3>
              <div className="space-y-6">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blogs/${item.slug}`}
                    className="group block"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="relative h-20 w-24 shrink-0 rounded-xl overflow-hidden shadow-sm">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatHumanReadable(item.updated_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-10 p-6 bg-green-50 rounded-3xl border border-green-100">
                <p className="text-green-800 font-semibold mb-2">Need Help?</p>
                <p className="text-sm text-green-700 mb-4">
                  Can't find what you are looking for? Contact our support team.
                </p>
                <Link
                  href="/contact-us"
                  className="text-sm font-bold text-green-600 hover:underline"
                >
                  Contact Support &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
