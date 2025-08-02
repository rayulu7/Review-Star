
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "./firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import ReviewList from "./ReviewList";
import ReviewForm from "./ReviewForm";
import "./ReviewPage.css";

const ReviewPage = () => {
  const { userId } = useParams(); 
  const [reviewedUser, setReviewedUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [currentUserReview, setCurrentUserReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setUserNotFound(true);
          setLoading(false);
          return;
        }

        setReviewedUser(userSnap.data());

       
        const reviewsRef = collection(db, "reviews");
        const q = query(reviewsRef, where("toUserId", "==", userId));
        const snapshot = await getDocs(q);

        const reviewList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setReviews(reviewList);

       
        if (currentUser) {
          const currentUserReview = reviewList.find(
            r => r.fromUserId === currentUser.uid
          );
          setCurrentUserReview(currentUserReview || null);
        }
      } catch (error) {
        console.error("Error fetching review data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (userNotFound) {
    return <div>User not found</div>;
  }

  return (
    <div className="review-page">
      <h2>Reviews for {reviewedUser.fname} {reviewedUser.lname}</h2>

     
      <div className="scoreboard">
        <span className="rating">⭐ {reviewedUser.avgRating?.toFixed(1) || 0}</span>
        <span className="count">({reviewedUser.totalReviews || 0} reviews)</span>
      </div>

      
      {currentUser && !currentUserReview && (
        <div className="review-form-container">
          <h3>Write a Review</h3>
          <ReviewForm reviewedUserId={userId} />
        </div>
      )}

      {currentUser && currentUserReview && (
        <p className="already-reviewed">You've already reviewed this user.</p>
      )}

      
      <div className="review-list-container">
        <h3>All Reviews</h3>
        {reviews.length > 0 ? (
          <ReviewList reviews={reviews} />
        ) : (
          <p>No reviews yet. Be the first!</p>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;