import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const app = express();

// Set up server-side storage file
const DB_FILE = path.join(process.cwd(), "database.json");

// Conditionally initialize Firebase Admin SDK
let firebaseDb: admin.firestore.Firestore | null = null;
let useFirebase = false;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (admin.apps.length > 0) {
    firebaseDb = admin.firestore();
    useFirebase = true;
    console.log("✅ Firebase Admin already initialized. Reusing existing app.");
  } else if (serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseDb = admin.firestore();
    useFirebase = true;
    console.log("✅ Firebase Admin successfully initialized using FIREBASE_SERVICE_ACCOUNT_KEY.");
  } else if (projectId && clientEmail && privateKey) {
    const formattedKey = privateKey.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedKey
      })
    });
    firebaseDb = admin.firestore();
    useFirebase = true;
    console.log("✅ Firebase Admin successfully initialized using individual environment credentials.");
  } else {
    console.log("ℹ️ Firebase environment variables not fully set. Running in local fallback mode (database.json).");
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin, running in local fallback mode:", error);
}


// Define basic types
export interface Location {
  area: string;
  city: string;
  district: string;
  pincode: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface Issue {
  id: string;
  citizenName: string;
  citizenPhone: string;
  title: string;
  category: string;
  location: Location;
  description: string;
  translatedDescription: string;
  photoUrl: string;
  status: "submitted" | "accepted" | "in_progress" | "waiting_verification" | "resolved" | "rejected";
  upvotes: string[]; // List of user phone numbers
  downvotes: string[]; // List of user phone numbers
  risk: "low" | "moderate" | "high" | "emergency";
  priority: "low" | "medium" | "high" | "critical";
  raisedDate: string;
  resolvedDate: string | null;
  resolvedPhotoUrl: string | null;
  resolvedNote: string | null;
  verificationUpvotes: string[];
  verificationDownvotes: string[];
}

export interface User {
  phone: string;
  name: string;
  points: number;
  acceptedCount: number;
  role: "citizen" | "authority";
}

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { phone: "9876543210", name: "Rajesh Kumar", points: 210, acceptedCount: 3, role: "citizen" },
  { phone: "9812345678", name: "Ananya Sharma", points: 130, acceptedCount: 2, role: "citizen" },
  { phone: "9123456789", name: "Vikram Singh", points: 80, acceptedCount: 1, role: "citizen" },
  { phone: "9988776655", name: "Priya Patel", points: 50, acceptedCount: 1, role: "citizen" },
  { phone: "9000000000", name: "Amit Verma", points: 0, acceptedCount: 0, role: "citizen" }
];

