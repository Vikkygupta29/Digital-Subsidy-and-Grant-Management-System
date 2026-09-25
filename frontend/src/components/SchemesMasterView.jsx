import React, { useState } from 'react';
import { 
  Layers, Plus, Edit3, Trash2, Search, Eye, 
  Building, MapPin, Users, Award, X, Sliders, CheckCircle2, ListFilter
} from 'lucide-react';
import { schemeAPI } from '../services/api';
import { toast } from '../context/ToastContext';

export default function SchemesMasterView({ schemes = [], beneficiaries = [], onRefresh, onCreateScheme, onUpdateScheme, onDeleteScheme }) {
  const [activeTab, setActiveTab] = useState('schemes'); // 'schemes' or 'beneficiary_registry'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal states
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeScheme, setActiveScheme] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Scheme Form State with all required fields + Dynamic Attributes
  const [schemeForm, setSchemeForm] = useState({
    schemeCode: '',
    name: '',
    description: '',
    category: 'Agriculture',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    maxGrantAmount: 60000,
    totalBudget: 50000000,
    minAge: 18,
    maxAge: 70,
    maxIncomeCriteria: 300000,
    targetRegion: 'ALL',
    targetCategories: 'Farmer,SC,ST,BPL',
    active: true,
    requiredDocuments: 'Aadhaar Card, Land Record / RoR, Bank Passbook',
    // Dynamic Custom Attributes
    dynamicFields: [
      { key: 'cropType', label: 'Primary Agricultural Crop', type: 'select', options: ['Paddy', 'Wheat', 'Cotton', 'Mustard'], required: true, placeholder: '' },
      { key: 'landKhasraNo', label: 'Land Survey / Khasra No', type: 'text', options: [], required: true, placeholder: 'e.g. Khasra 102/4' }
    ],
    // Slabs
    grantSlabs: [
      { slabName: 'Tier 1 - Marginal / Smallholder', amount: 30000, criteria: 'Land size up to 1.5 acres' },
      { slabName: 'Tier 2 - Standard Subsidy', amount: 60000, criteria: 'Land size > 1.5 acres' }
    ],
    // Regional Allocations
    regionalBudgets: {
      'North Region': 15000000,
      'West Region': 12000000,
      'South Region': 12000000,
      'East Region': 11000000,
    }
  });

  const getParsedDynamicFields = (scheme) => {
    if (scheme?.dynamicFields && Array.isArray(scheme.dynamicFields)) {
      return scheme.dynamicFields;
    }
    if (scheme?.dynamicFieldsJson) {
      try {
        const parsed = JSON.parse(scheme.dynamicFieldsJson);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Failed to parse dynamicFieldsJson:', e);
      }
    }
    return [];
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setActiveScheme(null);
    setSchemeForm({
      schemeCode: '',
      name: '',
      description: '',
      category: 'Agriculture',
      ministry: 'Ministry of Agriculture & Farmers Welfare',
      maxGrantAmount: 60000,
      totalBudget: 50000000,
      minAge: 18,
      maxAge: 70,
      maxIncomeCriteria: 300000,
      targetRegion: 'ALL',
      targetCategories: 'Farmer,SC,ST,BPL',
      active: true,
      requiredDocuments: 'Aadhaar Card, Land Record / RoR, Bank Passbook',
      dynamicFields: [
        { key: 'primaryAttribute', label: 'Scheme Specific Field', type: 'text', options: [], required: true, placeholder: 'Enter value' }
      ],
      grantSlabs: [
        { slabName: 'Tier 1 - Marginal', amount: 30000, criteria: 'Annual income < 1.5 Lakhs' },
        { slabName: 'Tier 2 - Smallholder', amount: 60000, criteria: 'Annual income 1.5L - 3.0L' }
      ],
      regionalBudgets: {
        'North Region': 15000000,
        'West Region': 12000000,
        'South Region': 12000000,
        'East Region': 11000000,
      }
    });
    setShowSchemeModal(true);
  };

  const openEditModal = (scheme) => {
    setIsEditing(true);
    setActiveScheme(scheme);
    const dynFields = getParsedDynamicFields(scheme);

    setSchemeForm({
      id: scheme.id,
      schemeCode: scheme.schemeCode || '',
      name: scheme.name || '',
      description: scheme.description || '',
      category: scheme.category || 'Agriculture',
      ministry: scheme.ministry || 'Ministry of Agriculture & Farmers Welfare',
      maxGrantAmount: scheme.maxGrantAmount || 50000,
      totalBudget: scheme.totalBudget || 40000000,
      minAge: scheme.minAge || 18,
      maxAge: scheme.maxAge || 70,
      maxIncomeCriteria: scheme.maxIncomeCriteria || 300000,
      targetRegion: scheme.targetRegion || 'ALL',
      targetCategories: scheme.targetCategories || 'Farmer,SC,ST,BPL',
      active: scheme.active !== undefined ? scheme.active : true,
      requiredDocuments: scheme.requiredDocuments || 'Aadhaar Card, Land Record Certificate',
      dynamicFields: dynFields.length > 0 ? dynFields : [
        { key: 'primaryAttribute', label: 'Scheme Specific Field', type: 'text', options: [], required: true, placeholder: 'Enter value' }
      ],
      grantSlabs: scheme.grantSlabs || [
        { slabName: 'Standard Grant Slab', amount: scheme.maxGrantAmount || 50000, criteria: 'Standard eligible beneficiary' }
      ],
      regionalBudgets: scheme.regionalBudgets || {
        'North Region': 12000000,
        'West Region': 10000000,
        'South Region': 10000000,
        'East Region': 8000000,
      }
    });
    setShowSchemeModal(true);
  };

  const openDetailsModal = (scheme) => {
    setActiveScheme(scheme);
    setShowDetailsModal(true);
  };

  // Dynamic Attribute Handlers
  const handleAddDynamicField = () => {
    setSchemeForm(prev => ({
      ...prev,
      dynamicFields: [
        ...prev.dynamicFields,
        {
          key: `attribute_${Date.now().toString().slice(-4)}`,
          label: 'New Dynamic Field',
          type: 'text',
          options: [],
          required: false,
          placeholder: ''
        }
      ]
    }));
  };

  const handleUpdateDynamicField = (index, fieldKey, val) => {
    setSchemeForm(prev => {
      const updated = [...prev.dynamicFields];
      if (fieldKey === 'label') {
        // Auto-suggest key if user edits label
        const generatedKey = val.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24);
        updated[index] = {
          ...updated[index],
          label: val,
          key: updated[index].key.startsWith('attribute_') ? generatedKey : updated[index].key
        };
      } else if (fieldKey === 'optionsRaw') {
        const opts = val.split(',').map(s => s.trim()).filter(Boolean);
        updated[index] = {
          ...updated[index],
          options: opts
        };
      } else {
        updated[index] = {
          ...updated[index],
          [fieldKey]: val
        };
      }
      return { ...prev, dynamicFields: updated };
    });
  };

  const handleRemoveDynamicField = (index) => {
    setSchemeForm(prev => ({
      ...prev,
      dynamicFields: prev.dynamicFields.filter((_, i) => i !== index)
    }));
  };

  const handleSaveScheme = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...schemeForm,
        dynamicFieldsJson: JSON.stringify(schemeForm.dynamicFields || [])
      };

      if (isEditing && activeScheme) {
        const updated = { ...activeScheme, ...payload };
        try {
          await schemeAPI.update(activeScheme.id, updated);
        } catch (apiErr) {
          console.warn('Backend API update failed, updating local state:', apiErr.message);
        }
        if (onUpdateScheme) onUpdateScheme(updated);
        toast.success(`Scheme "${schemeForm.name}" updated successfully with ${schemeForm.dynamicFields.length} dynamic attributes!`);
      } else {
        const created = {
          ...payload,
          id: Date.now(),
          allocatedBudget: 0,
          disbursedBudget: 0,
        };
        try {
          await schemeAPI.createOrUpdate(created);
        } catch (apiErr) {
          console.warn('Backend API create failed, updating local state:', apiErr.message);
        }
        if (onCreateScheme) onCreateScheme(created);
        toast.success(`New Scheme "${schemeForm.name}" created with ${schemeForm.dynamicFields.length} dynamic attributes!`);
      }
      setShowSchemeModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Error saving scheme: ' + err.message);
    }
  };

  const handleDeleteScheme = async (scheme) => {
    if (!window.confirm(`Are you sure you want to deactivate scheme "${scheme.name}" (${scheme.schemeCode})?`)) return;
    try {
      try {
        await schemeAPI.delete(scheme.id);
      } catch (e) {
        console.warn('Backend API delete, updating local state:', e.message);
      }
      if (onDeleteScheme) onDeleteScheme(scheme.id);
      if (onRefresh) onRefresh();
      toast.info(`Scheme "${scheme.name}" deactivated.`);
    } catch (err) {
      toast.error('Failed to delete scheme: ' + err.message);
    }
  };

  // Filter schemes
  const filteredSchemes = schemes.filter(s => {
    const matchesSearch = 
      (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.schemeCode && s.schemeCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.ministry && s.ministry.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || 
      (selectedStatus === 'ACTIVE' ? s.active !== false : s.active === false);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Module Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#00142f] rounded-2xl text-white shadow-md">
              <Layers className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-[#00142f] tracking-tight">
                  Schemes Master & Beneficiary Registry
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                  Dynamic Attributes & Policy Master
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage subsidy schemes, define dynamic scheme-specific form attributes, configure grant slabs & monitor budgets
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-[#00142f] hover:bg-[#0f294a] text-white text-xs font-bold rounded-xl shadow transition flex items-center whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2 text-emerald-400" /> Create New Scheme
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('schemes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center ${
                activeTab === 'schemes'
                  ? 'bg-[#0f294a] text-white shadow-sm'
                  : 'bg-[#eff4ff] text-[#46617c] hover:text-[#00142f]'
              }`}
            >
              <Layers className="w-4 h-4 mr-2" />
              Scheme Master Records ({schemes.length})
            </button>
            <button
              onClick={() => setActiveTab('beneficiary_registry')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center ${
                activeTab === 'beneficiary_registry'
                  ? 'bg-[#0f294a] text-white shadow-sm'
                  : 'bg-[#eff4ff] text-[#46617c] hover:text-[#00142f]'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Beneficiary Registry Linkage ({beneficiaries.length})
            </button>
          </div>

          {activeTab === 'schemes' && (
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Dynamic Form Attributes Enabled</span>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'schemes' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search Scheme Code, Name, Ministry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-[#00142f] focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#00142f] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Renewable Energy">Renewable Energy</option>
                  <option value="Women Empowerment">Women Empowerment</option>
                  <option value="Micro Enterprise">Micro Enterprise</option>
                  <option value="Education">Education</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#00142f] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Schemes</option>
                  <option value="INACTIVE">Inactive / Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scheme Master Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.length === 0 ? (
              <div className="col-span-3 bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
                No schemes match the search filter. Click <strong>Create New Scheme</strong> to configure a new grant.
              </div>
            ) : (
              filteredSchemes.map((scheme) => {
                const dynFields = getParsedDynamicFields(scheme);

                return (
                  <div
                    key={scheme.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#1aa54c]/50 transition space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 bg-[#eff4ff] text-[#00142f] text-xs font-mono font-bold rounded-lg border border-[#c4e0ff]">
                          {scheme.schemeCode}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {scheme.targetRegion || 'ALL'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            scheme.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {scheme.active !== false ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-[#00142f] mb-1 line-clamp-1">{scheme.name}</h3>
                      <div className="text-[11px] text-slate-500 mb-2 flex items-center">
                        <Building className="w-3 h-3 mr-1 text-slate-400" />
                        {scheme.ministry || 'Govt of India Department'}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">{scheme.description}</p>

                      {/* Dynamic Attributes Tag Bar */}
                      <div className="mb-3 p-2 bg-emerald-50/70 rounded-xl border border-emerald-200/60 flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-[11px] text-emerald-900 font-bold">
                          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dynamic Attributes:</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold">
                          {dynFields.length} Form Fields
                        </span>
                      </div>

                      {/* Eligibility & Grant Criteria Chips */}
                      <div className="bg-[#f8f9ff] p-3 rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600 mb-3">
                        <div className="flex justify-between">
                          <span>Max Grant Amount:</span>
                          <strong className="font-mono text-[#1aa54c]">₹{(scheme.maxGrantAmount || 50000).toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Income Ceiling:</span>
                          <strong className="font-mono text-[#00142f]">&le; ₹{(scheme.maxIncomeCriteria || 300000).toLocaleString()} / yr</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Eligible Age:</span>
                          <strong className="text-[#00142f]">{scheme.minAge || 18} - {scheme.maxAge || 70} Years</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Social:</span>
                          <strong className="text-slate-700">{scheme.targetCategories || 'Farmer, SC, ST'}</strong>
                        </div>
                      </div>

                      {/* Budget Utilization Mini Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Total Scheme Budget:</span>
                          <strong className="font-mono text-[#00142f]">₹{((scheme.totalBudget || 50000000)/10000000).toFixed(2)} Cr</strong>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#1aa54c] h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, ((scheme.disbursedBudget || 0) / (scheme.totalBudget || 1)) * 100)}%`
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Disbursed: ₹{((scheme.disbursedBudget || 0)/100000).toFixed(1)}L</span>
                          <span>{Math.round(((scheme.disbursedBudget || 0) / (scheme.totalBudget || 1)) * 100)}% utilized</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openDetailsModal(scheme)}
                        className="flex-1 py-1.5 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00142f] font-bold text-xs rounded-xl border border-[#c4e0ff] transition flex items-center justify-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" /> Slabs & Attributes
                      </button>
                      <button
                        onClick={() => openEditModal(scheme)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                        title="Edit Scheme Configuration"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteScheme(scheme)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                        title="Deactivate Scheme"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Beneficiary Registry Access Tab */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#00142f]">Beneficiary Registry Cross-Reference</h3>
              <p className="text-xs text-slate-500">Live linkage to verified citizen profiles eligible for master schemes</p>
            </div>
            <span className="text-xs font-bold text-[#1aa54c] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              {beneficiaries.length} Total Citizens in Registry
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs text-[#00142f]">
              <thead className="bg-[#eff4ff] text-[#46617c] font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Beneficiary Name</th>
                  <th className="p-3">Aadhaar Reference</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Bank A/C & IFSC</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beneficiaries.map((b) => (
                  <tr key={b.id} className="hover:bg-[#f8f9ff]">
                    <td className="p-3 font-bold text-[#00142f]">{b.fullName}</td>
                    <td className="p-3 font-mono text-slate-600">{b.aadhaarNumber}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#0f294a] border border-[#c4e0ff]">
                        {b.category}
                      </span>
                    </td>
                    <td className="p-3">{b.district || 'Varanasi'}, {b.state || 'UP'}</td>
                    <td className="p-3 font-mono text-[11px]">
                      <div>{b.bankAccountNumber || '••••4820'}</div>
                      <div className="text-slate-400">{b.ifscCode || 'SBIN0001234'}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {b.verificationStatus || 'VERIFIED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Scheme */}
      {showSchemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#00142f] text-white rounded-xl">
                  <Layers className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00142f]">
                    {isEditing ? 'Edit Scheme Master & Dynamic Attributes' : 'Create New Scheme Master'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure core policy parameters & define custom citizen dynamic form fields</p>
                </div>
              </div>
              <button onClick={() => setShowSchemeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScheme} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Scheme Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PM-KISAN-2026"
                    value={schemeForm.schemeCode}
                    onChange={(e) => setSchemeForm({ ...schemeForm, schemeCode: e.target.value.toUpperCase() })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Category *</label>
                  <select
                    value={schemeForm.category}
                    onChange={(e) => setSchemeForm({ ...schemeForm, category: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  >
                    <option value="Agriculture">Agriculture</option>
                    <option value="Renewable Energy">Renewable Energy</option>
                    <option value="Women Empowerment">Women Empowerment</option>
                    <option value="Micro Enterprise">Micro Enterprise</option>
                    <option value="Education">Education</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Scheme Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PM Kisan Samman Nidhi - Direct Income Support"
                    value={schemeForm.name}
                    onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Ministry / Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ministry of Agriculture & Farmers Welfare"
                    value={schemeForm.ministry}
                    onChange={(e) => setSchemeForm({ ...schemeForm, ministry: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Description *</label>
                  <textarea
                    rows="2"
                    required
                    value={schemeForm.description}
                    onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Total Scheme Budget (INR) *</label>
                  <input
                    type="number"
                    required
                    value={schemeForm.totalBudget}
                    onChange={(e) => setSchemeForm({ ...schemeForm, totalBudget: Number(e.target.value) })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Maximum Grant Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={schemeForm.maxGrantAmount}
                    onChange={(e) => setSchemeForm({ ...schemeForm, maxGrantAmount: Number(e.target.value) })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Min Age Limit</label>
                  <input
                    type="number"
                    value={schemeForm.minAge}
                    onChange={(e) => setSchemeForm({ ...schemeForm, minAge: Number(e.target.value) })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Max Age Limit</label>
                  <input
                    type="number"
                    value={schemeForm.maxAge}
                    onChange={(e) => setSchemeForm({ ...schemeForm, maxAge: Number(e.target.value) })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Max Income Ceiling (INR)</label>
                  <input
                    type="number"
                    value={schemeForm.maxIncomeCriteria}
                    onChange={(e) => setSchemeForm({ ...schemeForm, maxIncomeCriteria: Number(e.target.value) })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Region Eligibility</label>
                  <input
                    type="text"
                    value={schemeForm.targetRegion}
                    onChange={(e) => setSchemeForm({ ...schemeForm, targetRegion: e.target.value })}
                    placeholder="ALL or specific regions"
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Target Social Categories</label>
                  <input
                    type="text"
                    value={schemeForm.targetCategories}
                    onChange={(e) => setSchemeForm({ ...schemeForm, targetCategories: e.target.value })}
                    placeholder="e.g. Farmer, SC, ST, BPL, Women"
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Required Verification Documents</label>
                  <input
                    type="text"
                    value={schemeForm.requiredDocuments}
                    onChange={(e) => setSchemeForm({ ...schemeForm, requiredDocuments: e.target.value })}
                    placeholder="e.g. Aadhaar Card, Land Record / RoR, Income Proof"
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              {/* DYNAMIC SCHEME ATTRIBUTES BUILDER */}
              <div className="bg-[#f8f9ff] p-4 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-[#00142f] text-xs">
                        Dynamic Scheme Attributes (Citizen Application Form Fields)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Define scheme-specific custom input fields rendered dynamically on citizen apply modal
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDynamicField}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] flex items-center shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Dynamic Attribute
                  </button>
                </div>

                {schemeForm.dynamicFields.length === 0 ? (
                  <div className="p-4 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
                    No custom dynamic fields defined. Click <strong>Add Dynamic Attribute</strong> above to add custom form fields.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schemeForm.dynamicFields.map((field, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 relative shadow-xs">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className="font-mono text-[10px] font-bold text-slate-500">Field #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDynamicField(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Remove this field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-5">
                            <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Field Label *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Primary Agricultural Crop"
                              value={field.label}
                              onChange={(e) => handleUpdateDynamicField(idx, 'label', e.target.value)}
                              className="w-full bg-[#f8f9ff] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Attribute Key *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. cropType"
                              value={field.key}
                              onChange={(e) => handleUpdateDynamicField(idx, 'key', e.target.value)}
                              className="w-full bg-[#f8f9ff] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">Field Type *</label>
                            <select
                              value={field.type}
                              onChange={(e) => handleUpdateDynamicField(idx, 'type', e.target.value)}
                              className="w-full bg-[#f8f9ff] border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-semibold"
                            >
                              <option value="text">Text Input</option>
                              <option value="number">Number</option>
                              <option value="select">Dropdown Select</option>
                              <option value="date">Date Picker</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2 flex items-center pt-4">
                            <label className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => handleUpdateDynamicField(idx, 'required', e.target.checked)}
                                className="w-3.5 h-3.5 text-[#0f294a] rounded border-slate-300"
                              />
                              <span>Required</span>
                            </label>
                          </div>

                          {field.type === 'select' && (
                            <div className="sm:col-span-12 pt-1">
                              <label className="block text-[10px] text-slate-600 font-semibold mb-0.5">
                                Dropdown Options (Comma-separated) *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Paddy, Wheat, Cotton, Mustard"
                                value={(field.options || []).join(', ')}
                                onChange={(e) => handleUpdateDynamicField(idx, 'optionsRaw', e.target.value)}
                                className="w-full bg-[#f8f9ff] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="schemeActive"
                  checked={schemeForm.active}
                  onChange={(e) => setSchemeForm({ ...schemeForm, active: e.target.checked })}
                  className="w-4 h-4 text-[#0f294a] rounded border-slate-300"
                />
                <label htmlFor="schemeActive" className="text-slate-700 font-bold">
                  Scheme is Active & Accepting Direct Applications
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSchemeModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow hover:bg-[#0f294a]"
                >
                  {isEditing ? 'Update Scheme Master' : 'Create Scheme Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Scheme Details, Dynamic Attributes, Slabs & Regional Allocations */}
      {showDetailsModal && activeScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-[#eff4ff] text-[#00142f] text-xs font-mono font-bold rounded-lg border border-[#c4e0ff]">
                    {activeScheme.schemeCode}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {activeScheme.category}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-[#00142f] mt-1">{activeScheme.name}</h3>
                <p className="text-xs text-slate-500">{activeScheme.ministry}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-[#f8f9ff] p-4 rounded-2xl border border-slate-200">
              <span className="font-bold text-[#00142f] block mb-1">Policy Description:</span>
              {activeScheme.description}
            </div>

            {/* Configured Dynamic Form Attributes */}
            <div className="space-y-2">
              <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                <Sliders className="w-4 h-4 text-emerald-600 mr-1.5" />
                Configured Dynamic Scheme Attributes ({getParsedDynamicFields(activeScheme).length})
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-[#00142f]">
                  <thead className="bg-[#eff4ff] text-[#46617c] font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Attribute Label & Key</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Required</th>
                      <th className="p-3">Options / Constraints</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getParsedDynamicFields(activeScheme).length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-slate-400">No dynamic attributes configured</td>
                      </tr>
                    ) : (
                      getParsedDynamicFields(activeScheme).map((attr, i) => (
                        <tr key={i} className="hover:bg-[#f8f9ff]">
                          <td className="p-3">
                            <div className="font-bold text-[#00142f]">{attr.label}</div>
                            <div className="font-mono text-[10px] text-slate-500">{attr.key}</div>
                          </td>
                          <td className="p-3 font-semibold uppercase text-[10px] text-blue-700">
                            <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                              {attr.type}
                            </span>
                          </td>
                          <td className="p-3">
                            {attr.required ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                Mandatory
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Optional</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 text-[11px]">
                            {attr.options && attr.options.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {attr.options.map((opt, oIdx) => (
                                  <span key={oIdx} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">{attr.placeholder || 'Free input'}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grant Slabs */}
            <div className="space-y-2">
              <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                <Award className="w-4 h-4 text-emerald-600 mr-1.5" />
                Configured Grant Amount Slabs
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-[#00142f]">
                  <thead className="bg-[#eff4ff] text-[#46617c] font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Slab Tier</th>
                      <th className="p-3">Grant Amount</th>
                      <th className="p-3">Eligibility Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeScheme.grantSlabs || [
                      { slabName: 'Marginal Tier', amount: Math.round(activeScheme.maxGrantAmount * 0.5), criteria: 'Small scale' },
                      { slabName: 'Maximum Grant Tier', amount: activeScheme.maxGrantAmount, criteria: 'Standard eligible beneficiary' }
                    ]).map((slab, i) => (
                      <tr key={i}>
                        <td className="p-3 font-semibold">{slab.slabName}</td>
                        <td className="p-3 font-mono font-bold text-[#1aa54c]">₹{(slab.amount || 0).toLocaleString()}</td>
                        <td className="p-3 text-slate-600">{slab.criteria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Regional Budget Allocation */}
            <div className="space-y-2">
              <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                <MapPin className="w-4 h-4 text-blue-600 mr-1.5" />
                Regional Allocation Budget Ceilings
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {Object.entries(activeScheme.regionalBudgets || {
                  'North Region': 15000000,
                  'West Region': 12000000,
                  'South Region': 12000000,
                  'East Region': 11000000,
                }).map(([region, amount]) => (
                  <div key={region} className="p-3 bg-[#eff4ff] rounded-xl border border-[#c4e0ff]">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">{region}</span>
                    <strong className="text-[#00142f] font-mono text-xs">₹{(amount / 100000).toFixed(1)} Lakhs</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory Criteria */}
            <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Age Criteria:</span>
                <strong className="text-[#00142f]">{activeScheme.minAge || 18} to {activeScheme.maxAge || 70} Years</strong>
              </div>
              <div className="flex justify-between">
                <span>Income Ceiling:</span>
                <strong className="text-[#00142f]">&le; ₹{(activeScheme.maxIncomeCriteria || 300000).toLocaleString()} / year</strong>
              </div>
              <div className="flex justify-between">
                <span>Required Documentation:</span>
                <strong className="text-slate-700">{activeScheme.requiredDocuments}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-[#00142f] text-white text-xs font-bold rounded-xl shadow hover:bg-[#0f294a]"
              >
                Close Scheme Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
