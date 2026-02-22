"use client";

import { useEffect, useState } from "react";
import { Restaurant } from "@/types";
import { useReviewStore } from "@/stores/reviewStore";
import { useBookingStore } from "@/stores/bookingStore";
import { canReview } from "@/lib/reviewEligibility";
import { computeAverageRating } from "@/lib/mockApi/reviews";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="w-4 text-right text-text-muted">{label}</span>
      <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
        <div className="h-full bg-gold rounded-full transition-all duration-[var(--dur-slow)]" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-[12px] text-text-muted">{count}</span>
    </div>
  );
}

export function ReviewsSection({ restaurant }: { restaurant: Restaurant }) {
  const { reviews, loading, loadReviews, addReview } = useReviewStore();
  const { bookings, loadBookings } = useBookingStore();
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formName, setFormName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadReviews(restaurant.id); loadBookings(); }, [restaurant.id, loadReviews, loadBookings]);

  const eligibility = canReview(restaurant.id, bookings, reviews);
  const { avg, count: reviewCount } = computeAverageRating(reviews, restaurant.rating);
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({ label: String(star), count: reviews.filter((r) => r.rating === star).length }));

  const handleSubmit = async () => {
    if (!formComment.trim()) { setError("Please write a comment"); return; }
    if (!eligibility.eligibleBooking) return;
    setSubmitting(true); setError("");
    await addReview({ restaurantId: restaurant.id, bookingId: eligibility.eligibleBooking.id, customerName: formName || eligibility.eligibleBooking.customerName, rating: formRating, comment: formComment.trim() });
    setShowForm(false); setFormComment(""); setFormRating(5); setSubmitting(false);
  };

  return (
    <section>
      <h2 className="font-serif text-[24px] font-bold text-text-primary tracking-[-0.5px] mb-4">Reviews</h2>

      <div className="flex flex-col sm:flex-row gap-6 mb-6 p-5 bg-surface rounded-[var(--radius-lg)] border border-border">
        <div className="text-center sm:text-left shrink-0">
          <p className="text-4xl font-bold text-text-primary">{avg}</p>
          <RatingStars rating={Math.round(avg)} />
          <p className="text-[13px] text-text-muted mt-1">{reviewCount > 0 ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""}` : `${restaurant.reviewCount} seed reviews`}</p>
        </div>
        {reviewCount > 0 && (
          <div className="flex-1 space-y-1.5">
            {ratingDistribution.map((rd) => <RatingBar key={rd.label} label={rd.label} count={rd.count} total={reviewCount} />)}
          </div>
        )}
      </div>

      {eligibility.eligible && !showForm && (
        <Button variant="brandGhost" size="sm" className="mb-6" onClick={() => { setFormName(eligibility.eligibleBooking?.customerName ?? ""); setShowForm(true); }}>
          Write a Review
        </Button>
      )}
      {!eligibility.eligible && !loading && (
        <p className="text-[13px] text-text-muted mb-6 italic">You can write a review after completing a booking at this restaurant.</p>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}>
        <ModalHeader title="Write a Review" onClose={() => setShowForm(false)} />
        <ModalBody className="space-y-4">
          <div>
            <label className="text-[13px] font-semibold text-text-secondary mb-2 block">Your Rating</label>
            <RatingStars rating={formRating} interactive onChange={setFormRating} size="lg" />
          </div>
          <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} />
          <Textarea label="Comment" value={formComment} onChange={(e) => setFormComment(e.target.value)} rows={4} placeholder="Share your dining experience..." error={error} />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} loading={submitting}>Submit Review</Button>
        </ModalFooter>
      </Modal>

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="animate-pulse border border-border rounded-[var(--radius-lg)] p-4 bg-surface"><div className="h-4 bg-card rounded w-1/3 mb-2" /><div className="h-3 bg-card rounded w-full mb-1" /><div className="h-3 bg-card rounded w-2/3" /></div>)}</div>
      ) : reviews.length === 0 ? (
        <p className="text-[13px] text-text-muted py-4">No reviews yet. Be the first to share your experience!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-border rounded-[var(--radius-lg)] p-4 bg-surface transition-colors duration-[var(--dur-fast)] hover:bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-dim flex items-center justify-center text-brand-light font-bold text-[13px]">{review.customerName.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-[13px] font-semibold text-text-primary">{review.customerName}</p>
                    <p className="text-[11px] text-text-muted">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <RatingStars rating={review.rating} size="sm" />
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
