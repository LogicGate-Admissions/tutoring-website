/* eslint-disable @typescript-eslint/no-require-imports */

// Creates 10 demo tutors and 10 demo students with realistic profiles.
//
// Usage:
//   node scripts/seed-demo.cjs
//   DRY_RUN=true node scripts/seed-demo.cjs

const { loadEnvConfig } = require("@next/env");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

loadEnvConfig(process.cwd());

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");

const serviceAccount = JSON.parse(raw);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

initializeApp({ credential: cert(serviceAccount) });

const auth = getAuth();
const db = getFirestore();
const DRY_RUN = process.env.DRY_RUN === "true";

const DEMO_PASSWORD = "Demo1234!";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function availabilitySummary(blocks) {
  if (!blocks.length) return "Availability not added yet";
  const first = blocks.slice(0, 4).map((b) => `${b.day} ${b.from}-${b.to}`);
  const extra = Math.max(blocks.length - first.length, 0);
  return first.join(", ") + (extra > 0 ? `, +${extra} more` : "");
}

function levelsFromSelections(selections) {
  return selections.filter((s) => s.subjects.length > 0).map((s) => s.category);
}

function subjectsFromSelections(selections) {
  const seen = new Set();
  return selections.flatMap((s) => s.subjects).filter((sub) => {
    if (seen.has(sub)) return false;
    seen.add(sub);
    return true;
  });
}

function normaliseRates(selections, rates) {
  return selections.flatMap((sel) =>
    sel.subjects.map((subject) => {
      const existing = rates.find(
        (r) => r.qualification === sel.category && r.subject === subject
      );
      return {
        qualification: sel.category,
        subject,
        pricePerHour: existing?.pricePerHour ?? 0,
      };
    })
  );
}

function minRate(rates) {
  const nums = rates.map((r) => r.pricePerHour).filter((n) => Number.isFinite(n) && n >= 0);
  return nums.length ? Math.min(...nums) : 0;
}

function uniqueTags(...arrays) {
  return [...new Set(arrays.flat().map((v) => v.trim()).filter(Boolean))];
}

// ─── Tutor definitions ────────────────────────────────────────────────────────

