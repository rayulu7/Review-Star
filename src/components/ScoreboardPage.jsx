
import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import "./ScoreboardPage.css";

const ScoreboardPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("avgRating", "desc"), orderBy("totalReviews", "desc"));
        const snapshot = await getDocs(q);

        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(userList);
      } catch (error) {
        console.error("Error fetching scoreboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopUsers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="scoreboard-page">
      <h2>🏆 Top Rated Roommates</h2>
      <div className="scoreboard-list">
        {users.length > 0 ? (
          users.map((user, index) => (
            <div key={user.id} className="scoreboard-item">
              <span className="rank">{index + 1}</span>
              <span className="name">{user.fname} {user.lname}</span>
              <span className="rating">⭐ {user.avgRating.toFixed(1)}</span>
              <span className="count">({user.totalReviews} reviews)</span>
            </div>
          ))
        ) : (
          <p>No users found.</p>
        )}
      </div>
    </div>
  );
};

export default ScoreboardPage;