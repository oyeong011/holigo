import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { 
  CheckCircle, MapPin, Plane, Home as LucideHome, Briefcase, ChevronDown, ChevronUp,
  ArrowRight, Loader2, Search, Sparkles, User, LayoutDashboard, MessageSquareQuote,
  CalendarDays, ShieldCheck, Navigation, X, Navigation2, Send, ClipboardList,
  Coffee, Utensils, Tractor, Laptop, Scissors, HeartPulse, LogOut, Check, Globe, Zap,
  Smartphone, FileText, Camera, CreditCard, Lock, Filter, Star, Info, Award, ChevronLeft,
  DollarSign, Clock
} from 'lucide-react';

// --- 파이어베이스 설정 ---
const firebaseConfig = (() => {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    return JSON.parse(__firebase_config);
  }
  const raw = import.meta?.env?.VITE_FIREBASE_CONFIG;
  return raw ? JSON.parse(raw) : null;
})();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : (import.meta?.env?.VITE_APP_ID || 'holigo-app-v5');

// --- 상수 데이터 ---
const COUNTRIES = [
  { id: 'au', name: '호주', emoji: '🇦🇺', regions: ['시드니', '멜버른', '브리즈번', '퍼스'], requirements: ['RSA(주류면허)', 'TFN(세금번호)', '화이트카드'] },
  { id: 'ca', name: '캐나다', emoji: '🇨🇦', regions: ['토론토', '밴쿠버', '몬트리올'], requirements: ['SIN', 'Work Permit'] },
  { id: 'de', name: '독일', emoji: '🇩🇪', regions: ['베를린', '뮌헨', '함부르크'], requirements: ['Tax ID', 'Anmeldung'] },
];

const JOB_CATEGORIES = [
  { id: 'barista', name: '바리스타', icon: Coffee },
  { id: 'cook', name: '키친핸드/요리', icon: Utensils },
  { id: 'it', name: 'IT/기술지원', icon: Laptop },
  { id: 'beauty', name: '헤어/미용', icon: Scissors },
  { id: 'farm', name: '농장/공장', icon: Tractor },
];

