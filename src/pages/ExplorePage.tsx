import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api.ts';
import { 
  Search, 
  Filter, 
  Star, 
  ArrowRight, 
  Repeat, 
  SlidersHorizontal, 
  Clock, 
  BookOpen, 
  Loader2,
  X
} from 'lucide-react';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters state
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const proficiency = searchParams.get('proficiency') || 'all';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadListings();
  }, [searchParams]);

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

  const loadListings = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(searchParams);
      const res = await api.get(`/listings?${query.toString()}`);
      if (res.data.success) {
        setListings(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Explore Student Skills
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse skills offered by student mentors for peer exchange or paid tutoring
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search by skill name, topic, or instructor..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
          {search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        {/* Category Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Category:</span>
          <select
            value={category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Proficiency Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Proficiency:</span>
          <select
            value={proficiency}
            onChange={(e) => updateFilter('proficiency', e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {/* Price Sorting */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Sort By:</span>
          <select
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Newest First</option>
            <option value="rating_desc">Highest Rated</option>
            <option value="price_asc">Price: Low to High (INR)</option>
            <option value="price_desc">Price: High to Low (INR)</option>
          </select>
        </div>

        {/* Max Price Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Max ₹:</span>
          <select
            value={maxPrice}
            onChange={(e) => updateFilter('max_price', e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Any Price</option>
            <option value="300">Up to ₹300</option>
            <option value="450">Up to ₹450</option>
            <option value="600">Up to ₹600</option>
          </select>
        </div>

        {(category || proficiency !== 'all' || maxPrice || search) && (
          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid of Listings */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-sm">Fetching skill listings from database...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No skill listings found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or resetting filters to see more skills.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {item.category_name}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{item.rating_avg}</span>
                    <span className="text-slate-400 font-normal text-[11px]">({item.total_reviews})</span>
                  </div>
                </div>

                <Link to={`/skill/${item.id}`} className="block">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-slate-700">{item.skill_name}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      item.proficiency_level === 'Beginner'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.proficiency_level === 'Intermediate'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {item.proficiency_level}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </Link>

                <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                  <img
                    src={item.user_avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.user_name}`}
                    alt={item.user_name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.user_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.user_location}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{Number(item.price_inr).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">/ {item.session_duration_minutes || 60} mins</span>
                </div>
                <Link
                  to={`/skill/${item.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateFilter('page', String(p))}
              className={`w-8 h-8 rounded-lg text-xs font-semibold ${
                pagination.page === p
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