const TUTORS = [
  {
    email: "james.wright@logicgate.com",
    name: "James Wright",
    headline: "Imperial Maths & Physics specialist, 3 years tutoring experience",
    university: "Imperial College London",
    degree: "Mathematics BSc",
    subjectSelections: [
      { category: "A-level", subjects: ["Maths", "Physics"] },
      { category: "GCSE", subjects: ["Maths", "Physics"] },
    ],
    subjectRates: [
      { qualification: "A-level", subject: "Maths", pricePerHour: 60 },
      { qualification: "A-level", subject: "Physics", pricePerHour: 60 },
      { qualification: "GCSE", subject: "Maths", pricePerHour: 45 },
      { qualification: "GCSE", subject: "Physics", pricePerHour: 45 },
    ],
    learningStyles: ["Step-by-step examples", "Past-paper drilling"],
    availability: [
      { id: "1", day: "Mon", from: "18:00", to: "21:00", source: "preset" },
      { id: "2", day: "Wed", from: "18:00", to: "21:00", source: "preset" },
      { id: "3", day: "Sat", from: "09:00", to: "13:00", source: "preset" },
    ],
    bio: "Hi, I'm James — a Mathematics graduate from Imperial College London. I specialise in A-level and GCSE Maths and Physics and have helped students gain top grades for three years. I focus on building a solid conceptual foundation before moving to exam technique.",
  },
  {
    email: "emma.thompson@logicgate.com",
    name: "Emma Thompson",
    headline: "Oxford Natural Sciences — Chemistry & Biology from GCSE to A-level",
    university: "University of Oxford",
    degree: "Natural Sciences BA",
    subjectSelections: [
      { category: "A-level", subjects: ["Chemistry", "Biology"] },
      { category: "GCSE", subjects: ["Chemistry", "Biology"] },
    ],
    subjectRates: [
      { qualification: "A-level", subject: "Chemistry", pricePerHour: 65 },
      { qualification: "A-level", subject: "Biology", pricePerHour: 65 },
      { qualification: "GCSE", subject: "Chemistry", pricePerHour: 50 },
      { qualification: "GCSE", subject: "Biology", pricePerHour: 50 },
    ],
    learningStyles: ["Visual explanations", "Socratic questioning"],
    availability: [
      { id: "1", day: "Tue", from: "17:00", to: "20:00", source: "preset" },
      { id: "2", day: "Thu", from: "17:00", to: "20:00", source: "preset" },
      { id: "3", day: "Sun", from: "10:00", to: "14:00", source: "preset" },
    ],
    bio: "I'm Emma, studying Natural Sciences at Oxford with a focus on Biological and Chemical Sciences. I love breaking down complex mechanisms into clear, memorable explanations. Whether it's organic chemistry or cell biology, I tailor sessions to the student's exam board and learning pace.",
  },
  {
    email: "oliver.chen@logicgate.com",
    name: "Oliver Chen",
    headline: "Cambridge Computer Science — coding, algorithms & A-level Maths",
    university: "University of Cambridge",
    degree: "Computer Science MEng",
    subjectSelections: [
      { category: "A-level", subjects: ["Computer Science", "Maths"] },
      { category: "GCSE", subjects: ["Computer Science", "Maths"] },
    ],
    subjectRates: [
      { qualification: "A-level", subject: "Computer Science", pricePerHour: 55 },
      { qualification: "A-level", subject: "Maths", pricePerHour: 55 },
      { qualification: "GCSE", subject: "Computer Science", pricePerHour: 40 },
      { qualification: "GCSE", subject: "Maths", pricePerHour: 40 },
    ],
    learningStyles: ["Step-by-step examples", "Past-paper drilling"],
    availability: [
      { id: "1", day: "Fri", from: "16:00", to: "20:00", source: "preset" },
      { id: "2", day: "Sat", from: "10:00", to: "16:00", source: "preset" },
    ],
    bio: "Computer Science MEng student at Cambridge. I love teaching programming concepts, data structures, and algorithms as well as the mathematical theory behind them. I'm patient, methodical, and adapt my style to whether you prefer to learn through building projects or through worked exam questions.",
  },
  {
    email: "sophie.williams@logicgate.com",
    name: "Sophie Williams",
    headline: "UCL Economics — A-level Economics & Business Studies tutor",
    university: "University College London",
    degree: "Economics BSc",
    subjectSelections: [
      { category: "A-level", subjects: ["Economics", "Business"] },
      { category: "GCSE", subjects: ["Economics", "Business"] },
    ],
    subjectRates: [
      { qualification: "A-level", subject: "Economics", pricePerHour: 50 },
      { qualification: "A-level", subject: "Business", pricePerHour: 50 },
      { qualification: "GCSE", subject: "Economics", pricePerHour: 38 },
      { qualification: "GCSE", subject: "Business", pricePerHour: 38 },
    ],
    learningStyles: ["Socratic questioning", "Essay planning"],
    availability: [
      { id: "1", day: "Mon", from: "17:00", to: "20:00", source: "preset" },
      { id: "2", day: "Wed", from: "17:00", to: "20:00", source: "preset" },
      { id: "3", day: "Sun", from: "14:00", to: "18:00", source: "preset" },
    ],
    bio: "Hi! I'm Sophie, a second-year Economics student at UCL. I find that most students struggle with evaluating arguments and applying theory to real-world case studies — so that's exactly what I focus on in our sessions. I'm friendly, structured, and always come prepared with relevant examples.",
  },
  {
    email: "liam.harrison@logicgate.com",
    name: "Liam Harrison",
    headline: "Imperial MSci Maths — Further Maths & Maths at A-level",
    university: "Imperial College London",
    degree: "Mathematics MSci",
    subjectSelections: [
      { category: "A-level", subjects: ["Further Maths", "Maths"] },
    ],
    subjectRates: [
      { qualification: "A-level", subject: "Further Maths", pricePerHour: 70 },
      { qualification: "A-level", subject: "Maths", pricePerHour: 65 },
    ],
    learningStyles: ["Past-paper drilling", "Timed practice"],
    availability: [
      { id: "1", day: "Tue", from: "19:00", to: "21:00", source: "preset" },
      { id: "2", day: "Thu", from: "19:00", to: "21:00", source: "preset" },
      { id: "3", day: "Sat", from: "09:00", to: "14:00", source: "preset" },
      { id: "4", day: "Sun", from: "09:00", to: "14:00", source: "preset" },
    ],
    bio: "MSci Mathematics student at Imperial. I've helped more than twenty students through A-level Further Maths and can tackle any module: Pure, Mechanics, Statistics, or Decision. I believe that speed comes from understanding — so I never rush to the formula sheet before we've understood why it works.",
  },
  {
    email: "ava.clarke@logicgate.com",
    name: "Ava Clarke",
    headline: "UCL Physics MSci — IB Physics, Chemistry & Maths tutor",
    university: "University College London",
    degree: "Physics MSci",
    subjectSelections: [
      { category: "IB", subjects: ["Physics", "Chemistry", "Mathematics AA"] },
      { category: "A-level", subjects: ["Physics"] },
    ],
    subjectRates: [
      { qualification: "IB", subject: "Physics", pricePerHour: 60 },
      { qualification: "IB", subject: "Chemistry", pricePerHour: 60 },
      { qualification: "IB", subject: "Mathematics AA", pricePerHour: 60 },
      { qualification: "A-level", subject: "Physics", pricePerHour: 58 },
    ],
    learningStyles: ["Visual explanations", "Step-by-step examples"],
    availability: [
      { id: "1", day: "Mon", from: "16:00", to: "19:00", source: "preset" },
      { id: "2", day: "Fri", from: "16:00", to: "19:00", source: "preset" },
      { id: "3", day: "Sat", from: "11:00", to: "16:00", source: "preset" },
    ],
    bio: "Physics MSci student at UCL who went through the IB programme herself. I understand exactly what the examiners are looking for and can teach all three sciences at IB level. I'm particularly strong on experimental technique and internal assessments.",
  },
  {
    email: "noah.patel@logicgate.com",
    name: "Noah Patel",
    headline: "Warwick Maths — GCSE & A-level Maths, Physics, Chemistry specialist",
    university: "University of Warwick",
    degree: "Mathematics BSc",
    subjectSelections: [
      { category: "GCSE", subjects: ["Maths", "Physics", "Chemistry"] },
      { category: "A-level", subjects: ["Maths"] },
    ],
    subjectRates: [
      { qualification: "GCSE", subject: "Maths", pricePerHour: 45 },
      { qualification: "GCSE", subject: "Physics", pricePerHour: 45 },
      { qualification: "GCSE", subject: "Chemistry", pricePerHour: 45 },
      { qualification: "A-level", subject: "Maths", pricePerHour: 55 },
    ],
    learningStyles: ["Past-paper drilling", "Timed practice"],
    availability: [
      { id: "1", day: "Mon", from: "16:00", to: "18:30", source: "preset" },
      { id: "2", day: "Tue", from: "16:00", to: "18:30", source: "preset" },
      { id: "3", day: "Thu", from: "16:00", to: "18:30", source: "preset" },
      { id: "4", day: "Sat", from: "10:00", to: "14:00", source: "preset" },
    ],
    bio: "Maths student at Warwick with a knack for making numbers click. I specialise in GCSE triple science and maths and have helped students jump two grades with targeted exam prep. I believe every student has the ability — sometimes they just need the right explanation.",
  },
  {
    email: "ethan.moore@logicgate.com",
    name: "Ethan Moore",
    headline: "Bristol Medical student — Biology & Chemistry from GCSE to A-level",
    university: "University of Bristol",
    degree: "Medicine MBBS",
    subjectSelections: [
      { category: "A-level", subjects: ["Biology", "Chemistry"] },
      { category: "GCSE", subjects: ["Biology", "Chemistry"] },
    ],
    subjectRates: [
      { qualification: "A-level", subject: "Biology", pricePerHour: 55 },
      { qualification: "A-level", subject: "Chemistry", pricePerHour: 55 },
      { qualification: "GCSE", subject: "Biology", pricePerHour: 42 },
      { qualification: "GCSE", subject: "Chemistry", pricePerHour: 42 },
    ],
    learningStyles: ["Visual explanations", "Step-by-step examples"],
    availability: [
      { id: "1", day: "Wed", from: "18:00", to: "21:00", source: "preset" },
      { id: "2", day: "Sun", from: "09:00", to: "13:00", source: "preset" },
    ],
    bio: "Medical student at Bristol who loves the biological sciences. I can explain complex processes — from enzyme kinetics to population genetics — in plain language with memorable analogies. I tailor sessions to your exam board (AQA, OCR, Edexcel) and always bring past-paper questions.",
  },
  {
    email: "grace.kim@logicgate.com",
    name: "Grace Kim",
    headline: "Edinburgh Economics — Maths & Economics tutor for all levels",
    university: "University of Edinburgh",
    degree: "Economics BSc",
    subjectSelections: [
      { category: "A-level", subjects: ["Maths", "Economics"] },
      { category: "GCSE", subjects: ["Maths", "Economics"] },
      { category: "Scottish Highers", subjects: ["Mathematics", "Business Management"] },
    ],
    subjectRates: [
      { qualification: "A-level", subject: "Maths", pricePerHour: 50 },
      { qualification: "A-level", subject: "Economics", pricePerHour: 50 },
      { qualification: "GCSE", subject: "Maths", pricePerHour: 40 },
      { qualification: "GCSE", subject: "Economics", pricePerHour: 40 },
      { qualification: "Scottish Highers", subject: "Mathematics", pricePerHour: 45 },
      { qualification: "Scottish Highers", subject: "Business Management", pricePerHour: 45 },
    ],
    learningStyles: ["Step-by-step examples", "Essay planning"],
    availability: [
      { id: "1", day: "Mon", from: "17:30", to: "20:30", source: "preset" },
      { id: "2", day: "Wed", from: "17:30", to: "20:30", source: "preset" },
      { id: "3", day: "Sat", from: "10:00", to: "15:00", source: "preset" },
    ],
    bio: "Economics student at Edinburgh, originally from Scotland. I cover Maths and Economics at GCSE, A-level, and Scottish Highers. I'm great at connecting abstract economic theory to current events, which keeps sessions engaging and helps with the longer evaluative questions.",
  },
  {
    email: "daniel.foster@logicgate.com",
    name: "Daniel Foster",
    headline: "Imperial Physics — A-level Physics/Maths & university admissions prep",
    university: "Imperial College London",
    degree: "Physics MSci",
    subjectSelections: [
      { category: "A-level", subjects: ["Physics", "Maths"] },
      { category: "University admissions", subjects: ["TMUA", "MAT", "PAT"] },
    ],
    subjectRates: [
      { qualification: "A-level", subject: "Physics", pricePerHour: 65 },
      { qualification: "A-level", subject: "Maths", pricePerHour: 65 },
      { qualification: "University admissions", subject: "TMUA", pricePerHour: 75 },
      { qualification: "University admissions", subject: "MAT", pricePerHour: 75 },
      { qualification: "University admissions", subject: "PAT", pricePerHour: 75 },
    ],
    learningStyles: ["Past-paper drilling", "Timed practice"],
    availability: [
      { id: "1", day: "Tue", from: "18:00", to: "21:00", source: "preset" },
      { id: "2", day: "Thu", from: "18:00", to: "21:00", source: "preset" },
      { id: "3", day: "Sat", from: "09:00", to: "17:00", source: "preset" },
    ],
    bio: "Physics MSci student at Imperial with a strong track record in university admissions preparation. I scored in the top 5% in the MAT and PAT and can guide students through TMUA, MAT, and PAT with targeted timed practice. I also cover A-level Physics and Maths with a focus on problem-solving.",
  },
];

