import React, { useState } from 'react';
import { useSyncSpace } from './lib/useSyncSpace';
import { ThemeWrapper } from './components/ThemeWrapper';
import { Login } from './components/Login';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Settings as SettingsIcon, 
  Bell, 
  Plus, 
  LogOut,
  Link,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { SharedEvent, UserProfile } from './types';
import { db, auth } from './lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';

export default function App() {
  const { 
    user, 
    profile, 
    pairing, 
    partnerProfile, 
    sharedEvents, 
    myWorkEvents, 
    partnerWorkEvents, 
    loading,
    createSharedEvent,
    updateSharedEvent,
    deleteSharedEvent,
    linkPartner
  } = useSyncSpace();

  const [activeTab, setActiveTab] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SharedEvent | null>(null);

  if (loading) return <div className="flex items-center justify-center h-screen text-[var(--p)]">Checking connection...</div>;
  if (!user) return <ThemeWrapper><Login /></ThemeWrapper>;

  const getWeekDays = () => {
    const start = addDays(startOfWeek(new Date()), weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const currentWeekDays = getWeekDays();
  const dateKey = (d: Date) => format(d, 'yyyy-MM-dd');
  
  const filteredEvents = sharedEvents.filter(e => e.date === dateKey(selectedDate));
  const filteredMyWork = myWorkEvents.filter(e => e.date === dateKey(selectedDate));
  const filteredPartnerWork = partnerWorkEvents.filter(e => e.date === dateKey(selectedDate));

  const allEvents = [
    ...filteredEvents.map(e => ({ ...e, type: 'shared' })),
    ...filteredMyWork.map(e => ({ ...e, type: 'mine' })),
    ...filteredPartnerWork.map(e => ({ ...e, type: 'partner' }))
  ].sort((a, b) => a.time.localeCompare(b.time));

  const handleCreateOrUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const eventData = {
      title: formData.get('title') as string,
      tag: formData.get('tag') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      notes: formData.get('notes') as string,
    };

    if (editingEvent) {
      await updateSharedEvent(editingEvent.id, eventData);
    } else {
      await createSharedEvent(eventData);
    }
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  return (
    <ThemeWrapper themeKey={profile?.theme}>
      <div className="flex flex-col h-screen max-w-lg mx-auto bg-[var(--bg)] shadow-xl relative overflow-hidden">
        {/* Status Bar */}
        <div className="bg-[var(--p)] text-white px-5 py-2 flex justify-between items-center text-xs font-semibold">
          <span>{format(new Date(), 'H:mm')}</span>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-full">Synced</span>
          </div>
        </div>

        {/* Header */}
        <header className="bg-[var(--p)] text-white p-5 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-serif text-2xl font-light">SyncSpace</h1>
              <p className="text-white/60 text-xs mt-0.5">{format(selectedDate, 'EEEE, MMMM d')}</p>
            </div>
            <div 
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold overflow-hidden border-2 border-white/30"
              onClick={() => setActiveTab('settings')}
            >
              {profile?.photoURL ? <img src={profile.photoURL} alt="" /> : profile?.displayName?.[0]}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20">
          <AnimatePresence mode="wait">
            {activeTab === 'today' && (
              <motion.div
                key="today"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                {/* Week Strip */}
                <div className="bg-white border-b border-gray-100 p-2">
                  <div className="flex justify-between items-center px-4 py-1">
                    <span className="font-bold text-[var(--t1)] text-sm">{format(currentWeekDays[0], 'MMMM yyyy')}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setWeekOffset(v => v - 1)} className="p-1"><ChevronLeft size={18} /></button>
                      <button onClick={() => setWeekOffset(v => v + 1)} className="p-1"><ChevronRight size={18} /></button>
                    </div>
                  </div>
                  <div className="flex gap-1 p-2">
                    {currentWeekDays.map(d => (
                      <div 
                        key={d.toISOString()}
                        onClick={() => setSelectedDate(d)}
                        className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${isSameDay(d, selectedDate) ? 'bg-[var(--p)] text-white shadow-md scale-105' : 'text-gray-500'}`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider">{format(d, 'EEE')}</span>
                        <span className="text-lg font-medium">{format(d, 'd')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="p-4 space-y-3">
                  {allEvents.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-[var(--p)]/10 rounded-2xl flex items-center justify-center mx-auto text-[var(--p)]">
                        <CalendarIcon size={32} />
                      </div>
                      <p className="text-[var(--t1)] font-medium">Nothing scheduled for today</p>
                      <button onClick={() => setIsModalOpen(true)} className="text-[var(--acc)] font-semibold text-sm">+ Add shared event</button>
                    </div>
                  ) : (
                    allEvents.map((e: any) => (
                      <div 
                        key={e.id} 
                        className={`p-4 rounded-2xl border-l-[4px] border-l-[var(--p)] bg-white shadow-sm relative group`}
                        style={{ borderLeftColor: e.type === 'mine' ? 'var(--p)' : e.type === 'partner' ? 'var(--s)' : 'var(--acc)' }}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">
                          {e.type === 'mine' ? 'You' : e.type === 'partner' ? 'Partner' : 'Shared'} · {e.time}
                        </div>
                        <h3 className="font-semibold text-[var(--t1)]">{e.title}</h3>
                        {e.notes && <p className="text-xs text-[var(--t2)] mt-1 line-clamp-2">{e.notes}</p>}
                        
                        {e.type === 'shared' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingEvent(e); setIsModalOpen(true); }} className="p-2 bg-gray-50 rounded-lg text-gray-500 hover:text-[var(--p)]"><Edit2 size={14} /></button>
                            <button onClick={() => deleteSharedEvent(e.id)} className="p-2 bg-gray-50 rounded-lg text-gray-500 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'partner' && (
              <motion.div
                key="partner"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6"
              >
                {!profile?.partnerUid ? (
                  <div className="text-center space-y-6 pt-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto text-gray-400">
                      <Users size={40} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[var(--t1)]">Sync with your partner</h2>
                      <p className="text-sm text-[var(--t2)] mt-2">Connect your calendars to see each other's schedules and plan better together.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center">
                      <p className="text-xs font-bold text-[var(--t2)] uppercase tracking-widest mb-2">Your pairing code</p>
                      <div className="text-3xl font-mono font-bold tracking-[6px] text-[var(--p)]">{profile?.pairingCode}</div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-bold text-[var(--t2)] uppercase tracking-widest">Or enter their code</p>
                      <form onSubmit={(ev) => {
                        ev.preventDefault();
                        const code = new FormData(ev.currentTarget).get('code') as string;
                        linkPartner(code).catch(err => alert(err.message));
                      }} className="flex gap-2">
                        <input name="code" className="flex-1 p-3 border rounded-xl" placeholder="e.g. AB-1234" />
                        <button className="bg-[var(--p)] text-white px-6 py-3 rounded-xl font-bold">Link</button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-[var(--s)]/10 p-6 rounded-3xl flex items-center gap-4 border border-[var(--s)]/20">
                      <div className="w-16 h-16 rounded-full bg-[var(--s)] flex items-center justify-center text-white text-xl font-bold">
                        {partnerProfile?.displayName?.[0]}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-[var(--t1)]">{partnerProfile?.displayName}</h2>
                        <p className="text-sm text-[var(--t2)]">Linked · Currently Active</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-[var(--t1)] flex items-center gap-2 mb-4">
                        <CalendarIcon size={18} className="text-[var(--acc)]" />
                        Availability this week
                      </h3>
                      <div className="space-y-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                          <div key={day} className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-400 w-8">{day}</span>
                            <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden flex">
                              <div className="w-1/3 bg-[var(--acc)]/20 h-full"></div>
                              <div className="w-1/4 bg-[var(--p)]/20 h-full border-x border-white"></div>
                              <div className="flex-1 bg-gray-100 h-full"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--p)] text-white flex items-center justify-center text-2xl font-bold">
                    {profile?.displayName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--t1)]">{profile?.displayName}</h2>
                    <p className="text-sm text-[var(--t2)]">{profile?.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Theme</div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries({
                      A: { bg: '#0B3A5A', label: 'Classic' },
                      B: { bg: '#c45', label: 'Sunset' },
                      C: { bg: '#0052CC', label: 'Oasis' },
                      D: { bg: '#333', label: 'Midnight' }
                    }).map(([key, t]) => (
                      <button 
                        key={key}
                        onClick={() => updateDoc(doc(db, 'users', user.uid), { theme: key })}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${profile?.theme === key ? 'border-[var(--p)] bg-white shadow-sm' : 'border-transparent bg-gray-50'}`}
                      >
                        <div className="w-6 h-6 rounded-md" style={{ backgroundColor: t.bg }}></div>
                        <span className="font-medium text-gray-700">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => auth.signOut()}
                    className="w-full flex items-center gap-3 p-4 text-red-500 font-semibold bg-red-50 rounded-2xl hover:bg-red-100 transition-all"
                  >
                    <LogOut size={20} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* FAB */}
        <button 
          onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}
          className="absolute right-6 bottom-24 w-14 h-14 bg-[var(--p)] text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
        >
          <Plus size={30} />
        </button>

        {/* Tab Bar */}
        <nav className="bg-white border-t border-gray-100 px-4 py-3 pb-8 flex justify-between absolute bottom-0 w-full z-20">
          {[
            { id: 'today', icon: CalendarIcon, label: 'Today' },
            { id: 'partner', icon: Users, label: 'Together' },
            { id: 'events', icon: Link, label: 'Shared' },
            { id: 'settings', icon: SettingsIcon, label: 'Preferences' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all px-4 ${activeTab === tab.id ? 'text-[var(--p)] scale-110 font-bold' : 'text-gray-400'}`}
            >
              <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="absolute inset-0 z-50">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/40"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute bottom-0 w-full bg-[var(--bg)] rounded-t-[32px] p-8 shadow-2xl min-h-[60%]"
              >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
                <h2 className="text-2xl font-bold text-[var(--t1)] mb-6">{editingEvent ? 'Edit Shared Event' : 'New Shared Event'}</h2>
                <form onSubmit={handleCreateOrUpdate} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Title</label>
                    <input 
                      name="title" 
                      defaultValue={editingEvent?.title} 
                      required 
                      autoFocus
                      placeholder="e.g. Italian Date Night" 
                      className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-[var(--p)] outline-none" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</label>
                      <input 
                        name="date" 
                        type="date" 
                        defaultValue={editingEvent?.date || dateKey(selectedDate)} 
                        required 
                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-[var(--p)] outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Time</label>
                      <input 
                        name="time" 
                        type="time" 
                        defaultValue={editingEvent?.time || '19:00'} 
                        required 
                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-[var(--p)] outline-none" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      name="tag" 
                      defaultValue={editingEvent?.tag || 'date night'}
                      className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-[var(--p)] outline-none appearance-none"
                    >
                      <option value="date night">Date Night</option>
                      <option value="family">Family</option>
                      <option value="errand">Errand</option>
                      <option value="fitness">Fitness</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Notes</label>
                    <textarea 
                      name="notes" 
                      defaultValue={editingEvent?.notes} 
                      placeholder="Special plans or location..."
                      rows={3}
                      className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:border-[var(--p)] outline-none resize-none" 
                    />
                  </div>
                  <button className="w-full p-5 bg-[var(--p)] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all mt-4">
                    {editingEvent ? 'Save Changes' : 'Create Event'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ThemeWrapper>
  );
}