const INITIAL_ISSUES: Issue[] = [
  {
    id: "iss_1",
    citizenName: "Rajesh Kumar",
    citizenPhone: "9876543210",
    title: "Dangerous potholes on Connaught Place Main Circle",
    category: "Road Problem",
    location: {
      area: "Connaught Place",
      city: "New Delhi",
      district: "New Delhi District",
      pincode: "110001",
      state: "Delhi",
      latitude: 28.6304,
      longitude: 77.2177
    },
    description: "कनॉट प्लेस के इनर सर्किल पर बहुत बड़े गड्ढे हो गए हैं। कल रात दो स्कूटर वाले यहाँ गिरकर चोटिल हो गए। कृपया इसे जल्दी से ठीक करवाएं।",
    translatedDescription: "Very large potholes have formed on the inner circle of Connaught Place. Last night, two scooter riders fell and got injured here. Please repair this quickly.",
    photoUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    status: "submitted",
    upvotes: ["9812345678", "9123456789", "9988776655"],
    downvotes: [],
    risk: "high",
    priority: "high",
    raisedDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // 1 day ago
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
    location: {
      area: "Sector 3, near KV School",
      city: "Kolkata",
      district: "North 24 Parganas",
      pincode: "700098",
      state: "West Bengal",
      latitude: 22.5726,
      longitude: 88.4233
    },
    description: "স্কুলের গেটের ঠিক পাশে ময়লার স্তূপ জমে আছে। পচা গন্ধ চারদিকে ছড়াচ্ছে এবং বাচ্চাদের অসুস্থ হওয়ার আশঙ্কা রয়েছে। কর্পোরেশন গাড়ি ৩ দিন ধরে আসেনি।",
    translatedDescription: "A huge pile of garbage has accumulated right next to the school gate. Rotting smell is spreading around, posing health risks to children. The corporation truck has not arrived for 3 days.",
    photoUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    status: "accepted",
    upvotes: ["9876543210", "9123456789"],
    downvotes: [],
    risk: "moderate",
    priority: "medium",
    raisedDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
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
    location: {
      area: "Andheri Link Road, near Pillar 104",
      city: "Mumbai",
      district: "Mumbai Suburban",
      pincode: "400053",
      state: "Maharashtra",
      latitude: 19.1197,
      longitude: 72.8468
    },
    description: "Main water pipe bust here, clean drinking water is bursting out like a fountain and flooding the street. Waste of municipal water.",
    translatedDescription: "Main water pipe burst here. Clean drinking water is bursting out like a fountain and flooding the street, leading to immense wastage of municipal water.",
    photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600",
    status: "in_progress",
    upvotes: ["9876543210", "9812345678", "9988776655", "9000000000"],
    downvotes: [],
    risk: "moderate",
    priority: "medium",
    raisedDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago
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
    location: {
      area: "100 Feet Road, near Metro Station",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      pincode: "560038",
      state: "Karnataka",
      latitude: 12.9716,
      longitude: 77.5946
    },
    description: "An extremely dangerous open manhole on the main footpath. It has no warning sign. Someone could fall and die, especially with the monsoon starting.",
    translatedDescription: "Extremely dangerous open manhole on the main footpath without any warning sign. High risk of fatal accidents, especially with the onset of the monsoon.",
    photoUrl: "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=600",
    status: "waiting_verification",
    upvotes: ["9876543210", "9812345678"],
    downvotes: [],
    risk: "emergency",
    priority: "critical",
    raisedDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), // 7 days ago
    resolvedDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // Resolved 2 hours ago
    resolvedPhotoUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600",
    resolvedNote: "We have securely placed a new reinforced cement concrete (RCC) heavy manhole cover and sealed the boundary to ensure citizen safety.",
    verificationUpvotes: ["9876543210", "9812345678", "9123456789"], // Needs 5 upvotes to transition to resolved, or 5 downvotes to in_progress
    verificationDownvotes: []
  },
  {
    id: "iss_5",
    citizenName: "Rajesh Kumar",
    citizenPhone: "9876543210",
    title: "Dead streetlights making Adyar backroad pitch dark",
    category: "Streetlight Failure",
    location: {
      area: "Gandhi Nagar, 3rd Main Road",
      city: "Chennai",
      district: "Chennai District",
      pincode: "600020",
      state: "Tamil Nadu",
      latitude: 13.0063,
      longitude: 80.2574
    },
    description: "Adyar main connection backroad has 10 streetlights and none of them are working. Pitch dark after 6 PM, ladies and kids are afraid to walk.",
    translatedDescription: "A series of 10 streetlights on Adyar backroad are completely non-functional. It is pitch dark after 6 PM, making residents, especially women and kids, feel unsafe.",
    photoUrl: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&q=80&w=600",
    status: "resolved",
    upvotes: ["9812345678", "9988776655", "9123456789", "9000000000"],
    downvotes: [],
    risk: "high",
    priority: "high",
    raisedDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), // 10 days ago
    resolvedDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
    resolvedPhotoUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=600",
    resolvedNote: "The electrical wiring short circuit has been fixed, and all 10 non-working bulbs replaced with modern bright energy-efficient LED luminaires.",
    verificationUpvotes: ["9812345678", "9988776655", "9123456789", "9876543210", "9000000000"], // 5 upvotes reached -> Resolved
    verificationDownvotes: []
  }
];

// In-memory database cache
let cachedDb: { users: User[]; issues: Issue[] } | null = null;

// Read/Write database helper functions
export function writeLocalDatabase(data: { users: User[]; issues: Issue[] }) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing database.json", error);
  }
}

