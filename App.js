<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NDA結んどこか</title>

  <!-- Tailwind (CDN) -->
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
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

  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.3.1",
      "react-dom": "https://esm.sh/react-dom@18.3.1",
      "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
      "lucide-react": "https://esm.sh/lucide-react@0.469.0?deps=react@18.3.1",
      "firebase/app": "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js",
      "firebase/auth": "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js",
      "firebase/firestore": "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js"
    }
  }
  </script>

  <script type="module">
    import React, { useState, useRef, useEffect } from 'react';
    import { createRoot } from 'react-dom/client';
    import {
      FileText, PenTool, CheckCircle, RotateCcw, Sparkles, PartyPopper,
      Send, ChevronRight, Zap, Search, Copy
    } from 'lucide-react';
    import { initializeApp } from 'firebase/app';
    import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
    import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';

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

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const appIdPrefix = 'remote-nda-app';

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

    const generateNDAText = (data) => {
      const selectedScopes = SCOPE_OPTIONS
        .filter(o => data.scope?.[o.id])
        .map(o => `「${o.label}」`);
      const scopeText = selectedScopes.length > 0 ? selectedScopes.join('、') : "（未選択）";
      const durationLabel = DURATION_OPTIONS.find(o => o.id === data.duration)?.label || "（未設定）";

      return `秘密保持契約書

${data.partyA || "（未入力）"}（以下「甲」という）と、${data.partyB || "（未入力）"}（以下「乙」という）は、${data.purpose || "（未入力）"}（以下「本目的」という）に関し、甲又は乙が相手方に開示する秘密情報の取扱いについて、以下の通り契約を締結する。

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

締結日: ${data.date || "（未設定）"}

甲: ${data.partyA || "（未入力）"}
乙: ${data.partyB || "（未入力）"}`;
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

      return React.createElement('div', { className: 'flex flex-col gap-3' },
        React.createElement('div', { className: 'flex justify-between items-end px-2' },
          React.createElement('label', { className: `text-xs font-black uppercase tracking-wider ${accentColor === 'pink' ? 'text-pink-500' : 'text-indigo-500'}` }, label),
          existingSignature && !disabled && React.createElement('button', {
            onClick: (e) => { e.preventDefault(); onSave(null); },
            className: 'flex items-center gap-1 text-[10px] bg-white hover:bg-rose-50 text-rose-400 px-3 py-1 rounded-full transition-all border border-rose-100 shadow-sm'
          }, React.createElement(RotateCcw, { size: 12 }), '消す')
        ),
        React.createElement('div', { className: `relative border-2 ${disabled ? 'border-indigo-50 bg-indigo-50/10' : 'border-slate-100 bg-white hover:border-indigo-200'} rounded-[2rem] overflow-hidden aspect-[4/3] md:aspect-[3/2] shadow-sm transition-all` },
          disabled
            ? React.createElement('img', { src: existingSignature, className: 'w-full h-full object-contain p-6' })
            : React.createElement(React.Fragment, null,
              React.createElement('canvas', {
                ref: canvasRef, width: 300, height: 200, className: 'signature-canvas w-full h-full',
                onMouseDown: startDrawing, onMouseMove: draw, onMouseUp: stopDrawing, onMouseOut: stopDrawing,
                onTouchStart: startDrawing, onTouchMove: draw, onTouchEnd: stopDrawing
              }),
              !existingSignature && React.createElement('div', { className: 'absolute inset-0 flex flex-col items-center justify-center pointer-events-none' },
                React.createElement(PenTool, { className: `w-6 h-6 mb-2 opacity-10 ${accentColor === 'pink' ? 'text-pink-500' : 'text-indigo-500'}` }),
                React.createElement('p', { className: 'text-[10px] text-slate-300 font-black tracking-[0.2em] uppercase' }, 'Sign Here')
              )
            )
        )
      );
    };

    function App() {
      const [user, setUser] = useState(null);
      const [view, setView] = useState('home');
      const [loading, setLoading] = useState(false);
      const [ndas, setNdas] = useState([]);
      const [currentNdaId, setCurrentNdaId] = useState(null);
      const [searchId, setSearchId] = useState('');
      const [accessedIds, setAccessedIds] = useState(() => {
        try {
          const s = localStorage.getItem('nda_accessed_ids');
          return s ? JSON.parse(s) : [];
        } catch (e) { return []; }
      });
      const [formData, setFormData] = useState({
        partyA: '', partyB: '', purpose: '',
        date: new Date().toISOString().split('T')[0],
        scope: { all: true }, duration: '1year',
        signatureA: null, signatureB: null, status: 'draft'
      });
      const [showSuccess, setShowSuccess] = useState(false);
      const [showCreatedSuccess, setShowCreatedSuccess] = useState(false);
      const [copyFeedback, setCopyFeedback] = useState(false);

      useEffect(() => {
        localStorage.setItem('nda_accessed_ids', JSON.stringify(accessedIds));
      }, [accessedIds]);

      useEffect(() => {
        const init = async () => {
          try { await signInAnonymously(auth); } catch (e) { console.error(e); }
        };
        init();
        return onAuthStateChanged(auth, setUser);
      }, []);

      useEffect(() => {
        if (!user) return;
        const q = collection(db, 'artifacts', appIdPrefix, 'public', 'data', 'ndas');
        return onSnapshot(q, (s) => {
          setNdas(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      }, [user]);

      useEffect(() => {
        if (!user || !currentNdaId) return;
        const ref = doc(db, 'artifacts', appIdPrefix, 'public', 'data', 'ndas', currentNdaId);
        return onSnapshot(ref, (s) => {
          if (s.exists()) setFormData(prev => ({ ...prev, ...s.data() }));
        });
      }, [user, currentNdaId]);

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
        if (!user) return;
        setLoading(true);
        const isNew = !currentNdaId;
        try {
          const nextStatus =
            (formData.signatureA && formData.signatureB) ? 'completed' :
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

          if (nextStatus === 'completed') setShowSuccess(true);
          else if (isNew) setShowCreatedSuccess(true);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };

      const handleSearch = async () => {
        if (!searchId.trim() || !user) return;
        setLoading(true);
        try {
          const ref = doc(db, 'artifacts', appIdPrefix, 'public', 'data', 'ndas', searchId.trim());
          const s = await getDoc(ref);
          if (s.exists()) {
            setCurrentNdaId(searchId.trim());
            setFormData(s.data());
            setAccessedIds(prev => [...new Set([...prev, searchId.trim()])]);
            setView('edit');
          } else {
            alert("見つからなかったよ🥺");
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };

      const copyId = () => {
        if (!currentNdaId) return;
        navigator.clipboard.writeText(currentNdaId).then(() => {
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2000);
        }).catch(() => {
          const t = document.createElement("textarea");
          t.value = currentNdaId;
          document.body.appendChild(t);
          t.select();
          document.execCommand('copy');
          document.body.removeChild(t);
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2000);
        });
      };

      const filtered = ndas.filter(n => n.createdBy === user?.uid || accessedIds.includes(n.id));
      const count = ndas.filter(n => n.status === 'completed').length;

      return React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-8' },
        React.createElement('header', { className: 'flex flex-col md:flex-row justify-between items-center mb-10 bg-white/70 backdrop-blur-md p-6 rounded-[2.5rem] shadow-xl border border-white gap-4' },
          React.createElement('div', { onClick: () => setView('home'), className: 'cursor-pointer group flex flex-col items-center md:items-start' },
            React.createElement('div', { className: 'flex items-center gap-3' },
              React.createElement('div', { className: 'bg-indigo-600 p-2 rounded-2xl group-hover:rotate-12 transition-all' },
                React.createElement(FileText, { className: 'text-white' })
              ),
              React.createElement('h1', { className: 'text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-500' }, 'NDA結んどこか')
            ),
            React.createElement('div', { className: 'flex items-center gap-1.5 mt-2 bg-slate-50 px-3 py-1 rounded-full text-[10px] font-black text-slate-400' },
              React.createElement(Zap, { size: 12, className: 'text-amber-400 fill-amber-400' }),
              `今までに ${count}回 結ばれたよ！`
            )
          ),
          React.createElement('nav', { className: 'flex gap-2 bg-slate-100/50 p-1.5 rounded-3xl' },
            [{ id: 'home', label: 'ホーム' }, { id: 'history', label: `履歴 (${filtered.length})` }].map(n =>
              React.createElement('button', {
                key: n.id,
                onClick: () => setView(n.id),
                className: `px-6 py-2 rounded-2xl text-sm font-bold transition-all ${view === n.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`
              }, n.label)
            )
          )
        ),

        view === 'home'
          ? React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto' },
              React.createElement('div', { className: 'bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 text-center flex flex-col items-center gap-6' },
                React.createElement('div', { className: 'w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg' },
                  React.createElement(Sparkles, { size: 40 })
                ),
                React.createElement('div', null,
                  React.createElement('h2', { className: 'text-xl font-black mb-2' }, '新しく結ぶ'),
                  React.createElement('p', { className: 'text-xs text-slate-400' }, '秒でNDAを作成しちゃうよ✨')
                ),
                React.createElement('button', {
                  onClick: handleStartNew,
                  className: 'w-full bg-indigo-600 text-white font-black py-4 rounded-[2rem] shadow-lg hover:bg-indigo-700 transition-all'
                }, '作成スタート！')
              ),
              React.createElement('div', { className: 'bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 text-center flex flex-col items-center gap-6' },
                React.createElement('div', { className: 'w-20 h-20 bg-pink-500 rounded-[2rem] flex items-center justify-center text-white shadow-lg' },
                  React.createElement(Search, { size: 40 })
                ),
                React.createElement('div', null,
                  React.createElement('h2', { className: 'text-xl font-black mb-2' }, 'IDで参加'),
                  React.createElement('p', { className: 'text-xs text-slate-400' }, '教えてもらったIDで署名するよ🤝')
                ),
                React.createElement('div', { className: 'w-full flex gap-2 p-2 bg-slate-50 rounded-[2rem] border border-slate-100' },
                  React.createElement('input', {
                    type: 'text',
                    placeholder: 'IDを入力...',
                    className: 'flex-grow bg-transparent px-4 py-2 font-bold outline-none text-sm',
                    value: searchId,
                    onChange: e => setSearchId(e.target.value)
                  }),
                  React.createElement('button', {
                    onClick: handleSearch,
                    className: 'bg-slate-900 text-white px-6 rounded-[1.5rem] font-bold text-sm hover:bg-black transition-all'
                  }, 'GO!')
                )
              )
            )
          : view === 'edit'
          ? React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-10' },
              React.createElement('div', { className: 'space-y-6' },
                React.createElement('div', { className: 'bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-6' },
                  React.createElement('h2', { className: 'text-xl font-black flex items-center gap-2' },
                    React.createElement('div', { className: 'w-1.5 h-6 bg-indigo-500 rounded-full' }),
                    'Setting'
                  ),
                  currentNdaId && React.createElement('div', { className: 'bg-indigo-600 p-4 rounded-2xl flex justify-between items-center text-white shadow-inner' },
                    React.createElement('div', { className: 'truncate' },
                      React.createElement('p', { className: 'text-[8px] font-black opacity-50 uppercase tracking-widest' }, 'Contract ID'),
                      React.createElement('p', { className: 'text-xs font-mono' }, currentNdaId)
                    ),
                    React.createElement('button', { onClick: copyId, className: 'bg-white text-indigo-600 p-2 rounded-xl hover:scale-110 transition-all' },
                      copyFeedback ? React.createElement(CheckCircle, { size: 16 }) : React.createElement(Copy, { size: 16 })
                    )
                  ),
                  React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                    React.createElement('input', {
                      disabled: formData.status === 'completed',
                      placeholder: '甲（あなた）',
                      className: 'px-5 py-3 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-400 focus:bg-white transition-all',
                      value: formData.partyA,
                      onChange: e => setFormData({ ...formData, partyA: e.target.value })
                    }),
                    React.createElement('input', {
                      disabled: formData.status === 'completed',
                      placeholder: '乙（お相手）',
                      className: 'px-5 py-3 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-400 focus:bg-white transition-all',
                      value: formData.partyB,
                      onChange: e => setFormData({ ...formData, partyB: e.target.value })
                    })
                  ),
                  React.createElement('input', {
                    disabled: formData.status === 'completed',
                    placeholder: '目的（例：相談、コラボ）',
                    className: 'w-full px-5 py-3 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-400 focus:bg-white transition-all',
                    value: formData.purpose,
                    onChange: e => setFormData({ ...formData, purpose: e.target.value })
                  }),
                  React.createElement('div', { className: 'grid grid-cols-3 gap-2' },
                    SCOPE_OPTIONS.map(o => React.createElement('button', {
                      key: o.id,
                      onClick: () => setFormData({ ...formData, scope: { ...formData.scope, [o.id]: !formData.scope?.[o.id] } }),
                      className: `py-2 rounded-xl border-2 text-[10px] font-black transition-all ${formData.scope?.[o.id] ? `${o.color} border-current shadow-sm` : 'bg-white border-slate-100 text-slate-400'}`
                    }, o.label))
                  )
                ),
                React.createElement('div', { className: 'bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-6' },
                  React.createElement('h2', { className: 'text-xl font-black flex items-center gap-2' },
                    React.createElement('div', { className: 'w-1.5 h-6 bg-pink-500 rounded-full' }),
                    'Signature'
                  ),
                  React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                    React.createElement(SignaturePad, {
                      label: '甲のサイン',
                      accentColor: 'indigo',
                      existingSignature: formData.signatureA,
                      onSave: s => setFormData({ ...formData, signatureA: s }),
                      disabled: formData.status === 'completed'
                    }),
                    React.createElement(SignaturePad, {
                      label: '乙のサイン',
                      accentColor: 'pink',
                      existingSignature: formData.signatureB,
                      onSave: s => setFormData({ ...formData, signatureB: s }),
                      disabled: formData.status === 'completed'
                    })
                  ),
                  React.createElement('button', {
                    onClick: handleSave,
                    disabled: loading || formData.status === 'completed',
                    className: 'w-full bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-black py-4 rounded-[2rem] shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50'
                  }, formData.status === 'completed' ? '締結済み！🎉' : (currentNdaId ? '更新して保存 🚀' : '確定してID発行 🌟'))
                )
              ),
              React.createElement('div', { className: 'bg-slate-900 p-4 pb-12 rounded-[3rem] shadow-2xl relative overflow-hidden min-h-[600px]' },
                React.createElement('div', { className: 'bg-white p-10 rounded-[2.5rem] shadow-inner h-full flex flex-col relative' },
                  React.createElement('pre', { className: 'whitespace-pre-wrap font-serif text-[12px] leading-relaxed text-slate-700 h-full' }, generateNDAText(formData)),
                  formData.status === 'completed' && React.createElement('div', { className: 'absolute inset-0 flex items-center justify-center pointer-events-none bg-white/40 backdrop-blur-[1px] rounded-[2.5rem]' },
                    React.createElement('div', { className: 'border-[8px] border-emerald-500 text-emerald-500 font-black text-4xl uppercase tracking-widest -rotate-12 px-6 py-4 rounded-2xl bg-white shadow-2xl animate-in zoom-in-50 duration-300' }, '結んだ！')
                  )
                )
              )
            )
          : React.createElement('div', { className: 'max-w-4xl mx-auto space-y-6' },
              React.createElement('h2', { className: 'text-3xl font-black text-center mb-8' }, '過去に結んだやつ'),
              filtered.length === 0
                ? React.createElement('div', { className: 'bg-white p-12 rounded-[3rem] text-center shadow-md' },
                    React.createElement('p', { className: 'text-slate-300 font-bold' }, 'まだ履歴がないよ✨')
                  )
                : filtered.slice().reverse().map(n => React.createElement('div', {
                    key: n.id,
                    onClick: () => { setCurrentNdaId(n.id); setFormData(n); setView('edit'); },
                    className: 'bg-white p-6 rounded-[2rem] shadow-md flex justify-between items-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-50'
                  },
                    React.createElement('div', { className: 'flex items-center gap-4' },
                      React.createElement('div', { className: `w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${n.status === 'completed' ? 'bg-emerald-100 text-emerald-500' : 'bg-amber-100 text-amber-500'}` },
                        React.createElement(FileText)
                      ),
                      React.createElement('div', null,
                        React.createElement('h3', { className: 'font-black text-sm text-slate-700' }, `${n.partyA || "?"} & ${n.partyB || "?"}`),
                        React.createElement('p', { className: 'text-[10px] text-slate-400 font-bold uppercase tracking-wider' }, n.purpose)
                      )
                    ),
                    React.createElement(ChevronRight, { size: 20, className: 'text-slate-300' })
                  ))
            ),

        showCreatedSuccess && React.createElement('div', { className: 'fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/60 backdrop-blur-xl animate-in fade-in duration-300' },
          React.createElement('div', { className: 'bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm w-full space-y-6 animate-in zoom-in-95' },
            React.createElement('div', { className: 'w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl' },
              React.createElement(Send)
            ),
            React.createElement('div', null,
              React.createElement('h3', { className: 'text-2xl font-black' }, '作成完了！🎉'),
              React.createElement('p', { className: 'text-xs text-slate-400 font-bold' }, 'IDをコピーしてお相手にシェアしてね')
            ),
            React.createElement('div', { className: 'bg-slate-50 p-4 rounded-xl flex justify-between items-center text-xs font-mono border border-slate-100' },
              React.createElement('span', { className: 'truncate mr-2' }, currentNdaId),
              React.createElement('button', { onClick: copyId, className: 'text-indigo-600 font-black' }, copyFeedback ? 'OK!' : 'COPY')
            ),
            React.createElement('button', {
              onClick: () => { setShowCreatedSuccess(false); setView('home'); },
              className: 'w-full bg-indigo-600 text-white font-black py-4 rounded-[2rem] shadow-lg hover:bg-indigo-700 transition-all'
            }, 'ホームに戻る')
          )
        ),

        showSuccess && React.createElement('div', { className: 'fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/60 backdrop-blur-xl animate-in fade-in duration-300' },
          React.createElement('div', { className: 'bg-white p-10 rounded-[3rem] shadow-2xl text-center max-w-sm w-full space-y-6 animate-in zoom-in-95' },
            React.createElement('div', { className: 'w-16 h-16 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl animate-bounce-subtle' },
              React.createElement(PartyPopper)
            ),
            React.createElement('h3', { className: 'text-2xl font-black' }, '契約締結完了！'),
            React.createElement('p', { className: 'text-xs text-slate-400 font-bold' }, '双方がサインしたよ！大事に保管しておくね🔒✨'),
            React.createElement('button', {
              onClick: () => { setShowSuccess(false); setView('home'); },
              className: 'w-full bg-slate-900 text-white font-black py-4 rounded-[2rem] shadow-lg hover:bg-black transition-all'
            }, 'ホームに戻る')
          )
        )
      );
    }

    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(React.createElement(App));
  </script>
</body>
</html>
