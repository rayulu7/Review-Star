import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReviewForm = () => {
  const { userId } = useParams();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExistingReview = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const reviews = userSnap.data().reviews || [];
        const found = reviews.find(r => r.uid === uid);
        if (found) {
          setExistingReview(found);
          setRating(found.rating);
          setReviewText(found.reviewText);
        }
      }
      setLoading(false);
    };
    fetchExistingReview();
  }, [userId]);

  const handleStarClick = (star) => setRating(star);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !reviewText) {
      toast.error('Please provide a rating and review text.');
      return;
    }
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('User not authenticated');
      
      const reviewerDocRef = doc(db, 'users', uid);
      const reviewerSnap = await getDoc(reviewerDocRef);
      const reviewerName = reviewerSnap.exists() ? reviewerSnap.data().fname : 'Unknown';
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      let reviews = userSnap.exists() ? (userSnap.data().reviews || []) : [];
      const now = new Date();
      const newReview = {
        uid,
        reviewerName,
        rating,
        reviewText,
        createdAt: now,
      };
      const existingIdx = reviews.findIndex(r => r.uid === uid);
      if (existingIdx !== -1) {
        
        reviews[existingIdx] = { ...reviews[existingIdx], ...newReview, createdAt: now };
      } else {
        
        reviews.push(newReview);
      }
      await updateDoc(userDocRef, {
        reviews,
        reviewUpdatedAt: now,
      });
      toast.success(existingIdx !== -1 ? 'Review updated!' : 'Review submitted!');
      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      toast.error('Failed to submit review.');
    }
  };

  return (
    <div className="review-form-container">
      <h2>{existingReview ? 'Edit Your Review' : 'Write a Review'}</h2>
      {loading ? <div>Loading...</div> : (
        <form onSubmit={handleSubmit}>
          <div className="star-rating">
            {[1,2,3,4,5].map(star => (
              <span
                key={star}
                style={{ cursor: 'pointer', color: star <= rating ? 'gold' : 'gray', fontSize: '2rem' }}
                onClick={() => handleStarClick(star)}
              >
                ★
              </span>
            ))}
          </div>
          <textarea
            placeholder="Write your review..."
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            rows={4}
            style={{ width: '100%', marginTop: '1rem' }}
          />
          <button type="submit" style={{ marginTop: '1rem' }}>{existingReview ? 'Update Review' : 'Submit Review'}</button>
        </form>
      )}
      <ToastContainer />
    </div>
  );
};

export default ReviewForm;