// ─── Student definitions ──────────────────────────────────────────────────────

const STUDENTS = [
  {
    email: "alex.turner@logicgate.com",
    name: "Alex Turner",
    displayName: "Alex Turner",
    subjectSelections: [{ category: "A-level", subjects: ["Maths"] }],
    studiedSubjectSelections: [
      { category: "A-level", subjects: ["Maths", "Physics", "Computer Science"] },
    ],
    learningStyles: ["Step-by-step examples", "Past-paper drilling"],
    preferredUniversities: ["Imperial College London", "University of Cambridge"],
    availability: [
      { id: "1", day: "Mon", from: "16:00", to: "19:00", source: "preset" },
      { id: "2", day: "Wed", from: "16:00", to: "19:00", source: "preset" },
      { id: "3", day: "Sat", from: "10:00", to: "14:00", source: "preset" },
    ],
    bio: "Sixth-form student aiming for Maths at a top university. I enjoy problem-solving but struggle with proof questions and mechanics. Looking for a tutor who can help me develop confidence with harder material.",
  },
  {
    email: "chloe.roberts@logicgate.com",
    name: "Chloe Roberts",
    displayName: "Chloe Roberts",
    subjectSelections: [
      { category: "GCSE", subjects: ["Maths", "Physics"] },
    ],
    studiedSubjectSelections: [
      { category: "GCSE", subjects: ["Maths", "Physics", "Chemistry", "Biology", "English Literature"] },
    ],
    learningStyles: ["Visual explanations", "Step-by-step examples"],
    preferredUniversities: ["University of Manchester", "University of Bristol"],
    availability: [
      { id: "1", day: "Tue", from: "16:00", to: "18:30", source: "preset" },
      { id: "2", day: "Thu", from: "16:00", to: "18:30", source: "preset" },
      { id: "3", day: "Sun", from: "14:00", to: "17:00", source: "preset" },
    ],
    bio: "Year 11 student preparing for GCSEs. I'm doing combined science and find physics and maths particularly tricky. I'd like a tutor who is patient and good at explaining things in different ways.",
  },
  {
    email: "priya.sharma@logicgate.com",
    name: "Priya Sharma",
    displayName: "Priya Sharma",
    subjectSelections: [
      { category: "A-level", subjects: ["Chemistry", "Biology"] },
    ],
    studiedSubjectSelections: [
      { category: "A-level", subjects: ["Chemistry", "Biology", "Maths"] },
    ],
    learningStyles: ["Visual explanations", "Socratic questioning"],
    preferredUniversities: ["University of Oxford", "University College London"],
    availability: [
      { id: "1", day: "Mon", from: "17:00", to: "20:00", source: "preset" },
      { id: "2", day: "Fri", from: "17:00", to: "20:00", source: "preset" },
      { id: "3", day: "Sat", from: "11:00", to: "15:00", source: "preset" },
    ],
    bio: "A-level student hoping to study Medicine. I'm strong on Biology but need help with the physical chemistry and organic mechanisms in Chemistry. I like tutors who challenge me with questions rather than just telling me the answer.",
  },
  {
    email: "marcus.johnson@logicgate.com",
    name: "Marcus Johnson",
    displayName: "Marcus Johnson",
    subjectSelections: [
      { category: "A-level", subjects: ["Computer Science", "Maths"] },
    ],
    studiedSubjectSelections: [
      { category: "A-level", subjects: ["Computer Science", "Maths", "Physics"] },
    ],
    learningStyles: ["Step-by-step examples", "Past-paper drilling"],
    preferredUniversities: ["University of Cambridge", "University of Edinburgh"],
    availability: [
      { id: "1", day: "Wed", from: "18:00", to: "21:00", source: "preset" },
      { id: "2", day: "Sat", from: "09:00", to: "13:00", source: "preset" },
    ],
    bio: "Passionate about Computer Science and aiming for a place at a top university. I'm confident with programming but need support on the theory paper — especially data structures and Boolean algebra. Also want to strengthen my A-level Maths.",
  },
  {
    email: "lily.davis@logicgate.com",
    name: "Lily Davis",
    displayName: "Lily Davis",
    subjectSelections: [
      { category: "A-level", subjects: ["Further Maths", "Maths"] },
    ],
    studiedSubjectSelections: [
      { category: "A-level", subjects: ["Further Maths", "Maths", "Physics"] },
    ],
    learningStyles: ["Past-paper drilling", "Timed practice"],
    preferredUniversities: ["Imperial College London", "University of Warwick"],
    availability: [
      { id: "1", day: "Tue", from: "18:00", to: "21:00", source: "preset" },
      { id: "2", day: "Thu", from: "18:00", to: "21:00", source: "preset" },
      { id: "3", day: "Sun", from: "10:00", to: "14:00", source: "preset" },
    ],
    bio: "Year 13 doing Further Maths. I'm comfortable with pure content but the Statistics and Mechanics modules are weaker. I want to focus heavily on past papers and timed practice to get exam-ready.",
  },
  {
    email: "aiden.brown@logicgate.com",
    name: "Aiden Brown",
    displayName: "Aiden Brown",
    subjectSelections: [
      { category: "GCSE", subjects: ["Biology", "Chemistry"] },
    ],
    studiedSubjectSelections: [
      { category: "GCSE", subjects: ["Biology", "Chemistry", "Physics", "Maths", "English Language"] },
    ],
    learningStyles: ["Visual explanations", "Step-by-step examples"],
    preferredUniversities: ["University of Manchester", "University of Edinburgh"],
    availability: [
      { id: "1", day: "Mon", from: "16:30", to: "19:00", source: "preset" },
      { id: "2", day: "Thu", from: "16:30", to: "19:00", source: "preset" },
      { id: "3", day: "Sat", from: "14:00", to: "17:00", source: "preset" },
    ],
    bio: "Sitting my GCSEs next year and want to get ahead in Biology and Chemistry. I find drawing diagrams really helpful and prefer tutors who use a lot of visuals.",
  },
  {
    email: "charlotte.green@logicgate.com",
    name: "Charlotte Green",
    displayName: "Charlotte Green",
    subjectSelections: [
      { category: "A-level", subjects: ["Economics", "Business"] },
    ],
    studiedSubjectSelections: [
      { category: "A-level", subjects: ["Economics", "Business", "Psychology"] },
    ],
    learningStyles: ["Essay planning", "Socratic questioning"],
    preferredUniversities: ["University College London", "University of Warwick"],
    availability: [
      { id: "1", day: "Mon", from: "17:00", to: "20:00", source: "preset" },
      { id: "2", day: "Wed", from: "17:00", to: "20:00", source: "preset" },
      { id: "3", day: "Sat", from: "11:00", to: "15:00", source: "preset" },
    ],
    bio: "A-level student hoping to read Economics at a Russell Group university. My data/numbers side is solid but I lose marks on the long-answer evaluation questions. Need a tutor who can help me structure my answers and use current events effectively.",
  },
  {
    email: "joshua.wilson@logicgate.com",
    name: "Joshua Wilson",
    displayName: "Joshua Wilson",
    subjectSelections: [
      { category: "A-level", subjects: ["Physics", "Maths"] },
    ],
    studiedSubjectSelections: [
      { category: "A-level", subjects: ["Physics", "Maths", "Further Maths"] },
    ],
    learningStyles: ["Step-by-step examples", "Visual explanations"],
    preferredUniversities: ["Imperial College London", "University of Bristol"],
    availability: [
      { id: "1", day: "Tue", from: "17:00", to: "20:00", source: "preset" },
      { id: "2", day: "Fri", from: "17:00", to: "20:00", source: "preset" },
      { id: "3", day: "Sun", from: "10:00", to: "14:00", source: "preset" },
    ],
    bio: "Sixth-former who wants to study Physics at university. I'm confident with the maths but I struggle to apply physical intuition to harder problems. I'd like a tutor who can help bridge that gap and also keep me sharp on the quantitative side.",
  },
  {
    email: "mia.evans@logicgate.com",
    name: "Mia Evans",
    displayName: "Mia Evans",
    subjectSelections: [
      { category: "A-level", subjects: ["Maths", "Physics"] },
    ],
    studiedSubjectSelections: [
      { category: "A-level", subjects: ["Maths", "Physics", "Chemistry"] },
    ],
    learningStyles: ["Past-paper drilling", "Step-by-step examples"],
    preferredUniversities: ["University of Cambridge", "Imperial College London"],
    availability: [
      { id: "1", day: "Mon", from: "18:00", to: "21:00", source: "preset" },
      { id: "2", day: "Wed", from: "18:00", to: "21:00", source: "preset" },
      { id: "3", day: "Sat", from: "09:00", to: "13:00", source: "preset" },
    ],
    bio: "Aiming for Cambridge Engineering. I want to consolidate A-level Maths and Physics and get ahead on problem-solving under timed conditions. I'm self-motivated but benefit from having someone review my working and point out bad habits.",
  },
  {
    email: "sam.taylor@logicgate.com",
    name: "Sam Taylor",
    displayName: "Sam Taylor",
    subjectSelections: [
      { category: "University admissions", subjects: ["TMUA"] },
      { category: "A-level", subjects: ["Maths"] },
    ],
    studiedSubjectSelections: [
      { category: "A-level", subjects: ["Maths", "Further Maths", "Economics"] },
    ],
    learningStyles: ["Timed practice", "Past-paper drilling"],
    preferredUniversities: ["University of Cambridge", "University of Warwick"],
    availability: [
      { id: "1", day: "Tue", from: "17:00", to: "20:00", source: "preset" },
      { id: "2", day: "Thu", from: "17:00", to: "20:00", source: "preset" },
      { id: "3", day: "Sat", from: "10:00", to: "16:00", source: "preset" },
    ],
    bio: "Applying to read Economics at Cambridge and need support for the TMUA. My A-level Maths is strong but the TMUA has unique problem types that require a different approach. Also want to keep A-level Maths at its best for the summer exams.",
  },
];

