import { useEffect, useMemo, useState, type ReactNode, type FormEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useAskKannadaTutor, useHealthCheck, getHealthCheckQueryKey } from '@workspace/api-client-react';
import { BookOpen, Bookmark, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Compass, Headphones, Heart, Home, Languages, Menu, MessageCircle, Search, Send, Sparkles, Volume2, X, Zap } from 'lucide-react';
import './app.css';

type Lesson = { id: string; title: string; level: string; category: string; duration: number; description: string; phrases: { kannada: string; transliteration: string; meaning: string }[] };
type Phrase = { id: string; category: string; kannada: string; transliteration: string; meaning: string; favorite: boolean };
type Progress = { completedLessonIds: string[]; quizBestScore: number; streak: number; lastVisitDate: string };

const lessons: Lesson[] = [
  { id:'greetings', title:'First hellos', level:'Beginner', category:'Essentials', duration:8, description:'Start a conversation with warmth, respect, and the right greeting for the moment.', phrases:[
    {kannada:'ನಮಸ್ಕಾರ',transliteration:'namaskāra',meaning:'Hello / greetings'},
    {kannada:'ನೀವು ಹೇಗಿದ್ದೀರಿ?',transliteration:'nīvu hēgiddīri?',meaning:'How are you? (respectful)'},
    {kannada:'ಚೆನ್ನಾಗಿದ್ದೇನೆ',transliteration:'cennāgiddēne',meaning:'I am well'},
    {kannada:'ಧನ್ಯವಾದಗಳು',transliteration:'dhanyavādagaḷu',meaning:'Thank you'}
  ]},
  { id:'getting-around', title:'Getting around', level:'Beginner', category:'Travel', duration:10, description:'Ask for a place, understand a direction, and move around town with confidence.', phrases:[
    {kannada:'ಬಸ್ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?',transliteration:'bas nilḍāṇa ellide?',meaning:'Where is the bus stop?'},
    {kannada:'ನೇರವಾಗಿ ಹೋಗಿ',transliteration:'nēravāgi hōgi',meaning:'Go straight'},
    {kannada:'ಇಲ್ಲಿ ಇಳಿಸಿ',transliteration:'illi iḷisi',meaning:'Please drop me here'},
    {kannada:'ಎಷ್ಟು ದೂರ?',transliteration:'eṣṭu dūra?',meaning:'How far?'}
  ]},
  { id:'at-the-table', title:'At the table', level:'Beginner', category:'Food', duration:9, description:'Order a meal, ask what is in it, and make a simple preference known.', phrases:[
    {kannada:'ಊಟಕ್ಕೆ ಏನಿದೆ?',transliteration:'ūṭakke ēnide?',meaning:'What is there for a meal?'},
    {kannada:'ಇದು ಖಾರವೇ?',transliteration:'idu khāravē?',meaning:'Is this spicy?'},
    {kannada:'ನೀರು ಕೊಡಿ',transliteration:'nīru koḍi',meaning:'Please give me water'},
    {kannada:'ತುಂಬಾ ರುಚಿಯಾಗಿದೆ',transliteration:'tumbā ruciyāgide',meaning:'It is very tasty'}
  ]},
  { id:'workplace', title:'At work & campus', level:'Intermediate', category:'Work', duration:12, description:'Introduce yourself, ask for help, and find your way through a new workplace or campus.', phrases:[
    {kannada:'ನಾನು ಇಲ್ಲಿ ಹೊಸಬನು',transliteration:'nānu illi hosabanu',meaning:'I am new here'},
    {kannada:'ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡುತ್ತೀರಾ?',transliteration:'dayaviṭṭu sahāya māḍuttīrā?',meaning:'Could you please help me?'},
    {kannada:'ಸಭೆ ಯಾವಾಗ?',transliteration:'sabhe yāvāga?',meaning:'When is the meeting?'},
    {kannada:'ನನಗೆ ಅರ್ಥವಾಯಿತು',transliteration:'nanage arthavāyitu',meaning:'I understood'}
  ]},
  { id:'everyday-needs', title:'Everyday needs', level:'Intermediate', category:'Essentials', duration:11, description:'Handle the small, useful moments: asking for something, clarifying, and saying goodbye.', phrases:[
    {kannada:'ಇದು ಎಷ್ಟು?',transliteration:'idu eṣṭu?',meaning:'How much is this?'},
    {kannada:'ಸ್ವಲ್ಪ ನಿಧಾನವಾಗಿ ಹೇಳಿ',transliteration:'svalpa nidhānavāgi hēḷi',meaning:'Please speak a little slowly'},
    {kannada:'ಪರವಾಗಿಲ್ಲ',transliteration:'paravāgilla',meaning:'It is okay / no problem'},
    {kannada:'ಮತ್ತೆ ಸಿಗೋಣ',transliteration:'matte sigōṇa',meaning:'See you again'}
  ]},
  { id:'polite-clarifying', title:'Polite clarifying', level:'Advanced', category:'Essentials', duration:14, description:'Keep a longer conversation clear with respectful requests, clarifications, and confident follow-through.', phrases:[
    {kannada:'ನಾನು ಸರಿಯಾಗಿ ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನಾ?',transliteration:'nānu sariyāgi arthamāḍikoṇḍiddēnā?',meaning:'Have I understood correctly?'},
    {kannada:'ನಿಮಗೆ ಸಮಯವಿದ್ದರೆ, ಸಹಾಯ ಮಾಡುತ್ತೀರಾ?',transliteration:'nimage samayaviddare, sahāya māḍuttīrā?',meaning:'If you have time, could you help me?'},
    {kannada:'ನೀವು ಹೇಳಿದುದನ್ನು ಮತ್ತೊಮ್ಮೆ ಹೇಳುತ್ತೀರಾ?',transliteration:'nīvu hēḷidudannu mattonme hēḷuttīrā?',meaning:'Could you repeat what you said?'},
    {kannada:'ನಾನು ಪ್ರಯತ್ನಿಸಿ ನೋಡುತ್ತೇನೆ',transliteration:'nānu prayatnisi nōḍuttēne',meaning:'I will try'}
  ]}
];
const allPhrases: Phrase[] = lessons.flatMap(l => l.phrases.map((p,i)=>({ ...p, id:`${l.id}-${i}`, category:l.category, favorite:false })));
const quizQuestions = [
  { question:'You want to say “Thank you.” Which phrase is right?', options:['ಧನ್ಯವಾದಗಳು','ನಮಸ್ಕಾರ','ಎಷ್ಟು ದೂರ?','ಪರವಾಗಿಲ್ಲ'], answer:0, note:'ಧನ್ಯವಾದಗಳು (dhanyavādagaḷu) means thank you.' },
  { question:'What does “ಬಸ್ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?” mean?', options:['How much is this?','Where is the bus stop?','I am well','Go straight'], answer:1, note:'ಬಸ್ ನಿಲ್ದಾಣ is bus stop; ಎಲ್ಲಿದೆ asks where it is.' },
  { question:'Choose a respectful “How are you?”', options:['ನೀವು ಹೇಗಿದ್ದೀರಿ?','ನೀರು ಕೊಡಿ','ಇದು ಖಾರವೇ?','ಮತ್ತೆ ಸಿಗೋಣ'], answer:0, note:'ನೀವು is the respectful “you”; ಹೇಗಿದ್ದೀರಿ asks how you are.' },
  { question:'At a restaurant, how do you ask “Is this spicy?”', options:['ಊಟಕ್ಕೆ ಏನಿದೆ?','ಇಲ್ಲಿ ಇಳಿಸಿ','ಇದು ಖಾರವೇ?','ಚೆನ್ನಾಗಿದ್ದೇನೆ'], answer:2, note:'ಖಾರ means spicy; the question ending -ವೇ turns it into “is it?”' },
  { question:'Someone gives you directions. What does “ನೇರವಾಗಿ ಹೋಗಿ” mean?', options:['Go straight','Please give water','I understood','How far?'], answer:0, note:'ನೇರವಾಗಿ means straight; ಹೋಗಿ is a polite form of go.' }
];

