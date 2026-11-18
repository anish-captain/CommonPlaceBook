import React, { useState, useEffect } from 'react';
import { BookOpen, Briefcase, GraduationCap, Activity, DollarSign, LayoutDashboard, Plus, Trash2, Sparkles } from 'lucide-react';

const SECTIONS = [
  { id: 'work', name: 'Work', icon: Briefcase, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'study', name: 'Study', icon: GraduationCap, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 'running', name: 'Running', icon: Activity, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'money', name: 'Money', icon: DollarSign, color: 'bg-amber-50 text-amber-600 border-amber-200' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('commonplace_entries');
    return saved ? JSON.parse(saved) : { work: [], study: [], running: [], money: [] };
  });

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedSection, setSelectedSection] = useState('work');
  const [randomHighlights, setRandomHighlights] = useState({});

  useEffect(() => {
    localStorage.setItem('commonplace_entries', JSON.stringify(entries));
  }, [entries]);

  const refreshDashboard = () => {
    const highlights = {};
    SECTIONS.forEach(sec => {
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
  }, [entries]);

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      date: new Date().toLocaleDateString(),
    };

    setEntries(prev => ({
      ...prev,
      [selectedSection]: [newItem, ...prev[selectedSection]]
    }));

    setNewTitle('');
    setNewContent('');
  };

  const handleDelete = (sectionId, id) => {
    setEntries(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter(item => item.id !== id)
    }));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans">
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-700">
          <BookOpen className="w-8 h-8 text-indigo-400" />
          <span className="font-bold text-lg tracking-wide">Commonplace</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sections</div>

          {SECTIONS.map(sec => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === sec.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{sec.name}</span>
                <span className="ml-auto bg-slate-900/40 text-xs px-2 py-0.5 rounded-full text-slate-300">
                  {entries[sec.id]?.length || 0}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-20 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/80 backdrop-blur sticky top-0 z-10">
          <h1 className="text-2xl font-bold capitalize text-white">
            {activeTab === 'dashboard' ? '🧠 Serendipity Dashboard' : `${activeTab} Notebook`}
          </h1>
          {activeTab === 'dashboard' && (
            <button
              onClick={refreshDashboard}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-md shadow-indigo-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Shuffle Highlights</span>
            </button>
          )}
        </header>

        <div className="p-8 max-w-5xl w-full mx-auto flex-1">
          {activeTab === 'dashboard' ? (
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-indigo-200 mb-2">Welcome to your intellectual hub</h2>
                <p className="text-slate-300 text-sm">
                  Your dashboard surfaces one random highlight or process from each section to keep what matters top-of-mind without cognitive overload.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SECTIONS.map(sec => {
                  const item = randomHighlights[sec.id];
                  const Icon = sec.icon;
                  return (
                    <div key={sec.id} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-slate-600 transition">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2 text-indigo-400">
                            <Icon className="w-5 h-5" />
                            <span className="font-semibold text-sm tracking-wide uppercase">{sec.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">{item ? item.date : ''}</span>
                        </div>
                        {item ? (
                          <div>
                            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
                          </div>
                        ) : (
                          <p className="text-slate-500 italic text-sm py-4">No entries yet. Add some in the {sec.name} tab!</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <span>Add New Highlight / Process to {activeTab}</span>
                </h2>
                <form onSubmit={handleAddEntry} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Title / Book / Topic</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => {
                        setNewTitle(e.target.value);
                        setSelectedSection(activeTab);
                      }}
                      placeholder="e.g., Atomic Habits Chapter 3 or Deployment Checklist"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Highlight or Step Content</label>
                    <textarea
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Write your highlight, process steps, or key takeaways here..."
                      rows="3"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/30"
                  >
                    Save Entry
                  </button>
                </form>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">All Entries ({entries[activeTab]?.length || 0})</h2>
                {entries[activeTab]?.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-700 rounded-2xl text-slate-500">
                    No entries in this section yet. Add your first one above!
                  </div>
                ) : (
                  entries[activeTab]?.map(item => (
                    <div key={item.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 flex justify-between items-start group hover:border-slate-600 transition">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-bold text-white">{item.title}</h3>
                          <span className="text-xs text-slate-500 bg-slate-900 px-2.5 py-1 rounded-full">{item.date}</span>
                        </div>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed pt-1">{item.content}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(activeTab, item.id)}
                        className="text-slate-500 hover:text-red-400 p-2 rounded-lg transition opacity-0 group-hover:opacity-100"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}