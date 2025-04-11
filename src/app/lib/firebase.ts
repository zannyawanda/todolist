import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
    apiKey: "AIzaSyBMn12BAWFYMPqgt2sZ1C6VW_h6Nz67rxc",
    authDomain: "projectzanny.firebaseapp.com",
    projectId: "projectzanny",
    storageBucket: "projectzanny.firebasestorage.app",
    messagingSenderId: "1014638706793",
    appId: "1:1014638706793:web:034b6302d4df06187de2f8",
    measurementId: "G-ZQVFS8BRJG"
  };

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

