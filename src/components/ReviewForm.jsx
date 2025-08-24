import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReviewForm = () => {
  const { userId } = useParams();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch user being reviewed
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          
          // Check for existing review
          const reviews = userSnap.data().reviews || [];
          const found = reviews.find(r => r.uid === uid);
          if (found) {
            setExistingReview(found);
            setRating(found.rating);
            setReviewText(found.reviewText);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error('Failed to load review data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  const handleStarClick = (star) => setRating(star);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error('Please select a rating.');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Please write your review.');
      return;
    }
    if (reviewText.length < 10) {
      toast.error('Review should be at least 10 characters long.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('User not authenticated');
      
      const reviewerDocRef = doc(db, 'users', uid);
      const reviewerSnap = await getDoc(reviewerDocRef);
      const reviewerName = reviewerSnap.exists() 
        ? `${reviewerSnap.data().fname} ${reviewerSnap.data().lname}`.trim() 
        : 'Anonymous User';
        
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      let reviews = userSnap.exists() ? (userSnap.data().reviews || []) : [];
      const now = new Date();
      
      const newReview = {
        uid,
        reviewerName,
        rating,
        reviewText: reviewText.trim(),
        createdAt: now,
      };
      
      const existingIdx = reviews.findIndex(r => r.uid === uid);
      if (existingIdx !== -1) {
        // Update existing review
        reviews[existingIdx] = { ...reviews[existingIdx], ...newReview, updatedAt: now };
      } else {
        // Add new review
        reviews.push(newReview);
      }
      
      await updateDoc(userDocRef, {
        reviews,
        lastReviewUpdate: now,
      });
      
      toast.success(existingIdx !== -1 ? 'Review updated successfully!' : 'Review submitted successfully!');
      setTimeout(() => navigate(`/user/${userId}`), 1500);
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="review-loading-container">
        <div className="review-spinner"></div>
        <p>Loading review form...</p>
      </div>
    );
  }

  return (
    <div className="review-form-page">
      <div className="review-form-card">
        <button 
          onClick={() => navigate(-1)} 
          className="review-back-btn"
          disabled={submitting}
        >
          <span className="back-arrow">←</span> Back
        </button>
        
        <div className="review-header">
          <h1>{existingReview ? 'Edit Your Review' : 'Write a Review'}</h1>
          {userData && (
            <p className="reviewing-user">
              for {userData.fname} {userData.lname}
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="review-form">
          <div className="rating-section">
            <label>How would you rate your experience?</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={`star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="rating-labels">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
            {rating > 0 && (
              <p className="selected-rating-text">
                You selected {rating} star{rating !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div className="review-text-section">
            <label htmlFor="review-text">Share your experience</label>
            <textarea
              id="review-text"
              placeholder="What did you like or dislike? What could be improved?"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={5}
              maxLength={500}
            />
            <div className="character-count">
              {reviewText.length}/500 characters
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting || !rating || reviewText.length < 10}
              className="submit-btn"
            >
              {submitting ? (
                <>
                  <span className="submit-spinner"></span>
                  {existingReview ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                existingReview ? 'Update Review' : 'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer 
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default ReviewForm;