export async function readDatabase(): Promise<{ users: User[]; issues: Issue[] }> {
  if (cachedDb) {
    return cachedDb;
  }

  if (useFirebase && firebaseDb) {
    try {
      const issuesSnapshot = await firebaseDb.collection("issues").get();
      const usersSnapshot = await firebaseDb.collection("users").get();

      // Validate schema: filter out docs that don't match the expected Issue/User schema
      const issues = issuesSnapshot.docs
        .map((doc) => doc.data())
        .filter((d) => d && typeof d.id === "string" && typeof d.citizenPhone === "string") as Issue[];
      const users = usersSnapshot.docs
        .map((doc) => doc.data())
        .filter((d) => d && typeof d.phone === "string" && typeof d.name === "string") as User[];

      // If valid data is empty or mostly corrupted, re-seed Firestore
      if (issues.length === 0) {
        console.log("🌱 No valid issues found in Firestore. Seeding initial JantaMitra mock data...");
        // Clear any corrupt docs first
        const allIssueDocs = issuesSnapshot.docs;
        if (allIssueDocs.length > 0) {
          for (const doc of allIssueDocs) await doc.ref.delete();
          console.log(`🗑️ Removed ${allIssueDocs.length} corrupt/old-schema issue docs.`);
        }
        for (const issue of INITIAL_ISSUES) {
          await firebaseDb.collection("issues").doc(issue.id).set(issue);
        }
      }

      if (users.length === 0) {
        console.log("🌱 No valid users found in Firestore. Seeding initial users...");
        // Clear any corrupt docs first
        const allUserDocs = usersSnapshot.docs;
        if (allUserDocs.length > 0) {
          for (const doc of allUserDocs) await doc.ref.delete();
          console.log(`🗑️ Removed ${allUserDocs.length} corrupt/old-schema user docs.`);
        }
        for (const user of INITIAL_USERS) {
          await firebaseDb.collection("users").doc(user.phone).set(user);
        }
      }

      const finalIssues = issues.length > 0 ? issues : INITIAL_ISSUES;
      const finalUsers = users.length > 0 ? users : INITIAL_USERS;

      // Sync local file as backup
      cachedDb = { users: finalUsers, issues: finalIssues };
      writeLocalDatabase(cachedDb);
      return cachedDb;
    } catch (error) {
      console.error("⚠️ Error reading from Firestore. Falling back to local file:", error);
    }
  }

  // Fallback to local file
  if (!fs.existsSync(DB_FILE)) {
    const data = { users: INITIAL_USERS, issues: INITIAL_ISSUES };
    writeLocalDatabase(data);
    cachedDb = data;
    return data;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    // Validate schema: ensure users and issues arrays exist with correct fields
    const validUsers = Array.isArray(parsed.users)
      ? parsed.users.filter((u: any) => u && typeof u.phone === "string" && typeof u.name === "string")
      : [];
    const validIssues = Array.isArray(parsed.issues)
      ? parsed.issues.filter((i: any) => i && typeof i.id === "string" && typeof i.citizenPhone === "string")
      : [];
    if (validIssues.length === 0 || validUsers.length === 0) {
      console.warn("⚠️ Local database.json has invalid/old schema. Resetting to initial data.");
      const data = { users: INITIAL_USERS, issues: INITIAL_ISSUES };
      writeLocalDatabase(data);
      cachedDb = data;
      return data;
    }
    const data = { users: validUsers as User[], issues: validIssues as Issue[] };
    cachedDb = data;
    return data;
  } catch (error) {
    console.error("Error reading local database. Initializing fresh mock data.", error);
    const data = { users: INITIAL_USERS, issues: INITIAL_ISSUES };
    writeLocalDatabase(data);
    cachedDb = data;
    return data;
  }
}

export async function writeDatabase(data: { users: User[]; issues: Issue[] }) {
  cachedDb = data;
  // Sync to local file backup
  writeLocalDatabase(data);

  if (useFirebase && firebaseDb) {
    // Sync to Firestore in the background
    (async () => {
      try {
        const userPromises = data.users.map((u) =>
          firebaseDb!.collection("users").doc(u.phone).set(u)
        );
        const issuePromises = data.issues.map((i) =>
          firebaseDb!.collection("issues").doc(i.id).set(i)
        );
        await Promise.all([...userPromises, ...issuePromises]);
      } catch (error) {
        console.error("⚠️ Error syncing to Firestore in background:", error);
      }
    })();
  }
}