const initialProgress: Progress = { completedLessonIds:[], quizBestScore:0, streak:1, lastVisitDate:new Date().toISOString().slice(0,10) };
function readSaved<T>(key:string, fallback:T):T { try { const v=localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } }
function speakKannada(text:string, setNotice:(s:string)=>void) {
  if (!('speechSynthesis' in window)) { setNotice('Speech playback is not available in this browser.'); return; }
  const voice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('kn'));
  if (!voice) { setNotice('No Kannada voice is installed on this device. Try enabling a Kannada voice in your system speech settings.'); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text); utterance.lang='kn-IN'; utterance.voice=voice; window.speechSynthesis.speak(utterance); setNotice('Playing Kannada pronunciation.');
}

const queryClient = new QueryClient();
const navItems = [
  {href:'/', label:'My learning', icon:Home}, {href:'/learn',label:'Lessons',icon:BookOpen}, {href:'/practice',label:'Practice',icon:MessageCircle},
  {href:'/quiz',label:'Quick quiz',icon:CircleHelp}, {href:'/phrasebook',label:'Phrasebook',icon:Bookmark}, {href:'/about',label:'About KannadaMitra',icon:Compass}
];

function Shell({ children, progress }: {children:ReactNode; progress:Progress}) {
  const [path] = useLocation(); const [mobileOpen,setMobileOpen]=useState(false);
  const health=useHealthCheck({query:{queryKey:getHealthCheckQueryKey(), refetchInterval:60000}});
  return <div className="app-shell grain">
    <aside className={`sidebar ${mobileOpen?'sidebar-open':''}`}>
      <div className="brand-row"><div className="brand-mark"><Languages size={20}/></div><div><div className="brand-name">Kannada<span>Mitra</span></div><div className="brand-sub">YOUR EVERYDAY LANGUAGE GUIDE</div></div><button className="mobile-close" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div>
      <div className="sidebar-caption">LEARN A LITTLE, EVERY DAY</div>
      <nav className="side-nav" aria-label="Main navigation">{navItems.map(({href,label,icon:Icon})=><Link key={href} href={href} data-testid={`link-nav-${href.replace('/','home')}`} className={`nav-link ${path===href?'active':''}`} onClick={()=>setMobileOpen(false)}><Icon size={18}/><span>{label}</span>{path===href&&<span className="nav-active-dot"/>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="mini-streak"><div className="streak-icon"><Zap size={17}/></div><div><strong>{progress.streak} day streak</strong><small>Keep your rhythm going</small></div></div><div className="api-status" data-testid="status-api"><span className={`status-dot ${health.isError?'offline':''}`}/><span>{health.isLoading?'Checking learning services…':health.isError?'Learning services offline':'Learning services ready'}</span></div><div className="sidebar-footer">Made for meaningful moments<br/><span>in Karnataka.</span></div></div>
    </aside>
    {mobileOpen&&<button className="mobile-scrim" aria-label="Close navigation overlay" onClick={()=>setMobileOpen(false)}/>}
    <main className="main-area"><header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={()=>setMobileOpen(true)}><Menu size={21}/></button><div className="breadcrumb"><span>KannadaMitra</span><ChevronRight size={14}/><strong>{navItems.find(n=>n.href===path)?.label||'Learn'}</strong></div><div className="topbar-right"><span className="greeting-chip"><span className="greeting-sun"/> Namaskāra, learner</span><div className="avatar">ನ</div></div></header><div className="content-wrap">{children}</div></main>
  </div>;
}

function PageHeading({eyebrow,title,subtitle,action}:{eyebrow:string;title:string;subtitle:string;action?:React.ReactNode}) {
  return <div className="page-heading"><div><div className="eyebrow"><span/>{eyebrow}</div><h1 className="display">{title}</h1><p>{subtitle}</p></div>{action}</div>;
}
function ProgressBar({value}:{value:number}) { return <div className="progress-track" aria-label={`${value}% complete`}><span style={{width:`${value}%`}}/></div>; }

function HomePage({progress}:{progress:Progress}) {
  const [speechNotice,setSpeechNotice]=useState('');
  const finished=progress.completedLessonIds.length; const next=lessons.find(l=>!progress.completedLessonIds.includes(l.id))||lessons[0];
  return <div className="page-enter">
    <section className="welcome-hero"><div className="hero-copy"><div className="hero-kicker"><span className="kicker-line"/> YOUR KANNADA, ONE MOMENT AT A TIME</div><h1 className="display">A little Kannada<br/>goes a <em>long way.</em></h1><p>Make everyday conversations feel easier — from your first “namaskāra” to finding your way around Bengaluru.</p><div className="hero-actions"><Link href="/learn" className="button-primary" data-testid="link-start-learning">Continue learning <ChevronRight size={17}/></Link><Link href="/practice" className="button-quiet" data-testid="link-practice-now">Try a real-life conversation <MessageCircle size={16}/></Link></div><div className="hero-note"><span className="note-check"><Check size={12}/></span>Start with useful phrases. Build confidence at your pace.</div><div className="hero-speech-notice" role="status">{speechNotice}</div></div><div className="hero-art"><div className="art-sun"/><div className="art-ring ring-one"/><div className="art-ring ring-two"/><div className="art-panel"><span className="art-label">TODAY'S WORD</span><strong className="kn">ನಮಸ್ಕಾರ</strong><span className="art-pronounce">namaskāra</span><span className="art-meaning">a respectful hello</span><button aria-label="Listen to namaskāra" className="listen-circle" onClick={()=>speakKannada('ನಮಸ್ಕಾರ',setSpeechNotice)}><Volume2 size={18}/></button></div><div className="art-stamp">ಕನ್ನಡ<br/><small>WITH KINDNESS</small></div><div className="art-lines"/></div></section>
    <section className="stat-row" aria-label="Your learning progress"><div className="stat-card"><div className="stat-icon stat-orange"><BookOpen size={18}/></div><div><strong>{finished}<span> / {lessons.length}</span></strong><small>lessons completed</small></div></div><div className="stat-card"><div className="stat-icon stat-green"><Zap size={18}/></div><div><strong>{progress.streak}<span>{progress.streak===1?' day':' days'}</span></strong><small>learning streak</small></div></div><div className="stat-card"><div className="stat-icon stat-blue"><CircleHelp size={18}/></div><div><strong>{progress.quizBestScore}<span> / 5</span></strong><small>best quiz score</small></div></div><div className="stat-aside">Progress is yours.<br/><strong>Small steps count.</strong></div></section>
    <section className="home-lower"><div className="section-main"><div className="section-heading"><div><div className="eyebrow"><span/> YOUR NEXT STEP</div><h2 className="display">Pick up where you are</h2></div><Link href="/learn" className="text-link">All lessons <ChevronRight size={15}/></Link></div><div className="next-card"><div className="next-number">0{lessons.findIndex(l=>l.id===next.id)+1}</div><div className="next-content"><div className="card-meta"><span className="tag tag-orange">{next.level}</span><span>{next.category}</span><span className="meta-dot"/> <Clock3 size={13}/>{next.duration} min</div><h3>{next.title}</h3><p>{next.description}</p><Link href={`/learn/${next.id}`} className="button-dark" data-testid="link-next-lesson">Open lesson <ChevronRight size={16}/></Link></div><div className="next-watermark kn">ಕನ್ನಡ</div></div>
      <div className="quick-grid"><Link href="/phrasebook" className="quick-card"><span className="quick-icon"><Bookmark size={18}/></span><div><strong>Find the right words</strong><small>Search practical phrases for today</small></div><ChevronRight size={16}/></Link><Link href="/quiz" className="quick-card"><span className="quick-icon quick-yellow"><Zap size={18}/></span><div><strong>Five-minute check-in</strong><small>Put a few new phrases to work</small></div><ChevronRight size={16}/></Link></div>
    </div><aside className="home-aside"><div className="aside-intro"><span className="tiny-sun"/> A FRIENDLY START</div><h3 className="display">Language opens doors.</h3><p>Moving, studying, or working in Karnataka can bring a hundred small “how do I say that?” moments. KannadaMitra gives you useful words for the moments that matter.</p><div className="aside-rule"/><div className="aside-stat"><strong>01</strong><span>Learn at your own pace<br/><small>Short lessons, everyday language</small></span></div><div className="aside-stat"><strong>02</strong><span>Practice without pressure<br/><small>Try a conversation, then try again</small></span></div><Link href="/about" className="aside-link">Why this project matters <ChevronRight size={14}/></Link></aside></section>
    <section className="impact-strip"><div className="impact-mark"><Heart size={18}/></div><p>Built to help newcomers feel a little more at home — with respect for the language and the people who speak it.</p><Link href="/about" className="impact-link">Our approach <ChevronRight size={14}/></Link></section>
  </div>;
}

function LearnPage({progress,onComplete}:{progress:Progress;onComplete:(id:string)=>void}) {
  const [category,setCategory]=useState('All'); const cats=['All',...Array.from(new Set(lessons.map(l=>l.category)))];
  const filtered=lessons.filter(l=>category==='All'||l.category===category);
  return <div className="page-enter"><PageHeading eyebrow="THE LESSON SHELF" title="Useful words, well placed." subtitle="Short, focused lessons for the conversations you are likely to have this week." action={<div className="lesson-count"><span>{progress.completedLessonIds.length}</span> of {lessons.length}<small>completed</small></div>}/>
    <div className="category-row" role="tablist" aria-label="Filter lessons">{cats.map(c=><button key={c} role="tab" aria-selected={category===c} onClick={()=>setCategory(c)} className={`filter-chip ${category===c?'selected':''}`} data-testid={`filter-lesson-${c.toLowerCase()}`}>{c}</button>)}</div>
    <div className="lesson-list">{filtered.map((l,i)=>{const done=progress.completedLessonIds.includes(l.id);return <article className={`lesson-row ${done?'lesson-done':''}`} key={l.id} data-testid={`card-lesson-${l.id}`}><div className="lesson-index">{done?<Check size={20}/>:String(i+1).padStart(2,'0')}</div><div className="lesson-info"><div className="card-meta"><span className={`tag ${l.level==='Beginner'?'tag-orange':'tag-green'}`}>{l.level}</span><span>{l.category}</span><span className="meta-dot"/><Clock3 size={13}/>{l.duration} min</div><h2>{l.title}</h2><p>{l.description}</p><div className="lesson-preview"><span className="kn">{l.phrases[0].kannada}</span><span>{l.phrases[0].transliteration}</span><span className="preview-meaning">{l.phrases[0].meaning}</span></div></div><div className="lesson-action"><span className="lesson-state">{done?'Completed':'Ready when you are'}</span><Link href={`/learn/${l.id}`} className="circle-arrow" aria-label={`Open ${l.title}`} data-testid={`link-open-lesson-${l.id}`}><ChevronRight size={19}/></Link></div></article>})}</div>
    <div className="lesson-footnote"><span><Headphones size={16}/></span><div><strong>Listen as you learn</strong><p>Each lesson includes useful phrases, pronunciation guides, and audio playback when a Kannada voice is available on your device.</p></div></div>
  </div>;
}
function LessonDetail({id,progress,onComplete}:{id:string;progress:Progress;onComplete:(id:string)=>void}) {
  const lesson=lessons.find(l=>l.id===id); const [notice,setNotice]=useState(''); const [completed,setCompleted]=useState(false);
  if(!lesson) return <div className="empty-state"><BookOpen size={24}/><h2>We could not find that lesson.</h2><Link href="/learn" className="button-primary">Back to lessons</Link></div>;
  const done=progress.completedLessonIds.includes(id)||completed;
  return <div className="page-enter lesson-detail"><Link href="/learn" className="back-link"><ChevronRight size={15}/> All lessons</Link><div className="detail-top"><div><div className="eyebrow"><span/>{lesson.category.toUpperCase()} · {lesson.level.toUpperCase()}</div><h1 className="display">{lesson.title}</h1><p>{lesson.description}</p><div className="detail-duration"><Clock3 size={15}/> About {lesson.duration} minutes <span className="meta-dot"/> Four useful phrases</div></div><div className="detail-kannada kn">ನುಡಿ<br/><small>words that connect</small></div></div><div className="phrase-lesson-list"><div className="phrase-list-heading"><span>THE PHRASES</span><span>Tap the speaker to listen</span></div>{lesson.phrases.map((p,i)=><article className="phrase-lesson" key={p.kannada}><span className="phrase-num">0{i+1}</span><div className="phrase-copy"><strong className="kn">{p.kannada}</strong><span className="translit">{p.transliteration}</span><span className="meaning">{p.meaning}</span></div><button className="listen-button" onClick={()=>speakKannada(p.kannada,setNotice)} aria-label={`Listen to ${p.transliteration}`} data-testid={`button-listen-${i}`}><Volume2 size={17}/><span>Listen</span></button></article>)}</div><div className="speech-notice" role="status">{notice||'Pronunciation audio depends on Kannada voices installed on your device.'}</div><div className="complete-panel"><div><span className="complete-tick">{done?<Check size={18}/>:<Sparkles size={18}/>}</span><div><strong>{done?'Lesson in your progress':'That is a useful start.'}</strong><small>{done?'You can revisit this lesson anytime.':'Mark it complete when you feel ready.'}</small></div></div><button className={done?'button-secondary':'button-primary'} disabled={done} onClick={()=>{onComplete(id);setCompleted(true)}} data-testid="button-complete-lesson">{done?'Completed':<>Mark lesson complete <Check size={16}/></>}</button></div></div>;
}

const scenarios=[
  {id:'cafe',title:'At a darshini',place:'A quick breakfast stop',line:'You would like one idli and a coffee.',prompt:'How might you begin your order?',options:['ಒಂದು ಇಡ್ಲಿ ಮತ್ತು ಕಾಫಿ ಕೊಡಿ','ಬಸ್ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?','ನೀವು ಹೇಗಿದ್ದೀರಿ?'],answer:0,reply:'ಒಂದು ಇಡ್ಲಿ ಮತ್ತು ಕಾಫಿ ಕೊಡಿ — “One idli and a coffee, please.” A polite ಕೊಡಿ makes this a friendly request.'},
  {id:'auto',title:'Taking an auto',place:'Getting across town',line:'You want to go to the railway station.',prompt:'Ask the driver where the station is.',options:['ನಿಲ್ದಾಣಕ್ಕೆ ಹೋಗುತ್ತೀರಾ?','ತುಂಬಾ ರುಚಿಯಾಗಿದೆ','ನನಗೆ ಅರ್ಥವಾಯಿತು'],answer:0,reply:'ನಿಲ್ದಾಣಕ್ಕೆ ಹೋಗುತ್ತೀರಾ? — “Will you go to the station?” Use this to check whether the driver can take you there.'},
  {id:'campus',title:'Finding your classroom',place:'A new campus',line:'You need help finding the library.',prompt:'Ask someone politely for help.',options:['ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡುತ್ತೀರಾ?','ಇದು ಖಾರವೇ?','ಮತ್ತೆ ಸಿಗೋಣ'],answer:0,reply:'ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡುತ್ತೀರಾ? — “Could you please help me?” It is a respectful way to open a request.'}
];
function PracticePage() {
  const [scenarioId,setScenarioId]=useState(scenarios[0].id); const [choice,setChoice]=useState<number|null>(null); const [showReply,setShowReply]=useState(false);
  const scenario=scenarios.find(s=>s.id===scenarioId)!;
  const mutation=useAskKannadaTutor(); const [tutorText,setTutorText]=useState(''); const [tutorLevel,setTutorLevel]=useState<'beginner'|'intermediate'|'advanced'>('beginner'); const [tutorReply,setTutorReply]=useState<{answer:string;source:string}|null>(null);
  function chooseScenario(id:string){setScenarioId(id);setChoice(null);setShowReply(false);}
  function askTutor(e:FormEvent){e.preventDefault();if(!tutorText.trim())return;mutation.mutate({data:{message:tutorText.trim(),level:tutorLevel,context:'Everyday Kannada practice in Karnataka'}},{onSuccess:r=>setTutorReply(r)});}
  return <div className="page-enter"><PageHeading eyebrow="SAY IT WITH CONFIDENCE" title="Practice the moment." subtitle="A few low-pressure rehearsals can make the real conversation feel more familiar."/>
    <div className="practice-layout"><section className="practice-main"><div className="scenario-select">{scenarios.map((s,i)=><button key={s.id} className={`scenario-tab ${scenarioId===s.id?'selected':''}`} onClick={()=>chooseScenario(s.id)} data-testid={`button-scenario-${s.id}`}><span>0{i+1}</span><strong>{s.title}</strong><small>{s.place}</small></button>)}</div><div className="simulation-card"><div className="sim-top"><span className="live-label"><span/> PRACTICE SCENARIO</span><span className="sim-step">STEP 01 / 02</span></div><div className="sim-situation"><div className="scene-icon"><MessageCircle size={22}/></div><div><span className="scene-label">THE MOMENT</span><h2>{scenario.line}</h2></div></div><div className="sim-question"><span>YOUR TURN</span><h3>{scenario.prompt}</h3><div className="choice-list">{scenario.options.map((o,i)=><button key={o} onClick={()=>{setChoice(i);setShowReply(false)}} className={`choice-option ${choice===i?'chosen':''} ${showReply&&choice===i?(i===scenario.answer?'correct':'incorrect'):''}`} data-testid={`button-choice-${i}`}><span className="choice-letter">{String.fromCharCode(65+i)}</span><span className="kn">{o}</span>{choice===i&&<Check size={17}/>}</button>)}</div><button className="button-primary submit-choice" disabled={choice===null} onClick={()=>setShowReply(true)} data-testid="button-check-choice">Check my answer <ChevronRight size={16}/></button>{showReply&&<div className={`feedback-box ${choice===scenario.answer?'feedback-good':'feedback-help'}`} role="status"><strong>{choice===scenario.answer?'Nicely said.':'Good try — here is a useful way.'}</strong><p>{scenario.reply}</p></div>}</div></div></section>
      <aside className="practice-aside"><div className="coach-mark"><Sparkles size={18}/></div><div className="eyebrow"><span/> A LITTLE GUIDANCE</div><h3 className="display">Practice without the pressure.</h3><p>Choose a situation, try a phrase, and see why it works. Getting it imperfect is part of learning.</p><div className="practice-tip"><span className="tip-number">01</span><span>Listen for a familiar word</span></div><div className="practice-tip"><span className="tip-number">02</span><span>Use a respectful phrase</span></div><div className="practice-tip"><span className="tip-number">03</span><span>Take your time</span></div><Link href="/phrasebook" className="text-link">Browse phrasebook <ChevronRight size={15}/></Link></aside></div>
    <section className="tutor-panel"><div className="tutor-heading"><div className="tutor-mark"><Languages size={20}/></div><div><div className="eyebrow"><span/> KANNADA TUTOR</div><h2 className="display">Wondering how to say something?</h2><p>Ask about a phrase, a polite way to say it, or a word you heard.</p></div></div><form className="tutor-form" onSubmit={askTutor}><label className="sr-only" htmlFor="tutor-question">Your Kannada question</label><input id="tutor-question" value={tutorText} onChange={e=>setTutorText(e.target.value)} maxLength={1000} placeholder="For example: How do I politely ask for directions?" data-testid="input-tutor-question"/><select aria-label="Your Kannada level" value={tutorLevel} onChange={e=>setTutorLevel(e.target.value as typeof tutorLevel)} data-testid="select-tutor-level"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select><button className="button-primary" type="submit" disabled={mutation.isPending||!tutorText.trim()} data-testid="button-ask-tutor">{mutation.isPending?'Thinking…':<>Ask tutor <Send size={15}/></>}</button></form>{mutation.isPending&&<div className="loading-line" role="status">Your tutor is preparing a reply…</div>}{mutation.isError&&<div className="error-box" role="alert">The tutor could not respond right now. Your sample lessons and practice activities are still ready to use.</div>}{tutorReply&&<div className="tutor-answer" data-testid="tutor-answer"><div className="answer-label"><span>TUTOR REPLY</span><span className={tutorReply.source==='sample'?'sample-label':''}>{tutorReply.source==='sample'?'Sample mode':'Gemini tutor'}</span></div><p>{tutorReply.answer}</p>{tutorReply.source==='sample'&&<small>This is a sample-mode response because a Gemini secret may not be configured.</small>}</div>}</section>
  </div>;
}

function QuizPage({progress,onScore}:{progress:Progress;onScore:(score:number)=>void}) {
  const [step,setStep]=useState(0); const [selected,setSelected]=useState<number|null>(null); const [answers,setAnswers]=useState<number[]>([]); const [finished,setFinished]=useState(false); const [review,setReview]=useState(false);
  const q=quizQuestions[step]; const score=answers.reduce((sum,a,i)=>sum+(a===quizQuestions[i].answer?1:0),0);
  function advance(){if(selected===null)return;const updated=[...answers,selected];setAnswers(updated);if(step===quizQuestions.length-1){const finalScore=updated.reduce((sum,a,i)=>sum+(a===quizQuestions[i].answer?1:0),0);onScore(finalScore);setFinished(true);}else{setStep(step+1);setSelected(null);}}
  function restart(){setStep(0);setSelected(null);setAnswers([]);setFinished(false);setReview(false);}
  return <div className="page-enter"><PageHeading eyebrow="A QUICK CHECK-IN" title="What is sticking?" subtitle="Five short questions. No timer, no pressure — just a chance to notice what you already know." action={<div className="lesson-count"><span>{progress.quizBestScore}</span> / 5<small>best score</small></div>}/>
    {!finished?<div className="quiz-card"><div className="quiz-top"><span className="eyebrow"><span/> QUESTION {String(step+1).padStart(2,'0')} OF 05</span><span className="quiz-progress-label">{Math.round(((step+1)/quizQuestions.length)*100)}% through</span></div><ProgressBar value={((step+1)/quizQuestions.length)*100}/><h2>{q.question}</h2><div className="quiz-options">{q.options.map((o,i)=><button key={o} onClick={()=>setSelected(i)} className={`quiz-option ${selected===i?'selected':''}`} data-testid={`button-quiz-option-${i}`}><span>{String.fromCharCode(65+i)}</span>{o}</button>)}</div><div className="quiz-bottom"><span>Choose the answer that feels right.</span><button className="button-primary" disabled={selected===null} onClick={advance} data-testid="button-quiz-next">{step===quizQuestions.length-1?'See my score':'Next question'} <ChevronRight size={16}/></button></div></div>:<div className="quiz-result"><div className="result-seal">{score}<small>/5</small></div><div className="eyebrow"><span/> QUIZ COMPLETE</div><h2 className="display">{score===5?'Wonderful work.':score>=3?'You are finding your rhythm.':'Every try is progress.'}</h2><p>You got {score} out of 5 right. {score>=3?'Keep these phrases close and use them when the moment comes.':'Revisit a lesson or two, then give it another go.'}</p><div className="result-actions"><button className="button-primary" onClick={restart} data-testid="button-quiz-retry">Try again <ChevronRight size={16}/></button><button className="button-quiet" onClick={()=>setReview(!review)} data-testid="button-quiz-review">{review?'Hide':'Review'} answers <ChevronDown size={15}/></button></div>{review&&<div className="review-list">{quizQuestions.map((question,i)=><div className="review-row" key={question.question}><span className={answers[i]===question.answer?'review-correct':'review-missed'}>{answers[i]===question.answer?'Correct':'Review'}</span><div><strong>{question.options[question.answer]}</strong><p>{question.note}</p></div></div>)}</div>}</div>}</div>;
}

function PhrasebookPage({favorites,onToggleFavorite}:{favorites:string[];onToggleFavorite:(id:string)=>void}) {
  const [search,setSearch]=useState(''); const [category,setCategory]=useState('All'); const [onlyFavorites,setOnlyFavorites]=useState(false); const [notice,setNotice]=useState('');
  const categories=['All',...Array.from(new Set(allPhrases.map(p=>p.category)))];
  const visible=useMemo(()=>allPhrases.filter(p=>(category==='All'||p.category===category)&&(!onlyFavorites||favorites.includes(p.id))&&(!search||`${p.kannada} ${p.transliteration} ${p.meaning} ${p.category}`.toLowerCase().includes(search.toLowerCase()))),[category,onlyFavorites,favorites,search]);
  return <div className="page-enter"><PageHeading eyebrow="WORDS FOR THE DAY" title="Your pocket phrasebook." subtitle="Search by meaning, phrase, or situation. Save the words you want close at hand." action={<div className="lesson-count"><span>{favorites.length}</span><small>saved phrases</small></div>}/>
    <div className="phrase-tools"><div className="search-wrap"><Search size={18}/><label className="sr-only" htmlFor="phrase-search">Search phrases</label><input id="phrase-search" type="search" placeholder="Try “thank you” or “bus stop”" value={search} onChange={e=>setSearch(e.target.value)} data-testid="input-phrase-search"/>{search&&<button aria-label="Clear search" onClick={()=>setSearch('')}><X size={15}/></button>}</div><button className={`favorite-filter ${onlyFavorites?'on':''}`} onClick={()=>setOnlyFavorites(!onlyFavorites)} aria-pressed={onlyFavorites} data-testid="button-favorites-filter"><Heart size={16}/>{onlyFavorites?'Saved only':'Favorites'}</button></div>
    <div className="category-row phrase-categories" role="tablist" aria-label="Filter phrase categories">{categories.map(c=><button key={c} role="tab" aria-selected={category===c} className={`filter-chip ${category===c?'selected':''}`} onClick={()=>setCategory(c)} data-testid={`filter-phrase-${c.toLowerCase()}`}>{c}</button>)}</div>
    <div className="phrasebook-count">{visible.length} {visible.length===1?'phrase':'phrases'}{search?` matching “${search}”`:''}</div>
    {visible.length?<div className="phrasebook-grid">{visible.map(p=>{const saved=favorites.includes(p.id);return <article className="phrasebook-card" key={p.id} data-testid={`card-phrase-${p.id}`}><div className="phrasebook-card-top"><span className="tag tag-soft">{p.category}</span><button className={`heart-button ${saved?'saved':''}`} aria-label={`${saved?'Remove':'Save'} ${p.meaning}`} aria-pressed={saved} onClick={()=>onToggleFavorite(p.id)} data-testid={`button-favorite-${p.id}`}><Heart size={17} fill={saved?'currentColor':'none'}/></button></div><strong className="kn phrasebook-kannada">{p.kannada}</strong><span className="phrasebook-translit">{p.transliteration}</span><div className="phrasebook-card-foot"><span>{p.meaning}</span><button className="sound-button" aria-label={`Listen to ${p.transliteration}`} onClick={()=>speakKannada(p.kannada,setNotice)} data-testid={`button-speak-${p.id}`}><Volume2 size={17}/></button></div></article>})}</div>:<div className="empty-state"><div className="empty-icon"><Search size={22}/></div><h2>{onlyFavorites&&favorites.length===0?'Your saved list is ready.':'No phrases found.'}</h2><p>{onlyFavorites&&favorites.length===0?'Tap the heart on a phrase to keep it here for quick reference.':'Try a different word or choose another category.'}</p><button className="button-secondary" onClick={()=>{setSearch('');setCategory('All');setOnlyFavorites(false)}}>Show all phrases</button></div>}
    <div className="speech-notice phrase-notice" role="status">{notice||'Pronunciation audio is available when your device has a Kannada voice installed.'}</div>
  </div>;
}

function AboutPage() {
  return <div className="page-enter"><PageHeading eyebrow="A PRACTICAL LANGUAGE COMPANION" title="A warmer welcome, in Kannada." subtitle="KannadaMitra is built around one simple belief: a little local language can make a new place feel more like home."/>
    <section className="about-banner"><div className="about-quote kn">ನುಡಿ ಹೃದಯದ ದಾರಿ.<small>Words are a path to the heart.</small></div><div className="about-banner-copy"><span className="eyebrow"><span/> BUILT FOR REAL LIFE</span><h2 className="display">Not fluency overnight.<br/>A better first conversation.</h2><p>For newcomers, students, employees, and travellers in Karnataka, everyday Kannada can make practical moments feel more human. We help you begin with useful, respectful language — one small step at a time.</p></div></section>
    <section className="about-section"><div className="about-section-title"><div className="eyebrow"><span/> THE CHALLENGE</div><h2 className="display">The small moments<br/>are the big ones.</h2></div><div className="about-problem"><p>A new city brings everyday questions: how to greet a neighbour, ask for directions, order lunch, or understand a reply. Language barriers can make those moments feel harder than they need to be.</p><p>KannadaMitra turns that challenge into a practical, welcoming learning path — grounded in useful phrases, respectful speech, and practice that feels safe to try.</p><div className="challenge-note"><span>01</span><strong>Useful from the first lesson.</strong><span>02</span><strong>Respectful of the people and language.</strong></div></div></section>
    <section className="about-pillars"><div className="pillar"><span className="pillar-icon"><BookOpen size={20}/></span><span className="eyebrow">LEARN</span><h3>Start with what you need.</h3><p>Short lessons center on everyday situations: greetings, food, travel, work, and getting help.</p></div><div className="pillar"><span className="pillar-icon"><MessageCircle size={20}/></span><span className="eyebrow">PRACTICE</span><h3>Try it before the moment.</h3><p>Guided conversation scenarios let you rehearse a reply without the pressure of getting it perfect.</p></div><div className="pillar"><span className="pillar-icon"><Heart size={20}/></span><span className="eyebrow">CONNECT</span><h3>Make room for belonging.</h3><p>Every phrase is a small invitation to connect with the people and place around you.</p></div></section>
    <section className="impact-section"><div><div className="eyebrow"><span/> SOCIAL IMPACT</div><h2 className="display">Belonging begins<br/>with being understood.</h2></div><div><p>By making everyday Kannada approachable, the project supports more confident participation in local life — at the market, on campus, at work, and in the neighbourhood.</p><p>It is a companion, not a substitute for the richness of learning from Kannada speakers and community. We invite learners to listen, be curious, and meet every conversation with respect.</p><Link href="/learn" className="button-primary">Begin with a greeting <ChevronRight size={16}/></Link></div></section>
    <section className="tech-section"><div><div className="eyebrow"><span/> HOW IT WORKS</div><h2 className="display">Simple by design.</h2><p>Practice remains useful whether or not the AI tutor is available.</p></div><div className="tech-list"><div><span>01</span><strong>React + TypeScript</strong><small>A responsive, accessible learning experience</small></div><div><span>02</span><strong>Local learning data</strong><small>Lessons, phrases, favorites, and progress stay ready</small></div><div><span>03</span><strong>Kannada tutor API</strong><small>Optional Gemini-backed help with honest sample mode</small></div><div><span>04</span><strong>Browser speech synthesis</strong><small>Pronunciation playback only when Kannada voice is installed</small></div></div></section>
  </div>;
}

function RoutedErrorBoundary({children}:{children:ReactNode}) { const [location]=useLocation(); return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>; }
function AppContent() {
  const [progress,setProgress]=useState<Progress>(()=>readSaved('kannadamitra-progress',initialProgress));
  const [favorites,setFavorites]=useState<string[]>(()=>readSaved('kannadamitra-favorites',[]));
  useEffect(()=>{localStorage.setItem('kannadamitra-progress',JSON.stringify(progress));},[progress]);
  useEffect(()=>{localStorage.setItem('kannadamitra-favorites',JSON.stringify(favorites));},[favorites]);
  useEffect(()=>{const today=new Date().toISOString().slice(0,10);setProgress(p=>{if(p.lastVisitDate===today)return p;const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);return {...p,lastVisitDate:today,streak:p.lastVisitDate===yesterday?p.streak+1:1};});},[]);
  function completeLesson(id:string){setProgress(p=>p.completedLessonIds.includes(id)?p:{...p,completedLessonIds:[...p.completedLessonIds,id]});}
  function saveScore(score:number){setProgress(p=>({...p,quizBestScore:Math.max(p.quizBestScore,score)}));}
  function toggleFavorite(id:string){setFavorites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);}
  return <Shell progress={progress}><RoutedErrorBoundary><Switch>
    <Route path="/"><HomePage progress={progress}/></Route>
    <Route path="/learn"><LearnPage progress={progress} onComplete={completeLesson}/></Route>
    <Route path="/learn/:id">{params=><LessonDetail id={params.id} progress={progress} onComplete={completeLesson}/>}</Route>
    <Route path="/practice"><PracticePage/></Route>
    <Route path="/quiz"><QuizPage progress={progress} onScore={saveScore}/></Route>
    <Route path="/phrasebook"><PhrasebookPage favorites={favorites} onToggleFavorite={toggleFavorite}/></Route>
    <Route path="/about"><AboutPage/></Route>
    <Route component={NotFound}/>
  </Switch></RoutedErrorBoundary></Shell>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}><AppContent/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}
export default App;
