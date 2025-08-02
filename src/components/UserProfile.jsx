import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import ReviewList from "./ReviewList";
import "./Profile.css";
import "./ScoreboardPage.css";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [scoreboard, setScoreboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setUser(null);
          setLoading(false);
          return;
        }
        const userData = { id: userSnap.id, ...userSnap.data() };
        setUser(userData);

        
        const reviewsArr = Array.isArray(userData.reviews) ? userData.reviews : [];
        setUserReviews(reviewsArr);
        if (reviewsArr.length > 0) {
          const sum = reviewsArr.reduce((acc, r) => acc + (typeof r.rating === 'number' ? r.rating : 0), 0);
          setAvgRating((sum / reviewsArr.length).toFixed(2));
        } else {
          setAvgRating(null);
        }

        
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

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found.</div>;

  return (
    <div className="user-profile-page">
      <button onClick={() => navigate(-1)} className="back-btn">Back</button>
      <div className="profile-container">
        <h2>{user.fname} {user.lname}</h2>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Gender:</b> {user.gender}</p>
        <p><b>DOB:</b> {user.dob}</p>
        <p><b>Phone:</b> {user.phone}</p>
        <p><b>Address:</b> {user.address?.address}, {user.address?.state}, {user.address?.pin}, {user.address?.country}</p>
        <p><b>Average Rating:</b> {avgRating !== null ? avgRating : "N/A"}</p>
        <p><b>Total Reviews:</b> {userReviews.length}</p>
      </div>
      <div className="reviews-section">
        <h3>Reviews for {user.fname}</h3>
        {userReviews.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {userReviews.map((review, idx) => {
              const currentUid = localStorage.getItem('uid');
              const isCurrentUser = review.uid === currentUid;
              return (
                <li key={idx} style={{ borderBottom: '1px solid #eee', marginBottom: 8, paddingBottom: 8 }}>
                  <span style={{ color: 'gold', fontWeight: 'bold' }}>★ {review.rating}</span>
                  <span style={{ marginLeft: 8 }}>{review.reviewText}</span>
                  <span style={{ marginLeft: 16, color: '#888', fontSize: '0.9em' }}>{review.createdAt && (new Date(review.createdAt.seconds ? review.createdAt.seconds * 1000 : review.createdAt)).toLocaleString()}</span>
                  <span style={{ marginLeft: 16, color: '#007bff', fontWeight: 'bold' }}>by {review.reviewerName ? review.reviewerName : review.uid}</span>
                  {isCurrentUser && (
                    <button style={{ marginLeft: 16 }} onClick={() => navigate(`/review/${user.id}`)}>Edit</button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : <p>No reviews yet.</p>}
      </div>
      <div className="scoreboard-section">
        <h3>🏆 Scoreboard</h3>
        <div className="scoreboard-list">
          {scoreboard.length > 0 ? (
            scoreboard.map((u, idx) => (
              <div key={u.id} className="scoreboard-item">
                <span className="rank">{idx + 1}</span>
                <span className="name">{u.fname} {u.lname}</span>
                <span className="rating">⭐ {u.avgRating?.toFixed(1) ?? "N/A"}</span>
                <span className="count">({u.totalReviews ?? 0} reviews)</span>
              </div>
            ))
          ) : (
            <p>No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
