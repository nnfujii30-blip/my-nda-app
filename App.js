import React, { useState, useRef, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { LucidePenTool, LucideFileText, LucideSave, LucideCheckCircle, LucideHistory, LucideShare2, LucideCopy, LucideSearch, LucideUserCheck, LucideSettings, LucideRotateCcw, LucideSparkles, LucidePartyPopper, LucideSend, LucideChevronRight, LucideZap } from 'lucide-react';

// あなたのFirebaseのカギ（正しく修正しました！）
const firebaseConfig = {
  apiKey: "AIzaSyCAgZM1wpTHjRd5yb9NUU3eYFYtZkxWhM8",
  authDomain: "my-nda-app.firebaseapp.com",
  projectId: "my-nda-app",
  storageBucket: "my-nda-app.firebasestorage.app",
  messagingSenderId: "80744851082",
  appId: "1:80744851082:web:34a836dfe68222181cef73",
  measurementId: "G-LJGPM5G4SN"
};

// アプリの起動
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'remote-nda-app';

const SCOPE_OPTIONS = [
  { id: 'business', label: '事業内容', color: 'bg-pink-100 text-pink-600 border-pink-200' },
  { id: 'tech', label: '技術情報', color: 'bg-purple-100 text-purple-600 border-purple-200' },
  { id: 'finance', label: '財務情報', color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { id: 'customer', label: '顧客情報', color: 'bg-green-100 text-green-600 border-green-200' },
  { id: 'investment', label: '投資政策', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
  { id: 'all', label: '全部！', color: 'bg-orange-100 text-orange-600 border-orange-200' },
];

const DURATION_OPTIONS = [
  { id: '1year', label: '1年' },
  { id: '3years', label: '3年' },
  { id: '5years', label: '5年' },
  { id: 'indefinite', label: 'ずっと' },
];

const DEFAULT_NDA_TEMPLATE = (formData) => {
  const { partyA, partyB, purpose, date, scope = {}, duration } = formData;
  const selectedScopes = SCOPE_OPTIONS
    .filter(opt => scope[opt.id])
    .map(opt => `「${opt.label}」`);
  const scopeText = selectedScopes.length > 0 ? selectedScopes.join('、') : "（未選択）";
  const durationLabel = DURATION_OPTIONS.find(opt => opt.id === duration)?.label || "（未設定）";

  return `
秘密保持契約書

${partyA || "（未入力）"}（以下「甲」という）と、${partyB || "（未入力）"}（以下「乙」という）は、${purpose || "（未入力）"}（以下「本目的」という）に関し、甲又は乙が相手方に開示する秘密情報の取扱いについて、以下の通り契約を締結する。

第1条（秘密情報）
本契約において「秘密情報」とは、本目的に関連して、一方当事者が相手方に対し、書面、口頭、電子データ等、形式の如何を問わず開示された一切の情報をいう。なお、本契約において特に重視される秘密情報の範囲は、${scopeText}とする。

第2条（秘密保持）
甲及び乙は、相手方の承諾なく、秘密情報を第三者に開示又は漏洩してはならない。

第3条（目的外使用の禁止）
甲及び乙は、秘密情報を本目的以外の目的に使用してはならない。

第4条（有効期間）
本契約の有効期間は、本契約締結日から${durationLabel}とする。

第5条（協議解決）
本契約に定めのない事項、又は本契約の解釈について疑義が生じたときは、甲乙誠意をもって協議の上、解決するものとする。

本契約の締結を証するため、本書を2通作成し、甲乙記名押印（又は署名）の上、各1通を保有する。

締結日: ${date || "（未設定）"}

甲: ${partyA || "（未入力）"}
乙: ${partyB || "（未入力）"}
`;
};

const SignaturePad = ({ onSave, label, existingSignature, disabled, accentColor }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = accentColor === 'pink' ? '#EC4899' : '#4F46E5'; 

    if (existingSignature && !isDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = existingSignature;
    }
  }, [existingSignature, isDrawing, accentColor]);

  const startDrawing = (e) => {
    if (disabled) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (disabled || !isDrawing) return;
    setIsDrawing(false);
    onSave(canvasRef.current.toDataURL());
  };

  const handleReset = (e) => {
    e.stopPropagation();
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    onSave(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end px-2">
        <label className={`text-xs font-black uppercase tracking-wider ${accentColor === 'pink' ? 'text-pink-500' : 'text-indigo-500'}`}>{label}</label>
        {existingSignature && !disabled && (
          <button 
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] bg-white hover:bg-rose-50 text-rose-400 px-3 py-1 rounded-full transition-all border border-rose-100 shadow-sm"
          >
            <LucideRotateCcw className="w-3 h-3" />
            消す
          </button>
        )}
      </div>
      <div className={`relative border-2 ${disabled ? 'border-indigo-50 bg-indigo-50/10' : 'border-slate-100 bg-white hover:border-indigo-200'} rounded-[2rem] overflow-hidden aspect-[4/3] md:aspect-[3/2] shadow-sm transition-all`}>
        {disabled ? (
          <img src={existingSignature} className="w-full h-full object-contain p-6" alt="Signature" />
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={300}
              height={200}
              className="w-full h-full touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!existingSignature && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <LucidePenTool className={`w-6 h-6 mb-2 opacity-10 ${accentColor === 'pink' ? 'text-pink-500' : 'text-indigo-500'}`} />
                <p className="text-[10px] text-slate-300 font-black tracking-[0.2em] uppercase">Sign Here</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(false);
  const [ndas, setNdas] = useState([]);
  const [currentNdaId, setCurrentNdaId] = useState(null);
  const [searchId, setSearchId] = useState('');
  
  const [accessedIds, setAccessedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('nda_accessed_ids');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [formData, setFormData] = useState({
    partyA: '',
    partyB: '',
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    scope: { all: true }, 
    duration: '1year',   
    signatureA: null,
    signatureB: null,
    status: 'draft' 
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [showCreatedSuccess, setShowCreatedSuccess] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    localStorage.setItem('nda_accessed_ids', JSON.stringify(accessedIds));
  }, [accessedIds]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const ndasRef = collection(db, 'artifacts', appId, 'public', 'data', 'ndas');
    return onSnapshot(ndasRef, (snapshot) => {
      setNdas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Firestore error:", err));
  }, [user]);

  const markAsAccessed = (id) => {
    if (!accessedIds.includes(id)) {
      setAccessedIds(prev => [...prev, id]);
    }
  };

  useEffect(() => {
    if (!user || !currentNdaId) return;
    const ndaDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'ndas', currentNdaId);
    return onSnapshot(ndaDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setFormData(prev => ({ ...prev, ...data }));
        markAsAccessed(currentNdaId);
      }
    });
  }, [user, currentNdaId]);

  const handleStartNew = () => {
    setCurrentNdaId(null);
    setFormData({
      partyA: '', partyB: '', purpose: '', 
      date: new Date().toISOString().split('T')[0],
      scope: { all: true },
      duration: '1year',
      signatureA: null, signatureB: null, status: 'draft'
    });
    setView('edit');
  };

  const handleSaveOrUpdate = async () => {
    if (!user) return;
    setLoading(true);
    const isNew = !currentNdaId;
    try {
      const ndasRef = collection(db, 'artifacts', appId, 'public', 'data', 'ndas');
      const nextStatus = (formData.signatureA && formData.signatureB) ? 'completed' : 
                         (formData.signatureA || formData.signatureB) ? 'partially_signed' : 'draft';
      
      const payload = {
        ...formData,
        status: nextStatus,
        updatedAt: new Date().toISOString()
      };

      if (currentNdaId) {
        await updateDoc(doc(ndasRef, currentNdaId), payload);
      } else {
        const newDoc = await addDoc(ndasRef, { ...payload, createdAt: new Date().toISOString(), createdBy: user.uid });
        setCurrentNdaId(newDoc.id);
        markAsAccessed(newDoc.id);
      }

      if (nextStatus === 'completed') {
        setShowSuccess(true);
      } else if (isNew) {
        setShowCreatedSuccess(true);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchNDA = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    try {
      const ndaDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'ndas', searchId.trim());
      const ndaSorted = await getDoc(ndaDocRef);
      if (ndaSorted.exists()) {
        setCurrentNdaId(searchId.trim());
        setFormData(ndaSorted.data());
        markAsAccessed(searchId.trim());
        setView('edit');
      } else {
        alert("そのIDは見つからなかったよ🥺 正しいか確認してみてね！");
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!currentNdaId) return;
    const textArea = document.createElement("textarea");
    textArea.value = currentNdaId;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const toggleScope = (id) => {
    if (formData.status === 'completed') return;
    setFormData(prev => ({
      ...prev,
      scope: { ...prev.scope, [id]: !prev.scope[id] }
    }));
  };

  const filteredNdas = ndas.filter(nda => 
    nda.createdBy === user?.uid || accessedIds.includes(nda.id)
  );

  const totalCompletedCount = ndas.filter(n => n.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      
      <div className="max-w-7xl mx-auto relative">
        
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100 border border-white gap-4">
          <div onClick={() => setView('home')} className="cursor-pointer group flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
                <LucideFileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-500">
                NDA結んどこか
              </h1>
            </div>
            <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 shadow-inner">
              <LucideZap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                今までに <span className="text-indigo-600 text-xs">{totalCompletedCount}回</span> 結ばれたよ！
              </span>
            </div>
          </div>
          <nav className="flex gap-3 bg-slate-100/50 p-2 rounded-3xl">
            <button onClick={() => setView('home')} className={`px-6 py-2 rounded-2xl text-sm font-bold transition-all ${view === 'home' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>
              ホーム
            </button>
            <button onClick={() => setView('history')} className={`px-6 py-2 rounded-2xl text-sm font-bold transition-all ${view === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>
              履歴 <span className="ml-1 opacity-50">{filteredNdas.length}</span>
            </button>
          </nav>
        </header>

        {view === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 max-w-5xl mx-auto py-10">
            <div className="group bg-white p-12 rounded-[3rem] shadow-2xl shadow-indigo-100 border border-slate-50 flex flex-col items-center text-center gap-8 hover:-translate-y-2 transition-all duration-500">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                <LucideSparkles className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-3">新しく結ぶ</h2>
                <p className="text-slate-400 text-sm font-medium px-6 leading-relaxed">自分好みのルールを決めて、秒でNDAを作成しよう✨</p>
              </div>
              <button onClick={handleStartNew} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[2rem] shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95">
                作成スタート！
              </button>
            </div>

            <div className="group bg-white p-12 rounded-[3rem] shadow-2xl shadow-pink-100 border border-slate-50 flex flex-col items-center text-center gap-8 hover:-translate-y-2 transition-all duration-500">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl shadow-pink-200">
                <LucideSearch className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-3">IDを教えてもらった</h2>
                <p className="text-slate-400 text-sm font-medium px-6 leading-relaxed">送られてきた「契約ID」を入力して、内容チェックと署名をするよ🤝</p>
              </div>
              <div className="w-full space-y-3">
                <div className="flex gap-2 p-2 bg-slate-50 rounded-[2rem] border border-slate-100 focus-within:border-pink-300 transition-all">
                  <input 
                    type="text" 
                    placeholder="IDを入れてね..." 
                    className="flex-grow bg-transparent px-5 py-2 font-bold outline-none placeholder:text-slate-300"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                  />
                  <button onClick={handleSearchNDA} className="bg-slate-900 hover:bg-black text-white px-8 rounded-[1.5rem] font-bold transition-all disabled:opacity-50" disabled={loading}>
                    開く
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'edit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in zoom-in-95 duration-500">
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                    Setting
                  </h2>
                  {formData.status === 'completed' && (
                    <span className="bg-emerald-100 text-emerald-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-tighter shadow-sm border border-emerald-50">
                      Done ✨
                    </span>
                  )}
                </div>

                {currentNdaId && (
                  <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-lg shadow-indigo-100 flex flex-col gap-3">
                    <p className="text-[10px] uppercase font-black text-indigo-200 tracking-[0.2em]">Share this ID with Partner</p>
                    <div className="flex justify-between items-center bg-indigo-700/50 p-3 rounded-2xl border border-white/10">
                      <p className="text-xs font-mono text-white truncate mr-4">{currentNdaId}</p>
                      <button onClick={copyToClipboard} className="bg-white text-indigo-600 p-2 rounded-xl hover:scale-110 transition-all">
                        {copyFeedback ? <LucideCheckCircle className="w-4 h-4" /> : <LucideCopy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase ml-2">甲（あなた）</label>
                      <input 
                        disabled={formData.status === 'completed'}
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold"
                        value={formData.partyA}
                        onChange={(e) => setFormData({...formData, partyA: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase ml-2">乙（お相手）</label>
                      <input 
                        disabled={formData.status === 'completed'}
                        type="text" 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold"
                        value={formData.partyB}
                        onChange={(e) => setFormData({...formData, partyB: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-2">契約の目的は？</label>
                    <input 
                      disabled={formData.status === 'completed'}
                      type="text" 
                      placeholder="例：コラボ企画の打ち合わせ"
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold"
                      value={formData.purpose}
                      onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase ml-2">守ってほしい情報 📂</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SCOPE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        disabled={formData.status === 'completed'}
                        onClick={() => toggleScope(opt.id)}
                        className={`flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all ${
                          formData.scope[opt.id] 
                            ? `${opt.color} shadow-lg shadow-current/10 font-black` 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors ${formData.scope[opt.id] ? 'bg-current border-transparent' : 'border-slate-200'}`}>
                          {formData.scope[opt.id] && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase ml-2">有効期間は？ ⏳</label>
                  <div className="grid grid-cols-4 gap-2">
                    {DURATION_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        disabled={formData.status === 'completed'}
                        onClick={() => setFormData({...formData, duration: opt.id})}
                        className={`py-3 rounded-2xl border-2 text-sm font-black transition-all ${
                          formData.duration === opt.id 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 space-y-8">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-8 bg-pink-500 rounded-full"></div>
                  Signature
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SignaturePad 
                    label="甲のサイン" 
                    accentColor="indigo"
                    existingSignature={formData.signatureA} 
                    onSave={(sig) => setFormData({...formData, signatureA: sig})}
                    disabled={formData.status === 'completed'}
                  />
                  <SignaturePad 
                    label="乙のサイン" 
                    accentColor="pink"
                    existingSignature={formData.signatureB} 
                    onSave={(sig) => setFormData({...formData, signatureB: sig})}
                    disabled={formData.status === 'completed'}
                  />
                </div>
                <button
                  onClick={handleSaveOrUpdate}
                  disabled={loading || formData.status === 'completed'}
                  className="group relative w-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-black py-6 rounded-[2rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale overflow-hidden"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3 text-lg">
                    {loading ? "送信中..." : (
                      formData.status === 'completed' ? (
                        <>締結完了！🎉</>
                      ) : (
                        currentNdaId ? <>更新して保存 🚀</> : <>内容を確定してID発行 🌟</>
                      )
                    )}
                  </div>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 h-fit sticky top-8">
              <div className="bg-slate-900 p-4 pb-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <div className="bg-white p-12 rounded-[3rem] shadow-inner min-h-[850px] flex flex-col relative">
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/clean-gray-paper.png")' }}></div>
                  
                  <div className="whitespace-pre-wrap font-serif text-slate-800 text-[14px] leading-relaxed mb-16 relative z-10">
                    {DEFAULT_NDA_TEMPLATE(formData)}
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-16 relative z-10">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b-2 border-indigo-50 pb-1">Signature 甲</p>
                      <div className="h-24 flex items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 overflow-hidden">
                        {formData.signatureA && <img src={formData.signatureA} alt="Sig A" className="h-full w-full object-contain p-2" />}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest border-b-2 border-pink-50 pb-1">Signature 乙</p>
                      <div className="h-24 flex items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 overflow-hidden">
                        {formData.signatureB && <img src={formData.signatureB} alt="Sig B" className="h-full w-full object-contain p-2" />}
                      </div>
                    </div>
                  </div>

                  {formData.status === 'completed' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      <div className="border-[12px] border-emerald-500 text-emerald-500 font-black text-7xl uppercase tracking-[0.3em] -rotate-12 px-10 py-6 rounded-3xl animate-in zoom-in-50 duration-300 shadow-2xl bg-white/80 backdrop-blur-sm text-center">
                        結んだ！
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center gap-2 mt-6">
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                  <div className="w-12 h-3 rounded-full bg-indigo-500"></div>
                  <div className="w-3 h-3 rounded-full bg-white/20"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 py-10 max-w-4xl mx-auto">
            <h2 className="text-4xl font-black text-slate-800 mb-10 text-center">過去に結んだやつ</h2>
            {filteredNdas.length === 0 ? (
              <div className="bg-white p-20 rounded-[3rem] text-center shadow-2xl border border-slate-50">
                <p className="text-slate-300 font-bold text-lg">まだ履歴がないよ。新しく作ってみて！✨</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {[...filteredNdas].reverse().map(nda => (
                  <div 
                    key={nda.id} 
                    onClick={() => { setCurrentNdaId(nda.id); setFormData(nda); setView('edit'); }}
                    className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-2xl hover:shadow-indigo-100 transition-all cursor-pointer flex flex-col md:flex-row justify-between items-center gap-6"
                  >
                    <div className="flex gap-6 items-center">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${nda.status === 'completed' ? 'bg-emerald-100 text-emerald-500' : 'bg-amber-100 text-amber-500'}`}>
                        <LucideFileText className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-slate-800">{nda.partyA || "Somebody"} & {nda.partyB || "Somebody"}</h3>
                        <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">{nda.purpose || "Something Important"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-300 group-hover:text-indigo-500 transition-colors">
                      <LucideChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showCreatedSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-indigo-900/60 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-white p-12 rounded-[4rem] shadow-2xl flex flex-col items-center gap-6 max-w-md text-center border border-white scale-100 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                <LucideSend className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-3xl font-black mb-3">作成完了！🎉</h3>
                <p className="text-slate-400 font-bold px-4 leading-relaxed">契約IDが発行されたよ。このIDをお相手にシェアしてね！</p>
              </div>
              <div className="w-full bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                <p className="text-xs font-mono text-slate-500 truncate mr-2">{currentNdaId}</p>
                <button onClick={copyToClipboard} className="text-indigo-600 font-black text-xs hover:scale-105 transition-all">
                  {copyFeedback ? "OK!" : "COPY"}
                </button>
              </div>
              <button 
                onClick={() => { setShowCreatedSuccess(false); setView('home'); }} 
                className="mt-2 w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black hover:bg-indigo-700 transition-all shadow-xl"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-emerald-900/60 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-white p-12 rounded-[4rem] shadow-2xl flex flex-col items-center gap-6 max-w-md text-center border border-white scale-100 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-200 animate-bounce">
                <LucidePartyPopper className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-3xl font-black mb-3">契約締結完了！</h3>
                <p className="text-slate-400 font-bold px-4 leading-relaxed">双方がサインしたよ！これで「NDA結んどこか」のミッション完了🔒✨</p>
              </div>
              <button 
                onClick={() => { setShowSuccess(false); setView('home'); }} 
                className="mt-4 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-black transition-all shadow-xl"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
