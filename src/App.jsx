import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Activity,
  DollarSign,
  LayoutDashboard,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Tag,
  FolderPlus,
  X,
  Feather,
  Image as ImageIcon,
  Edit3,
  LogOut,
  Menu,
  Maximize2,
  Camera,
  BookmarkCheck,
  Download,
  Globe,
  Quote,
  Bold,
  Italic,
  Copy,
  Check,
  FileText,
  Pin,
  CalendarHeart,
  FileJson,
  FileCode2,
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const DEFAULT_SECTIONS = [
  { id: 'work', name: 'Work', icon: 'Briefcase' },
  { id: 'books', name: 'Books', icon: 'BookOpen' },
  { id: 'health', name: 'Health', icon: 'Activity' },
  { id: 'study', name: 'Study', icon: 'GraduationCap' },
  { id: 'money', name: 'Money', icon: 'DollarSign' },
  { id: 'misc', name: 'Misc', icon: 'Feather' },
];

const DEFAULT_SECTION_IDS = new Set(DEFAULT_SECTIONS.map((s) => s.id));

const ICON_MAP = {
  Briefcase,
  GraduationCap,
  Activity,
  DollarSign,
  BookOpen,
  Feather,
};

const QUICK_TAGS_BY_SECTION = {
  books: ['running-channel', 'work', 'life', 'book-club'],
  health: ['running-channel', 'life'],
};

const IG_THEMES = {
  mahogany: {
    label: 'Mahogany & Gold',
    bg: '#1c120b',
    border: '#b88b4a',
    accent: '#e3be82',
    text: '#f6eedc',
    muted: '#bfa37a',
    badgeBg: '#2e1d12',
  },
  parchment: {
    label: 'Sepia Parchment',
    bg: '#f2e6cf',
    border: '#6d4728',
    accent: '#7c3f1d',
    text: '#23160d',
    muted: '#5c432c',
    badgeBg: '#e4d3b3',
  },
  library: {
    label: 'Library Ink',
    bg: '#141916',
    border: '#7d9276',
    accent: '#b7cca8',
    text: '#edf2e8',
    muted: '#9fb096',
    badgeBg: '#1f2822',
  },
};

