
const admin = require("firebase-admin");
const serviceAccount = require("./path-to-your-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function addMissingFieldsToUsers() {
  try {
    const usersSnapshot = await db.collection("users").get();
    const batch = db.batch();

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      const updates = {};

      if (data.totalReviews === undefined) updates.totalReviews = 0;
      if (data.avgRating === undefined) updates.avgRating = 0;

      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        console.log(`Updated user ${doc.id}:`, updates);
      }
    });

    await batch.commit();
    console.log("Successfully updated all users with missing fields.");
  } catch (error) {
    console.error("Error updating user fields:", error);
  }
}

addMissingFieldsToUsers();