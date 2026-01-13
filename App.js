<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NDA結んどこか - React JSX Version</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- React & Babel (JSX用) -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans JP', sans-serif; }
        .signature-canvas { touch-action: none; cursor: crosshair; }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce-subtle { animation: bounce-subtle 2s infinite ease-in-out; }
    </style>
</head>
<body class="bg-gradient-to-br from-indigo-50 via-white to-pink-50 text-slate-900 min-h-screen">
    <div id="root"></div>

    <!-- Firebase SDK Setup -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
        import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
        import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

        window.FirebaseSDK = { initializeApp, getAuth, signInAnonymously, onAuthStateChanged, getFirestore, collection, addDoc, onSnapshot, doc, getDoc, updateDoc };
    </script>

    <!-- React App Implementation -->
    <script type="text/babel">
        const { useState, useRef, useEffect } = React;

        // --- 独自アイコンコンポーネント (エラー回避のためグループ化タグを追加) ---
        const Icon = ({ name, size = 24, className = "" }) => {
            const paths = {
                FileText: <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M8 18h8M8 14h8M8 10h4" />,
                PenTool: <path d="m12 19 7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 2h3l5 5" />,
                CheckCircle: <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />,
                RotateCcw: <path d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />,
                Sparkles: <path d="m12 3 1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3zM5 3v4M3 5h4M19 17v4M17 19h4" />,
                PartyPopper: <path d="M4 22v-7a2 2 0 0 0-2-2c0-1.1.9-2 2-2h7a2 2 0 0 0 2 2c0 1.1-.9 2-2 2v7M9 7l1-3m4 3l3-3m-6 3l-2-2M2 2l3.5 3.5M19 2l-3.5 3.5M10.5 17.5l-2-2M15.5 17.5l2-2" />,
                Send: <path d="m22 2-7 20-4-9-9-4 20-7zM22 2l-11 11" />,
                ChevronRight: <path d="m9 18 6-6-6-6" />,
                Zap: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
                // グループタグ <g> で囲むことで隣接JSX要素エラーを回避
                Search: <g><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></g>,
                Copy: <g><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></g>
            };

            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={className}
                >
                    {paths[name]}
                </svg>
            );
        };

        // --- あなたのFirebase設定 ---
        const firebaseConfig = {
            apiKey: "AIzaSyCAgZM1wpTHjRd5yb9NUU3eYFYtZkxWhM8",
            authDomain: "my-nda-app.firebaseapp.com",
            projectId: "my-nda-app",
            storageBucket: "my-nda-app.firebasestorage.app",
            messagingSenderId: "80744851082",
            appId: "1:80744851082:web:34a836dfe68222181cef73",
            measurementId: "G-LJGPM5G4SN"
        };

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

        // サイン用コンポーネント
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
            }, [existingSignature, isDrawing]);

            const getPoint = (e) => {
                const rect = canvasRef.current.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return { x: clientX - rect.left, y: clientY - rect.top };
            };

            const startDrawing = (e) => {
                if (disabled) return;
                const { x, y } = getPoint(e);
                const ctx = canvasRef.current.getContext('2d');
                ctx.beginPath();
                ctx.moveTo(x, y);
                setIsDrawing(true);
            };

            const draw = (e) => {
                if (!isDrawing || disabled) return;
                const { x, y } = getPoint(e);
                const ctx = canvasRef.current.getContext('2d');
                ctx.lineTo(x, y);
                ctx.stroke();
            };

            const stopDrawing = () => {
                if (disabled || !isDrawing) return;
                setIsDrawing(false);
                onSave(canvasRef.current.toDataURL());
            };

            return (
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-end px-2">
                        <label className={`text-xs font-black uppercase tracking-wider ${accentColor === 'pink' ? 'text-pink-500' : 'text-indigo-500'}`}>{label}</label>
                        {existingSignature && !disabled && (
                            <button onClick={() => onSave(null)} className="flex items-center gap-1 text-[10px] bg-white text-rose-400 px-3 py-1 rounded-full border border-rose-100 shadow-sm">
                                <Icon name="RotateCcw" size={12} />消す
                            </button>
                        )}
                    </div>
                    <div className={`relative border-2 ${disabled ? 'border-indigo-50 bg-indigo-50/10' : 'border-slate-100 bg-white'} rounded-[2rem] overflow-hidden aspect-[4/3] shadow-sm`}>
                        {disabled ? (
                            <img src={existingSignature} className="w-full h-full object-contain p-6" />
                        ) : (
                            <React.Fragment>
                                <canvas
                                    ref={canvasRef} width={300} height={200} className="signature-canvas w-full h-full"
                                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing}
                                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                />
                                {!existingSignature && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                                        <Icon name="PenTool" size={24} className={accentColor === 'pink' ? 'text-pink-500' : 'text-indigo-500'} />
                                        <p className="text-[10px] font-black uppercase mt-1">Sign Here</p>
                                    </div>
                                )}
                            </React.Fragment>
                        )}
                    </div>
                </div>
            );
        };

        function App() {
            const [db, setDb] = useState(null);
            const [auth, setAuth] = useState(null);
            const [user, setUser] = useState(null);
            const [view, setView] = useState('home');
            const [loading, setLoading] = useState(false);
            const [ndas, setNdas] = useState([]);
            const [currentNdaId, setCurrentNdaId] = useState(null);
            const [searchId, setSearchId] = useState('');
            const [accessedIds, setAccessedIds] = useState(() => {
                const s = localStorage.getItem('nda_accessed_ids');
                return s ? JSON.parse(s) : [];
            });
            const [formData, setFormData] = useState({
                partyA: '', partyB: '', purpose: '', 
                date: new Date().toISOString().split('T')[0],
                scope: { all: true }, duration: '1year', 
                signatureA: null, signatureB: null, status: 'draft' 
            });

            const appIdPrefix = 'remote-nda-app';

            useEffect(() => {
                const checkSDK = setInterval(() => {
                    if (window.FirebaseSDK) {
                        clearInterval(checkSDK);
                        const { initializeApp, getAuth, signInAnonymously, onAuthStateChanged, getFirestore } = window.FirebaseSDK;
                        const app = initializeApp(firebaseConfig);
                        const _auth = getAuth(app);
                        const _db = getFirestore(app);
                        setAuth(_auth);
                        setDb(_db);
                        signInAnonymously(_auth).catch(console.error);
                        onAuthStateChanged(_auth, setUser);
                    }
                }, 100);
            }, []);

            useEffect(() => {
                if (!user || !db) return;
                const { collection, onSnapshot } = window.FirebaseSDK;
                const q = collection(db, 'artifacts', appIdPrefix, 'public', 'data', 'ndas');
                return onSnapshot(q, (s) => {
                    setNdas(s.docs.map(d => ({ id: d.id, ...d.data() })));
                });
            }, [user, db]);

            useEffect(() => {
                if (!user || !db || !currentNdaId) return;
                const { doc, onSnapshot } = window.FirebaseSDK;
                const ref = doc(db, 'artifacts', appIdPrefix, 'public', 'data', 'ndas', currentNdaId);
                return onSnapshot(ref, (s) => {
                    if (s.exists()) setFormData(prev => ({ ...prev, ...s.data() }));
                });
            }, [user, db, currentNdaId]);

            useEffect(() => {
                localStorage.setItem('nda_accessed_ids', JSON.stringify(accessedIds));
            }, [accessedIds]);

            const handleStartNew = () => {
                setCurrentNdaId(null);
                setFormData({
                    partyA: '', partyB: '', purpose: '', 
                    date: new Date().toISOString().split('T')[0],
                    scope: { all: true }, duration: '1year', 
                    signatureA: null, signatureB: null, status: 'draft' 
                });
                setView('edit');
            };

            const handleSave = async () => {
                if (!user || !db) return;
                setLoading(true);
                const { collection, addDoc, doc, updateDoc } = window.FirebaseSDK;
                try {
                    const nextStatus = (formData.signatureA && formData.signatureB) ? 'completed' : 
                                      (formData.signatureA || formData.signatureB) ? 'partially_signed' : 'draft';
                    const payload = { ...formData, status: nextStatus, updatedAt: new Date().toISOString() };
                    const colRef = collection(db, 'artifacts', appIdPrefix, 'public', 'data', 'ndas');
                    
                    if (currentNdaId) {
                        await updateDoc(doc(colRef, currentNdaId), payload);
                    } else {
                        const d = await addDoc(colRef, { ...payload, createdAt: new Date().toISOString(), createdBy: user.uid });
                        setCurrentNdaId(d.id);
                        setAccessedIds(prev => [...new Set([...prev, d.id])]);
                    }
                    if (nextStatus === 'completed') setView('home'); 
                } catch (e) { console.error(e); }
                finally { setLoading(false); }
            };

            const handleSearch = async () => {
                if (!searchId.trim() || !user || !db) return;
                setLoading(true);
                const { doc, getDoc } = window.FirebaseSDK;
                try {
                    const ref = doc(db, 'artifacts', appIdPrefix, 'public', 'data', 'ndas', searchId.trim());
                    const s = await getDoc(ref);
                    if (s.exists()) {
                        setCurrentNdaId(searchId.trim());
                        setFormData(s.data());
                        setAccessedIds(prev => [...new Set([...prev, searchId.trim()])]);
                        setView('edit');
                    } else alert("見つかりませんでした🥺");
                } catch (e) { console.error(e); }
                finally { setLoading(false); }
            };

            const copyId = () => {
                if (!currentNdaId) return;
                const t = document.createElement("textarea");
                t.value = currentNdaId;
                document.body.appendChild(t); t.select();
                document.execCommand('copy');
                document.body.removeChild(t);
                alert("IDをコピーしました！");
            };

            const filtered = ndas.filter(n => n.createdBy === user?.uid || accessedIds.includes(n.id));
            const count = ndas.filter(n => n.status === 'completed').length;

            return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl border border-white gap-4">
                        <div onClick={() => setView('home')} className="cursor-pointer flex flex-col items-center md:items-start">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg">
                                    <Icon name="FileText" className="text-white" />
                                </div>
                                <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500">NDA結んどこか</h1>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 bg-slate-50 px-3 py-1 rounded-full text-[10px] font-black text-slate-400">
                                <Icon name="Zap" size={12} className="text-amber-400 fill-amber-400" />
                                今までに {count}回 結ばれたよ！
                            </div>
                        </div>
                        <nav className="flex gap-2 bg-slate-100/50 p-1.5 rounded-3xl">
                            <button onClick={() => setView('home')} className={`px-6 py-2 rounded-2xl text-sm font-bold transition-all ${view === 'home' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-50'}`}>ホーム</button>
                            <button onClick={() => setView('history')} className={`px-6 py-2 rounded-2xl text-sm font-bold transition-all ${view === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>履歴 ({filtered.length})</button>
                        </nav>
                    </header>

                    {view === 'home' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center flex flex-col items-center gap-6">
                                <div className="w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg"><Icon name="Sparkles" size={40} /></div>
                                <h2 className="text-xl font-black">新しく結ぶ</h2>
                                <button onClick={handleStartNew} className="w-full bg-indigo-600 text-white font-black py-4 rounded-[2rem] shadow-lg hover:bg-indigo-700 transition-all">作成スタート！</button>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center flex flex-col items-center gap-6">
                                <div className="w-20 h-20 bg-pink-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg"><Icon name="Search" size={40} /></div>
                                <h2 className="text-xl font-black">IDで参加</h2>
                                <div className="w-full flex gap-2 p-2 bg-slate-50 rounded-[2rem] border border-slate-100 focus-within:border-indigo-400">
                                    <input type="text" placeholder="IDを入力..." className="flex-grow bg-transparent px-4 py-2 font-bold outline-none text-sm" value={searchId} onChange={e => setSearchId(e.target.value)} />
                                    <button onClick={handleSearch} className="bg-slate-900 text-white px-6 rounded-[1.5rem] font-bold text-sm hover:bg-black transition-all">GO!</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'edit' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
                                    <h2 className="text-xl font-black flex items-center gap-2"><div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>Setting</h2>
                                    {currentNdaId && (
                                        <div className="bg-indigo-600 p-4 rounded-2xl flex justify-between items-center text-white shadow-inner">
                                            <div className="truncate">
                                                <p className="text-[8px] font-black opacity-50 uppercase tracking-widest">Contract ID</p>
                                                <p className="text-xs font-mono">{currentNdaId}</p>
                                            </div>
                                            <button onClick={copyId} className="bg-white text-indigo-600 p-2 rounded-xl hover:scale-110 transition-all"><Icon name="Copy" size={16} /></button>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <input disabled={formData.status === 'completed'} placeholder="甲（あなた）" className="px-5 py-3 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none transition-all" value={formData.partyA} onChange={e => setFormData({...formData, partyA: e.target.value})} />
                                        <input disabled={formData.status === 'completed'} placeholder="乙（お相手）" className="px-5 py-3 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none transition-all" value={formData.partyB} onChange={e => setFormData({...formData, partyB: e.target.value})} />
                                    </div>
                                    <input disabled={formData.status === 'completed'} placeholder="契約の目的" className="w-full px-5 py-3 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-indigo-400 outline-none transition-all" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} />
                                    <div className="grid grid-cols-3 gap-2">
                                        {SCOPE_OPTIONS.map(o => (
                                            <button key={o.id} onClick={() => setFormData({...formData, scope: {...formData.scope, [o.id]: !formData.scope?.[o.id]}})} className={`py-2 rounded-xl border-2 text-[10px] font-black transition-all ${formData.scope?.[o.id] ? `${o.color} border-current shadow-sm` : 'bg-white border-slate-100 text-slate-400'}`}>{o.label}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
                                    <h2 className="text-xl font-black flex items-center gap-2"><div className="w-1.5 h-6 bg-pink-500 rounded-full"></div>Signature</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <SignaturePad label="甲のサイン" accentColor="indigo" existingSignature={formData.signatureA} onSave={s => setFormData({...formData, signatureA: s})} disabled={formData.status === 'completed'} />
                                        <SignaturePad label="乙のサイン" accentColor="pink" existingSignature={formData.signatureB} onSave={s => setFormData({...formData, signatureB: s})} disabled={formData.status === 'completed'} />
                                    </div>
                                    <button onClick={handleSave} disabled={loading || formData.status === 'completed'} className="w-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-black py-4 rounded-[2rem] shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                                        {formData.status === 'completed' ? '締結済み！🎉' : (currentNdaId ? '更新して保存 🚀' : '確定してID発行 🌟')}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-4 pb-12 rounded-[3rem] shadow-2xl relative overflow-hidden min-h-[600px]">
                                <div className="bg-white p-10 rounded-[2.5rem] shadow-inner h-full flex flex-col relative overflow-y-auto">
                                    <pre className="whitespace-pre-wrap font-serif text-[12px] leading-relaxed text-slate-700">
                                        {`秘密保持契約書\n\n${formData.partyA || "（未入力）"}（以下「甲」という）と、${formData.partyB || "（未入力）"}（以下「乙」という）は、${formData.purpose || "（未入力）"}（以下「本目的」という）に関し、甲又は乙が相手方に開示する秘密情報の取扱いについて、以下の通り契約を締結する。\n\n第1条（秘密情報）\n本契約において「秘密情報」とは、本目的に関連して、一方当事者が相手方に対し、書面、口頭、電子データ等、形式の如何を問わず開示された一切の情報をいう。\n\n締結日: ${formData.date}\n甲: ${formData.partyA}\n乙: ${formData.partyB}`}
                                    </pre>
                                    {formData.status === 'completed' && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/40 backdrop-blur-[1px]">
                                            <div className="border-[8px] border-emerald-500 text-emerald-500 font-black text-4xl uppercase tracking-widest -rotate-12 px-6 py-4 rounded-2xl bg-white shadow-2xl animate-in zoom-in-50 duration-300">結んだ！</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'history' && (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <h2 className="text-3xl font-black text-center mb-8">過去に結んだやつ</h2>
                            {filtered.length === 0 ? (
                                <div className="bg-white p-12 rounded-[3rem] text-center shadow-md text-slate-300 font-bold">まだ履歴がないよ✨</div>
                            ) : (
                                filtered.slice().reverse().map(n => (
                                    <div key={n.id} onClick={() => { setCurrentNdaId(n.id); setFormData(n); setView('edit'); }} className="bg-white p-6 rounded-[2rem] shadow-md flex justify-between items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${n.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-500'}`}><Icon name="FileText" /></div>
                                            <div>
                                                <h3 className="font-black text-sm text-slate-700">{n.partyA || "?"} & {n.partyB || "?"}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{n.purpose}</p>
                                            </div>
                                        </div>
                                        <Icon name="ChevronRight" size={20} className="text-slate-300" />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            );
        }

        const container = document.getElementById('root');
        const root = ReactDOM.createRoot(container);
        root.render(<App />);
    </script>
</body>
</html>
