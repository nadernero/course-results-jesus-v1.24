// @google/genai-ts: Fix: The 'firebase/app', 'firebase/firestore', and 'firebase/auth' modules do not have the specified exported members in v8. Switched to the v8 compat library to fix initialization errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/auth';


// TODO: Replace the following with your app's Firebase project configuration from the Firebase console.
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "AIzaSyC7ep2vb7UhYTAVZAj78WR2iQcRH_JNxQg",
  authDomain: "course-results-jesus.firebaseapp.com",
  projectId: "course-results-jesus",
  storageBucket: "course-results-jesus.appspot.com",
  messagingSenderId: "683397242327",
  appId: "1:683397242327:web:880331411333ec502a7f92",
  measurementId: "G-MEC27E63R5"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
export const db = firebase.firestore();
export const storage = firebase.storage();
export const auth = firebase.auth();