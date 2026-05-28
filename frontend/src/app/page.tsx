'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
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

export default function MatchingSystem() {
  const [allTutors, setAllTutors] = useState<Tutor[]>([]);
  const [displayedTutors, setDisplayedTutors] = useState<Tutor[]>([]);
  
  // Multi subject selection
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedUni, setSelectedUni] = useState('');

  // Subject clicks
  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject) // Remove it if it's already selected
        : [...prev, subject]              // Add it if it's not selected
    );
  };

  useEffect(() => {
    async function fetchTutors() {
      const querySnapshot = await getDocs(collection(db, "tutors"));
      const fetchedTutors = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tutor[];

      setAllTutors(fetchedTutors);
      setDisplayedTutors(fetchedTutors);
    }
    fetchTutors();
  }, []);

  // Filtering Logic
  useEffect(() => {
    let filtered = allTutors;

    // Filter by multiple subjects (OR logic)
    if (selectedSubjects.length > 0) {
      filtered = filtered.filter(tutor => {
        const subjects = tutor.subjects || [];
        // Returns true if the tutor teaches ANY of the selected subjects
        return subjects.some(sub => selectedSubjects.includes(sub.toLowerCase()));
      });
    }

    if (selectedStyle) {
      filtered = filtered.filter(tutor => 
        tutor.learningStyles?.some(style => style.toLowerCase() === selectedStyle.toLowerCase())
      );
    }

    if (selectedUni) {
      filtered = filtered.filter(tutor => 
        tutor.university?.toLowerCase() === selectedUni.toLowerCase()
      );
    }

    setDisplayedTutors(filtered);
  }, [selectedSubjects, selectedStyle, selectedUni, allTutors]);

  return (
    <main className="min-h-screen p-8 bg-gray-50 flex flex-col md:flex-row gap-8 text-black">
      
      {/* SIDEBAR: Filters */}
      <aside className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-sm h-fit">
        <h2 className="font-bold text-xl mb-6">Find your match</h2>
        
        {/* MULTI-SELECT SUBJECTS UI */}
        <div className="mb-6">
          <label className="block mb-3 text-sm font-medium">Subjects (Select Multiple)</label>
          <div className="flex flex-wrap gap-2">
            {['math', 'further math', 'physics', 'chemistry', 'biology'].map(sub => (
              <button
                key={sub}
                onClick={() => toggleSubject(sub)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  selectedSubjects.includes(sub)
                    ? 'bg-black text-white' // Highlighted state
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200' // Unselected state
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Learning Style</label>
          <select 
            className="w-full border border-gray-300 p-2 rounded bg-white text-black text-sm"
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
          >
            <option value="">Any Style</option>
            <option value="visual">Visual</option>
            <option value="socratic">Socratic</option>
            <option value="past-paper drilling">Past-Paper Drilling</option>
            <option value="exam technique">Exam Technique</option>
            <option value="first-principles">First-Principles</option>
            <option value="highly structured">Highly Structured</option>
            <option value="neurodivergent friendly">Neurodivergent Friendly</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">University</label>
          <select 
            className="w-full border border-gray-300 p-2 rounded bg-white text-black text-sm"
            value={selectedUni}
            onChange={(e) => setSelectedUni(e.target.value)}
          >
            <option value="">Any University</option>
            <option value="imperial college london">Imperial College London</option>
            <option value="cambridge university">Cambridge University</option>
            <option value="ucl">UCL</option>
            <option value="university of manchester">University of Manchester</option>
          </select>
        </div>
        
        <button 
          onClick={() => { 
            setSelectedSubjects([]); 
            setSelectedStyle(''); 
            setSelectedUni(''); 
          }}
          className="w-full border border-gray-300 px-4 py-2 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Clear Filters
        </button>
      </aside>

      {/* MAIN CONTENT: Tutor Grid */}
      <section className="w-full md:w-3/4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedTutors.map((tutor) => (
            <div key={tutor.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl">{tutor.name}</h3>
                  <span className="font-bold text-lg text-green-700">£{tutor.hourlyRate}/hr</span>
                </div>
                
                <p className="text-sm font-semibold text-gray-500 mb-3">{tutor.university}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {tutor.subjects?.map(subject => (
                    <span key={subject} className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      {subject}
                    </span>
                  ))}
                  {tutor.learningStyles?.map(style => (
                    <span key={style} className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      {style}
                    </span>
                  ))}
                </div>
                
                <p className="text-sm mb-6 text-gray-700 leading-relaxed">{tutor.bio}</p>
              </div>
              
              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={() => alert("Booking system coming in Milestone 3!")}
                  className="bg-black text-white px-4 py-2 rounded text-sm font-medium w-full hover:bg-gray-800 transition-colors"
                >
                  Book Consultation
                </button>
              </div>
            </div>
          ))}

          {displayedTutors.length === 0 && (
            <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500 font-medium mb-2">No tutors found matching your criteria.</p>
              <p className="text-gray-400 text-sm">Try clearing some filters or selecting different options.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}