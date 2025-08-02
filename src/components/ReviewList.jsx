
import React from "react";
import ReviewItem from "./ReviewItem";
import "./ReviewList.css";

const ReviewList = ({ reviews }) => {
  return (
    <div className="review-list">
      {reviews.map(review => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </div>
  );
};

export default ReviewList;