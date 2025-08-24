import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import ReviewList from "./ReviewList";
import "./UserProfile.css";
import "./ScoreboardPage.css";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [scoreboard, setScoreboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reviews');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user data
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setUser(null);
          setLoading(false);
          return;
        }
        const userData = { id: userSnap.id, ...userSnap.data() };
        setUser(userData);

        // Process reviews
        const reviewsArr = Array.isArray(userData.reviews) ? userData.reviews : [];
        setUserReviews(reviewsArr);
        if (reviewsArr.length > 0) {
          const sum = reviewsArr.reduce((acc, r) => acc + (typeof r.rating === 'number' ? r.rating : 0), 0);
          setAvgRating((sum / reviewsArr.length).toFixed(2));
        } else {
          setAvgRating(null);
        }

        // Fetch scoreboard
        const usersRef = collection(db, "users");
        const scoreboardQ = query(usersRef, orderBy("avgRating", "desc"), orderBy("totalReviews", "desc"));
        const scoreboardSnap = await getDocs(scoreboardQ);
        const scoreboardList = scoreboardSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 5);
        setScoreboard(scoreboardList);
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading profile...</p>
    </div>
  );
  
  if (!user) return (
    <div className="error-container">
      <h2>User Not Found</h2>
      <p>The user you're looking for doesn't exist.</p>
      <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
    </div>
  );

  return (
    <div className="user-profile-page">
      <button onClick={() => navigate(-1)} className="back-btn">
        <span className="back-arrow">←</span> Back
      </button>
      
      <div className="profile-header">
        <div className="avatar-container">
          <div className="user-avatar">
            {user.fname?.charAt(0)}{user.lname?.charAt(0)}
          </div>
          {avgRating !== null && (
            <div className="rating-badge">
              <span className="star-icon">★</span>
              {avgRating}
            </div>
          )}
        </div>
        
        <div className="user-info">
          <h1>{user.fname} {user.lname}</h1>
          <p className="user-title">Member since {user.createdAt ? new Date(user.createdAt.seconds * 1000).getFullYear() : '2023'}</p>
          
          <div className="stats-container">
            <div className="stat">
              <span className="stat-value">{userReviews.length}</span>
              <span className="stat-label">Reviews</span>
            </div>
            <div className="stat">
              <span className="stat-value">{avgRating || '0.0'}</span>
              <span className="stat-label">Avg Rating</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {scoreboard.findIndex(u => u.id === userId) + 1 || '-'}
              </span>
              <span className="stat-label">Rank</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="profile-content">
        <div className="main-content">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
            <button 
              className={`tab ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'reviews' ? (
              <div className="reviews-section">
                <h3>Reviews for {user.fname}</h3>
                {userReviews.length > 0 ? (
                  <div className="reviews-list">
                    {userReviews.map((review, idx) => {
                      const currentUid = localStorage.getItem('uid');
                      const isCurrentUser = review.uid === currentUid;
                      return (
                        <div key={idx} className="review-card">
                          <div className="review-header">
                            <div className="review-rating">
                              <span className="star-icon">★</span>
                              {review.rating}
                            </div>
                            <span className="review-date">
                              {review.createdAt && (
                                new Date(
                                  review.createdAt.seconds ? 
                                  review.createdAt.seconds * 1000 : 
                                  review.createdAt
                                ).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              )}
                            </span>
                          </div>
                          <p className="review-text">{review.reviewText}</p>
                          <div className="review-footer">
                            <span className="review-author">
                              by {review.reviewerName ? review.reviewerName : 'Anonymous'}
                            </span>
                            {isCurrentUser && (
                              <button 
                                className="edit-review-btn"
                                onClick={() => navigate(`/review/${user.id}`)}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <h4>No reviews yet</h4>
                    <p>This user hasn't received any reviews yet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="details-section">
                <div className="detail-card">
                  <h4>Contact Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{user.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{user.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Gender</span>
                      <span className="detail-value">{user.gender || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date of Birth</span>
                      <span className="detail-value">{user.dob || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
                
                {user.address && (
                  <div className="detail-card">
                    <h4>Address</h4>
                    <div className="address-text">
                      {user.address.address && <p>{user.address.address}</p>}
                      <p>
                        {[user.address.state, user.address.pin, user.address.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="sidebar">
          <div className="scoreboard-card">
            <div className="card-header">
              <h3>🏆 Top Reviewers</h3>
            </div>
            <div className="scoreboard-list">
              {scoreboard.length > 0 ? (
                scoreboard.map((u, idx) => (
                  <div 
                    key={u.id} 
                    className={`scoreboard-item ${u.id === userId ? 'current-user' : ''}`}
                  >
                    <span className="rank">{idx + 1}</span>
                    <span className="name">{u.fname} {u.lname}</span>
                    <div className="score-info">
                      <span className="rating">⭐ {u.avgRating?.toFixed(1) ?? "N/A"}</span>
                      <span className="count">({u.totalReviews ?? 0})</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No users found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;