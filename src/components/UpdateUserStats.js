
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../components/firebase";

export const updateUserStats = async (userId) => {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("toUserId", "==", userId));
    const snapshot = await getDocs(q);

    let totalReviews = snapshot.size;
    let avgRating = 0;

    if (totalReviews > 0) {
      const ratingsSum = snapshot.docs.reduce(
        (sum, doc) => sum + doc.data().rating,
        0
      );
      avgRating = parseFloat((ratingsSum / totalReviews).toFixed(2));
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      totalReviews,
      avgRating,
    });
  } catch (error) {
    console.error("Error updating user stats:", error);
  }
};