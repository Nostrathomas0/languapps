// firebaseUtils.js
import { db } from './firebaseInit.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// Store JWT token in Firestore
export async function storeJwtInFirestore(userId, jwtToken) {
  try {
    const userDoc = doc(db, 'users', userId);
    await setDoc(userDoc, { jwtToken }, { merge: true });
    console.log("JWT token stored in Firestore for user:", userId);
  } catch (error) {
    console.error("Error storing JWT token:", error);
  }
}

// Retrieve JWT token from Firestore
export async function getJwtFromFirestore(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data().jwtToken : null;
  } catch (error) {
    console.error("Error retrieving JWT token:", error);
    return null;
  }
}