export async function saveUser(user: User, db: { users: User[]; issues: Issue[] }) {
  // Update local memory and file first
  const index = db.users.findIndex((u) => u.phone === user.phone);
  if (index !== -1) {
    db.users[index] = user;
  } else {
    db.users.push(user);
  }
  cachedDb = db;
  writeLocalDatabase(db);

  if (useFirebase && firebaseDb) {
    // Write to Firestore in the background without blocking
    firebaseDb.collection("users").doc(user.phone).set(user).catch((error) => {
      console.error(`⚠️ Error saving user ${user.phone} to Firestore in background:`, error);
    });
  }
}

export async function saveIssue(issue: Issue, db: { users: User[]; issues: Issue[] }) {
  // Update local memory and file first
  const index = db.issues.findIndex((i) => i.id === issue.id);
  if (index !== -1) {
    db.issues[index] = issue;
  } else {
    db.issues.push(issue);
  }
  cachedDb = db;
  writeLocalDatabase(db);

  if (useFirebase && firebaseDb) {
    // Write to Firestore in the background without blocking
    firebaseDb.collection("issues").doc(issue.id).set(issue).catch((error) => {
      console.error(`⚠️ Error saving issue ${issue.id} to Firestore in background:`, error);
    });
  }
}


// Heuristic local fallback analysis engine
function getLocalAnalysisFallback(description: string) {
  console.log("Processing description via local fallback engine:", description);
  const lowercase = description.toLowerCase();
  let category = "Others";
  let risk: "low" | "moderate" | "high" | "emergency" = "low";
  let priority: "low" | "medium" | "high" | "critical" = "low";
  let translated = description;

  // Keyword heuristic mapping for high-fidelity offline translation & categorization
  if (lowercase.includes("road") || lowercase.includes("pothole") || lowercase.includes("गड्ढा") || lowercase.includes("सड़क")) {
    category = "Road Problem";
    risk = "high";
    priority = "high";
    translated = lowercase.includes("गड्ढा")
      ? "There is a severe pothole/road damage issue causing public safety concerns and potential accidents."
      : description;
  } else if (lowercase.includes("garbage") || lowercase.includes("dump") || lowercase.includes("waste") || lowercase.includes("कचरा") || lowercase.includes("कूड़ा")) {
    category = "Garbage Issue";
    risk = "moderate";
    priority = "medium";
    translated = lowercase.includes("कचरा")
      ? "Huge accumulation of garbage on the street creating unhygienic conditions and bad odor."
      : description;
  } else if (lowercase.includes("water") || lowercase.includes("leak") || lowercase.includes("pipe") || lowercase.includes("पानी")) {
    category = "Water Related";
    risk = "moderate";
    priority = "medium";
    translated = lowercase.includes("पानी")
      ? "Water pipeline leakage flooding the local area and leading to clean drinking water loss."
      : description;
  } else if (lowercase.includes("manhole") || lowercase.includes("sewage") || lowercase.includes("drain") || lowercase.includes("नाला")) {
    category = "Sewage & Drainage";
    risk = "emergency";
    priority = "critical";
  } else if (lowercase.includes("light") || lowercase.includes("dark") || lowercase.includes("electricity") || lowercase.includes("बिजली")) {
    category = "Streetlight Failure";
    risk = "high";
    priority = "high";
  }

  return {
    translatedDescription: translated,
    category,
    risk,
    priority
  };
}

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini API client initialized successfully.");
    } else {
      console.warn("No valid GEMINI_API_KEY found in environment. Using fallback translation engine.");
    }
  }
  return geminiClient;
}

// Express parsing middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[Express API] ${req.method} ${req.url}`);
  next();
});

// --- API ROUTES ---