const App = () => {
  const apiKey = import.meta?.env?.VITE_GEMINI_API_KEY || "";
  const model = "gemini-2.5-flash-preview-09-2025";

  // --- 상태 관리 ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); 
  const [aiLoading, setAiLoading] = useState(false);
  const isInitialLoad = useRef(true);
  
  // 시뮬레이션 데이터 상태
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [flights, setFlights] = useState([]);
  const [houses, setHouses] = useState([]);

  // 세부 프로세스 상태
  const [visaStep, setVisaStep] = useState('idle'); 
  const [visaProgress, setVisaProgress] = useState(0);
  const [bookingStep, setBookingStep] = useState('idle'); 

  const [appData, setAppData] = useState({
    selectedCountryId: null,
    selectedRegion: '',
    departureDate: '',
    completed: { visa: false, flight: false, house: false, profile: false, job: false },
    userProfile: { 
      skills: [], 
      careerDetails: '', 
      certificates: [],
      aiBio: '', 
    },
    hiredJobId: null,
    selectedFlightId: null,
    selectedHouseId: null,
  });

  // --- 인증 로직 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  // --- 데이터 동기화 및 새로고침 초기화 로직 ---
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'current');
    
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        let data = snap.data();

        // [핵심] 새로고침 시 체크리스트 초기화 로직
        if (isInitialLoad.current) {
          const resetCompleted = { visa: false, flight: false, house: false, profile: false, job: false };
          data = { 
            ...data, 
            completed: resetCompleted,
            hiredJobId: null,
            selectedFlightId: null,
            selectedHouseId: null
          };
          
          // 초기화된 상태를 즉시 Firestore에 저장
          setDoc(docRef, data).catch(console.error);
          
          if (data.selectedCountryId) setView('dashboard');
          isInitialLoad.current = false;
        }
        
        setAppData(data);
      } else {
        if (isInitialLoad.current) setView('login');
        isInitialLoad.current = false;
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore sync error:", err);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  const saveData = async (newData) => {
    if (!user) return;
    setAppData(prev => {
      const merged = { ...prev, ...newData };
      setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'current'), merged)
        .catch(e => console.error("Firestore save error:", e));
      return merged;
    });
  };

  // --- Gemini 데이터 생성 로직 ---
  const fetchRealisticData = async (type) => {
    setDiscoveryLoading(true);
    const country = COUNTRIES.find(c => c.id === appData.selectedCountryId)?.name;
    const region = appData.selectedRegion;
    
    let prompt = "";
    if (type === 'flight') {
      prompt = `대한민국 서울에서 ${country} ${region}까지 가는 실제 항공권 정보를 JSON 형식으로 3개 만들어줘. 
      속성: id, airline, price(한화), duration, type(직항/경유), color(항공사 테마색).`;
    } else {
      prompt = `${country} ${region}에서 워킹홀리데이 학생들이 실제로 살기 좋은 쉐어하우스나 숙소 정보 3개를 JSON 형식으로 만들어줘.
      속성: id, name, area(실제 지역구 이름), price(주당 현지통화), rating, description.`;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }) 
      });
      const json = await res.json();
      const result = JSON.parse(json.candidates[0].content.parts[0].text);
      if (type === 'flight') setFlights(Array.isArray(result) ? result : (result.flights || []));
      else setHouses(Array.isArray(result) ? result : (result.houses || []));
    } catch (e) { console.error("Gemini Error:", e); } finally { setDiscoveryLoading(false); }
  };

  const generateAiResume = async () => {
    if (appData.userProfile.skills.length === 0 || !appData.userProfile.careerDetails) return;
    setAiLoading(true);
    const countryName = COUNTRIES.find(c => c.id === appData.selectedCountryId)?.name;
    const prompt = `${countryName} ${appData.selectedRegion} 구직용 전문 Summary 2문장을 한국어로 작성해줘. 경력: "${appData.userProfile.careerDetails}". 기술: ${appData.userProfile.skills.join(',')}.`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const json = await res.json();
      const bio = json.candidates?.[0]?.content?.parts?.[0]?.text || "AI 생성에 실패했습니다.";
      await saveData({ 
        userProfile: { ...appData.userProfile, aiBio: bio }, 
        completed: { ...appData.completed, profile: true } 
      });
    } catch (e) { console.error("Resume AI Error:", e); } finally { setAiLoading(false); }
  };

  const handleVisaApply = () => {
    setVisaStep('processing');
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      if (p >= 100) {
        setVisaProgress(100);
        clearInterval(interval);
        setTimeout(() => { 
          saveData({ completed: { ...appData.completed, visa: true } }); 
          setVisaStep('done'); 
        }, 1000);
      } else { setVisaProgress(p); }
    }, 400);
  };

  const handleBooking = (type, id) => {
    setBookingStep('processing');
    const key = type === 'flight' ? 'selectedFlightId' : 'selectedHouseId';
    setTimeout(() => {
      saveData({ [key]: id, completed: { ...appData.completed, [type]: true } });
      setBookingStep('done');
      setTimeout(() => { 
        setBookingStep('idle'); 
        setView('dashboard'); 
      }, 1500);
    }, 2000);
  };

  // --- Renders ---

  const renderDashboard = () => (
    <div className="px-6 space-y-6 animate-in fade-in">
      <div className="bg-slate-900 rounded-[56px] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full"></div>
        <div className="flex justify-between items-start mb-12">
          <div>
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">My Journey</h3>
            <p className="text-3xl font-black tracking-tight mb-1 italic">HoliGo Voyage</p>
            <p className="text-xs font-bold text-slate-500">{COUNTRIES.find(c => c.id === appData.selectedCountryId)?.name} · {appData.selectedRegion} · {appData.departureDate || '날짜 미정'}</p>
          </div>
          <button onClick={() => setView('country')} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><Info size={20}/></button>
        </div>

        <div className="space-y-5">
          {[
            { id: 'profile', label: 'AI 스마트 이력서', done: appData.completed.profile, icon: User, target: 'profile' },
            { id: 'visa', label: '비자 자동 발급', done: appData.completed.visa, icon: ShieldCheck, target: 'visa' },
            { id: 'flight', label: '최저가 항공 매칭', done: appData.completed.flight, icon: Plane, target: 'flight' },
            { id: 'house', label: '현지 숙소 예약', done: appData.completed.house, icon: LucideHome, target: 'house' },
            { id: 'job', label: '일자리 매칭 계약', done: appData.completed.job, icon: Briefcase, target: 'jobs', locked: !appData.completed.profile },
          ].map((step) => (
            <div 
              key={step.id} 
              onClick={() => !step.locked && setView(step.target)} 
              className={`flex items-center gap-5 p-2 rounded-3xl transition-all ${step.locked ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}
            >
              <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center border-2 transition-all ${step.done ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-900' : 'border-white/10'}`}>
                {step.done ? <Check size={24} strokeWidth={4}/> : <step.icon size={20}/>}
              </div>
              <div className="flex-1">
                <p className={`text-base font-black tracking-tight ${step.done ? 'text-white' : 'text-white/60'}`}>{step.label}</p>
              </div>
              {!step.done && !step.locked && <ArrowRight size={16} className="text-white/20"/>}
              {step.locked && <Lock size={14} className="text-white/10"/>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><Sparkles size={24}/></div>
        <p className="text-sm font-bold text-blue-900 leading-tight tracking-tight">AI가 가장 적합한 <span className="text-blue-600 underline decoration-2 underline-offset-4">현지 일자리</span>를 매칭하고 있습니다.</p>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="px-6 py-4 space-y-10 animate-in fade-in overflow-y-auto pb-40">
      <header className="flex items-center gap-4">
        <button onClick={() => setView('dashboard')} className="p-3 bg-slate-50 rounded-2xl active:scale-90"><ChevronLeft size={20}/></button>
        <h2 className="text-3xl font-black">AI 이력서</h2>
      </header>

      <div className="space-y-10">
        <section>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block tracking-widest flex items-center gap-2"><Briefcase size={12}/> 희망 직무</label>
          <div className="grid grid-cols-2 gap-3">
            {JOB_CATEGORIES.map(job => (
              <button 
                key={job.id} 
                onClick={() => {
                  const skills = appData.userProfile.skills.includes(job.id) ? appData.userProfile.skills.filter(s => s !== job.id) : [...appData.userProfile.skills, job.id];
                  saveData({ userProfile: { ...appData.userProfile, skills } });
                }} 
                className={`flex items-center gap-3 p-5 rounded-[28px] border-2 transition-all ${appData.userProfile.skills.includes(job.id) ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-xl shadow-blue-50' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
              >
                <job.icon size={20}/> <span className="font-black text-xs">{job.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block tracking-widest flex items-center gap-2"><Award size={12}/> 현지 필수 자격증</label>
          <div className="flex flex-wrap gap-2">
            {(COUNTRIES.find(c => c.id === appData.selectedCountryId)?.requirements || []).map(req => (
              <button 
                key={req} 
                onClick={() => {
                  const certificates = appData.userProfile.certificates.includes(req) ? appData.userProfile.certificates.filter(c => c !== req) : [...appData.userProfile.certificates, req];
                  saveData({ userProfile: { ...appData.userProfile, certificates } });
                }}
                className={`px-5 py-3 rounded-2xl text-[11px] font-black border-2 transition-all ${appData.userProfile.certificates.includes(req) ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}
              >
                {req}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block tracking-widest flex items-center gap-2"><MessageSquareQuote size={12}/> 상세 경력 및 역량 기술</label>
          <textarea 
            className="w-full bg-slate-50 border-none rounded-[32px] p-8 text-sm h-56 focus:ring-4 ring-blue-50 shadow-inner resize-none font-medium leading-relaxed" 
            placeholder="예: 한국 스타벅스 2년 근무, 하루 평균 150잔 제조 경험. 라떼아트 가능 및 빠른 고객 응대 가능..." 
            value={appData.userProfile.careerDetails} 
            onChange={(e) => saveData({ userProfile: { ...appData.userProfile, careerDetails: e.target.value } })} 
          />
        </section>
        
        {appData.userProfile.aiBio && (
          <div className="bg-slate-900 p-8 rounded-[48px] text-white shadow-2xl animate-in zoom-in-95 italic">
            <h4 className="text-blue-400 text-[10px] font-black uppercase mb-4 tracking-widest flex items-center gap-2"><Sparkles size={12}/> Professional Summary</h4>
            "{appData.userProfile.aiBio}"
          </div>
        )}

        <button 
          onClick={generateAiResume} 
          disabled={aiLoading || !appData.userProfile.careerDetails} 
          className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-lg shadow-2xl flex items-center justify-center gap-3 disabled:bg-slate-100 transition-all active:scale-95"
        >
          {aiLoading ? <Loader2 size={24} className="animate-spin" /> : <><Sparkles size={24}/> AI 전문 이력서 완성</>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center font-sans text-slate-900">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-x-hidden">
        
        {/* 상단 브랜딩 바 */}
        <header className="px-8 py-8 flex justify-between items-center border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-xl z-40">
          <div onClick={() => setView('dashboard')} className="cursor-pointer">
            <h1 className="text-3xl font-black tracking-tighter italic text-blue-600">HoliGo!</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{COUNTRIES.find(c => c.id === appData.selectedCountryId)?.name || 'Welcome'}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-slate-50 rounded-2xl text-slate-400"><Search size={20}/></button>
            <button onClick={() => { signOut(auth); setView('login'); isInitialLoad.current = true; }} className="p-3 bg-slate-50 rounded-2xl text-slate-300 hover:text-red-500 transition-all active:scale-90"><LogOut size={20}/></button>
          </div>
        </header>

        {/* 뷰 전환기 */}
        <main className="pt-8 pb-36">
          {view === 'login' && (
            <div className="h-[80vh] flex flex-col items-center justify-center px-10 text-center animate-in fade-in">
              <div className="w-24 h-24 bg-blue-600 rounded-[40px] flex items-center justify-center mb-8 shadow-2xl shadow-blue-100 animate-bounce-short"><Zap className="text-white fill-white" size={44} /></div>
              <h1 className="text-5xl font-black text-slate-900 mb-2 tracking-tighter italic">HoliGo!</h1>
              <p className="text-slate-400 font-medium mb-12 text-sm leading-relaxed">준비는 자동으로, 즐거움은 온전히.<br/>HoliGo와 함께 떠나는 워킹홀리데이</p>
              <button onClick={() => setView('country')} className="w-full max-w-xs py-5 bg-slate-900 text-white rounded-[28px] font-black shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">무료로 시작하기 <ArrowRight size={20}/></button>
            </div>
          )}
          {view === 'country' && (
             <div className="px-8 py-8 space-y-10 animate-in slide-in-from-bottom-10">
                <h2 className="text-3xl font-black leading-tight tracking-tight">어디로,<br/>언제 떠나시나요?</h2>
                <div className="space-y-8">
                  <section>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block tracking-widest">목표 국가 선택</label>
                    <div className="grid grid-cols-3 gap-3">
                      {COUNTRIES.map(c => (
                        <button key={c.id} onClick={() => saveData({ selectedCountryId: c.id, selectedRegion: c.regions[0] })} className={`p-5 rounded-[32px] border-2 transition-all flex flex-col items-center gap-2 ${appData.selectedCountryId === c.id ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-50' : 'border-slate-50 bg-slate-50 opacity-50'}`}><span className="text-4xl">{c.emoji}</span><span className="text-[11px] font-black">{c.name}</span></button>
                      ))}
                    </div>
                  </section>
                  {appData.selectedCountryId && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                      <section>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block tracking-widest">도시 선택</label>
                        <div className="flex flex-wrap gap-2">{COUNTRIES.find(c => c.id === appData.selectedCountryId)?.regions.map(r => (
                          <button key={r} onClick={() => saveData({ selectedRegion: r })} className={`px-6 py-3 rounded-full text-xs font-black transition-all ${appData.selectedRegion === r ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-slate-50 text-slate-400'}`}>{r}</button>
                        ))}</div>
                      </section>
                      <section>
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block tracking-widest">출발 날짜</label>
                        <div className="relative">
                          <input 
                            type="date" 
                            value={appData.departureDate} 
                            onChange={(e) => saveData({ departureDate: e.target.value })} 
                            className="w-full p-5 bg-slate-50 border-none rounded-[24px] text-sm font-bold focus:ring-4 ring-blue-100 outline-none relative z-10"
                            style={{ WebkitAppearance: 'none' }}
                          />
                          <CalendarDays className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none z-0" size={20} />
                        </div>
                      </section>
                    </div>
                  )}
                  <button onClick={() => setView('dashboard')} disabled={!appData.selectedCountryId || !appData.departureDate} className="w-full py-5 bg-blue-600 text-white rounded-[32px] font-black text-lg shadow-2xl disabled:bg-slate-100 flex items-center justify-center gap-2 transition-all">계획 확정하기 <ArrowRight size={20}/></button>
                </div>
             </div>
          )}
          {view === 'dashboard' && renderDashboard()}
          {view === 'profile' && renderProfile()}
          {view === 'visa' && (
            <div className="px-8 space-y-10 animate-in slide-in-from-right h-full flex flex-col justify-center py-20">
              <h2 className="text-4xl font-black leading-tight tracking-tighter">비자 자동 신청</h2>
              {visaStep === 'idle' && (
                <div className="space-y-8">
                  <div className="bg-blue-50 p-10 rounded-[48px] text-center border border-blue-100 shadow-inner"><div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm"><FileText className="text-blue-600" size={40}/></div><p className="text-base font-bold text-blue-900 leading-relaxed italic">"HoliGo 엔진이 대사관 서버에 직접<br/>신청 서류를 자동 제출합니다."</p></div>
                  <button onClick={handleVisaApply} className="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black text-xl shadow-2xl shadow-blue-100">신청서 자동 제출</button>
                </div>
              )}
              {visaStep === 'processing' && (
                <div className="flex flex-col items-center py-10">
                  <div className="w-full max-w-[280px] bg-slate-100 h-3 rounded-full overflow-hidden mb-8 shadow-inner"><div className="bg-blue-600 h-full transition-all duration-500 ease-out shadow-lg" style={{ width: `${visaProgress}%` }}></div></div>
                  <h3 className="text-2xl font-black mb-2 animate-pulse tracking-tight text-slate-900">심사 데이터 전송 중</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{Math.round(visaProgress)}% Completed</p>
                </div>
              )}
              {visaStep === 'done' && (
                <div className="text-center animate-in zoom-in-95"><div className="w-28 h-28 bg-green-100 rounded-[56px] flex items-center justify-center mx-auto mb-10 shadow-inner"><CheckCircle className="text-green-600" size={56} /></div><h3 className="text-5xl font-black tracking-tighter mb-4 italic text-green-700 uppercase">Granted</h3><p className="text-sm font-bold text-slate-400 uppercase tracking-[0.4em] mb-12">VISA ID: #WH-AU-88392</p><button onClick={() => setView('dashboard')} className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black shadow-2xl text-lg">메인으로 가기</button></div>
              )}
            </div>
          )}
          {view === 'flight' && (
             <div className="px-8 space-y-8 animate-in slide-in-from-right">
                <h2 className="text-3xl font-black">항공권 매칭</h2>
                {discoveryLoading ? (
                  <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin text-blue-600 mb-6" size={48} /><p className="font-black text-xl animate-pulse">실시간 최저가 분석 중...</p></div>
                ) : bookingStep === 'processing' ? (
                  <div className="py-20 flex flex-col items-center"><div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-bounce"><Plane className="text-blue-600" size={40} /></div><p className="font-black text-xl animate-pulse">발권 요청 중...</p></div>
                ) : flights.length > 0 ? (
                  <div className="space-y-4 pb-20">{flights.map(f => (
                    <div key={f.id} onClick={() => handleBooking('flight', f.id)} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:border-blue-500 transition-all cursor-pointer group shadow-sm active:scale-95"><div className="flex justify-between items-start mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs" style={{ backgroundColor: f.color || '#3b82f6' }}>{f.airline[0]}</div><div><h4 className="font-black text-slate-900">{f.airline}</h4><p className="text-[10px] font-bold text-slate-400 uppercase">{f.type} · {f.duration}</p></div></div><span className="font-black text-blue-600">{f.price}</span></div><button className="w-full py-3 bg-slate-50 text-slate-900 rounded-2xl font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">예약하기</button></div>
                  ))}</div>
                ) : (
                  <div className="bg-slate-50 p-12 rounded-[48px] text-center border-2 border-dashed border-slate-200"><Plane size={48} className="text-slate-200 mx-auto mb-6" /><p className="text-sm font-bold text-slate-400 mb-8">인천(ICN) ➔ {appData.selectedRegion}<br/>가장 효율적인 루트를 찾습니다.</p><button onClick={() => fetchRealisticData('flight')} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl">항공권 검색</button></div>
                )}
             </div>
          )}
          {view === 'house' && (
             <div className="px-8 space-y-8 animate-in slide-in-from-right">
                <h2 className="text-3xl font-black">현지 숙소 매칭</h2>
                {discoveryLoading ? (
                  <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin text-blue-600 mb-6" size={48} /><p className="font-black text-xl animate-pulse">리얼 매물 분석 중...</p></div>
                ) : bookingStep === 'processing' ? (
                  <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin text-blue-600 mb-6" size={48} /><p className="font-black text-xl animate-pulse">입주 신청 전송 중...</p></div>
                ) : houses.length > 0 ? (
                  <div className="space-y-5 pb-20">{houses.map(h => (
                    <div key={h.id} onClick={() => handleBooking('house', h.id)} className="bg-white overflow-hidden rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group active:scale-95"><div className="h-40 bg-slate-50 flex items-center justify-center text-5xl">🏠</div><div className="p-6"><div className="flex justify-between items-center mb-2"><h4 className="font-black text-lg text-slate-900">{h.name}</h4><div className="flex items-center gap-1 text-yellow-500 font-black text-sm"><Star size={14} fill="currentColor"/> {h.rating}</div></div><p className="text-xs text-slate-400 font-bold mb-4 flex items-center gap-1"><MapPin size={12}/> {h.area}</p><div className="flex justify-between items-center"><p className="text-xl font-black text-blue-600">{h.price}<small className="text-[10px] text-slate-400">/주</small></p><button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase">Book Now</button></div></div></div>
                  ))}</div>
                ) : (
                  <div className="bg-slate-50 p-12 rounded-[48px] text-center border-2 border-dashed border-slate-200"><LucideHome size={48} className="text-slate-200 mx-auto mb-6" /><p className="text-sm font-bold text-slate-400 mb-8">{appData.selectedRegion} 인기 쉐어하우스<br/>리스트를 불러옵니다.</p><button onClick={() => fetchRealisticData('house')} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl">숙소 리스트업</button></div>
                )}
             </div>
          )}
          {view === 'jobs' && (
            <div className="px-8 space-y-8 animate-in slide-in-from-right">
              <header><h2 className="text-3xl font-black tracking-tight">현지 채용 오퍼</h2><p className="text-sm text-slate-400 font-bold mt-1 tracking-tight leading-tight">AI 이력서 매칭 결과 도착한 최적의 공고들입니다.</p></header>
              <div className="space-y-4">
                {[
                  { company: 'The Grounds', role: 'Head Barista', pay: '$29.5/hr', logo: '☕' },
                  { company: 'Google Sydney', role: 'Kitchen Hand', pay: '$26.5/hr', logo: '💻' },
                ].map((job, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm transition-all hover:shadow-2xl">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-5"><div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-3xl shadow-inner">{job.logo}</div><div><h4 className="font-black text-slate-900 text-lg">{job.company}</h4><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.role}</p></div></div>
                      <span className="font-black text-blue-600 text-lg">{job.pay}</span>
                    </div>
                    <button onClick={() => saveData({ hiredJobId: 1, completed: { ...appData.completed, job: true } })} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black active:scale-95 transition-all shadow-xl">제안 수락 및 인터뷰 예약</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* 하단 네비게이션 */}
        {view !== 'login' && view !== 'country' && (
          <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-sm px-4 z-50">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[44px] p-2 flex items-center justify-around shadow-2xl">
              <button onClick={() => setView('dashboard')} className={`flex-1 flex flex-col items-center py-4 rounded-[36px] transition-all ${view === 'dashboard' ? 'bg-white text-slate-900' : 'text-slate-400'}`}><LayoutDashboard size={20}/></button>
              <button onClick={() => appData.completed.profile && setView('jobs')} className={`flex-1 flex flex-col items-center py-4 rounded-[36px] transition-all ${view === 'jobs' ? 'bg-white text-slate-900' : appData.completed.profile ? 'text-slate-400' : 'text-white/10 opacity-30 cursor-not-allowed'}`}><Briefcase size={20}/></button>
              <button onClick={() => setView('profile')} className={`flex-1 flex flex-col items-center py-4 rounded-[36px] transition-all ${view === 'profile' ? 'bg-white text-slate-900' : 'text-slate-400'}`}><User size={20}/></button>
            </div>
          </nav>
        )}

        {/* 성공 완료 모달 */}
        {appData.completed.job && appData.hiredJobId && (
          <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center px-10 text-center animate-in zoom-in-95">
            <div className="w-28 h-28 bg-green-100 rounded-[56px] flex items-center justify-center mb-10 shadow-inner"><CheckCircle className="text-green-600" size={56}/></div>
            <h2 className="text-5xl font-black mb-4 tracking-tighter italic">HoliGo Success!</h2>
            <p className="text-slate-500 font-medium mb-12 leading-relaxed tracking-tight">축하합니다! 인터뷰와 트라이얼 일정이 확정되었습니다.<br/><span className="text-slate-900 font-black">구체적인 가이드</span>가 메일로 발송되었습니다.</p>
            <button onClick={() => { saveData({ completed: { ...appData.completed, job: false }, hiredJobId: null }); setView('dashboard'); }} className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black shadow-2xl text-lg active:scale-95 transition-all">대시보드 확인</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce-short { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-bounce-short { animation: bounce-short 2.5s infinite ease-in-out; }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
    </div>
  );
};

export default App;