// ─── Create helpers ───────────────────────────────────────────────────────────

async function createOrGetUser(email, name) {
  try {
    const existing = await auth.getUserByEmail(email);
    console.log(`  Auth user already exists: ${email} (${existing.uid})`);
    return existing.uid;
  } catch {
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would create Auth user: ${email}`);
      return `dry-run-uid-${email}`;
    }
    const user = await auth.createUser({ email, password: DEMO_PASSWORD, displayName: name });
    console.log(`  Created Auth user: ${email} (${user.uid})`);
    return user.uid;
  }
}

async function seedTutor(def) {
  console.log(`\nSeeding tutor: ${def.name} (${def.email})`);
  const uid = await createOrGetUser(def.email, def.name);

  const subjectSelections = def.subjectSelections;
  const subjectRates = normaliseRates(subjectSelections, def.subjectRates);
  const levels = levelsFromSelections(subjectSelections);
  const subjects = subjectsFromSelections(subjectSelections);
  const learningStyles = def.learningStyles;
  const minPrice = minRate(subjectRates);

  const userDoc = {
    email: def.email,
    name: def.name,
    role: "tutor",
    hasCompletedOnboarding: true,
    photoUrl: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const tutorDoc = {
    name: def.name,
    photoUrl: "",
    headline: def.headline,
    university: def.university,
    degree: def.degree,
    subjects,
    levels,
    subjectSelections,
    learningStyles,
    subjectRates,
    pricePerHour: minPrice,
    minimumPricePerHour: minPrice,
    rating: 0,
    reviews: 0,
    numberOfStudents: 0,
    availability: availabilitySummary(def.availability),
    availabilityBlocks: def.availability,
    bio: def.bio,
    hobbies: [],
    personality: [],
    tags: uniqueTags(levels, subjects, learningStyles),
    ownerId: uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would write users/${uid} and tutorProfiles/${uid}`);
    return;
  }

  await db.collection("users").doc(uid).set(userDoc, { merge: true });
  await db.collection("tutorProfiles").doc(uid).set(tutorDoc, { merge: true });
  console.log(`  Wrote users/${uid} and tutorProfiles/${uid}`);
}