// 0. Geocoding: Reverse geocode coordinates to a real Indian address
app.get("/api/geocode/reverse", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "lat and lng parameters are required" });
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: "Invalid lat or lng values" });
  }

  try {
    // Standard reverse geocoding from openstreetmap
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "JantaMitra-AI/1.0 (kvp8624@gmail.com)"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed with status: ${response.status}`);
    }

    const data: any = await response.json();
    if (data && data.address) {
      const address = data.address;

      // Extract parts of address
      const road = address.road || address.pedestrian || address.suburb || address.neighbourhood || address.amenity || address.industrial || "";
      const suburb = address.suburb || address.neighbourhood || "";
      const area = [road, suburb].filter(Boolean).join(", ") || data.display_name.split(",").slice(0, 2).join(",").trim();

      const city = address.city || address.town || address.village || address.county || "";
      const district = address.state_district || address.county || address.city_district || "";
      const pincode = address.postcode || "";
      const state = address.state || "";

      return res.json({
        area: area || "Registered Location",
        city: city || "Unknown City",
        district: district || "Unknown District",
        pincode: pincode || "000000",
        state: state || "Unknown State",
        latitude,
        longitude
      });
    } else {
      throw new Error("No address details returned from geocoding API");
    }
  } catch (error) {
    console.warn("Reverse geocoding failed, using closest fallback preset matching:", error);

    // Closest preset matching fallback
    const allPresets = [
      { area: "M G Road Walkway", city: "Bengaluru", district: "Bengaluru Urban", pincode: "560001", state: "Karnataka", latitude: 12.9716, longitude: 77.5946 },
      { area: "Salt Lake City Sector 5", city: "Kolkata", district: "North 24 Parganas", pincode: "700091", state: "West Bengal", latitude: 22.5726, longitude: 88.4233 },
      { area: "Colaba Causeway near Taj", city: "Mumbai", district: "Mumbai City", pincode: "400005", state: "Maharashtra", latitude: 18.9261, longitude: 72.8224 },
      { area: "Rajouri Garden Block D", city: "New Delhi", district: "West Delhi", pincode: "110027", state: "Delhi", latitude: 28.6448, longitude: 77.1902 },
      { area: "T Nagar Shopping Area", city: "Chennai", district: "Chennai District", pincode: "600017", state: "Tamil Nadu", latitude: 13.0405, longitude: 80.2337 },
      { area: "Gachibowli Tech Circle", city: "Hyderabad", district: "Rangareddy", pincode: "500032", state: "Telangana", latitude: 17.4483, longitude: 78.3741 }
    ];

    let closestPreset = allPresets[0];
    let minDistance = Infinity;

    // Haversine distance function
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    for (const preset of allPresets) {
      const dist = getDistance(latitude, longitude, preset.latitude, preset.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestPreset = preset;
      }
    }

    return res.json({
      ...closestPreset,
      latitude,
      longitude
    });
  }
});

// In-memory OTP storage mapping: phone -> { otp, expiresAt }
const activeOtps = new Map<string, { otp: string; expiresAt: number }>();

// Helper: Send actual SMS (via Twilio, Textbelt, or console fallback)
async function sendSMS(phone: string, otp: string): Promise<boolean> {
  const messageBody = `Your JantaMitra verification OTP is ${otp}. Valid for 5 minutes.`;
  const toNumber = phone.startsWith("+") ? phone : `+91${phone}`;

  // 1. Try Twilio if configured in environment
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      console.log(`[SMS Gateway] Attempting Twilio SMS send to ${toNumber}...`);
      const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          From: twilioFrom,
          To: toNumber,
          Body: messageBody
        })
      });

      if (response.ok) {
        console.log(`[SMS Gateway] Twilio SMS sent successfully to ${toNumber}`);
        return true;
      } else {
        const errText = await response.text();
        console.error(`[SMS Gateway] Twilio API returned error: ${errText}`);
      }
    } catch (err) {
      console.error("[SMS Gateway] Twilio fetch error:", err);
    }
  }

  // 2. Try Textbelt free API tier (1 free SMS per day per IP)
  try {
    console.log(`[SMS Gateway] Attempting Textbelt free SMS send to ${toNumber}...`);
    const response = await fetch("https://textbelt.com/text", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        number: toNumber,
        message: messageBody,
        key: "textfree"
      })
    });

    const data: any = await response.json();
    if (data && data.success) {
      console.log(`[SMS Gateway] Textbelt free SMS sent successfully to ${toNumber}`);
      return true;
    } else {
      console.warn(`[SMS Gateway] Textbelt free quota/error: ${data.error || "unknown"}`);
    }
  } catch (err) {
    console.error("[SMS Gateway] Textbelt fetch error:", err);
  }

  // 3. Fallback: print to server console so developer can copy it
  console.log(`\n======================================================`);
  console.log(`[SMS Gateway Fallback] OTP code for ${toNumber} is: ${otp}`);
  console.log(`======================================================\n`);
  return false;
}

// 1a. Auth: Request unique OTP
app.post("/api/auth/request-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length !== 10 || isNaN(Number(phone))) {
    return res.status(400).json({ error: "Valid 10-digit mobile number is required" });
  }

  // Generate random 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Store in memory (expires in 5 minutes)
  activeOtps.set(phone, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  // Attempt real SMS send
  const smsSent = await sendSMS(phone, otp);

  // Return success (OTP is hidden from JSON payload)
  res.json({ success: true, smsSent });
});

// 1b. Auth: Citizen Sign In / Sign Up (OTP verification)
app.post("/api/auth/citizen", async (req, res) => {
  const { name, phone, otp } = req.body;
  if (!name || !phone || !otp) {
    return res.status(400).json({ error: "Name, Mobile number, and OTP are required" });
  }

  const storedData = activeOtps.get(phone);
  if (!storedData) {
    return res.status(400).json({ error: "No OTP was requested for this mobile number." });
  }

  if (Date.now() > storedData.expiresAt) {
    activeOtps.delete(phone);
    return res.status(400).json({ error: "OTP has expired. Please request a new one." });
  }

  if (String(storedData.otp).trim() !== String(otp).trim()) {
    return res.status(400).json({ error: "Incorrect OTP code. Please try again." });
  }

  // OTP verified successfully
  activeOtps.delete(phone);

  const db = await readDatabase();
  let user = db.users.find((u) => u.phone === phone);

  if (!user) {
    user = {
      phone,
      name,
      points: 0,
      acceptedCount: 0,
      role: "citizen"
    };
    await saveUser(user, db);
  } else {
    if (user.role !== "citizen") {
      return res.status(403).json({ error: "This mobile number belongs to an authority account" });
    }
  }

  res.json({ success: true, user });
});


// 2. Auth: Authority Sign In
app.post("/api/auth/authority", (req, res) => {
  const { govtId, password } = req.body;
  if (!govtId || !password) {
    return res.status(400).json({ error: "Govt. ID and Password are required" });
  }

  const validAuthorities = [
    { govtId: "GOVT-1234", name: "Officer Saxena", password: "authority" },
    { govtId: "GOVT-5678", name: "Director Iyer", password: "authority" },
    { govtId: "admin", name: "System Admin", password: "admin" }
  ];

  const authority = validAuthorities.find((a) => a.govtId === govtId && a.password === password);
  if (!authority) {
    return res.status(401).json({ error: "Invalid Government ID or Password" });
  }

  res.json({
    success: true,
    user: {
      phone: govtId,
      name: authority.name,
      points: 9999,
      acceptedCount: 0,
      role: "authority"
    }
  });
});

// 3. Issues: Get all issues
app.get("/api/issues", async (req, res) => {
  const db = await readDatabase();
  res.json(db.issues);
});

// 4. Leaderboard: Get citizen standings
app.get("/api/users", async (req, res) => {
  const db = await readDatabase();
  const citizens = db.users.filter((u) => u.role === "citizen");
  citizens.sort((a, b) => b.points - a.points);
  res.json(citizens);
});


// 5. AI: Analyze citizen description
app.post("/api/ai/analyze", async (req, res) => {
  const { description } = req.body;
  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "Description text is required for AI analysis" });
  }

  const client = getGeminiClient();

  if (!client) {
    console.log("No Gemini client found. Using fallback local analysis.");
    const fallbackData = getLocalAnalysisFallback(description);
    return res.json(fallbackData);
  }

  const prompt = `You are the core AI module of the JantaMitra civic portal. Analyze the following citizen-submitted complaint. 
It might be in Hindi, Tamil, Telugu, Marathi, Bengali, English, or any other regional language.

TASK:
1. Detect the language. Translate the complaint description into a short, concise, and clean 1-3 lines of English description.
2. Classify the problem into one of these exact categories: 'Road Problem', 'Garbage Issue', 'Water Related', 'Sewage & Drainage', 'Streetlight Failure', 'Electricity Outage', 'Public Health & Hygiene', or 'Others'.
3. Assess the risk level: 'low' (minor aesthetic), 'moderate' (inconvenience), 'high' (accidents/safety hazard), or 'emergency' (severe active threat to life/property).
4. Assess the municipal priority: 'low', 'medium', 'high', 'critical'.

Complaint Description:
"${description}"`;

  try {
    console.log("Attempting analysis with gemini-2.5-flash...");
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedDescription: {
              type: Type.STRING,
              description: "Short, clean 1-3 lines English translation and summary of the problem."
            },
            category: {
              type: Type.STRING,
              description: "Exact category string matching one of: Road Problem, Garbage Issue, Water Related, Sewage & Drainage, Streetlight Failure, Electricity Outage, Public Health & Hygiene, Others."
            },
            risk: {
              type: Type.STRING,
              description: "Exact risk string matching one of: low, moderate, high, emergency."
            },
            priority: {
              type: Type.STRING,
              description: "Exact priority string matching one of: low, medium, high, critical."
            }
          },
          required: ["translatedDescription", "category", "risk", "priority"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const data = JSON.parse(resultText);
    return res.json(data);
  } catch (err) {
    console.error("gemini-2.5-flash analysis failed, running local fallback:", err);
    const fallbackData = getLocalAnalysisFallback(description);
    return res.json(fallbackData);
  }
});

// 5b. AI: Translate citizen text into English
app.post("/api/ai/translate", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required for translation" });
  }

  const client = getGeminiClient();

  if (!client) {
    console.log("No Gemini client found. Using fallback local translation.");
    const fallbackData = getLocalAnalysisFallback(text);
    return res.json({ translatedText: fallbackData.translatedDescription });
  }

  const prompt = `You are a professional translator for JantaMitra, a civic portal. 
Translate the following user-submitted message into natural, professional, and clear English. 
Keep it concise and preserve all specific civic information like landmarks, road names, and severity.
Do not add extra commentary, greeting, or intro—just return the direct English translation.

Text to translate:
"${text}"`;

  try {
    console.log("Attempting quick translation with gemini-2.5-flash...");
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const translatedText = response.text?.trim() || text;
    return res.json({ translatedText });
  } catch (err) {
    console.error("Gemini translation failed. Error:", err);
    const fallbackData = getLocalAnalysisFallback(text);
    return res.json({ translatedText: fallbackData.translatedDescription });
  }
});

// 6. Issues: Submit a new issue
app.post("/api/issues", async (req, res) => {
  const { citizenName, citizenPhone, title, category, location, description, translatedDescription, photoUrl, risk, priority } = req.body;

  if (!citizenPhone || !title || !photoUrl || !description) {
    return res.status(400).json({ error: "Mandatory fields: Phone, Title, Image proof, and Description are required." });
  }

  const db = await readDatabase();
  const newIssue: Issue = {
    id: "iss_" + Math.random().toString(36).substr(2, 9),
    citizenName: citizenName || "Citizen",
    citizenPhone,
    title,
    category: category || "Others",
    location: location || {
      area: "General Area",
      city: "Unknown",
      district: "Unknown",
      pincode: "000000",
      state: "Unknown",
      latitude: 20.5937,
      longitude: 78.9629
    },
    description,
    translatedDescription: translatedDescription || description,
    photoUrl,
    status: "submitted",
    upvotes: [],
    downvotes: [],
    risk: risk || "low",
    priority: priority || "low",
    raisedDate: new Date().toISOString(),
    resolvedDate: null,
    resolvedPhotoUrl: null,
    resolvedNote: null,
    verificationUpvotes: [],
    verificationDownvotes: []
  };

  await saveIssue(newIssue, db);

  res.json({ success: true, issue: newIssue });
});


// 7. Issues: Upvote or Downvote an issue
app.post("/api/issues/:id/vote", async (req, res) => {
  const { id } = req.params;
  const { phone, type } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "User phone is required to register a vote." });
  }

  const db = await readDatabase();
  const issue = db.issues.find((i) => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found." });
  }

  if (issue.status === "resolved" || issue.status === "rejected") {
    return res.status(400).json({ error: "Cannot vote on resolved or rejected complaints." });
  }

  issue.upvotes = issue.upvotes.filter((p) => p !== phone);
  issue.downvotes = issue.downvotes.filter((p) => p !== phone);

  if (type === "up") {
    issue.upvotes.push(phone);
  } else if (type === "down") {
    issue.downvotes.push(phone);
  }

  await saveIssue(issue, db);
  res.json({ success: true, issue });
});

// 8. Issues: Verification vote
app.post("/api/issues/:id/verify-vote", async (req, res) => {
  const { id } = req.params;
  const { phone, type } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "User phone is required to verify." });
  }

  const db = await readDatabase();
  const issue = db.issues.find((i) => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found." });
  }

  if (issue.status !== "waiting_verification") {
    return res.status(400).json({ error: "This complaint is not in verification status." });
  }

  issue.verificationUpvotes = issue.verificationUpvotes.filter((p) => p !== phone);
  issue.verificationDownvotes = issue.verificationDownvotes.filter((p) => p !== phone);

  if (type === "up") {
    issue.verificationUpvotes.push(phone);
  } else if (type === "down") {
    issue.verificationDownvotes.push(phone);
  }

  if (issue.verificationUpvotes.length >= 5) {
    issue.status = "resolved";
    issue.resolvedDate = new Date().toISOString();
  }

  if (issue.verificationDownvotes.length >= 5) {
    issue.status = "in_progress";
    issue.verificationUpvotes = [];
    issue.verificationDownvotes = [];
    issue.resolvedPhotoUrl = null;
    issue.resolvedNote = null;
    issue.resolvedDate = null;
  }

  await saveIssue(issue, db);
  res.json({ success: true, issue });
});


// 9. Issues: Authority Status Update
app.post("/api/issues/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, resolvedPhotoUrl, resolvedNote } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Target status is required." });
  }

  const db = await readDatabase();
  const issue = db.issues.find((i) => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found." });
  }

  if (issue.status === "resolved" || issue.status === "rejected") {
    return res.status(400).json({ error: "This issue is final and its status cannot be modified." });
  }

  const oldStatus = issue.status;
  let creatorUpdated = false;
  let creatorUser: User | undefined;

  if (status === "accepted") {
    issue.status = "accepted";
    if (oldStatus === "submitted") {
      const creator = db.users.find((u) => u.phone === issue.citizenPhone);
      if (creator) {
        let pointsToAdd = 10;
        if (issue.risk === "moderate") pointsToAdd = 20;
        if (issue.risk === "high") pointsToAdd = 50;
        if (issue.risk === "emergency") pointsToAdd = 100;

        creator.points += pointsToAdd;
        creator.acceptedCount += 1;
        creatorUser = creator;
        creatorUpdated = true;
      }
    }
  } else if (status === "rejected") {
    issue.status = "rejected";
    if (resolvedNote) {
      issue.resolvedNote = resolvedNote;
    }
  } else if (status === "in_progress") {
    if (issue.status !== "accepted") {
      return res.status(400).json({ error: "Issues must be Accepted before marking them In Progress." });
    }
    issue.status = "in_progress";
  } else if (status === "resolved") {
    if (issue.status !== "in_progress") {
      return res.status(400).json({ error: "Only In-Progress issues can be resolved." });
    }
    if (!resolvedPhotoUrl || !resolvedNote) {
      return res.status(400).json({ error: "Authority must upload a resolved proof photo and a summary note." });
    }

    issue.status = "waiting_verification";
    issue.resolvedPhotoUrl = resolvedPhotoUrl;
    issue.resolvedNote = resolvedNote;
    issue.verificationUpvotes = [];
    issue.verificationDownvotes = [];
  } else {
    return res.status(400).json({ error: "Invalid status transition request." });
  }

  if (creatorUpdated && creatorUser) {
    await saveUser(creatorUser, db);
  }
  await saveIssue(issue, db);
  res.json({ success: true, issue });
});


export { app };
