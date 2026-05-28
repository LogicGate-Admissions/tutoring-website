'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, onSnapshot, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase'; 

type Tutor = {
  id?: string;
  name: string;
  university: string;
  bio: string;
  subjects: string[];
  levels: string[];
  learningStyles: string[];
  hourlyRate: number;
};

// Blueprint for match request
type MatchRequest = {
  id: string;
  tutorId: string;
  tutorName: string; 
  studentName: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function MatchingSystem() {
  // View Toggle State
  const [view, setView]  = useState<'student' | 'tutor'>('student');
  
  // User & Request State 
  const [currentStudent] = useState("Alex (Test Student)");
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);

  // Search & Filter State (Notice displayedTutors is gone from here!)
  const [allTutors, setAllTutors] = useState<Tutor[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedUni, setSelectedUni] = useState('');

  // Subject Multi-Select Logic
  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject) 
        : [...prev, subject]              
    );
  };

  // Fetch Tutors (Runs once on load)
  useEffect(() => {
    async function fetchTutors() {
      const querySnapshot = await getDocs(collection(db, "tutors"));
      const fetchedTutors = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tutor[];

      setAllTutors(fetchedTutors);
    }
    fetchTutors();
  }, []);

  // Real-time listener for Match Requests
  useEffect(() => {
    const q = query(collection(db, "matchRequests"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MatchRequest[];
      
      setMatchRequests(requests);
    });

    return () => unsubscribe();
  }, []);


  let displayedTutors = allTutors;

  if (selectedSubjects.length > 0) {
    displayedTutors = displayedTutors.filter(tutor => {
      const subjects = tutor.subjects || [];
      return subjects.some(sub => selectedSubjects.includes(sub.toLowerCase()));
    });
  }

  if (selectedStyle) {
    displayedTutors = displayedTutors.filter(tutor => 
      tutor.learningStyles?.some(style => style.toLowerCase() === selectedStyle.toLowerCase())
    );
  }

  if (selectedUni) {
    displayedTutors = displayedTutors.filter(tutor => 
      tutor.university?.toLowerCase() === selectedUni.toLowerCase()
    );
  }

  // Function to send the request to Firebase 
  const handleRequestMatch = async (tutor: Tutor) => {
    if (!tutor.id) return; 
    
    try {
      await addDoc(collection(db, "matchRequests"), {
        tutorId: tutor.id,
        tutorName: tutor.name,
        studentName: currentStudent, 
        status: 'pending'            
      });
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request.");
    }
  };

  // Function to Accept or Decline a match 
  const handleResolveMatch = async (requestId: string, newStatus: 'accepted' | 'declined') => {
    try {
      const requestRef = doc(db, "matchRequests", requestId);
      await updateDoc(requestRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Failed to update match status.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-black">
      
      {/* Global Header with View Switcher */}
      <header className="bg-black text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-xl tracking-tight">TutorMatch.</h1>
        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
          <button 
            onClick={() => setView('student')} 
            className={`px-4 py-1.5 rounded text-sm font-medium ${view === 'student' ? 'bg-white text-black' : 'text-gray-300'}`}
          >
            Student View
          </button>
          <button 
            onClick={() => setView('tutor')} 
            className={`px-4 py-1.5 rounded text-sm font-medium ${view === 'tutor' ? 'bg-white text-black' : 'text-gray-300'}`}
          >
            Tutor View
          </button>
        </div>
      </header>

      <div className="p-8">
        
        {/* STUDENT VIEW */}
        {view === 'student' && (
          <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
              <h2 className="font-bold text-xl mb-6">Find your match</h2>
              
              <div className="mb-6">
                <label className="block mb-3 text-sm font-medium">Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {['math', 'physics', 'chemistry', 'biology'].map(sub => (
                    <button key={sub} onClick={() => toggleSubject(sub)} className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${selectedSubjects.includes(sub) ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{sub}</button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium">Learning Style</label>
                <select className="w-full border p-2 rounded text-sm" value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)}>
                  <option value="">Any Style</option>
                  <option value="visual">Visual</option>
                  <option value="socratic">Socratic</option>
                  <option value="past-paper drilling">Past-Paper Drilling</option>
                  <option value="first-principles">First-Principles</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium">University</label>
                <select className="w-full border p-2 rounded text-sm" value={selectedUni} onChange={(e) => setSelectedUni(e.target.value)}>
                  <option value="">Any University</option>
                  <option value="imperial college london">Imperial College London</option>
                  <option value="cambridge university">Cambridge University</option>
                  <option value="ucl">UCL</option>
                  <option value="university of manchester">University of Manchester</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <button 
                onClick={() => {
                  setSelectedSubjects([]);
                  setSelectedStyle('');
                  setSelectedUni('');
                }}
                className="w-full border border-gray-300 bg-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors mt-2"
              >
                Clear Filters
              </button>
            </aside>

            <section className="w-full md:w-3/4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {displayedTutors.map((tutor) => {
                
                // Check if the student has a live request with this tutor
                const existingRequest = matchRequests.find(r => r.tutorId === tutor.id && r.studentName === currentStudent);

                return (
                  <div key={tutor.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-xl">{tutor.name}</h3>
                        <span className="font-bold text-green-700">£{tutor.hourlyRate}/hr</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">{tutor.university}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {/* Map over subjects and make them Green */}
                        {tutor.subjects?.map(subject => (
                          <span key={subject} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium capitalize">
                            {subject}
                          </span>
                        ))}
                        
                        {/* Map over learning styles and make them Blue */}
                        {tutor.learningStyles?.map(style => (
                          <span key={style} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            {style}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm mb-6">{tutor.bio}</p>
                    </div>
                    
                    {/* Dynamic Buttons based on status*/}
                    <div className="flex gap-2 mt-auto">
                      {!existingRequest && (
                        <button onClick={() => handleRequestMatch(tutor)} className="bg-black text-white px-4 py-2 rounded text-sm font-medium flex-1 hover:bg-gray-800 transition-colors">Request Match</button>
                      )}
                      {existingRequest?.status === 'pending' && (
                        <button disabled className="bg-yellow-100 text-yellow-800 border border-yellow-300 px-4 py-2 rounded text-sm font-medium flex-1 cursor-not-allowed">Request Pending...</button>
                      )}
                      {existingRequest?.status === 'accepted' && (
                        <button disabled className="bg-green-100 text-green-800 border border-green-300 px-4 py-2 rounded text-sm font-medium flex-1 cursor-not-allowed">✓ Match Accepted!</button>
                      )}
                      {existingRequest?.status === 'declined' && (
                        <button disabled className="bg-red-100 text-red-800 border border-red-300 px-4 py-2 rounded text-sm font-medium flex-1 cursor-not-allowed">Match Declined</button>
                      )}
                    </div>

                    {/* Secondary Action Row (No functionality yet) */}
                    <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => alert('Shortlist feature to be implemented!')}
                          className="flex-1 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          Shortlist
                        </button>
                        <button 
                          type="button" 
                          onClick={() => alert('Booking system to be implemented!')}
                          className="flex-1 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          Book a Call
                        </button>
                      </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {/* TUTOR VIEW */}
        {view === 'tutor' && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-bold text-2xl mb-2">Tutor Dashboard</h2>
            <p className="text-gray-500 mb-8">Manage your incoming student match requests.</p>
            
            {/* Displaying live requests */}
            <div className="flex flex-col gap-4">
              {matchRequests.length === 0 && (
                <p className="text-gray-500 italic">No incoming requests yet.</p>
              )}

              {matchRequests.map(req => (
                <div key={req.id} className="border border-gray-200 p-4 rounded-lg flex justify-between items-center bg-gray-50">
                  <div>
                    <p className="font-medium">Student: <span className="font-bold">{req.studentName}</span></p>
                    <p className="text-sm text-gray-500">Requested Tutor: {req.tutorName}</p>
                    <p className="text-sm mt-1">
                      Status: 
                      <span className={`ml-2 font-semibold ${
                        req.status === 'pending' ? 'text-yellow-600' : 
                        req.status === 'accepted' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </p>
                  </div>

                  {/* Connect the buttons to the resolve function */}
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleResolveMatch(req.id, 'accepted')} className="bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors">Accept</button>
                      <button onClick={() => handleResolveMatch(req.id, 'declined')} className="border border-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors">Decline</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}