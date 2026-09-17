import { Quote } from "lucide-react";

import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote:
      "Found a 2BHK in Neelankarai within a week — the locality filters and fresh listings made it easy.",
    name: "Priya S.",
    role: "Buyer · Chennai",
  },
  {
    quote:
      "Listed my flat and got serious enquiries the same day. The process felt clearer than the big portals.",
    name: "Arjun M.",
    role: "Owner · Bengaluru",
  },
  {
    quote:
      "EMI estimate on the listing page helped us budget before we even called the broker.",
    name: "Kavitha R.",
    role: "First-time buyer",
  },
];

type HomeTestimonialsProps = {
  className?: string;
};

export function HomeTestimonials({ className }: HomeTestimonialsProps) {
  return (
    <section
      className={cn("border-t border-gray-200 bg-gradient-to-b from-[#eef4f8] to-white", className)}
      aria-label="What homeowners say"
    >
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:py-12">
        <div className="mb-6 max-w-xl">
          <h2 className="font-display text-xl font-semibold text-gray-900 sm:text-2xl">
            Trusted by people finding their next home
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Short notes from buyers and owners who used Town-X recently.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure
              key={item.name}
              className="border border-gray-200/80 bg-white/80 px-4 py-4 backdrop-blur-sm"
            >
              <Quote className="mb-2 size-4 text-brand-500" aria-hidden />
              <blockquote className="text-sm leading-relaxed text-gray-700">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomeTestimonials;
