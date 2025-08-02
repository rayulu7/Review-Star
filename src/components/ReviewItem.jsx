
import React from "react";
import StarRating from "./StarRating";
import "./ReviewItem.css";

const ReviewItem = ({ review }) => {
  return (
    <div className="review-item">
      <h4>{review.name}</h4>
      <StarRating selectedStars={review.rating} readonly />
      <p>{review.comment}</p>
    </div>
  );
};

export default ReviewItem;