function formatSectionLabelFromId(sectionId) {
  return String(sectionId || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseTagsInput(raw) {
  return raw
    .split(',')
    .map((t) => t.trim().replace(/^#+/, '').toLowerCase())
    .filter(Boolean);
}

function parseEntryMonthDay(entry) {
  const candidates = [entry?.createdAt, entry?.date].filter(Boolean);
  for (const raw of candidates) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return {
        month: parsed.getMonth(),
        day: parsed.getDate(),
        year: parsed.getFullYear(),
      };
    }
  }
  return null;
}

function extractScreenshotStoragePath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
    return null;
  }

  try {
    const parsed = new URL(imageUrl, window.location.origin);
    const decodedPath = decodeURIComponent(parsed.pathname);
    const markers = [
      '/storage/v1/object/public/screenshots/',
      '/storage/v1/object/sign/screenshots/',
      '/storage/v1/object/authenticated/screenshots/',
      '/screenshots/',
    ];

    for (const marker of markers) {
      const idx = decodedPath.indexOf(marker);
      if (idx !== -1) {
        const objectPath = decodedPath
          .slice(idx + marker.length)
          .replace(/^\/+/, '');
        return objectPath || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function renderInlineFormatted(text, keyPrefix = 'inl') {
  const str = String(text || '');
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong
          key={`${keyPrefix}-b-${idx}`}
          className="font-bold text-[#f4ebd0]"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={`${keyPrefix}-i-${idx}`} className="italic text-[#f0dfc0]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>;
  });
}

function FormattedEntryBody({ content }) {
  const raw = String(content || '');
  if (!raw.trim()) return null;

  const lines = raw.split('\n');
  const blocks = [];
  let quoteLines = [];
  let paraLines = [];

  const flushQuotes = () => {
    if (quoteLines.length > 0) {
      blocks.push({ type: 'quote', lines: [...quoteLines] });
      quoteLines = [];
    }
  };

  const flushPara = () => {
    if (paraLines.length > 0) {
      blocks.push({ type: 'para', lines: [...paraLines] });
      paraLines = [];
    }
  };

  lines.forEach((line) => {
    const trimmedStart = line.trimStart();
    if (trimmedStart.startsWith('>')) {
      flushPara();
      quoteLines.push(trimmedStart.replace(/^>\s?/, ''));
    } else if (line.trim() === '') {
      flushQuotes();
      flushPara();
    } else {
      flushQuotes();
      paraLines.push(line);
    }
  });

  flushQuotes();
  flushPara();

  return (
    <div className="space-y-3 text-sm text-[#e8d9be] leading-relaxed">
      {blocks.map((block, bIdx) => {
        if (block.type === 'quote') {
          return (
            <blockquote
              key={`blk-q-${bIdx}`}
              className="border-l-2 border-[#c9a26d] bg-[#140d08]/75 pl-3.5 pr-3 py-2 rounded-r italic text-[#f3e5c6] space-y-1"
            >
              {block.lines.map((qLine, lIdx) => (
                <p key={`q-${bIdx}-${lIdx}`} className="whitespace-pre-wrap">
                  {renderInlineFormatted(qLine, `q-${bIdx}-${lIdx}`)}
                </p>
              ))}
            </blockquote>
          );
        }

        return (
          <p key={`blk-p-${bIdx}`} className="whitespace-pre-wrap">
            {block.lines.map((pLine, lIdx) => (
              <React.Fragment key={`p-${bIdx}-${lIdx}`}>
                {lIdx > 0 && <br />}
                {renderInlineFormatted(pLine, `p-${bIdx}-${lIdx}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function buildEntryMarkdown(entry, sectionLabel) {
  const lines = [];
  const heading = entry.title?.trim() || 'Untitled Note';
  lines.push(`### ${heading}`);

  const metaParts = [];
  if (entry.isPinned) metaParts.push('Pinned');
  if (entry.date) metaParts.push(entry.date);
  if (sectionLabel) metaParts.push(sectionLabel);
  if (metaParts.length > 0) {
    lines.push(`*${metaParts.join(' • ')}*`);
  }

  if (entry.content?.trim()) {
    lines.push('');
    lines.push(entry.content.trim());
  }

  if (Array.isArray(entry.tags) && entry.tags.length > 0) {
    lines.push('');
    lines.push(entry.tags.map((t) => `#${t}`).join(' '));
  }

  if (entry.imageUrl) {
    lines.push('');
    lines.push(`![${heading}](${entry.imageUrl})`);
  }

  return lines.join('\n');
}

function triggerFileDownload(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function wrapCanvasText(ctx, text, maxWidth) {
  const paragraphs = String(text || '').split('\n');
  const lines = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = `${current} ${words[i]}`;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }
  return lines;
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
    money: [],
    misc: [],
  });

  // Composer state
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [selectedSection, setSelectedSection] = useState('work');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);
  const contentTextareaRef = useRef(null);

  // Edit & copy feedback state
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [copiedEntryId, setCopiedEntryId] = useState(null);

  // Search, scope, pin & sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAllVolumes, setSearchAllVolumes] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [bookClubOnly, setBookClubOnly] = useState(false);
  const [queuedIds, setQueuedIds] = useState([]);

  // Image lightbox state
  const [viewingImage, setViewingImage] = useState(null);

  // Instagram Card Studio modal state
  const [isIgStudioOpen, setIsIgStudioOpen] = useState(false);
  const [igFormat, setIgFormat] = useState('square'); // 'square' | 'portrait'
  const [igTheme, setIgTheme] = useState('mahogany');
  const [igSourceNote, setIgSourceNote] = useState('');
  const [selectedIgEntryId, setSelectedIgEntryId] = useState('');
  const igCanvasRef = useRef(null);

  // Custom section modal state
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [deletingSectionId, setDeletingSectionId] = useState(null);

  // Dashboard highlights
  const [randomHighlights, setRandomHighlights] = useState({});

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async () => {
    if (!session || !supabase) return;

    const [
      { data: entriesData, error: entriesError },
      { data: sectionsData, error: sectionsError },
    ] = await Promise.all([
      supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('sections')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true }),
    ]);

    const mergedMap = new Map();
    DEFAULT_SECTIONS.forEach((sec) => {
      mergedMap.set(sec.id, { ...sec });
    });

    if (!sectionsError && Array.isArray(sectionsData)) {
      sectionsData.forEach((row) => {
        if (!row?.id) return;
        mergedMap.set(row.id, {
          id: row.id,
          name: row.name || formatSectionLabelFromId(row.id),
          icon: row.icon || 'Feather',
        });
      });
    }

    const grouped = {};
    mergedMap.forEach((_val, secId) => {
      grouped[secId] = [];
    });

    if (!entriesError && Array.isArray(entriesData)) {
      entriesData.forEach((item) => {
        const sec = item.section_id || 'work';
        if (!mergedMap.has(sec)) {
          mergedMap.set(sec, {
            id: sec,
            name: formatSectionLabelFromId(sec),
            icon: 'Feather',
          });
        }
        if (!grouped[sec]) grouped[sec] = [];
        grouped[sec].push({
          id: item.id,
          title: item.title || '',
          content: item.content || '',
          tags: Array.isArray(item.tags) ? item.tags : [],
          imageUrl: item.image_url || '',
          isPinned: Boolean(item.is_pinned),
          date:
            item.date ||
            new Date(item.created_at || Date.now()).toLocaleDateString(
              'en-GB',
              { day: '2-digit', month: 'short', year: 'numeric' }
            ),
          createdAt: item.created_at || '',
        });
      });
    }

    setSections(Array.from(mergedMap.values()));
    setEntries(grouped);
  };

  useEffect(() => {
    if (session && supabase) {
      fetchUserData();
    }
  }, [session]);

  useEffect(() => {
    const nextHighlights = {};
    Object.entries(entries).forEach(([secId, list]) => {
      if (Array.isArray(list) && list.length > 0) {
        const idx = Math.floor(Math.random() * list.length);
        nextHighlights[secId] = list[idx];
      }
    });
    setRandomHighlights(nextHighlights);
  }, [entries]);

  const allEntriesFlat = useMemo(() => {
    return Object.entries(entries).flatMap(([secId, list]) => {
      const secLabel = sections.find((s) => s.id === secId)?.name || secId;
      return (list || []).map((item) => ({
        ...item,
        _sectionId: secId,
        _sectionLabel: secLabel,
      }));
    });
  }, [entries, sections]);

  const pinnedEntries = useMemo(() => {
    return allEntriesFlat.filter((item) => Boolean(item.isPinned));
  }, [allEntriesFlat]);

  const onThisDayEntries = useMemo(() => {
    const now = new Date();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();

    return allEntriesFlat.filter((item) => {
      const parsed = parseEntryMonthDay(item);
      if (!parsed) return false;
      return parsed.month === todayMonth && parsed.day === todayDay;
    });
  }, [allEntriesFlat]);

  const handleExportJson = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const payload = {
      exportedAt: new Date().toISOString(),
      ledger: 'Victorian Commonplace Book',
      sectionsCount: sections.length,
      entriesCount: allEntriesFlat.length,
      sections,
      entriesBySection: entries,
    };

    triggerFileDownload(
      `commonplace-backup-${stamp}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleExportMarkdown = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const lines = [
      '# Commonplace Book Archive',
      '',
      `*Exported on ${new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} • ${allEntriesFlat.length} total entries across ${sections.length} volumes*`,
      '',
    ];

    sections.forEach((sec) => {
      const secEntries = entries[sec.id] || [];
      lines.push(`## ${sec.name} (${secEntries.length})`);
      lines.push('');

      if (secEntries.length === 0) {
        lines.push('*No entries in this volume.*');
        lines.push('');
        return;
      }

      secEntries.forEach((entry) => {
        lines.push(buildEntryMarkdown(entry, sec.name));
        lines.push('');
        lines.push('---');
        lines.push('');
      });
    });

    triggerFileDownload(
      `commonplace-archive-${stamp}.md`,
      lines.join('\n').trim() + '\n',
      'text/markdown;charset=utf-8'
    );
  };

  const applyFormatSnippet = (mode) => {
    const el = contentTextareaRef.current;
    const current = newContent || '';
    const start = el ? el.selectionStart ?? current.length : current.length;
    const end = el ? el.selectionEnd ?? current.length : current.length;
    const selected = current.slice(start, end);

    let replacement = '';
    let cursorOffset = 0;

    if (mode === 'quote') {
      const target = selected || 'Inscribed passage or quote';
      replacement = target
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
      cursorOffset = replacement.length;
    } else if (mode === 'bold') {
      const target = selected || 'bold text';
      replacement = `**${target}**`;
      cursorOffset = selected ? replacement.length : 2;
    } else if (mode === 'italic') {
      const target = selected || 'italic text';
      replacement = `*${target}*`;
      cursorOffset = selected ? replacement.length : 1;
    } else if (mode === 'citation') {
      const prefix = current && !current.endsWith('\n') ? '\n' : '';
      replacement = `${prefix}— Author, Title, p. XX`;
      cursorOffset = replacement.length;
    }

    const updated =
      current.slice(0, start) + replacement + current.slice(end);
    setNewContent(updated);

    requestAnimationFrame(() => {
      if (!contentTextareaRef.current) return;
      contentTextareaRef.current.focus();
      if (mode === 'bold' && !selected) {
        contentTextareaRef.current.setSelectionRange(start + 2, start + 11);
      } else if (mode === 'italic' && !selected) {
        contentTextareaRef.current.setSelectionRange(start + 1, start + 12);
      } else {
        const pos = start + cursorOffset;
        contentTextareaRef.current.setSelectionRange(pos, pos);
      }
    });
  };

  const handleCopyEntry = async (entry, secLabel) => {
    const markdownText = buildEntryMarkdown(entry, secLabel);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdownText);
      } else {
        const helper = document.createElement('textarea');
        helper.value = markdownText;
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        document.body.removeChild(helper);
      }
      setCopiedEntryId(entry.id);
      setTimeout(() => {
        setCopiedEntryId((prev) => (prev === entry.id ? null : prev));
      }, 1800);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleTogglePin = async (entry, secKey) => {
    const nextPinned = !Boolean(entry.isPinned);

    setEntries((prev) => ({
      ...prev,
      [secKey]: (prev[secKey] || []).map((item) =>
        item.id === entry.id ? { ...item, isPinned: nextPinned } : item
      ),
    }));

    if (supabase && session && !String(entry.id).startsWith('local-')) {
      const { error } = await supabase
        .from('entries')
        .update({ is_pinned: nextPinned })
        .eq('id', entry.id);

      if (error) {
        console.warn('Could not persist pin to Supabase:', error.message);
      }
    }
  };

  const attachImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewUrl(blobUrl);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          attachImageFile(file);
          break;
        }
      }
    }
  };

  const resetComposer = () => {
    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setNewIsPinned(false);
    setImageFile(null);
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImagePreviewUrl('');
    setExistingImageUrl('');
    setEditingEntryId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleQuickTag = (tagName) => {
    const current = parseTagsInput(newTags);
    const exists = current.includes(tagName);
    const updated = exists
      ? current.filter((t) => t !== tagName)
      : [...current, tagName];
    setNewTags(updated.join(', '));
  };

  const deleteScreenshotFromStorage = async (imageUrl) => {
    if (!supabase || !session || !imageUrl) return;
    const storagePath = extractScreenshotStoragePath(imageUrl);
    if (!storagePath) return;

    const { error } = await supabase.storage
      .from('screenshots')
      .remove([storagePath]);

    if (error) {
      console.error('Failed to remove screenshot from storage:', error.message);
    }
  };

  const uploadScreenshotIfNeeded = async () => {
    if (!imageFile) return existingImageUrl || '';
    if (!supabase || !session) return imagePreviewUrl || '';

    const ext = (imageFile.name.split('.').pop() || 'png').toLowerCase();
    const filePath = `${session.user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('screenshots')
      .upload(filePath, imageFile, { upsert: false });

    if (uploadError) {
      console.error('Screenshot upload error:', uploadError.message);
      return imagePreviewUrl || '';
    }

    const { data: publicUrlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || imagePreviewUrl || '';
  };

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (
      !newTitle.trim() &&
      !newContent.trim() &&
      !imageFile &&
      !existingImageUrl
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const previousImageUrl = editingEntryId ? existingImageUrl : '';
      const finalImageUrl = await uploadScreenshotIfNeeded();
      const parsedTags = parseTagsInput(newTags);
      const formattedDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const sectionTarget =
        activeTab !== 'dashboard' ? activeTab : selectedSection || 'work';

      if (supabase && session) {
        if (editingEntryId) {
          let { error } = await supabase
            .from('entries')
            .update({
              title: newTitle.trim() || 'Untitled Note',
              content: newContent.trim(),
              tags: parsedTags,
              image_url: finalImageUrl || null,
              section_id: sectionTarget,
              is_pinned: newIsPinned,
            })
            .eq('id', editingEntryId);

          if (error && /is_pinned/i.test(error.message)) {
            const fallback = await supabase
              .from('entries')
              .update({
                title: newTitle.trim() || 'Untitled Note',
                content: newContent.trim(),
                tags: parsedTags,
                image_url: finalImageUrl || null,
                section_id: sectionTarget,
              })
              .eq('id', editingEntryId);
            error = fallback.error;
          }

          if (!error) {
            if (previousImageUrl && previousImageUrl !== finalImageUrl) {
              await deleteScreenshotFromStorage(previousImageUrl);
            }
            await fetchUserData();
          }
        } else {
          let { error } = await supabase.from('entries').insert([
            {
              user_id: session.user.id,
              section_id: sectionTarget,
              title: newTitle.trim() || 'Untitled Note',
              content: newContent.trim(),
              tags: parsedTags,
              image_url: finalImageUrl || null,
              is_pinned: newIsPinned,
              date: formattedDate,
            },
          ]);

          if (error && /is_pinned/i.test(error.message)) {
            const fallback = await supabase.from('entries').insert([
              {
                user_id: session.user.id,
                section_id: sectionTarget,
                title: newTitle.trim() || 'Untitled Note',
                content: newContent.trim(),
                tags: parsedTags,
                image_url: finalImageUrl || null,
                date: formattedDate,
              },
            ]);
            error = fallback.error;
          }

          if (!error) {
            await fetchUserData();
          }
        }
      } else {
        setEntries((prev) => {
          const copy = { ...prev };
          const list = [...(copy[sectionTarget] || [])];
          if (editingEntryId) {
            const idx = list.findIndex((item) => item.id === editingEntryId);
            if (idx > -1) {
              list[idx] = {
                ...list[idx],
                title: newTitle.trim() || 'Untitled Note',
                content: newContent.trim(),
                tags: parsedTags,
                imageUrl: finalImageUrl,
                isPinned: newIsPinned,
              };
            }
          } else {
            list.unshift({
              id: `local-${Date.now()}`,
              title: newTitle.trim() || 'Untitled Note',
              content: newContent.trim(),
              tags: parsedTags,
              imageUrl: finalImageUrl,
              isPinned: newIsPinned,
              date: formattedDate,
            });
          }
          copy[sectionTarget] = list;
          return copy;
        });
      }

      resetComposer();
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (entry, secKey) => {
    setEditingEntryId(entry.id);
    setSelectedSection(secKey);
    if (activeTab !== 'dashboard') {
      setActiveTab(secKey);
    }
    setNewTitle(entry.title || '');
    setNewContent(entry.content || '');
    setNewTags((entry.tags || []).join(', '));
    setNewIsPinned(Boolean(entry.isPinned));
    setExistingImageUrl(entry.imageUrl || '');
    setImageFile(null);
    setImagePreviewUrl('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEntry = async (entryId, secKey) => {
    const targetEntry = (entries[secKey] || []).find(
      (item) => item.id === entryId
    );
    const targetImageUrl = targetEntry?.imageUrl || '';

    if (supabase && session && !String(entryId).startsWith('local-')) {
      if (targetImageUrl) {
        await deleteScreenshotFromStorage(targetImageUrl);
      }
      await supabase.from('entries').delete().eq('id', entryId);
      await fetchUserData();
    } else {
      if (targetImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(targetImageUrl);
      }
      setEntries((prev) => ({
        ...prev,
        [secKey]: (prev[secKey] || []).filter((item) => item.id !== entryId),
      }));
    }
    setQueuedIds((prev) => prev.filter((id) => id !== entryId));
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    const cleanName = newSectionName.trim();
    if (!cleanName || isCreatingSection) return;
    const id = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!id) return;

    setIsCreatingSection(true);
    try {
      const newSecObj = { id, name: cleanName, icon: 'Feather' };

      if (supabase && session) {
        const { error } = await supabase.from('sections').upsert(
          [
            {
              id,
              user_id: session.user.id,
              name: cleanName,
              icon: 'Feather',
            },
          ],
          { onConflict: 'user_id,id' }
        );

        if (error) {
          console.error('Failed to save custom section:', error.message);
        } else {
          await fetchUserData();
        }
      } else {
        setSections((prev) =>
          prev.some((s) => s.id === id) ? prev : [...prev, newSecObj]
        );
      }

      setEntries((prev) => ({
        ...prev,
        [id]: prev[id] || [],
      }));
      setSelectedSection(id);
      setActiveTab(id);
      setNewSectionName('');
      setIsSectionModalOpen(false);
    } finally {
      setIsCreatingSection(false);
    }
  };

  const handleDeleteSection = async (sec) => {
    if (!sec?.id || DEFAULT_SECTION_IDS.has(sec.id) || deletingSectionId) {
      return;
    }

    const secEntries = entries[sec.id] || [];
    const confirmMsg =
      secEntries.length > 0
        ? `Delete the "${sec.name}" volume? Its ${secEntries.length} ${
            secEntries.length === 1 ? 'entry' : 'entries'
          } will be transferred to Misc.`
        : `Delete the "${sec.name}" volume?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingSectionId(sec.id);
    try {
      const fallbackSec = 'misc';

      if (supabase && session) {
        if (secEntries.length > 0) {
          const { error: moveError } = await supabase
            .from('entries')
            .update({ section_id: fallbackSec })
            .eq('section_id', sec.id);

          if (moveError) {
            console.error('Failed to transfer volume entries to Misc:', moveError.message);
            return;
          }
        }

        const { error: delError } = await supabase
          .from('sections')
          .delete()
          .eq('user_id', session.user.id)
          .eq('id', sec.id);

        if (delError) {
          console.error('Failed to delete custom section:', delError.message);
          return;
        }

        await fetchUserData();
      } else {
        setSections((prev) => prev.filter((item) => item.id !== sec.id));
        setEntries((prev) => {
          const copy = { ...prev };
          const moved = copy[sec.id] || [];
          delete copy[sec.id];
          copy[fallbackSec] = [...moved, ...(copy[fallbackSec] || [])];
          return copy;
        });
      }

      if (activeTab === sec.id) {
        setActiveTab('dashboard');
      }
      if (selectedSection === sec.id) {
        setSelectedSection(fallbackSec);
      }
      setMobileMenuOpen(false);
    } finally {
      setDeletingSectionId(null);
    }
  };

  const toggleQueueForIg = (entryId) => {
    setQueuedIds((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId]
    );
  };

  const activeSectionObj = sections.find((s) => s.id === activeTab);
  const currentSectionEntries = entries[activeTab] || [];

  const availableTags = useMemo(() => {
    const pool = searchAllVolumes
      ? Object.values(entries).flat()
      : currentSectionEntries;
    const set = new Set();
    (pool || []).forEach((item) => {
      (item.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [entries, currentSectionEntries, searchAllVolumes]);

  const filteredEntries = useMemo(() => {
    const base = searchAllVolumes
      ? Object.entries(entries).flatMap(([secId, list]) => {
          const secLabel = sections.find((s) => s.id === secId)?.name || secId;
          return (list || []).map((item) => ({
            ...item,
            _sectionId: secId,
            _sectionLabel: secLabel,
          }));
        })
      : (entries[activeTab] || []).map((item) => ({
          ...item,
          _sectionId: activeTab,
          _sectionLabel: activeSectionObj?.name || activeTab,
        }));

    const q = searchQuery.trim().toLowerCase();

    const matched = base.filter((entry) => {
      if (pinnedOnly && !entry.isPinned) return false;
      if (activeTab === 'books' && bookClubOnly) {
        if (!(entry.tags || []).includes('book-club')) return false;
      }
      if (selectedTagFilter !== 'ALL') {
        if (!(entry.tags || []).includes(selectedTagFilter)) return false;
      }
      if (q) {
        const inTitle = (entry.title || '').toLowerCase().includes(q);
        const inBody = (entry.content || '').toLowerCase().includes(q);
        const inTags = (entry.tags || []).some((t) =>
          t.toLowerCase().includes(q)
        );
        const inSec = (entry._sectionLabel || '').toLowerCase().includes(q);
        if (!inTitle && !inBody && !inTags && !inSec) return false;
      }
      return true;
    });

    if (sortBy === 'oldest') return [...matched].reverse();
    if (sortBy === 'title') {
      return [...matched].sort((a, b) =>
        (a.title || '').localeCompare(b.title || '')
      );
    }
    return matched;
  }, [
    entries,
    sections,
    activeTab,
    activeSectionObj,
    searchAllVolumes,
    pinnedOnly,
    bookClubOnly,
    selectedTagFilter,
    searchQuery,
    sortBy,
  ]);

  const bookClubEntries = useMemo(() => {
    const allBooks = entries.books || [];
    const tagged = allBooks.filter((item) =>
      (item.tags || []).includes('book-club')
    );
    return tagged.length > 0 ? tagged : allBooks;
  }, [entries.books]);

  const activeIgEntry = useMemo(() => {
    if (selectedIgEntryId) {
      const found = bookClubEntries.find((item) => item.id === selectedIgEntryId);
      if (found) return found;
    }
    if (queuedIds.length > 0) {
      const queuedBookEntry = bookClubEntries.find((item) =>
        queuedIds.includes(item.id)
      );
      if (queuedBookEntry) return queuedBookEntry;
    }
    return bookClubEntries[0] || null;
  }, [bookClubEntries, selectedIgEntryId, queuedIds]);

  useEffect(() => {
    if (!isIgStudioOpen || !igCanvasRef.current) return;
    const canvas = igCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = igFormat === 'portrait' ? 1350 : 1080;
    canvas.width = width;
    canvas.height = height;

    const theme = IG_THEMES[igTheme] || IG_THEMES.mahogany;

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, width - 96, height - 96);

    ctx.lineWidth = 1.5;
    ctx.strokeRect(64, 64, width - 128, height - 128);

    ctx.fillStyle = theme.badgeBg;
    ctx.fillRect(104, 108, 300, 44);
    ctx.fillStyle = theme.accent;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText('COMMONPLACE • #BOOK-CLUB', 122, 137);

    if (activeIgEntry?.date) {
      ctx.fillStyle = theme.muted;
      ctx.font = 'italic 22px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText(activeIgEntry.date, width - 104, 137);
      ctx.textAlign = 'left';
    }

    let cursorY = 215;
    if (igSourceNote.trim()) {
      ctx.fillStyle = theme.accent;
      ctx.font = 'italic 26px Georgia, serif';
      const noteLines = wrapCanvasText(ctx, igSourceNote.trim(), width - 208);
      for (const line of noteLines) {
        ctx.fillText(line, 104, cursorY);
        cursorY += 36;
      }
      cursorY += 12;
    }

    ctx.fillStyle = theme.text;
    ctx.font = 'bold 46px Georgia, serif';
    const titleLines = wrapCanvasText(
      ctx,
      activeIgEntry?.title || 'Book Club Reflection',
      width - 208
    );
    for (const line of titleLines) {
      ctx.fillText(line, 104, cursorY);
      cursorY += 58;
    }

    cursorY += 10;
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(104, cursorY);
    ctx.lineTo(width - 104, cursorY);
    ctx.stroke();
    cursorY += 46;

    ctx.fillStyle = theme.text;
    ctx.font = '32px Georgia, serif';
    const bodyLines = wrapCanvasText(
      ctx,
      activeIgEntry?.content ||
        'Select or tag an entry in Books with #book-club to compose your card.',
      width - 208
    );
    const maxBodyY = height - 135;
    for (const line of bodyLines) {
      if (cursorY + 46 > maxBodyY) {
        ctx.fillText('…', 104, cursorY);
        break;
      }
      if (line !== '') {
        ctx.fillText(line, 104, cursorY);
      }
      cursorY += 46;
    }

    ctx.fillStyle = theme.muted;
    ctx.font = '22px Georgia, serif';
    ctx.fillText('THE VICTORIAN COMMONPLACE LEDGER', 104, height - 88);
  }, [isIgStudioOpen, igFormat, igTheme, igSourceNote, activeIgEntry]);

  const handleDownloadIgPng = () => {
    if (!igCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `book-club-instagram-${igFormat}-${Date.now()}.png`;
    link.href = igCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!supabase) {
      setAuthError('Supabase keys are missing in .env file!');
      return;
    }
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) setAuthError(error.message);
      else alert('Check your email for confirmation link or sign in!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
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

  if (supabase && !session) {
    return (
      <div className="min-h-screen bg-[#140d08] text-[#f4ebd0] flex items-center justify-center p-4 font-serif">
        <div className="w-full max-w-md bg-[#1f150e] border-2 border-[#70492c] rounded-xl p-7 shadow-2xl space-y-5">
          <div className="text-center space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-[#b8976f]">
              Victorian Commonplace
            </p>
            <h1 className="text-2xl font-bold italic text-[#f4ebd0]">
              {isSignUp ? 'Open Your Ledger' : 'Enter Your Study'}
            </h1>
          </div>

          {authError && (
            <div className="p-3 rounded bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#b8976f] mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded bg-[#140d08] border border-[#3d2817] text-[#f4ebd0] focus:outline-none focus:border-[#c9a26d]"
                placeholder="scholar@example.com"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#b8976f] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded bg-[#140d08] border border-[#3d2817] text-[#f4ebd0] focus:outline-none focus:border-[#c9a26d]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded bg-[#70492c] hover:bg-[#875836] text-[#f4ebd0] font-semibold transition"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-2 rounded bg-[#140d08] hover:bg-[#291b11] border border-[#3d2817] text-xs uppercase tracking-wider text-[#dfcaab] transition"
          >
            Continue with Google
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsSignUp((prev) => !prev);
                setAuthError('');
              }}
              className="text-xs text-[#b8976f] hover:text-[#f4ebd0] underline"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const quickTags = QUICK_TAGS_BY_SECTION[activeTab] || [];
  const formattedTodayLabel = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <div
      onPaste={handlePaste}
      className="min-h-screen bg-[#140d08] text-[#f4ebd0] font-serif flex flex-col md:flex-row"
    >
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#1f150e] border-b border-[#3d2817] sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Feather className="w-5 h-5 text-[#c9a26d]" />
          <span className="font-bold tracking-widest uppercase text-sm text-[#f4ebd0]">
            COMMONPLACE
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="p-2 rounded bg-[#140d08] border border-[#3d2817] text-[#dfcaab]"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* Sidebar / Mobile Drawer */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 shrink-0 bg-[#1f150e] border-b md:border-b-0 md:border-r border-[#3d2817] p-4 space-y-5`}
      >
        <div className="hidden md:flex items-center gap-2.5 px-2 pt-1">
          <Feather className="w-5 h-5 text-[#c9a26d]" />
          <div>
            <h1 className="font-bold tracking-widest uppercase text-sm text-[#f4ebd0]">
              COMMONPLACE
            </h1>
            <p className="text-[11px] italic text-[#b8976f]">
              Cabinet of Curiosities
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('dashboard');
              setSelectedTagFilter('ALL');
              setBookClubOnly(false);
              setPinnedOnly(false);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
              activeTab === 'dashboard'
                ? 'bg-[#70492c] text-[#f4ebd0] font-semibold'
                : 'text-[#cbb292] hover:bg-[#291b11]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Almanac Overview</span>
          </button>

          {sections.map((sec) => {
            const IconComponent = ICON_MAP[sec.icon] || Feather;
            const count = (entries[sec.id] || []).length;
            const isCustom = !DEFAULT_SECTION_IDS.has(sec.id);

            return (
              <div
                key={sec.id}
                className={`group flex items-center justify-between rounded-lg transition ${
                  activeTab === sec.id
                    ? 'bg-[#70492c] text-[#f4ebd0] font-semibold'
                    : 'text-[#cbb292] hover:bg-[#291b11]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(sec.id);
                    setSelectedSection(sec.id);
                    setSelectedTagFilter('ALL');
                    setBookClubOnly(false);
                    setPinnedOnly(false);
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-between px-3 py-2 text-sm text-left min-w-0"
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span className="truncate">{sec.name}</span>
                  </span>
                  <span className="text-xs text-[#b8976f] ml-2">{count}</span>
                </button>

                {isCustom && (
                  <button
                    type="button"
                    disabled={deletingSectionId === sec.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSection(sec);
                    }}
                    className="mr-2 p-1.5 rounded text-[#b8976f] hover:text-red-300 hover:bg-[#140d08]/60 disabled:opacity-40 transition shrink-0"
                    title={`Delete ${sec.name} volume`}
                    aria-label={`Delete ${sec.name} volume`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            setIsSectionModalOpen(true);
            setMobileMenuOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#70492c] text-xs uppercase tracking-wider text-[#dfcaab] hover:bg-[#291b11] transition"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Volume</span>
        </button>

        {/* Archive Export Controls */}
        <div className="pt-3 border-t border-[#3d2817] space-y-2">
          <span className="block px-1 text-[11px] uppercase tracking-widest text-[#9c7d56]">
            Backup Ledger
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-2.5 py-2 rounded-lg bg-[#140d08] hover:bg-[#291b11] border border-[#3d2817] text-xs text-[#dfcaab] flex items-center justify-center gap-1.5 transition"
              title="Download full JSON backup"
            >
              <FileJson className="w-3.5 h-3.5 text-[#c9a26d]" />
              <span>JSON</span>
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="px-2.5 py-2 rounded-lg bg-[#140d08] hover:bg-[#291b11] border border-[#3d2817] text-xs text-[#dfcaab] flex items-center justify-center gap-1.5 transition"
              title="Download Markdown archive"
            >
              <FileCode2 className="w-3.5 h-3.5 text-[#c9a26d]" />
              <span>Markdown</span>
            </button>
          </div>
        </div>

        {session && (
          <div className="pt-3 border-t border-[#3d2817] flex items-center justify-between px-2 text-xs text-[#b8976f]">
            <span className="truncate max-w-[155px]">{session.user.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-[#291b11] text-[#dfcaab]"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        {activeTab === 'dashboard' ? (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d2817] pb-4">
              <div>
                <h2 className="text-2xl font-bold italic text-[#f4ebd0]">
                  Almanac Overview
                </h2>
                <p className="text-xs text-[#b8976f]">
                  Pinned marginalia, On This Day records & volume highlights
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1f150e] hover:bg-[#291b11] border border-[#3d2817] text-xs uppercase tracking-wider text-[#dfcaab]"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#c9a26d]" />
                  <span>Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1f150e] hover:bg-[#291b11] border border-[#3d2817] text-xs uppercase tracking-wider text-[#dfcaab]"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-[#c9a26d]" />
                  <span>Export MD</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = {};
                    Object.entries(entries).forEach(([secId, list]) => {
                      if (list?.length) {
                        next[secId] =
                          list[Math.floor(Math.random() * list.length)];
                      }
                    });
                    setRandomHighlights(next);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1f150e] hover:bg-[#291b11] border border-[#3d2817] text-xs uppercase tracking-wider text-[#dfcaab]"
                >
                  <Sparkles className="w-4 h-4 text-[#c9a26d]" />
                  <span>Shuffle Highlights</span>
                </button>
              </div>
            </div>

            {/* Pinned Marginalia & On This Day Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1f150e] border border-[#70492c]/80 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-[#e3be82] font-semibold flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5" />
                    <span>Pinned Marginalia ({pinnedEntries.length})</span>
                  </span>
                  {pinnedEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(pinnedEntries[0]._sectionId);
                        setSearchAllVolumes(true);
                        setPinnedOnly(true);
                      }}
                      className="text-xs text-[#dfcaab] hover:underline"
                    >
                      View All Pinned
                    </button>
                  )}
                </div>

                {pinnedEntries.length === 0 ? (
                  <p className="text-sm italic text-[#8a6d4b]">
                    Pin any entry inside a volume to keep your favorite quotes
                    and reflections right here.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {pinnedEntries.slice(0, 3).map((pinItem) => (
                      <div
                        key={`pin-${pinItem._sectionId}-${pinItem.id}`}
                        className="p-3 rounded-lg bg-[#140d08] border border-[#3d2817] space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab(pinItem._sectionId);
                              setSelectedSection(pinItem._sectionId);
                            }}
                            className="text-sm font-bold italic text-[#f4ebd0] hover:underline text-left truncate"
                          >
                            {pinItem.title || 'Untitled Note'}
                          </button>
                          <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#2e1d12] text-[#e3be82] shrink-0">
                            {pinItem._sectionLabel}
                          </span>
                        </div>
                        {pinItem.content && (
                          <p className="text-xs text-[#cbb292] line-clamp-2">
                            {pinItem.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#1f150e] border border-[#70492c]/80 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-[#e3be82] font-semibold flex items-center gap-1.5">
                    <CalendarHeart className="w-3.5 h-3.5" />
                    <span>On This Day • {formattedTodayLabel}</span>
                  </span>
                  <span className="text-xs text-[#9c7d56]">
                    {onThisDayEntries.length}{' '}
                    {onThisDayEntries.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                {onThisDayEntries.length === 0 ? (
                  <p className="text-sm italic text-[#8a6d4b]">
                    No past entries inscribed on {formattedTodayLabel} yet—today’s
                    entries will appear here on future {formattedTodayLabel}{' '}
                    dates.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {onThisDayEntries.slice(0, 3).map((otdItem) => (
                      <div
                        key={`otd-${otdItem._sectionId}-${otdItem.id}`}
                        className="p-3 rounded-lg bg-[#140d08] border border-[#3d2817] space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab(otdItem._sectionId);
                              setSelectedSection(otdItem._sectionId);
                            }}
                            className="text-sm font-bold italic text-[#f4ebd0] hover:underline text-left truncate"
                          >
                            {otdItem.title || 'Untitled Note'}
                          </button>
                          <span className="text-[11px] text-[#b8976f] shrink-0">
                            {otdItem.date}
                          </span>
                        </div>
                        {otdItem.content && (
                          <p className="text-xs text-[#cbb292] line-clamp-2">
                            {otdItem.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.map((sec) => {
                const highlight = randomHighlights[sec.id];
                const totalCount = (entries[sec.id] || []).length;
                return (
                  <div
                    key={sec.id}
                    className="bg-[#1f150e] border border-[#3d2817] rounded-xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setActiveTab(sec.id)}
                          className="text-xs uppercase tracking-widest text-[#c9a26d] hover:underline font-semibold"
                        >
                          {sec.name} ({totalCount})
                        </button>
                        {highlight?.date && (
                          <span className="text-xs text-[#9c7d56]">
                            {highlight.date}
                          </span>
                        )}
                      </div>

                      {highlight ? (
                        <>
                          <h3 className="text-lg font-bold italic text-[#f4ebd0]">
                            {highlight.title}
                          </h3>
                          <FormattedEntryBody content={highlight.content} />
                          {highlight.imageUrl && (
                            <div className="pt-2 flex items-center justify-between gap-2">
                              <img
                                src={highlight.imageUrl}
                                alt={highlight.title || 'Highlight'}
                                onClick={() =>
                                  setViewingImage({
                                    src: highlight.imageUrl,
                                    title: highlight.title,
                                  })
                                }
                                className="max-h-28 w-auto object-contain rounded border border-[#3d2817] bg-[#140d08] cursor-zoom-in"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setViewingImage({
                                    src: highlight.imageUrl,
                                    title: highlight.title,
                                  })
                                }
                                className="p-2 rounded bg-[#140d08] border border-[#3d2817] text-[#b8976f] hover:text-[#f4ebd0]"
                                title="View full image"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm italic text-[#8a6d4b]">
                          No entries inscribed in {sec.name} yet.
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#3d2817]/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSection(sec.id);
                          setActiveTab(sec.id);
                        }}
                        className="text-xs text-[#dfcaab] hover:text-[#f4ebd0] flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Open {sec.name}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            {/* Section Header & Book Club Tools */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d2817] pb-4">
              <div>
                <h2 className="text-2xl font-bold italic text-[#f4ebd0]">
                  {activeSectionObj?.name || activeTab}
                </h2>
                <p className="text-xs text-[#b8976f]">
                  {filteredEntries.length} of {currentSectionEntries.length}{' '}
                  entries shown • Paste screenshots with Ctrl/Cmd + V
                </p>
              </div>

              {activeTab === 'books' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBookClubOnly((prev) => !prev)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
                      bookClubOnly
                        ? 'bg-[#70492c] text-[#f4ebd0] border-[#c9a26d]'
                        : 'bg-[#1f150e] text-[#dfcaab] border-[#3d2817] hover:bg-[#291b11]'
                    }`}
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Sort #book-club</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsIgStudioOpen(true)}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#875836] hover:bg-[#9c6640] text-[#f4ebd0] border border-[#c9a26d]/50 flex items-center gap-1.5 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>IG Image Card</span>
                  </button>
                </div>
              )}
            </div>

            {/* Entry Composer Form */}
            <form
              onSubmit={handleSaveEntry}
              className="bg-[#1f150e] border border-[#3d2817] rounded-xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-widest text-[#c9a26d] font-semibold">
                  {editingEntryId ? 'Amend Entry' : 'New Entry'}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewIsPinned((prev) => !prev)}
                    className={`px-2.5 py-1 rounded text-xs border flex items-center gap-1 transition ${
                      newIsPinned
                        ? 'bg-[#70492c] text-[#f4ebd0] border-[#c9a26d]'
                        : 'bg-[#140d08] text-[#cbb292] border-[#3d2817]'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{newIsPinned ? 'Pinned' : 'Pin Entry'}</span>
                  </button>

                  {editingEntryId && (
                    <button
                      type="button"
                      onClick={resetComposer}
                      className="text-xs text-[#b8976f] hover:text-[#f4ebd0]"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Heading or passage title..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#140d08] border border-[#3d2817] text-[#f4ebd0] placeholder-[#7c6041] focus:outline-none focus:border-[#c9a26d]"
              />

              {/* Markdown & Quote Toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#140d08] border border-[#3d2817]">
                <span className="text-[11px] uppercase tracking-wider text-[#9c7d56] mr-1">
                  Style:
                </span>
                <button
                  type="button"
                  onClick={() => applyFormatSnippet('quote')}
                  className="px-2.5 py-1 rounded text-xs bg-[#1f150e] hover:bg-[#291b11] border border-[#3d2817] text-[#dfcaab] flex items-center gap-1 transition"
                  title="Insert quote block (> )"
                >
                  <Quote className="w-3.5 h-3.5 text-[#c9a26d]" />
                  <span>Quote</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatSnippet('bold')}
                  className="px-2.5 py-1 rounded text-xs bg-[#1f150e] hover:bg-[#291b11] border border-[#3d2817] text-[#dfcaab] flex items-center gap-1 transition"
                  title="Bold (**text**)"
                >
                  <Bold className="w-3.5 h-3.5 text-[#c9a26d]" />
                  <span>Bold</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatSnippet('italic')}
                  className="px-2.5 py-1 rounded text-xs bg-[#1f150e] hover:bg-[#291b11] border border-[#3d2817] text-[#dfcaab] flex items-center gap-1 transition"
                  title="Italic (*text*)"
                >
                  <Italic className="w-3.5 h-3.5 text-[#c9a26d]" />
                  <span>Italic</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatSnippet('citation')}
                  className="px-2.5 py-1 rounded text-xs bg-[#1f150e] hover:bg-[#291b11] border border-[#3d2817] text-[#dfcaab] flex items-center gap-1 transition"
                  title="Insert source line"
                >
                  <FileText className="w-3.5 h-3.5 text-[#c9a26d]" />
                  <span>Source</span>
                </button>
              </div>

              <textarea
                ref={contentTextareaRef}
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Inscribe thoughts, > quotes, **bold**, or *italics*..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#140d08] border border-[#3d2817] text-[#f4ebd0] placeholder-[#7c6041] focus:outline-none focus:border-[#c9a26d]"
              />

              {quickTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#b8976f]">
                    Quick Tags:
                  </span>
                  {quickTags.map((qTag) => {
                    const active = parseTagsInput(newTags).includes(qTag);
                    return (
                      <button
                        key={qTag}
                        type="button"
                        onClick={() => toggleQuickTag(qTag)}
                        className={`px-2.5 py-1 rounded text-xs border transition ${
                          active
                            ? 'bg-[#70492c] text-[#f4ebd0] border-[#c9a26d]'
                            : 'bg-[#140d08] text-[#cbb292] border-[#3d2817] hover:border-[#70492c]'
                        }`}
                      >
                        #{qTag}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#140d08] border border-[#3d2817]">
                  <Tag className="w-4 h-4 text-[#b8976f] shrink-0" />
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    placeholder="Tags (comma separated, e.g. book-club, life)"
                    className="w-full bg-transparent text-sm text-[#f4ebd0] placeholder-[#7c6041] focus:outline-none"
                  />
                </div>

                <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#140d08] border border-[#3d2817] text-xs text-[#dfcaab] cursor-pointer hover:border-[#70492c]">
                  <span className="flex items-center gap-2 truncate">
                    <ImageIcon className="w-4 h-4 text-[#c9a26d] shrink-0" />
                    <span className="truncate">
                      {imageFile
                        ? imageFile.name
                        : existingImageUrl
                        ? 'Image attached'
                        : 'Attach screenshot (or Ctrl+V)'}
                    </span>
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => attachImageFile(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>

              {(imagePreviewUrl || existingImageUrl) && (
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#140d08] border border-[#3d2817]">
                  <img
                    src={imagePreviewUrl || existingImageUrl}
                    alt="Composer preview"
                    className="max-h-24 w-auto object-contain rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreviewUrl('');
                      setExistingImageUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-[#b8976f] hover:text-red-300 px-2 py-1"
                  >
                    Remove Image
                  </button>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg bg-[#70492c] hover:bg-[#875836] disabled:opacity-50 text-sm font-semibold text-[#f4ebd0] transition"
                >
                  {isSaving
                    ? 'Inscribing...'
                    : editingEntryId
                    ? 'Save Changes'
                    : 'Inscribe Entry'}
                </button>
              </div>
            </form>

            {/* Search, Scope, Pin & Tag Filter Bar */}
            <div className="bg-[#1f150e] border border-[#3d2817] rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#140d08] border border-[#3d2817]">
                  <Search className="w-4 h-4 text-[#b8976f] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchAllVolumes
                        ? 'Search across all volumes...'
                        : `Search in ${activeSectionObj?.name || activeTab}...`
                    }
                    className="w-full bg-transparent text-sm text-[#f4ebd0] placeholder-[#7c6041] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setPinnedOnly((prev) => !prev)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition shrink-0 ${
                    pinnedOnly
                      ? 'bg-[#70492c] text-[#f4ebd0] border-[#c9a26d]'
                      : 'bg-[#140d08] text-[#cbb292] border-[#3d2817] hover:text-[#f4ebd0]'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>Pinned</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchAllVolumes((prev) => !prev)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition shrink-0 ${
                    searchAllVolumes
                      ? 'bg-[#70492c] text-[#f4ebd0] border-[#c9a26d]'
                      : 'bg-[#140d08] text-[#cbb292] border-[#3d2817] hover:text-[#f4ebd0]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{searchAllVolumes ? 'All Volumes' : 'This Volume'}</span>
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#140d08] border border-[#3d2817] text-xs text-[#dfcaab] focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title (A–Z)</option>
                </select>
              </div>

              {availableTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTagFilter('ALL')}
                    className={`px-2.5 py-1 rounded text-xs border transition ${
                      selectedTagFilter === 'ALL'
                        ? 'bg-[#70492c] text-[#f4ebd0] border-[#c9a26d]'
                        : 'bg-[#140d08] text-[#b8976f] border-[#3d2817]'
                    }`}
                  >
                    All Tags
                  </button>
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setSelectedTagFilter((prev) =>
                          prev === tag ? 'ALL' : tag
                        )
                      }
                      className={`px-2.5 py-1 rounded text-xs border transition ${
                        selectedTagFilter === tag
                          ? 'bg-[#70492c] text-[#f4ebd0] border-[#c9a26d]'
                          : 'bg-[#140d08] text-[#cbb292] border-[#3d2817] hover:border-[#70492c]'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Entries List */}
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="bg-[#1f150e] border border-[#3d2817] rounded-xl p-8 text-center text-sm italic text-[#9c7d56]">
                  No entries match your current filter.
                </div>
              ) : (
                filteredEntries.map((item) => {
                  const secKey = item._sectionId || activeTab;
                  const secLabel =
                    item._sectionLabel || activeSectionObj?.name || secKey;
                  const isQueued = queuedIds.includes(item.id);
                  const isCopied = copiedEntryId === item.id;

                  return (
                    <article
                      key={`${secKey}-${item.id}`}
                      className={`bg-[#1f150e] border rounded-xl p-5 space-y-3 ${
                        item.isPinned ? 'border-[#c9a26d]' : 'border-[#3d2817]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold italic text-[#f4ebd0]">
                              {item.title}
                            </h3>
                            {item.isPinned && (
                              <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#70492c] text-[#f4ebd0] flex items-center gap-1">
                                <Pin className="w-3 h-3" />
                                <span>Pinned</span>
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-[#140d08] border border-[#3d2817] text-[#b8976f]">
                              {item.date}
                            </span>
                            {searchAllVolumes && item._sectionLabel && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab(secKey);
                                  setSearchAllVolumes(false);
                                }}
                                className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#2e1d12] text-[#e3be82] border border-[#70492c]/60 hover:underline"
                              >
                                {item._sectionLabel}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(item, secKey)}
                            className={`p-2 rounded border transition ${
                              item.isPinned
                                ? 'bg-[#70492c] border-[#c9a26d] text-[#f4ebd0]'
                                : 'bg-[#140d08] border-[#3d2817] text-[#b8976f] hover:text-[#f4ebd0]'
                            }`}
                            title={item.isPinned ? 'Unpin entry' : 'Pin entry'}
                            aria-label={
                              item.isPinned ? 'Unpin entry' : 'Pin entry'
                            }
                          >
                            <Pin className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyEntry(item, secLabel)}
                            className={`px-2.5 py-1.5 rounded text-xs border flex items-center gap-1 transition ${
                              isCopied
                                ? 'bg-[#2b4228] text-[#e7f5e4] border-[#6a9c63]'
                                : 'bg-[#140d08] text-[#dfcaab] border-[#3d2817] hover:text-[#f4ebd0]'
                            }`}
                            title="Copy formatted Markdown"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#9ad690]" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-[#c9a26d]" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {activeTab === 'books' && (
                            <button
                              type="button"
                              onClick={() => toggleQueueForIg(item.id)}
                              className={`px-2.5 py-1.5 rounded text-xs border transition ${
                                isQueued
                                  ? 'bg-[#70492c] text-[#f4ebd0] border-[#c9a26d]'
                                  : 'bg-[#140d08] text-[#b8976f] border-[#3d2817] hover:text-[#f4ebd0]'
                              }`}
                            >
                              {isQueued ? 'Queued for IG' : 'Queue for IG'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartEdit(item, secKey)}
                            className="p-2 rounded bg-[#140d08] border border-[#3d2817] text-[#b8976f] hover:text-[#f4ebd0] transition"
                            title="Edit entry"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(item.id, secKey)}
                            className="p-2 rounded bg-[#140d08] border border-[#3d2817] text-[#b8976f] hover:text-red-300 transition"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <FormattedEntryBody content={item.content} />

                      {item.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSelectedTagFilter(tag)}
                              className="text-xs px-2 py-0.5 rounded bg-[#140d08] text-[#c9a26d] border border-[#3d2817] hover:border-[#70492c]"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Minimized screenshot preview + Maximize2 button */}
                      {item.imageUrl && (
                        <div className="mt-3 pt-2.5 border-t border-[#3d2817]/60 flex items-center justify-between gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.title || 'Entry screenshot'}
                            onClick={() =>
                              setViewingImage({
                                src: item.imageUrl,
                                title: item.title,
                              })
                            }
                            className="max-h-40 w-auto object-contain rounded-lg border border-[#3d2817] bg-[#140d08] cursor-zoom-in"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setViewingImage({
                                src: item.imageUrl,
                                title: item.title,
                              })
                            }
                            className="text-[#b8976f] hover:text-[#f4ebd0] p-2 rounded transition bg-[#140d08] border border-[#3d2817] shrink-0"
                            title="View full image"
                            aria-label="View full image"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )}
      </main>

      {/* Full-Screen Image Lightbox Modal */}
      {viewingImage && (
        <div
          onClick={() => setViewingImage(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1f150e] border-2 border-[#70492c] rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3d2817] bg-[#140d08]">
              <h3 className="text-sm font-bold text-[#f4ebd0] italic truncate">
                {viewingImage.title || 'Screenshot Viewer'}
              </h3>
              <div className="flex items-center gap-3">
                <a
                  href={viewingImage.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#dfcaab] hover:underline"
                >
                  Open in New Tab
                </a>
                <button
                  type="button"
                  onClick={() => setViewingImage(null)}
                  className="text-[#b8976f] hover:text-[#f4ebd0] p-1 rounded"
                  aria-label="Close image viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-[#140d08]">
              <img
                src={viewingImage.src}
                alt={viewingImage.title || 'Full screenshot'}
                className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Instagram Post Card Studio Modal */}
      {isIgStudioOpen && (
        <div
          onClick={() => setIsIgStudioOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1f150e] border-2 border-[#70492c] rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#3d2817] pb-3">
              <div>
                <h3 className="text-lg font-bold italic text-[#f4ebd0]">
                  Instagram Post Card Studio
                </h3>
                <p className="text-xs text-[#b8976f]">
                  Export a #book-club entry as a downloadable PNG image.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsIgStudioOpen(false)}
                className="p-1.5 rounded text-[#b8976f] hover:text-[#f4ebd0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookClubEntries.length > 0 && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#b8976f] mb-1">
                  Entry
                </label>
                <select
                  value={activeIgEntry?.id || ''}
                  onChange={(e) => setSelectedIgEntryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#140d08] border border-[#3d2817] text-sm text-[#f4ebd0]"
                >
                  {bookClubEntries.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.date})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#b8976f] mb-1">
                  Aspect Ratio
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIgFormat('square')}
                    className={`flex-1 py-2 rounded text-xs border ${
                      igFormat === 'square'
                        ? 'bg-[#70492c] text-[#f4ebd0] border-[#c9a26d]'
                        : 'bg-[#140d08] text-[#cbb292] border-[#3d2817]'
                    }`}
                  >
                    1:1 Square
                  </button>
                  <button
                    type="button"
                    onClick={() => setIgFormat('portrait')}
                    className={`flex-1 py-2 rounded text-xs border ${
                      igFormat === 'portrait'
                        ? 'bg-[#70492c] text-[#f4ebd0] border-[#c9a26d]'
                        : 'bg-[#140d08] text-[#cbb292] border-[#3d2817]'
                    }`}
                  >
                    4:5 Portrait
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#b8976f] mb-1">
                  Volume Tone
                </label>
                <select
                  value={igTheme}
                  onChange={(e) => setIgTheme(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#140d08] border border-[#3d2817] text-xs text-[#f4ebd0]"
                >
                  {Object.entries(IG_THEMES).map(([key, t]) => (
                    <option key={key} value={key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#b8976f] mb-1">
                Book / Chapter / Page Note (Optional)
              </label>
              <input
                type="text"
                value={igSourceNote}
                onChange={(e) => setIgSourceNote(e.target.value)}
                placeholder="e.g. Middlemarch • Ch. XIV, p. 142"
                className="w-full px-3 py-2 rounded-lg bg-[#140d08] border border-[#3d2817] text-sm text-[#f4ebd0]"
              />
            </div>

            <div className="bg-[#140d08] border border-[#3d2817] rounded-lg p-3 flex justify-center">
              <canvas
                ref={igCanvasRef}
                className="w-full max-w-sm h-auto rounded shadow-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadIgPng}
                className="px-4 py-2.5 rounded-lg bg-[#70492c] hover:bg-[#875836] text-xs font-semibold text-[#f4ebd0] flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Instagram PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Volume Modal */}
      {isSectionModalOpen && (
        <div
          onClick={() => setIsSectionModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleCreateSection}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1f150e] border-2 border-[#70492c] rounded-xl max-w-sm w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold italic text-[#f4ebd0]">
                Create New Volume
              </h3>
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(false)}
                className="text-[#b8976f] hover:text-[#f4ebd0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Volume name (e.g. Natural Philosophy)"
              className="w-full px-3 py-2 rounded-lg bg-[#140d08] border border-[#3d2817] text-sm text-[#f4ebd0]"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSectionModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-[#b8976f]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingSection}
                className="px-4 py-1.5 rounded bg-[#70492c] hover:bg-[#875836] disabled:opacity-50 text-xs font-semibold text-[#f4ebd0]"
              >
                {isCreatingSection ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}