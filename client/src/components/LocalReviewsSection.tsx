import { Star, Quote } from "lucide-react";

interface Review {
  author: string;
  rating: number;
  datePublished: string;
  reviewBody: string;
}

interface LocalReviewsSectionProps {
  town: string;
  reviews: Review[];
}

export function LocalReviewsSection({ town, reviews }: LocalReviewsSectionProps) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            What {town} Residents Say
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Real reviews from your neighbors
          </p>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white p-4 sm:p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <Quote className="h-6 w-6 sm:h-8 sm:w-8 text-johnson-blue/20 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-3 italic">
                      "{review.reviewBody}"
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      {review.author}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
