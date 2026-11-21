import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BookOpen, Briefcase, GraduationCap, Activity, DollarSign, HeartPulse,
  LayoutDashboard, Plus, Trash2, Sparkles, Search, Tag, FolderPlus, X, Feather, Image as ImageIcon, Edit3, LogOut, Menu, ArrowUpDown, CheckCircle2, Download, Camera 
} from 'lucide-react';

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const DEFAULT_SECTIONS = [
  { id: 'work', name: 'Work', icon: 'Briefcase' },
  { id: 'books', name: 'Books', icon: 'BookOpen' },
  { id: 'health', name: 'Health', icon: 'HeartPulse' },
  { id: 'study', name: 'Study', icon: 'GraduationCap' },
  { id: 'running', name: 'Running', icon: 'Activity' },
  { id: 'money', name: 'Money', icon: 'DollarSign' },
];

const HEAD_PRESET_TAGS = {
  books: ['running-channel', 'work', 'life', 'book-club'],
  health: ['running-channel', 'life'],
};

const ICON_MAP = {
  Briefcase: Briefcase,
  BookOpen: BookOpen,
  HeartPulse: HeartPulse,
  GraduationCap: GraduationCap,
  Activity: Activity,
  DollarSign: DollarSign,
};

const normalizeTag = (tag) => tag.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-');

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 18) {
  const paragraphs = String(text || '').split('\n');
  let currentY = y;
  let lineCount = 0;

  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].split(/\s+/).filter(Boolean);
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line ? `${line} ${words[n]}` : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        if (lineCount >= maxLines - 1) {
          ctx.fillText(`${line.slice(0, Math.max(0, line.length - 3))}...`, x, currentY);
          return currentY + lineHeight;
        }
        ctx.fillText(line, x, currentY);
        line = words[n];
        currentY += lineHeight;
        lineCount += 1;
      } else {
        line = testLine;
      }
    }

    if (line) {
      if (lineCount >= maxLines - 1 && (p < paragraphs.length - 1)) {
        ctx.fillText(`${line.slice(0, Math.max(0, line.length - 3))}...`, x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
      lineCount += 1;
    }

    if (p < paragraphs.length - 1) {
      currentY += lineHeight * 0.45;
    }
  }

  return currentY;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [entries, setEntries] = useState({
    work: [],
    books: [],
    health: [],
    study: [],
    running: [],
    money: [],
  });

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [selectedSection, setSelectedSection] = useState('work');
  const fileInputRef = useRef(null);
  
  // Edit state
  const [editingEntryId, setEditingEntryId] = useState(null);

  // Search, Tag Filter, Sorting & Book Club Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'title'
  const [selectedBookClubIds, setSelectedBookClubIds] = useState([]);

  // Phase 3: Instagram Card Studio State
  const [isIgStudioOpen, setIsIgStudioOpen] = useState(false);
  const [igFormat, setIgFormat] = useState('square'); // 'square' (1080x1080) | 'portrait' (1080x1350)
  const [igTheme, setIgTheme] = useState('mahogany'); // 'mahogany' | 'parchment'
  const [igClubName, setIgClubName] = useState('BOOK CLUB NOTES');

  // New Section Modal
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const [randomHighlights, setRandomHighlights] = useState({});

  const presetTagsForActiveHead = HEAD_PRESET_TAGS[activeTab] || [];
  const activeTagList = newTags
    .split(',')
    .map(normalizeTag)
    .filter(Boolean);

  // Check Supabase Auth Session
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch entries from Supabase when logged in
  useEffect(() => {
    if (!session || !supabase) return;
    fetchUserData();
  }, [session]);

  const fetchUserData = async () => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const grouped = {};
      sections.forEach(s => { grouped[s.id] = []; });
      
      data.forEach(item => {
        const sec = item.section_id;
        if (!grouped[sec]) grouped[sec] = [];
        grouped[sec].push({
          id: item.id,
          title: item.title,
          content: item.content,
          tags: item.tags || [],
          imageUrl: item.image_url,
          date: item.date
        });
      });
      setEntries(grouped);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!supabase) {
      setAuthError('Supabase keys are missing in .env file!');
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
      else alert('Check your email for confirmation link or sign in!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) setAuthError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  const refreshDashboard = () => {
    const highlights = {};
    sections.forEach(sec => {
      const list = entries[sec.id] || [];
      if (list.length > 0) {
        const randomIndex = Math.floor(Math.random() * list.length);
        highlights[sec.id] = list[randomIndex];
      } else {
        highlights[sec.id] = null;
      }
    });
    setRandomHighlights(highlights);
  };

  useEffect(() => {
    refreshDashboard();
  }, [entries, sections]);

  const resetEntryForm = () => {
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setImageFile(null);
    setEditingEntryId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePresetTag = (tag) => {
    const cleanTag = normalizeTag(tag);
    const current = newTags
      .split(',')
      .map(normalizeTag)
      .filter(Boolean);

    const updated = current.includes(cleanTag)
      ? current.filter(t => t !== cleanTag)
      : [...current, cleanTag];

    setNewTags(updated.join(', '));
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const targetSection = editingEntryId ? selectedSection : activeTab;

    let imageUrl = null;
    if (imageFile && supabase) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('screenshots').upload(fileName, imageFile);
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage.from('screenshots').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
    }

    const formattedTags = Array.from(
      new Set(
        newTags
          .split(',')
          .map(normalizeTag)
          .filter(Boolean)
      )
    );

    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    if (editingEntryId) {
      const updatedItem = {
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: formattedTags,
        ...(imageUrl && { image_url: imageUrl })
      };

      if (supabase && session) {
        await supabase.from('entries').update(updatedItem).eq('id', editingEntryId);
      }

      setEntries(prev => ({
        ...prev,
        [targetSection]: (prev[targetSection] || []).map(item =>
          item.id === editingEntryId
            ? { ...item, ...updatedItem, imageUrl: imageUrl || item.imageUrl }
            : item
        )
      }));
    } else {
      const newItem = {
        id: Date.now().toString(),
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: formattedTags,
        imageUrl,
        date: dateStr,
      };

      if (supabase && session) {
        await supabase.from('entries').insert([{
          id: newItem.id,
          user_id: session.user.id,
          section_id: targetSection,
          title: newItem.title,
          content: newItem.content,
          tags: newItem.tags,
          image_url: newItem.imageUrl,
          date: newItem.date
        }]);
      }

      setEntries(prev => ({
        ...prev,
        [targetSection]: [newItem, ...(prev[targetSection] || [])]
      }));
    }

    resetEntryForm();
  };

  const handleEditClick = (item) => {
    setNewTitle(item.title);
    setNewContent(item.content);
    setNewTags(item.tags ? item.tags.join(', ') : '');
    setEditingEntryId(item.id);
    setSelectedSection(activeTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (sectionId, id) => {
    if (supabase && session) {
      await supabase.from('entries').delete().eq('id', id);
    }
    setEntries(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] || []).filter(item => item.id !== id)
    }));
    setSelectedBookClubIds(prev => prev.filter(itemId => itemId !== id));
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    const id = newSectionName.toLowerCase().replace(/\s+/g, '-');
    if (sections.some(s => s.id === id)) return;

    const newSec = { id, name: newSectionName.trim(), icon: 'BookOpen' };
    setSections(prev => [...prev, newSec]);
    setEntries(prev => ({ ...prev, [id]: [] }));
    setNewSectionName('');
    setIsSectionModalOpen(false);
    setSelectedSection(id);
    setActiveTab(id);
  };

  const toggleBookClubSelection = (id) => {
    setSelectedBookClubIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const currentEntries = entries[activeTab] || [];

  const availableSectionTags = Array.from(
    new Set([
      ...presetTagsForActiveHead,
      ...currentEntries.flatMap(item => item.tags || []),
    ])
  );

  const bookClubEntries = (entries.books || []).filter(
    item => item.tags && item.tags.includes('book-club')
  );

  const entriesForIgCard = selectedBookClubIds.length > 0
    ? bookClubEntries.filter(item => selectedBookClubIds.includes(item.id))
    : bookClubEntries.slice(0, 1);

  const handleDownloadIgImage = () => {
    if (entriesForIgCard.length === 0) return;

    const width = 1080;
    const height = igFormat === 'portrait' ? 1350 : 1080;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMahogany = igTheme === 'mahogany';
    const bgOuter = isMahogany ? '#140d08' : '#e8dcc4';
    const bgCard = isMahogany ? '#1f150e' : '#f4ebd6';
    const borderCol = isMahogany ? '#70492c' : '#8c6b48';
    const accentCol = isMahogany ? '#c9a26d' : '#5c3a21';
    const titleCol = isMahogany ? '#f7efe0' : '#24160d';
    const bodyCol = isMahogany ? '#d6c4a5' : '#3d2817';
    const mutedCol = isMahogany ? '#9c7d56' : '#70492c';

    // Outer & Inner Victorian Frame
    ctx.fillStyle = bgOuter;
    ctx.fillRect(0, 0, width, height);

    const pad = 54;
    ctx.fillStyle = bgCard;
    ctx.fillRect(pad, pad, width - pad * 2, height - pad * 2);

    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 4;
    ctx.strokeRect(pad + 18, pad + 18, width - (pad + 18) * 2, height - (pad + 18) * 2);

    // Header Label
    ctx.fillStyle = accentCol;
    ctx.font = '600 24px Georgia, serif';
    ctx.fillText((igClubName || 'BOOK CLUB NOTES').toUpperCase(), 110, 145);

    ctx.fillStyle = mutedCol;
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText('#book-club', width - 235, 145);

    // Divider rule
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(110, 175);
    ctx.lineTo(width - 110, 175);
    ctx.stroke();

    // Render selected entries onto the card
    let cursorY = 235;
    const maxTextWidth = width - 220;
    const cardCount = entriesForIgCard.length;

    entriesForIgCard.forEach((entry, idx) => {
      if (cursorY > height - 180) return;

      ctx.fillStyle = titleCol;
      ctx.font = cardCount === 1 ? 'italic bold 44px Georgia, serif' : 'italic bold 32px Georgia, serif';
      cursorY = wrapCanvasText(
        ctx,
        entry.title,
        110,
        cursorY,
        maxTextWidth,
        cardCount === 1 ? 56 : 42,
        3
      );

      if (entry.date) {
        ctx.fillStyle = mutedCol;
        ctx.font = '20px Georgia, serif';
        ctx.fillText(entry.date, 110, cursorY + 4);
        cursorY += 42;
      }

      ctx.fillStyle = bodyCol;
      ctx.font = cardCount === 1 ? '32px Georgia, serif' : '25px Georgia, serif';
      cursorY = wrapCanvasText(
        ctx,
        entry.content,
        110,
        cursorY + 6,
        maxTextWidth,
        cardCount === 1 ? 46 : 35,
        cardCount === 1 ? 14 : 6
      );

      if (idx < cardCount - 1 && cursorY < height - 210) {
        cursorY += 16;
        ctx.strokeStyle = borderCol;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(110, cursorY);
        ctx.lineTo(width - 110, cursorY);
        ctx.stroke();
        ctx.globalAlpha = 1;
        cursorY += 36;
      }
    });

    // Footer
    ctx.fillStyle = mutedCol;
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText('Commonplace Chronicle', 110, height - 102);

    const link = document.createElement('a');
    link.download = `book-club-instagram-${igFormat}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const filteredEntries = currentEntries
    .filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesTag = selectedTagFilter === 'ALL' || (item.tags && item.tags.includes(selectedTagFilter));
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortOrder === 'oldest') return Number(a.id) - Number(b.id);
      if (sortOrder === 'title') return a.title.localeCompare(b.title);
      return Number(b.id) - Number(a.id);
    });

  // If user is not logged in, show Login Screen
  if (supabase && !session) {
    return (
      <div className="min-h-screen bg-[#14100c] text-[#d4c3a3] flex items-center justify-center p-6 font-serif">
        <div className="bg-[#1f150e] border-2 border-[#3d2817] rounded-xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-lg bg-[#3d2817] border border-[#70492c] mx-auto flex items-center justify-center text-[#dfcaab]">
              <Feather className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#f4ebd0] italic">Commonplace Register</h1>
            <p className="text-xs text-[#b8976f]">Sign in to access your cloud journal across all devices</p>
          </div>

          {authError && <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs p-3 rounded">{authError}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8c6b48] uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-[#140d08] border border-[#3d2817] rounded-lg px-4 py-2.5 text-xs text-[#f4ebd0] focus:outline-none focus:border-[#70492c]"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8c6b48] uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-[#140d08] border border-[#3d2817] rounded-lg px-4 py-2.5 text-xs text-[#f4ebd0] focus:outline-none focus:border-[#70492c]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#3d2817] hover:bg-[#4d3420] text-[#f4ebd0] border border-[#70492c] py-2.5 rounded-lg text-xs font-semibold transition shadow"
            >
              {isSignUp ? 'Register Account' : 'Sign In'}
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#3d2817]"></div>
            <span className="flex-shrink mx-4 text-[10px] text-[#8c6b48] uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-[#3d2817]"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-[#140d08] hover:bg-[#261910] text-[#d4c3a3] border border-[#3d2817] py-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-2"
          >
            <span>Continue with Google</span>
          </button>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-[#b8976f] hover:text-[#f4ebd0] underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14100c] text-[#d4c3a3] flex flex-col md:flex-row font-serif selection:bg-[#5c3a21] selection:text-[#f4ebd0]">
      
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-[#1f150e] border-b-2 border-[#3d2817] p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <Feather className="w-5 h-5 text-[#dfcaab]" />
          <span className="font-bold text-sm text-[#f4ebd0]">COMMONPLACE</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[#d4c3a3] p-1">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Leather Sidebar (Responsive) */}
      <aside className={`fixed md:sticky top-0 h-screen w-72 bg-[#1b120c] border-r-2 border-[#3d2817] flex flex-col z-20 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 hidden md:flex items-center space-x-3 border-b-2 border-[#3d2817] bg-[#140d08]">
          <div className="w-10 h-10 rounded-lg bg-[#3d2817] border border-[#70492c] flex items-center justify-center text-[#dfcaab]">
            <Feather className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-wider text-[#f4ebd0]">COMMONPLACE</span>
            <span className="block text-[10px] text-[#b8976f] font-semibold tracking-widest uppercase">Cloud Journal</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-14 md:mt-0">
          <button
            onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); setSelectedTagFilter('ALL'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium text-sm border ${
              activeTab === 'dashboard' 
                ? 'bg-[#3d2817] text-[#f4ebd0] border-[#70492c] shadow-md' 
                : 'border-transparent text-[#b8976f] hover:bg-[#261910] hover:text-[#d4c3a3]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#b8976f]" />
            <span>Dashboard</span>
          </button>

          <div className="pt-4 pb-2 px-4 flex items-center justify-between text-[11px] font-bold text-[#8c6b48] uppercase tracking-widest border-t border-[#261910] mt-4">
            <span>Log Sections</span>
            <button 
              onClick={() => setIsSectionModalOpen(true)}
              className="text-[#b8976f] hover:text-[#f4ebd0] transition"
              title="Add section"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          {sections.map(sec => {
            const IconComponent = ICON_MAP[sec.icon] || BookOpen;
            const count = (entries[sec.id] || []).length;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => { setActiveTab(sec.id); setSelectedSection(sec.id); setSearchQuery(''); setSelectedTagFilter('ALL'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all font-medium text-sm border group ${
                  isActive 
                    ? 'bg-[#3d2817] text-[#f4ebd0] border-[#70492c] shadow-md' 
                    : 'border-transparent text-[#b8976f] hover:bg-[#261910] hover:text-[#d4c3a3]'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#f4ebd0]' : 'text-[#8c6b48] group-hover:text-[#b8976f]'}`} />
                <span className="truncate capitalize">{sec.name}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded font-semibold ${isActive ? 'bg-[#261910] text-[#f4ebd0]' : 'bg-[#1b120c] text-[#8c6b48]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t-2 border-[#3d2817] bg-[#140d08] space-y-2">
          <button
            onClick={() => setIsSectionModalOpen(true)}
            className="w-full bg-[#261910] hover:bg-[#3d2817] border border-[#523720] text-[#d4c3a3] rounded-lg py-2 px-3 text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-inner"
          >
            <Plus className="w-3.5 h-3.5 text-[#b8976f]" />
            <span>New Log Section</span>
          </button>
          {supabase && (
            <button
              onClick={handleLogout}
              className="w-full bg-[#140d08] hover:bg-red-950/40 border border-[#3d2817] text-[#b8976f] rounded-lg py-2 px-3 text-xs font-semibold flex items-center justify-center space-x-2 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#14100c]">
        <header className="h-20 border-b-2 border-[#3d2817] px-6 md:px-10 flex items-center justify-between bg-[#1f150e] sticky top-0 z-10 shadow-md">
          <h1 className="text-lg md:text-xl font-bold tracking-wide text-[#f4ebd0] capitalize italic">
            {activeTab === 'dashboard' ? 'Cabinet of Curiosities' : `${activeTab} Chronicle`}
          </h1>

          {activeTab === 'dashboard' ? (
            <button
              onClick={refreshDashboard}
              className="flex items-center space-x-2 bg-[#3d2817] hover:bg-[#4d3420] border border-[#70492c] text-[#f4ebd0] px-3.5 py-2 rounded-lg text-xs font-semibold transition shadow"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#b8976f]" />
              <span>Shuffle Pages</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8c6b48] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-[#140d08] border border-[#3d2817] rounded-lg pl-9 pr-4 py-2 text-xs text-[#d4c3a3] placeholder-[#8c6b48] focus:outline-none focus:border-[#70492c] w-40 sm:w-64 transition shadow-inner"
                />
              </div>
            </div>
          )}
        </header>

        <div className="p-4 sm:p-10 max-w-5xl w-full mx-auto flex-1">
          {activeTab === 'dashboard' ? (
            <div className="space-y-8">
              <div className="rounded-xl bg-[#211710] border-2 border-[#3d2817] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <h2 className="text-lg sm:text-xl font-bold text-[#f4ebd0] mb-2 tracking-wide italic">An Almanac of Reflections</h2>
                <p className="text-[#b8976f] text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Your daily compendium surfaces a solitary memory or process from each register, uniting disparate studies into one harmonious view.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map(sec => {
                  const item = randomHighlights[sec.id];
                  const IconComponent = ICON_MAP[sec.icon] || BookOpen;
                  return (
                    <div key={sec.id} className="bg-[#1f150e] border-2 border-[#3d2817] rounded-xl p-6 sm:p-7 flex flex-col justify-between transition hover:border-[#523720] shadow-xl relative">
                      <div className="absolute top-3 right-4 text-[10px] text-[#70492c] font-mono">EST. 1890</div>
                      <div>
                        <div className="flex items-center space-x-2.5 text-[#b8976f] mb-4">
                          <div className="w-8 h-8 rounded bg-[#140d08] border border-[#3d2817] flex items-center justify-center">
                            <IconComponent className="w-4 h-4 text-[#dfcaab]" />
                          </div>
                          <span className="font-semibold text-xs tracking-wider uppercase text-[#d4c3a3]">{sec.name}</span>
                        </div>
                        {item ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-bold text-[#f4ebd0] italic">{item.title}</h3>
                              <span className="text-[11px] text-[#8c6b48]">{item.date}</span>
                            </div>
                            <p className="text-[#c5b395] text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt="attachment" className="rounded-lg border border-[#3d2817] max-h-48 object-cover mt-2 w-full" />
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-2">
                                {item.tags.map(t => (
                                  <span key={t} className="text-[10px] font-medium bg-[#140d08] text-[#b8976f] border border-[#3d2817] px-2 py-0.5 rounded">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-[#8c6b48] italic text-xs">
                            No entries recorded in {sec.name} yet.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Form Entry */}
              <div className="bg-[#1f150e] border-2 border-[#3d2817] rounded-xl p-6 sm:p-7 shadow-2xl relative">
                <h2 className="text-sm font-bold text-[#f4ebd0] mb-4 flex items-center space-x-2 uppercase tracking-wider">
                  <Feather className="w-4 h-4 text-[#b8976f]" />
                  <span>{editingEntryId ? 'Edit Journal Entry' : `Record Entry into ${activeTab}`}</span>
                </h2>
                <form onSubmit={handleSaveEntry} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-[#8c6b48] uppercase tracking-wider mb-1">Subject / Title</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={
                          activeTab === 'work'
                            ? 'e.g., Sprint notes, client brief, or daily log'
                            : 'e.g., Treatise on Habits or Ledger Page'
                        }
                        className="w-full bg-[#140d08] border border-[#3d2817] rounded-lg px-4 py-2.5 text-xs text-[#f4ebd0] placeholder-[#70492c] focus:outline-none focus:border-[#70492c]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#8c6b48] uppercase tracking-wider mb-1">Tags</label>
                      <input
                        type="text"
                        value={newTags}
                        onChange={(e) => setNewTags(e.target.value)}
                        placeholder={
                          activeTab === 'books'
                            ? 'book-club, running-channel, work, life'
                            : activeTab === 'health'
                              ? 'running-channel, life'
                              : 'e.g. doctrine, study, notes'
                        }
                        className="w-full bg-[#140d08] border border-[#3d2817] rounded-lg px-4 py-2.5 text-xs text-[#f4ebd0] placeholder-[#70492c] focus:outline-none focus:border-[#70492c]"
                      />
                    </div>
                  </div>

                  {presetTagsForActiveHead.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-semibold text-[#8c6b48] uppercase tracking-wider">
                        Quick Tags for {activeTab}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {presetTagsForActiveHead.map(tag => {
                          const isSelected = activeTagList.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => togglePresetTag(tag)}
                              className={`text-xs px-3 py-1 rounded-lg font-medium transition border ${
                                isSelected
                                  ? 'bg-[#3d2817] text-[#f4ebd0] border-[#8c6b48] shadow'
                                  : 'bg-[#140d08] text-[#b8976f] border-[#3d2817] hover:bg-[#261910]'
                              }`}
                            >
                              #{tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-[#8c6b48] uppercase tracking-wider mb-1">
                      {activeTab === 'work' ? 'Entry Notes' : 'Transcription / Highlight'}
                    </label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder={
                        activeTab === 'work'
                          ? 'Write your normal work entry here...'
                          : 'Inscribe your thoughts or procedures...'
                      }
                      rows="3"
                      className="w-full bg-[#140d08] border border-[#3d2817] rounded-lg px-4 py-2.5 text-xs text-[#f4ebd0] placeholder-[#70492c] focus:outline-none focus:border-[#70492c] resize-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                    <label className="flex items-center space-x-2 text-xs text-[#b8976f] cursor-pointer bg-[#140d08] border border-[#3d2817] px-3 py-2 rounded-lg hover:border-[#70492c] transition">
                      <ImageIcon className="w-4 h-4 text-[#b8976f]" />
                      <span className="truncate max-w-[200px]">{imageFile ? imageFile.name : 'Attach Screenshot'}</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0] || null)}
                        className="hidden"
                      />
                    </label>

                    <div className="flex space-x-2 w-full sm:w-auto">
                      {editingEntryId && (
                        <button
                          type="button"
                          onClick={resetEntryForm}
                          className="px-4 py-2 rounded-lg text-xs font-medium bg-[#140d08] border border-[#3d2817] text-[#8c6b48]"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 sm:flex-none bg-[#3d2817] hover:bg-[#4d3420] text-[#f4ebd0] border border-[#70492c] font-medium text-xs px-6 py-2.5 rounded-lg transition shadow"
                      >
                        {editingEntryId ? 'Update Entry' : 'Inscribe Entry'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Book Club Spotlight & Instagram Card Generator inside Books */}
              {activeTab === 'books' && (
                <div className="bg-[#211710] border-2 border-[#523720] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#f4ebd0]">
                        Book Club Queue (#book-club)
                      </span>
                      <span className="text-[11px] bg-[#140d08] text-[#dfcaab] border border-[#3d2817] px-2 py-0.5 rounded">
                        {bookClubEntries.length} tagged · {selectedBookClubIds.length} queued
                      </span>
                    </div>
                    <p className="text-xs text-[#b8976f]">
                      Sort by #book-club, queue entries, and generate a downloadable Instagram-ready PNG image.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedTagFilter(selectedTagFilter === 'book-club' ? 'ALL' : 'book-club')}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold border transition ${
                        selectedTagFilter === 'book-club'
                          ? 'bg-[#5c3a21] text-[#f4ebd0] border-[#8c6b48]'
                          : 'bg-[#140d08] text-[#d4c3a3] border-[#3d2817] hover:bg-[#261910]'
                      }`}
                    >
                      {selectedTagFilter === 'book-club' ? 'Showing #book-club' : 'Sort #book-club'}
                    </button>
                    <button
                      type="button"
                      disabled={bookClubEntries.length === 0}
                      onClick={() => setIsIgStudioOpen(true)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold border bg-[#3d2817] hover:bg-[#4d3420] disabled:opacity-40 disabled:cursor-not-allowed text-[#f4ebd0] border-[#70492c] flex items-center justify-center space-x-1.5 transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#dfcaab]" />
                      <span>IG Image Card</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tag Filter & Sort Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                {availableSectionTags.length > 0 ? (
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    <span className="text-xs font-medium text-[#8c6b48] flex items-center space-x-1 shrink-0">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Filter:</span>
                    </span>
                    <button
                      onClick={() => setSelectedTagFilter('ALL')}
                      className={`text-xs px-3 py-1 rounded font-medium transition shrink-0 border ${
                        selectedTagFilter === 'ALL' ? 'bg-[#3d2817] text-[#f4ebd0] border-[#70492c]' : 'bg-[#1b120c] border-[#3d2817] text-[#b8976f]'
                      }`}
                    >
                      All
                    </button>
                    {availableSectionTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTagFilter(tag)}
                        className={`text-xs px-3 py-1 rounded font-medium transition shrink-0 border ${
                          selectedTagFilter === tag ? 'bg-[#3d2817] text-[#f4ebd0] border-[#70492c]' : 'bg-[#1b120c] border-[#3d2817] text-[#b8976f]'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2 shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#8c6b48]" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="bg-[#1b120c] border border-[#3d2817] rounded-lg px-3 py-1.5 text-xs text-[#d4c3a3] focus:outline-none focus:border-[#70492c]"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title (A–Z)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#3d2817] pb-2">
                  <h2 className="text-xs font-bold text-[#b8976f] uppercase tracking-widest">Logged Entries ({filteredEntries.length})</h2>
                </div>

                {filteredEntries.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-[#3d2817] rounded-xl text-[#8c6b48] bg-[#1f150e]/50">
                    <p className="text-xs italic">No entries found within this volume.</p>
                  </div>
                ) : (
                  filteredEntries.map(item => {
                    const isBookClubItem = activeTab === 'books' && item.tags && item.tags.includes('book-club');
                    const isSelectedForPost = selectedBookClubIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`bg-[#1f150e] border-2 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-xl transition ${
                          isSelectedForPost ? 'border-[#8c6b48]' : 'border-[#3d2817]'
                        }`}
                      >
                        <div className="space-y-2 max-w-2xl flex-1">
                          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                            <h3 className="text-base font-bold text-[#f4ebd0] italic">{item.title}</h3>
                            <span className="text-[11px] text-[#8c6b48] bg-[#140d08] px-2 py-0.5 rounded border border-[#3d2817]">{item.date}</span>
                            {isBookClubItem && (
                              <button
                                type="button"
                                onClick={() => toggleBookClubSelection(item.id)}
                                className={`text-[11px] px-2.5 py-0.5 rounded border flex items-center space-x-1 transition ${
                                  isSelectedForPost
                                    ? 'bg-[#5c3a21] text-[#f4ebd0] border-[#8c6b48]'
                                    : 'bg-[#140d08] text-[#b8976f] border-[#3d2817] hover:border-[#70492c]'
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isSelectedForPost ? 'Queued for IG' : 'Queue for IG'}</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[#c5b395] text-xs sm:text-sm whitespace-pre-wrap leading-relaxed pt-1">{item.content}</p>
                          {item.imageUrl && (
                            <div className="pt-2">
                              <img src={item.imageUrl} alt="attachment" className="rounded-lg border border-[#3d2817] max-h-64 object-cover" />
                            </div>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {item.tags.map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setSelectedTagFilter(t)}
                                  className="text-[10px] font-medium bg-[#140d08] text-[#b8976f] hover:text-[#f4ebd0] border border-[#3d2817] px-2 py-0.5 rounded transition"
                                >
                                  #{t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-start">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-[#b8976f] hover:text-[#f4ebd0] p-2 rounded transition bg-[#140d08] border border-[#3d2817]"
                            title="Edit entry"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(activeTab, item.id)}
                            className="text-[#8c6b48] hover:text-red-300 p-2 rounded transition bg-[#140d08] border border-[#3d2817]"
                            title="Expunge entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Phase 3 Modal: Instagram Image Card Studio */}
      {isIgStudioOpen && (
        <div className="fixed inset-0 z-50 bg-[#140d08]/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1f150e] border-2 border-[#3d2817] rounded-xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative my-8">
            <button
              onClick={() => setIsIgStudioOpen(false)}
              className="absolute top-6 right-6 text-[#8c6b48] hover:text-[#f4ebd0] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-[#f4ebd0] italic">Instagram Post Card Studio</h3>
              <p className="text-xs text-[#b8976f]">
                Exporting {entriesForIgCard.length} #book-club {entriesForIgCard.length === 1 ? 'entry' : 'entries'} as a downloadable PNG image.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#8c6b48] uppercase tracking-wider mb-1">Header Label</label>
                <input
                  type="text"
                  value={igClubName}
                  onChange={(e) => setIgClubName(e.target.value)}
                  className="w-full bg-[#140d08] border border-[#3d2817] rounded-lg px-3 py-2 text-xs text-[#f4ebd0] focus:outline-none focus:border-[#70492c]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#8c6b48] uppercase tracking-wider mb-1">Format</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIgFormat('square')}
                    className={`flex-1 py-2 rounded-lg text-xs border transition ${
                      igFormat === 'square' ? 'bg-[#3d2817] text-[#f4ebd0] border-[#8c6b48]' : 'bg-[#140d08] text-[#b8976f] border-[#3d2817]'
                    }`}
                  >
                    1:1 Square
                  </button>
                  <button
                    type="button"
                    onClick={() => setIgFormat('portrait')}
                    className={`flex-1 py-2 rounded-lg text-xs border transition ${
                      igFormat === 'portrait' ? 'bg-[#3d2817] text-[#f4ebd0] border-[#8c6b48]' : 'bg-[#140d08] text-[#b8976f] border-[#3d2817]'
                    }`}
                  >
                    4:5 Portrait
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#8c6b48] uppercase tracking-wider mb-1">Card Tone</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIgTheme('mahogany')}
                    className={`flex-1 py-2 rounded-lg text-xs border transition ${
                      igTheme === 'mahogany' ? 'bg-[#3d2817] text-[#f4ebd0] border-[#8c6b48]' : 'bg-[#140d08] text-[#b8976f] border-[#3d2817]'
                    }`}
                  >
                    Mahogany
                  </button>
                  <button
                    type="button"
                    onClick={() => setIgTheme('parchment')}
                    className={`flex-1 py-2 rounded-lg text-xs border transition ${
                      igTheme === 'parchment' ? 'bg-[#3d2817] text-[#f4ebd0] border-[#8c6b48]' : 'bg-[#140d08] text-[#b8976f] border-[#3d2817]'
                    }`}
                  >
                    Parchment
                  </button>
                </div>
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="flex justify-center bg-[#140d08] p-4 rounded-xl border border-[#3d2817]">
              <div
                className={`w-full max-w-[360px] ${
                  igFormat === 'portrait' ? 'aspect-[4/5]' : 'aspect-square'
                } p-4 flex flex-col justify-between border-2 transition-colors ${
                  igTheme === 'mahogany'
                    ? 'bg-[#1f150e] border-[#70492c] text-[#f4ebd0]'
                    : 'bg-[#f4ebd6] border-[#8c6b48] text-[#24160d]'
                }`}
              >
                <div>
                  <div className={`flex items-center justify-between text-[10px] tracking-widest uppercase pb-2 border-b ${
                    igTheme === 'mahogany' ? 'text-[#c9a26d] border-[#70492c]/60' : 'text-[#5c3a21] border-[#8c6b48]/60'
                  }`}>
                    <span>{igClubName || 'BOOK CLUB NOTES'}</span>
                    <span className="italic">#book-club</span>
                  </div>

                  <div className="mt-3 space-y-3 overflow-hidden">
                    {entriesForIgCard.map(entry => (
                      <div key={entry.id} className="space-y-1">
                        <h4 className="text-xs font-bold italic leading-snug">{entry.title}</h4>
                        <p className={`text-[11px] leading-relaxed line-clamp-4 ${
                          igTheme === 'mahogany' ? 'text-[#d6c4a5]' : 'text-[#3d2817]'
                        }`}>
                          {entry.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`text-[10px] italic pt-2 border-t ${
                  igTheme === 'mahogany' ? 'text-[#9c7d56] border-[#70492c]/40' : 'text-[#70492c] border-[#8c6b48]/40'
                }`}>
                  Commonplace Chronicle
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsIgStudioOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-[#140d08] border border-[#3d2817] text-[#b8976f]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDownloadIgImage}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#3d2817] hover:bg-[#4d3420] text-[#f4ebd0] border border-[#70492c] flex items-center space-x-2 transition shadow"
              >
                <Download className="w-4 h-4 text-[#dfcaab]" />
                <span>Download Instagram PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Section */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#140d08]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f150e] border-2 border-[#3d2817] rounded-xl p-8 max-w-md w-full shadow-2xl space-y-6 relative">
            <button 
              onClick={() => setIsSectionModalOpen(false)}
              className="absolute top-6 right-6 text-[#8c6b48] hover:text-[#f4ebd0] transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-[#f4ebd0] mb-1 italic">Establish New Log Volume</h3>
              <p className="text-xs text-[#b8976f]">Add a custom register (e.g., Natural Philosophy, Cartography, Apothecary)</p>
            </div>
            <form onSubmit={handleAddSection} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#8c6b48] uppercase tracking-wider mb-1.5">Volume Title</label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g. Natural Philosophy"
                  className="w-full bg-[#140d08] border border-[#3d2817] rounded-lg px-4 py-2.5 text-xs text-[#f4ebd0] placeholder-[#70492c] focus:outline-none focus:border-[#70492c] transition shadow-inner"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-[#140d08] border border-[#3d2817] text-[#b8976f] hover:bg-[#261910] transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-medium bg-[#3d2817] hover:bg-[#4d3420] text-[#f4ebd0] border border-[#70492c] transition shadow"
                >
                  Bind Volume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}