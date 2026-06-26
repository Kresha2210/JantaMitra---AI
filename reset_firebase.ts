/**
 * Firebase Reset & Reseed Script
 * Run: npx tsx reset_firebase.ts
 * Clears all existing Firestore data and seeds the correct initial JantaMitra mock data.
 */
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Firebase credentials missing in .env. Cannot reset.");
  process.exit(1);
}

const formattedKey = privateKey.replace(/\\n/g, "\n");

const app = admin.apps.length > 0
  ? admin.app()
  : admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey: formattedKey })
    });

const db = admin.firestore(app);

// ---- CORRECT SCHEMA DATA ----

const INITIAL_USERS = [
  { phone: "9876543210", name: "Rajesh Kumar", points: 210, acceptedCount: 3, role: "citizen" },
  { phone: "9812345678", name: "Ananya Sharma", points: 130, acceptedCount: 2, role: "citizen" },
  { phone: "9123456789", name: "Vikram Singh", points: 80, acceptedCount: 1, role: "citizen" },
  { phone: "9988776655", name: "Priya Patel", points: 50, acceptedCount: 1, role: "citizen" },
  { phone: "9000000000", name: "Amit Verma", points: 0, acceptedCount: 0, role: "citizen" }
];

const now = Date.now();
const INITIAL_ISSUES = [
  {
    id: "iss_1",
    citizenName: "Rajesh Kumar",
    citizenPhone: "9876543210",
    title: "Dangerous potholes on Connaught Place Main Circle",
    category: "Road Problem",
    location: { area: "Connaught Place", city: "New Delhi", district: "New Delhi District", pincode: "110001", state: "Delhi", latitude: 28.6304, longitude: 77.2177 },
    description: "कनॉट प्लेस के इनर सर्किल पर बहुत बड़े गड्ढे हो गए हैं। कल रात दो स्कूटर वाले यहाँ गिरकर चोटिल हो गए।",
    translatedDescription: "Very large potholes have formed on the inner circle of Connaught Place. Last night, two scooter riders fell and got injured here. Please repair this quickly.",
    photoUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    status: "submitted",
    upvotes: ["9812345678", "9123456789", "9988776655"],
    downvotes: [],
    risk: "high",
    priority: "high",
    raisedDate: new Date(now - 24 * 3600 * 1000).toISOString(),
    resolvedDate: null,
    resolvedPhotoUrl: null,
    resolvedNote: null,
    verificationUpvotes: [],
    verificationDownvotes: []
  },
  {
    id: "iss_2",
    citizenName: "Ananya Sharma",
    citizenPhone: "9812345678",
    title: "Overflowing open garbage dump near Salt Lake school",
    category: "Garbage Issue",
    location: { area: "Sector 3, near KV School", city: "Kolkata", district: "North 24 Parganas", pincode: "700098", state: "West Bengal", latitude: 22.5726, longitude: 88.4233 },
    description: "স্কুলের গেটের ঠিক পাশে ময়লার স্তূপ জমে আছে। পচা গন্ধ চারদিকে ছড়াচ্ছে এবং বাচ্চাদের অসুস্থ হওয়ার আশঙ্কা রয়েছে।",
    translatedDescription: "A huge pile of garbage has accumulated right next to the school gate. Rotting smell is spreading around, posing health risks to children. The corporation truck has not arrived for 3 days.",
    photoUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    status: "accepted",
    upvotes: ["9876543210", "9123456789"],
    downvotes: [],
    risk: "moderate",
    priority: "medium",
    raisedDate: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
    resolvedDate: null,
    resolvedPhotoUrl: null,
    resolvedNote: null,
    verificationUpvotes: [],
    verificationDownvotes: []
  },
  {
    id: "iss_3",
    citizenName: "Vikram Singh",
    citizenPhone: "9123456789",
    title: "Major water pipeline leakage at Andheri West metro pillar",
    category: "Water Related",
    location: { area: "Andheri Link Road, near Pillar 104", city: "Mumbai", district: "Mumbai Suburban", pincode: "400053", state: "Maharashtra", latitude: 19.1197, longitude: 72.8468 },
    description: "Main water pipe bust here, clean drinking water is bursting out like a fountain and flooding the street. Waste of municipal water.",
    translatedDescription: "Main water pipe burst here. Clean drinking water is bursting out like a fountain and flooding the street, leading to immense wastage of municipal water.",
    photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600",
    status: "in_progress",
    upvotes: ["9876543210", "9812345678", "9988776655", "9000000000"],
    downvotes: [],
    risk: "moderate",
    priority: "medium",
    raisedDate: new Date(now - 5 * 24 * 3600 * 1000).toISOString(),
    resolvedDate: null,
    resolvedPhotoUrl: null,
    resolvedNote: null,
    verificationUpvotes: [],
    verificationDownvotes: []
  },
  {
    id: "iss_4",
    citizenName: "Priya Patel",
    citizenPhone: "9988776655",
    title: "Open manhole cover on Indiranagar 100 Feet Road",
    category: "Sewage & Drainage",
    location: { area: "100 Feet Road, near Metro Station", city: "Bengaluru", district: "Bengaluru Urban", pincode: "560038", state: "Karnataka", latitude: 12.9716, longitude: 77.5946 },
    description: "An extremely dangerous open manhole on the main footpath. It has no warning sign. Someone could fall and die, especially with the monsoon starting.",
    translatedDescription: "Extremely dangerous open manhole on the main footpath without any warning sign. High risk of fatal accidents, especially with the onset of the monsoon.",
    photoUrl: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=600",
    status: "waiting_verification",
    upvotes: ["9876543210", "9812345678"],
    downvotes: [],
    risk: "emergency",
    priority: "critical",
    raisedDate: new Date(now - 7 * 24 * 3600 * 1000).toISOString(),
    resolvedDate: new Date(now - 2 * 3600 * 1000).toISOString(),
    resolvedPhotoUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600",
    resolvedNote: "We have securely placed a new reinforced cement concrete (RCC) heavy manhole cover and sealed the boundary to ensure citizen safety.",
    verificationUpvotes: ["9876543210", "9812345678", "9123456789"],
    verificationDownvotes: []
  },
  {
    id: "iss_5",
    citizenName: "Rajesh Kumar",
    citizenPhone: "9876543210",
    title: "Dead streetlights making Adyar backroad pitch dark",
    category: "Streetlight Failure",
    location: { area: "Gandhi Nagar, 3rd Main Road", city: "Chennai", district: "Chennai District", pincode: "600020", state: "Tamil Nadu", latitude: 13.0063, longitude: 80.2574 },
    description: "Adyar main connection backroad has 10 streetlights and none of them are working. Pitch dark after 6 PM, ladies and kids are afraid to walk.",
    translatedDescription: "A series of 10 streetlights on Adyar backroad are completely non-functional. It is pitch dark after 6 PM, making residents, especially women and kids, feel unsafe.",
    photoUrl: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&q=80&w=600",
    status: "resolved",
    upvotes: ["9812345678", "9988776655", "9123456789", "9000000000"],
    downvotes: [],
    risk: "high",
    priority: "high",
    raisedDate: new Date(now - 10 * 24 * 3600 * 1000).toISOString(),
    resolvedDate: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
    resolvedPhotoUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=600",
    resolvedNote: "The electrical wiring short circuit has been fixed, and all 10 non-working bulbs replaced with modern bright energy-efficient LED luminaires.",
    verificationUpvotes: ["9812345678", "9988776655", "9123456789", "9876543210", "9000000000"],
    verificationDownvotes: []
  },
  {
    id: "iss_6",
    citizenName: "Amit Verma",
    citizenPhone: "9000000000",
    title: "Electricity outage in entire Sector 12 for 3 days",
    category: "Electricity Outage",
    location: { area: "Sector 12, Block B", city: "Noida", district: "Gautam Buddha Nagar", pincode: "201301", state: "Uttar Pradesh", latitude: 28.5355, longitude: 77.3910 },
    description: "Our entire sector has had no electricity for 3 days. Transformer blew up on Sunday. No response from UPCL helpline. Patients at home, food spoiling.",
    translatedDescription: "The entire Sector 12 area has been without electricity for 3 days following a transformer breakdown. UPCL helpline has been unresponsive. Residents including patients are severely affected.",
    photoUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=600",
    status: "submitted",
    upvotes: ["9876543210", "9812345678", "9123456789", "9988776655"],
    downvotes: [],
    risk: "emergency",
    priority: "critical",
    raisedDate: new Date(now - 1 * 24 * 3600 * 1000).toISOString(),
    resolvedDate: null,
    resolvedPhotoUrl: null,
    resolvedNote: null,
    verificationUpvotes: [],
    verificationDownvotes: []
  }
];

async function deleteCollection(collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`🗑️  Deleted ${snapshot.size} docs from '${collectionName}' collection.`);
}

async function seedCollection(collectionName: string, docs: any[], idField: string) {
  const batch = db.batch();
  for (const doc of docs) {
    const ref = db.collection(collectionName).doc(doc[idField]);
    batch.set(ref, doc);
  }
  await batch.commit();
  console.log(`✅ Seeded ${docs.length} docs into '${collectionName}' collection.`);
}

async function main() {
  console.log("🔄 Starting Firebase Firestore reset...");
  console.log(`📡 Project: ${projectId}\n`);

  // 1. Delete old data
  await deleteCollection("issues");
  await deleteCollection("users");

  // 2. Seed correct data
  await seedCollection("users", INITIAL_USERS, "phone");
  await seedCollection("issues", INITIAL_ISSUES, "id");

  console.log("\n🎉 Firebase reset complete! JantaMitra initial data seeded successfully.");
  console.log("   Restart npm run dev to reload the server with fresh data.");
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
