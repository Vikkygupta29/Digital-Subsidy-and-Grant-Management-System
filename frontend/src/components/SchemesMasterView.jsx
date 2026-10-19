import React, { useState } from 'react';
import { 
  Layers, Plus, Edit3, Trash2, Search, Eye, RefreshCw,
  Building, MapPin, Users, Award, X, Sliders, CheckCircle2, ListFilter,
  Sparkles, Info, FileText, FileCheck
} from 'lucide-react';
import { schemeAPI } from '../services/api';
import { getSchemePreset, DEFAULT_SCHEME_DOCUMENTS_BY_CATEGORY } from '../services/dynamicFields';
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

  const emptySchemeForm = {
    schemeCode: '',
    name: '',
    description: '',
    category: '',
    ministry: '',
    maxGrantAmount: '',
    totalBudget: '',
    minAge: '',
    maxAge: '',
    maxIncomeCriteria: '',
    targetRegion: 'ALL',
    targetCategories: '',
    active: true,
    requiredDocuments: '',
    dynamicFields: [],
    grantSlabs: [],
    regionalBudgets: {}
  };

  // Scheme Form State initialized to empty
  const [schemeForm, setSchemeForm] = useState(emptySchemeForm);
  const [customDocInput, setCustomDocInput] = useState('');

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
    setSchemeForm(emptySchemeForm);
    setCustomDocInput('');
    setShowSchemeModal(true);
  };

  const openEditModal = (scheme) => {
    setIsEditing(true);
    setActiveScheme(scheme);
    setCustomDocInput('');
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
      requiredDocuments: scheme.requiredDocuments || DEFAULT_SCHEME_DOCUMENTS_BY_CATEGORY[scheme.category]?.join(', ') || 'Aadhaar Card, Bank Passbook',
      dynamicFields: dynFields.length > 0 ? dynFields : (
        DEFAULT_SCHEME_DOCUMENTS_BY_CATEGORY[scheme.category] ? getSchemePreset(scheme.category, scheme.schemeCode).dynamicFields : [
          { key: 'primaryAttribute', label: 'Scheme Specific Field', type: 'text', options: [], required: true, placeholder: 'Enter value' }
        ]
      ),
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

  // Preset Handlers for Category-based Auto-population
  const handleApplyCategoryPreset = (category, force = true) => {
    if (!category) return;
    const preset = getSchemePreset(category, schemeForm.schemeCode);
    setSchemeForm(prev => ({
      ...prev,
      category,
      requiredDocuments: force || !prev.requiredDocuments ? preset.requiredDocuments : prev.requiredDocuments,
      dynamicFields: force || prev.dynamicFields.length === 0 ? preset.dynamicFields : prev.dynamicFields
    }));
    toast.info(`Applied standard verification documents & attribute presets for ${category}.`);
  };

  const handleToggleDocChip = (docName) => {
    setSchemeForm(prev => {
      const currentList = (prev.requiredDocuments || '')
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);
      let updated;
      if (currentList.some(d => d.toLowerCase() === docName.toLowerCase())) {
        updated = currentList.filter(d => d.toLowerCase() !== docName.toLowerCase());
      } else {
        updated = [...currentList, docName];
      }
      return {
        ...prev,
        requiredDocuments: updated.join(', ')
      };
    });
  };

  const handleAddCustomDoc = (docToAdd) => {
    const raw = typeof docToAdd === 'string' ? docToAdd : customDocInput;
    const trimmed = (raw || '').trim();
    if (!trimmed) return;

    setSchemeForm(prev => {
      const currentList = (prev.requiredDocuments || '')
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);

      if (currentList.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
        toast.info(`"${trimmed}" is already included in required documents.`);
        return prev;
      }

      const updated = [...currentList, trimmed];
      toast.success(`Added "${trimmed}" to required documents.`);
      return {
        ...prev,
        requiredDocuments: updated.join(', ')
      };
    });
    setCustomDocInput('');
  };

  const handleRemoveDocChip = (docToRemove) => {
    setSchemeForm(prev => {
      const currentList = (prev.requiredDocuments || '')
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);
      const updated = currentList.filter(d => d.toLowerCase() !== docToRemove.toLowerCase());
      return {
        ...prev,
        requiredDocuments: updated.join(', ')
      };
    });
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
        category: schemeForm.category || 'General',
        totalBudget: schemeForm.totalBudget ? Number(schemeForm.totalBudget) : 0,
        maxGrantAmount: schemeForm.maxGrantAmount ? Number(schemeForm.maxGrantAmount) : 0,
        minAge: schemeForm.minAge !== '' && schemeForm.minAge != null ? Number(schemeForm.minAge) : 18,
        maxAge: schemeForm.maxAge !== '' && schemeForm.maxAge != null ? Number(schemeForm.maxAge) : 70,
        maxIncomeCriteria: schemeForm.maxIncomeCriteria !== '' && schemeForm.maxIncomeCriteria != null ? Number(schemeForm.maxIncomeCriteria) : null,
        targetRegion: schemeForm.targetRegion || 'ALL',
        dynamicFieldsJson: JSON.stringify(schemeForm.dynamicFields || [])
      };

      if (isEditing && activeScheme) {
        const updated = { ...activeScheme, ...payload };
        await schemeAPI.update(activeScheme.id, updated);
        if (onUpdateScheme) await onUpdateScheme(updated);
        toast.success(`Scheme "${schemeForm.name}" updated successfully with ${schemeForm.dynamicFields.length} dynamic attributes!`);
      } else {
        const created = await schemeAPI.createOrUpdate({
          ...payload,
          allocatedBudget: 0,
          disbursedBudget: 0,
        });
        if (onCreateScheme) await onCreateScheme(created.data);
        toast.success(`New Scheme "${schemeForm.name}" created with ${schemeForm.dynamicFields.length} dynamic attributes!`);
      }
      setShowSchemeModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Error saving scheme: ' + err.message);
    }
  };

  const handleDeleteScheme = async (scheme) => {
    const isInactive = scheme.active === false;
    const action = isInactive ? 'reactivate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} scheme "${scheme.name}" (${scheme.schemeCode})?`)) return;
    try {
      if (isInactive) {
        await schemeAPI.reactivate(scheme.id);
      } else {
        await schemeAPI.delete(scheme.id);
      }
      if (onDeleteScheme) await onDeleteScheme(scheme.id);
      if (onRefresh) await onRefresh();
      toast.info(`Scheme "${scheme.name}" ${isInactive ? 'reactivated' : 'deactivated'}.`);
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
                          <strong className="font-mono text-[#1aa54c]">₹{(scheme.maxGrantAmount || 0).toLocaleString()}</strong>
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
                          <strong className="font-mono text-[#00142f]">₹{((scheme.totalBudget || 0)/10000000).toFixed(2)} Cr</strong>
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
                          <span>Allocated: ₹{(scheme.allocatedBudget || 0).toLocaleString()}</span>
                          <span>Paid: ₹{(scheme.disbursedBudget || 0).toLocaleString()}</span>
                          <span>{Math.round(((scheme.disbursedBudget || 0) / (scheme.totalBudget || 1)) * 100)}% used</span>
                        </div>
                        <div className="text-[10px] text-slate-500 text-right">
                          Remaining: ₹{Math.max(0, (scheme.totalBudget || 0) - (scheme.allocatedBudget || 0)).toLocaleString()}
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
                        className={`p-1.5 rounded-xl transition ${
                          scheme.active === false
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            : 'bg-red-50 hover:bg-red-100 text-red-600'
                        }`}
                        title={scheme.active === false ? 'Reactivate Scheme' : 'Deactivate Scheme'}
                      >
                        {scheme.active === false ? <RefreshCw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
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
                    <td className="p-3">{b.district ? `${b.district}, ${b.state || ''}` : <span className="text-slate-400 italic">Not Provided</span>}</td>
                    <td className="p-3 font-mono text-[11px]">
                      <div>{b.bankAccountNumber ? `••••${b.bankAccountNumber.slice(-4)}` : <span className="text-slate-400 font-sans italic">Not Linked</span>}</div>
                      <div className="text-slate-400">{b.ifscCode || '—'}</div>
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
                    placeholder="Enter scheme code"
                    value={schemeForm.schemeCode}
                    onChange={(e) => setSchemeForm({ ...schemeForm, schemeCode: e.target.value.toUpperCase() })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Category *</label>
                  <select
                    value={schemeForm.category || ''}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      if (!isEditing && newCat) {
                        const preset = getSchemePreset(newCat, schemeForm.schemeCode);
                        setSchemeForm(prev => ({
                          ...prev,
                          category: newCat,
                          requiredDocuments: preset.requiredDocuments,
                          dynamicFields: preset.dynamicFields
                        }));
                      } else {
                        setSchemeForm(prev => ({ ...prev, category: newCat }));
                      }
                    }}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    required
                  >
                    <option value="">-- Select Category --</option>
                    <option value="Education">Education</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Renewable Energy">Renewable Energy</option>
                    <option value="Women Empowerment">Women Empowerment</option>
                    <option value="Micro Enterprise">Micro Enterprise</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Housing">Housing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Scheme Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full scheme name"
                    value={schemeForm.name || ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Ministry / Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter ministry or department (e.g. Ministry of Education)"
                    value={schemeForm.ministry || ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, ministry: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Description *</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Enter brief description of the scheme and objectives"
                    value={schemeForm.description || ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Total Scheme Budget (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Enter total scheme budget"
                    value={schemeForm.totalBudget ?? ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, totalBudget: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Maximum Grant Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Enter max grant per beneficiary"
                    value={schemeForm.maxGrantAmount ?? ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, maxGrantAmount: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Min Age Limit</label>
                  <input
                    type="number"
                    placeholder="e.g. 18"
                    value={schemeForm.minAge ?? ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, minAge: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Max Age Limit</label>
                  <input
                    type="number"
                    placeholder="e.g. 65"
                    value={schemeForm.maxAge ?? ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, maxAge: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Max Income Ceiling (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 300000"
                    value={schemeForm.maxIncomeCriteria ?? ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, maxIncomeCriteria: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Region Eligibility</label>
                  <input
                    type="text"
                    value={schemeForm.targetRegion || ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, targetRegion: e.target.value })}
                    placeholder="e.g. ALL or North Region"
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Target Social Categories</label>
                  <input
                    type="text"
                    value={schemeForm.targetCategories || ''}
                    onChange={(e) => setSchemeForm({ ...schemeForm, targetCategories: e.target.value })}
                    placeholder="e.g. Student, General, OBC, SC, ST or Farmer, BPL"
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                {/* INTERACTIVE REQUIRED DOCUMENTS CONFIGURATOR */}
                <div className="sm:col-span-2 p-4 bg-slate-50/90 rounded-2xl border border-slate-300 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2.5">
                    <div>
                      <label className="text-slate-900 text-xs font-bold flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-[#0f294a]" />
                        Required Verification Documents (Scheme-Specific) *
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Applicants must upload these documents. Field Officers will verify them during physical ground audits.
                      </p>
                    </div>
                    {schemeForm.category && (
                      <button
                        type="button"
                        onClick={() => handleApplyCategoryPreset(schemeForm.category, true)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border border-blue-200 transition self-start sm:self-auto shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Auto-Fill Presets for {schemeForm.category}
                      </button>
                    )}
                  </div>

                  {/* ACTIVE REQUIRED DOCUMENTS (CHIPS WITH REMOVE 'X' BUTTON) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                        Active Required Documents for this Scheme
                        <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-mono rounded-full font-bold">
                          {schemeForm.requiredDocuments ? schemeForm.requiredDocuments.split(',').map(s => s.trim()).filter(Boolean).length : 0}
                        </span>
                      </span>
                      {schemeForm.requiredDocuments && (
                        <button
                          type="button"
                          onClick={() => setSchemeForm(prev => ({ ...prev, requiredDocuments: '' }))}
                          className="text-[10px] text-slate-400 hover:text-red-600 transition"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {schemeForm.requiredDocuments && schemeForm.requiredDocuments.split(',').map(s => s.trim()).filter(Boolean).length > 0 ? (
                      <div className="flex flex-wrap gap-2 p-3 bg-white border border-slate-200 rounded-xl min-h-[48px] items-center">
                        {schemeForm.requiredDocuments.split(',').map(s => s.trim()).filter(Boolean).map((doc, idx) => (
                          <span
                            key={`${doc}-${idx}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-semibold shadow-xs hover:border-blue-300 transition"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span>{doc}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocChip(doc)}
                              className="ml-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full p-0.5 transition"
                              title={`Remove "${doc}"`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/80 border border-dashed border-amber-300 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>No documents selected yet! Click suggestions below or type a custom document name to add.</span>
                      </div>
                    )}
                  </div>

                  {/* ADD CUSTOM DOCUMENT INPUT + BUTTON */}
                  <div>
                    <label className="block text-[11px] text-slate-700 font-bold mb-1">
                      + Add Any Custom Document (Type Name & Click Add):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customDocInput}
                        onChange={(e) => setCustomDocInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomDoc();
                          }
                        }}
                        placeholder="e.g. Bonafide Enrollment Letter, Previous Semester Marksheet, Hostel Fee Receipt..."
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomDoc()}
                        disabled={!customDocInput.trim()}
                        className="px-4 py-2 bg-[#0f294a] hover:bg-[#153a66] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Document
                      </button>
                    </div>
                  </div>

                  {/* QUICK-ADD SUGGESTIONS PALETTES */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      Quick Pick Suggested Documents (Click to Add / Remove):
                    </span>

                    {/* Education Specific */}
                    <div>
                      <span className="text-[10px] text-blue-700 font-bold block mb-1">🎓 Higher Education & Technical:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'College Admission / Bonafide Letter',
                          'Class 12 / Semester Marksheet',
                          'College Student ID Card',
                          'Fee Structure / Receipt',
                          'Entrance Exam Scorecard'
                        ].map(docTag => {
                          const isSelected = (schemeForm.requiredDocuments || '')
                            .toLowerCase()
                            .includes(docTag.toLowerCase());
                          return (
                            <button
                              key={docTag}
                              type="button"
                              onClick={() => handleToggleDocChip(docTag)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {docTag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Agriculture & Rural */}
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold block mb-1">🌾 Agriculture & Land:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Land Record / RoR',
                          'Kisan Credit Card / Patta',
                          'Soil Health Card',
                          'DISCOM Electricity Bill'
                        ].map(docTag => {
                          const isSelected = (schemeForm.requiredDocuments || '')
                            .toLowerCase()
                            .includes(docTag.toLowerCase());
                          return (
                            <button
                              key={docTag}
                              type="button"
                              onClick={() => handleToggleDocChip(docTag)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {docTag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Identity, Banking, Social */}
                    <div>
                      <span className="text-[10px] text-purple-700 font-bold block mb-1">🪪 Identity, Banking & Social:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Aadhaar Card',
                          'Bank Passbook',
                          'PAN Card',
                          'Income Certificate',
                          'Caste Certificate',
                          'Ration / BPL Card',
                          'Udyam Registration',
                          'Mother-Child Protection (MCP) Card'
                        ].map(docTag => {
                          const isSelected = (schemeForm.requiredDocuments || '')
                            .toLowerCase()
                            .includes(docTag.toLowerCase());
                          return (
                            <button
                              key={docTag}
                              type="button"
                              onClick={() => handleToggleDocChip(docTag)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {docTag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Informational Guidance regarding Income Certificate & Education Schemes */}
                  <div className="flex items-start gap-2.5 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-snug">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Real Education Loan/Grant Rules:</strong>
                      <p className="text-[10px] text-amber-800 mt-1">
                        • <strong>Year Eligibility:</strong> In real government education schemes (like PM-Vidyalaxmi), students can apply <em>either from starting (1st Year Fresh Admission)</em> OR <em>during any ongoing academic year (2nd, 3rd, 4th, or Final/PG year)</em>. Therefore, verify both <strong>College Admission / Bonafide Letter</strong> and <strong>Class 12 / Semester Marksheet</strong>.
                      </p>
                      <p className="text-[10px] text-amber-800 mt-1">
                        • <strong>Income Certificate:</strong> Only mandate an Income Certificate if the scheme specifically enforces a low-income cap (e.g. EWS/BPL under ₹3 Lakhs). General higher education schemes should not disqualify students by enforcing an income certificate.
                      </p>
                    </div>
                  </div>

                  {/* Advanced raw edit */}
                  <div className="pt-1">
                    <details className="text-[11px] text-slate-500 cursor-pointer">
                      <summary className="font-semibold hover:text-slate-800">
                        Advanced: Direct comma-separated edit
                      </summary>
                      <input
                        type="text"
                        value={schemeForm.requiredDocuments || ''}
                        onChange={(e) => setSchemeForm({ ...schemeForm, requiredDocuments: e.target.value })}
                        placeholder="e.g. Aadhaar Card, College Admission / Bonafide Letter, Bank Passbook"
                        className="mt-2 w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                      />
                    </details>
                  </div>
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
                  <div className="flex items-center gap-2">
                    {schemeForm.category && (
                      <button
                        type="button"
                        onClick={() => {
                          const preset = getSchemePreset(schemeForm.category, schemeForm.schemeCode);
                          setSchemeForm(prev => ({
                            ...prev,
                            dynamicFields: preset.dynamicFields
                          }));
                          toast.info(`Populated ${preset.dynamicFields.length} standard dynamic attributes for ${schemeForm.category}.`);
                        }}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-[11px] flex items-center border border-blue-200 shadow-xs transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" /> Auto-Fill for {schemeForm.category}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddDynamicField}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] flex items-center shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Dynamic Attribute
                    </button>
                  </div>
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
                              placeholder="Enter field label"
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
                              placeholder="Enter field key"
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
                                placeholder="Enter allowed values"
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
              <div className="pt-1 border-t border-slate-200">
                <span className="font-semibold text-slate-700 block mb-1">Required Verification Documents:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(activeScheme.requiredDocuments || 'Aadhaar Card, Bank Passbook')
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
                    .map((doc, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-md text-[11px] font-semibold">
                        <FileText className="w-3 h-3 text-blue-600" />
                        {doc}
                      </span>
                    ))}
                </div>
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