async function seedStudent(def) {
  console.log(`\nSeeding student: ${def.name} (${def.email})`);
  const uid = await createOrGetUser(def.email, def.name);

  const userDoc = {
    email: def.email,
    name: def.name,
    role: "student",
    hasCompletedOnboarding: true,
    photoUrl: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const studentDoc = {
    displayName: def.displayName,
    photoUrl: "",
    bio: def.bio,
    subjectSelections: def.subjectSelections,
    studiedSubjectSelections: def.studiedSubjectSelections,
    learningStyles: def.learningStyles,
    preferredUniversities: def.preferredUniversities,
    availability: def.availability,
    ownerId: uid,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would write users/${uid} and studentProfiles/${uid}`);
    return;
  }

  await db.collection("users").doc(uid).set(userDoc, { merge: true });
  await db.collection("studentProfiles").doc(uid).set(studentDoc, { merge: true });
  console.log(`  Wrote users/${uid} and studentProfiles/${uid}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) {
    console.log("=== DRY RUN — no changes will be made ===\n");
  }

  console.log("=== Seeding tutors ===");
  for (const tutor of TUTORS) {
    await seedTutor(tutor);
  }

  console.log("\n=== Seeding students ===");
  for (const student of STUDENTS) {
    await seedStudent(student);
  }

  console.log("\n=== Done ===");
  console.log(`\nAll accounts use password: ${DEMO_PASSWORD}`);
  console.log("\nDemo tutors:");
  TUTORS.forEach((t) => console.log(`  ${t.email}`));
  console.log("\nDemo students:");
  STUDENTS.forEach((s) => console.log(`  ${s.email}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
