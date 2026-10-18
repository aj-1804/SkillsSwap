import React, { useState, useEffect } from 'react';
import api from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Clock, 
  Star, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyListingsPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [skillName, setSkillName] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [proficiencyLevel, setProficiencyLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [priceInr, setPriceInr] = useState(300);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [teachingAvailability, setTeachingAvailability] = useState('Mon-Fri 6:00 PM - 9:00 PM');
  const [description, setDescription] = useState('');
  const [supportingLink, setSupportingLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMyListings();
    loadCategories();
  }, []);

  const loadMyListings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/listings/my');
      if (res.data.success) {
        setListings(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    setEditingListing(null);
    setTitle('');
    setSkillName('');
    setCategoryId(categories[0]?.id || 1);
    setProficiencyLevel('Intermediate');
    setPriceInr(400);
    setDurationMinutes(60);
    setTeachingAvailability('Flexible Evenings & Weekends');
    setDescription('');
    setSupportingLink('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingListing(item);
    setTitle(item.title);
    setSkillName(item.skill_name);
    setCategoryId(item.category_id);
    setProficiencyLevel(item.proficiency_level);
    setPriceInr(Number(item.price_inr));
    setDurationMinutes(item.session_duration_minutes || 60);
    setTeachingAvailability(item.teaching_availability);
    setDescription(item.description);
    setSupportingLink(item.supporting_link || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      title,
      skill_name: skillName,
      category_id: categoryId,
      proficiency_level: proficiencyLevel,
      price_inr: priceInr,
      session_duration_minutes: durationMinutes,
      teaching_availability: teachingAvailability,
      description,
      supporting_link: supportingLink || null,
    };

    try {
      if (editingListing) {
        await api.put(`/listings/${editingListing.id}`, payload);
      } else {
        await api.post('/listings', payload);
      }
      setIsModalOpen(false);
      loadMyListings();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save skill listing.');
    } finally {
      setSaving(false);
    }
  };

  const toggleListingActive = async (item: any) => {
    try {
      await api.put(`/listings/${item.id}`, { is_active: item.is_active ? 0 : 1 });
      loadMyListings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this skill listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      loadMyListings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            My Skill Listings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish what you can teach to unlock free equal swaps or earn in Indian Rupees (₹)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Skill</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs">Loading your listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No skills listed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Share what you know with other college students. Listing a skill enables you to propose 100% free peer exchanges!
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                item.is_active ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50 opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {item.category_name}
                  </span>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => toggleListingActive(item)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md cursor-pointer ${
                        item.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                      title="Toggle active status"
                    >
                      {item.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{item.is_active ? 'Active' : 'Hidden'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-slate-700">{item.skill_name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.proficiency_level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {item.session_duration_minutes || 60} mins
                  </span>
                  <span className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {item.rating_avg} ({item.total_reviews})
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{Number(item.price_inr).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Session Value</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit listing"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingListing ? 'Edit Skill Listing' : 'Publish Skill Listing'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveListing} className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Listing Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master React Hooks and Component State"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="e.g. React.js"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Proficiency *
                  </label>
                  <select
                    value={proficiencyLevel}
                    onChange={(e) => setProficiencyLevel(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Session Price (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={priceInr}
                    onChange={(e) => setPriceInr(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teaching Availability & Preferred Hours *
                </label>
                <input
                  type="text"
                  value={teachingAvailability}
                  onChange={(e) => setTeachingAvailability(e.target.value)}
                  placeholder="e.g. Sat-Sun 10:00 AM - 2:00 PM or Mon-Fri Evenings"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Learning Objectives *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will you teach? What projects or topics will be covered during the exchange?"
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supporting Link / GitHub / Portfolio (Optional)
                </label>
                <input
                  type="url"
                  value={supportingLink}
                  onChange={(e) => setSupportingLink(e.target.value)}
                  placeholder="https://github.com/your-username or portfolio URL"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {saving ? 'Saving...' : editingListing ? 'Update Listing' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
