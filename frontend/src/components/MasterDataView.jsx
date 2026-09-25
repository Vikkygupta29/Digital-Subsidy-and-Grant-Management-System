import React, { useState } from 'react';
import { Layers, Plus, UserPlus, FileCheck, ExternalLink, Building, CheckCircle, Search, Filter, Edit3, Trash2, Globe, FileText } from 'lucide-react';
import { beneficiaryAPI, schemeAPI } from '../services/api';
import { toast } from '../context/ToastContext';

export default function MasterDataView({ schemes = [], beneficiaries = [], currentUser, onRefresh }) {
  const [activeSubTab, setActiveSubTab] = useState('schemes');
  const [showSchemeModal, setShowSchemeModal] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Scheme Form State with Dynamic Variables
  const [schemeForm, setSchemeForm] = useState({
    schemeCode: '',
    name: '',
    description: '',
    category: 'Agriculture',
    totalBudget: 5000000,
    maxGrantAmount: 50000,
    maxIncomeCriteria: 250000,
    targetCategories: 'Farmer,SC,ST,BPL',
    targetRegion: 'North Region',
    requiredDocuments: 'Aadhaar Card, Land Record Certificate, Income Proof',
    dynamicFieldsJson: '{"minLandAcres": 2.0, "preferredSector": "Solar Equipment"}',
  });

  // Beneficiary Form State with Cloudinary File upload
  const [benForm, setBenForm] = useState({
    userId: currentUser ? currentUser.id : 1,
    aadhaarNumber: '',
    panNumber: '',
    fullName: currentUser ? currentUser.fullName : '',
    category: 'Farmer',
    annualIncome: 180000,
    landSizeAcres: 2.5,
    region: currentUser?.region || 'North Region',
    address: '',
  });
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const openCreateModal = () => {
    setEditingScheme(null);
    setSchemeForm({
      schemeCode: '',
      name: '',
      description: '',
      category: 'Agriculture',
      totalBudget: 5000000,
      maxGrantAmount: 50000,
      maxIncomeCriteria: 250000,
      targetCategories: 'Farmer,SC,ST,BPL',
      targetRegion: 'North Region',
      requiredDocuments: 'Aadhaar Card, Land Record Certificate, Income Proof',
      dynamicFieldsJson: '{"minLandAcres": 2.0, "preferredSector": "Solar Equipment"}',
    });
    setShowSchemeModal(true);
  };

  const openEditModal = (scheme) => {
    setEditingScheme(scheme);
    setSchemeForm({
      schemeCode: scheme.schemeCode || '',
      name: scheme.name || '',
      description: scheme.description || '',
      category: scheme.category || 'Agriculture',
      totalBudget: scheme.totalBudget || 5000000,
      maxGrantAmount: scheme.maxGrantAmount || 50000,
      maxIncomeCriteria: scheme.maxIncomeCriteria || 250000,
      targetCategories: scheme.targetCategories || 'Farmer,SC,ST,BPL',
      targetRegion: scheme.targetRegion || 'ALL',
      requiredDocuments: scheme.requiredDocuments || 'Aadhaar Card, Land Record Certificate',
      dynamicFieldsJson: scheme.dynamicFieldsJson || '',
    });
    setShowSchemeModal(true);
  };

  const handleSaveScheme = async (e) => {
    e.preventDefault();
    try {
      if (editingScheme) {
        await schemeAPI.update(editingScheme.id, schemeForm);
        toast.success('Scheme updated successfully!');
      } else {
        await schemeAPI.createOrUpdate(schemeForm);
        toast.success('Scheme created successfully!');
      }
      setShowSchemeModal(false);
      setEditingScheme(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Error saving scheme: ' + (err.response?.data || err.message));
    }
  };

  const handleDeleteScheme = async (scheme) => {
    if (!window.confirm(`Are you sure you want to delete scheme "${scheme.name}" (${scheme.schemeCode})?`)) return;
    try {
      await schemeAPI.delete(scheme.id);
      toast.success('Scheme deleted successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Failed to delete scheme: ' + (err.response?.data || err.message));
    }
  };

  const handleRegisterBeneficiary = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('userId', currentUser ? currentUser.id : benForm.userId);
      formData.append('aadhaarNumber', benForm.aadhaarNumber);
      formData.append('panNumber', benForm.panNumber);
      formData.append('fullName', benForm.fullName);
      formData.append('category', benForm.category);
      formData.append('annualIncome', benForm.annualIncome);
      formData.append('landSizeAcres', benForm.landSizeAcres);
      formData.append('region', benForm.region);
      formData.append('address', benForm.address);
      if (docFile) {
        formData.append('document', docFile);
      }

      await beneficiaryAPI.register(formData);
      setShowBeneficiaryModal(false);
      setUploading(false);
      if (onRefresh) onRefresh();
      toast.success('Beneficiary profile registered & Identity document uploaded successfully!');
    } catch (err) {
      setUploading(false);
      toast.error('Registration failed: ' + (err.response?.data || err.message));
    }
  };

  const safeSchemes = Array.isArray(schemes) ? schemes : [];
  const safeBeneficiaries = Array.isArray(beneficiaries) ? beneficiaries : [];

  const filteredSchemes = safeSchemes.filter(s =>
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.schemeCode && s.schemeCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredBeneficiaries = safeBeneficiaries.filter(b =>
    (b.fullName && b.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.aadhaarNumber && b.aadhaarNumber.includes(searchQuery))
  );

  const isBeneficiary = currentUser?.role === 'BENEFICIARY';
  const isAdmin = currentUser?.role === 'ADMIN';

  // Check if beneficiary profile already exists for logged in user
  const beneficiaryRegistered = safeBeneficiaries.some(
    b => b.user?.id === currentUser?.id || b.fullName === currentUser?.fullName
  );

  return (
    <div className="space-y-6 pt-6 pb-12">
      {/* Sub-header & Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('schemes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center ${
              activeSubTab === 'schemes'
                ? 'bg-[#0f294a] text-white shadow-sm'
                : 'bg-[#eff4ff] text-[#46617c] hover:text-[#00142f]'
            }`}
          >
            <Layers className="w-4 h-4 mr-2" />
            Scheme Master Records ({safeSchemes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('beneficiaries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center ${
              activeSubTab === 'beneficiaries'
                ? 'bg-[#0f294a] text-white shadow-sm'
                : 'bg-[#eff4ff] text-[#46617c] hover:text-[#00142f]'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Beneficiary Registry ({safeBeneficiaries.length})
          </button>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code, name, Aadhaar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
            />
          </div>

          {activeSubTab === 'schemes' ? (
            !isBeneficiary && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-[#00142f] hover:bg-[#0f294a] text-white text-xs font-bold rounded-xl shadow transition flex items-center whitespace-nowrap"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create Scheme
              </button>
            )
          ) : (
            beneficiaryRegistered ? (
              <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold flex items-center shadow-xs">
                <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-600" /> Beneficiary Registered
              </span>
            ) : (
              <button
                onClick={() => setShowBeneficiaryModal(true)}
                className="px-4 py-2 bg-[#1aa54c] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition flex items-center whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> Register Beneficiary
              </button>
            )
          )}
        </div>
      </div>

      {/* Schemes Tab */}
      {activeSubTab === 'schemes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.length === 0 ? (
            <div className="col-span-3 bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
              No scheme records found.
            </div>
          ) : (
            filteredSchemes.map((scheme) => (
              <div key={scheme.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#1aa54c]/50 transition space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 bg-[#eff4ff] text-[#00142f] text-xs font-mono font-bold rounded-lg border border-[#c4e0ff]">
                      {scheme.schemeCode}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {scheme.targetRegion || 'ALL Regions'}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        {scheme.category}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#00142f] mb-1">{scheme.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">{scheme.description}</p>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Total Budget:</span>
                    <strong className="text-[#00142f] font-mono">₹{(scheme.totalBudget || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Max Grant / Applicant:</span>
                    <strong className="text-[#1aa54c] font-mono">₹{(scheme.maxGrantAmount || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Max Income Limit:</span>
                    <strong className="text-slate-800 font-mono">₹{(scheme.maxIncomeCriteria || 0).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Target Categories:</span>
                    <span className="text-slate-800 font-medium truncate max-w-[140px]">{scheme.targetCategories}</span>
                  </div>
                  {scheme.requiredDocuments && (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="font-bold text-[10px] text-slate-700 block mb-0.5">Required Scheme Documents:</span>
                      <span className="text-[11px] text-slate-600 font-medium block leading-tight">{scheme.requiredDocuments}</span>
                    </div>
                  )}
                  {scheme.dynamicFieldsJson && (
                    <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-100 font-mono text-[10px] text-indigo-900 truncate">
                      <span className="font-bold block mb-0.5">Dynamic Variables:</span>
                      {scheme.dynamicFieldsJson}
                    </div>
                  )}
                </div>

                {/* Admin CRUD Actions */}
                {isAdmin && (
                  <div className="flex items-center justify-end space-x-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => openEditModal(scheme)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-lg border border-blue-200 flex items-center transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteScheme(scheme)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold rounded-lg border border-red-200 flex items-center transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Beneficiaries Tab */}
      {activeSubTab === 'beneficiaries' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#f8f9ff] text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Beneficiary Name</th>
                  <th className="p-4">Aadhaar / Identity</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Annual Income</th>
                  <th className="p-4">Region</th>
                  <th className="p-4">Cloudinary Document</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBeneficiaries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No beneficiary profiles registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredBeneficiaries.map((b) => (
                    <tr key={b.id} className="hover:bg-[#f8f9ff] transition">
                      <td className="p-4 font-bold text-[#00142f]">{b.fullName}</td>
                      <td className="p-4 font-mono text-slate-600">{b.aadhaarNumber}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium">{b.category}</span>
                      </td>
                      <td className="p-4 text-[#1aa54c] font-bold font-mono">₹{(b.annualIncome || 0).toLocaleString()}</td>
                      <td className="p-4">{b.region}</td>
                      <td className="p-4">
                        {b.identityDocumentUrl ? (
                          <a
                            href={b.identityDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 hover:underline font-bold"
                          >
                            View Cloudinary File <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">No Document</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Scheme Modal */}
      {showSchemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-[#00142f] flex items-center">
              {editingScheme ? (
                <>
                  <Edit3 className="w-5 h-5 text-blue-600 mr-2" />
                  Edit Scheme Master Details
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-[#1aa54c] mr-2" />
                  Create New Government Scheme Master
                </>
              )}
            </h3>
            <form onSubmit={handleSaveScheme} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Scheme Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PMKG-2026"
                    value={schemeForm.schemeCode}
                    onChange={(e) => setSchemeForm({ ...schemeForm, schemeCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Category</label>
                  <select
                    value={schemeForm.category}
                    onChange={(e) => setSchemeForm({ ...schemeForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  >
                    <option value="Agriculture">Agriculture</option>
                    <option value="Renewable Energy">Renewable Energy</option>
                    <option value="Women Empowerment">Women Empowerment</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Scheme Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar Equipment Grant"
                  value={schemeForm.name}
                  onChange={(e) => setSchemeForm({ ...schemeForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={schemeForm.description}
                  onChange={(e) => setSchemeForm({ ...schemeForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Target Region Dynamic Variable</label>
                  <select
                    value={schemeForm.targetRegion}
                    onChange={(e) => setSchemeForm({ ...schemeForm, targetRegion: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  >
                    <option value="ALL">ALL Regions (Pan India)</option>
                    <option value="North Region">North Region</option>
                    <option value="South Region">South Region</option>
                    <option value="East Region">East Region</option>
                    <option value="West Region">West Region</option>
                    <option value="Central Region">Central Region</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Target Categories</label>
                  <input
                    type="text"
                    required
                    placeholder="Farmer,SC,ST,BPL"
                    value={schemeForm.targetCategories}
                    onChange={(e) => setSchemeForm({ ...schemeForm, targetCategories: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Total Budget (INR)</label>
                  <input
                    type="number"
                    required
                    value={schemeForm.totalBudget}
                    onChange={(e) => setSchemeForm({ ...schemeForm, totalBudget: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Max Grant / Applicant</label>
                  <input
                    type="number"
                    required
                    value={schemeForm.maxGrantAmount}
                    onChange={(e) => setSchemeForm({ ...schemeForm, maxGrantAmount: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Max Income Limit</label>
                  <input
                    type="number"
                    required
                    value={schemeForm.maxIncomeCriteria}
                    onChange={(e) => setSchemeForm({ ...schemeForm, maxIncomeCriteria: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Required Scheme Documents (Dynamic List)</label>
                <input
                  type="text"
                  placeholder="e.g. Aadhaar Card, Land Record Certificate, Income Proof"
                  value={schemeForm.requiredDocuments}
                  onChange={(e) => setSchemeForm({ ...schemeForm, requiredDocuments: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Dynamic Variables / Specifications (JSON Format)</label>
                <textarea
                  rows={2}
                  placeholder='{"minLandAcres": 2.0, "preferredSector": "Solar Equipment"}'
                  value={schemeForm.dynamicFieldsJson}
                  onChange={(e) => setSchemeForm({ ...schemeForm, dynamicFieldsJson: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSchemeModal(false);
                    setEditingScheme(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow"
                >
                  {editingScheme ? 'Update Scheme' : 'Save Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Beneficiary Modal with Cloudinary Upload */}
      {showBeneficiaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-[#00142f] flex items-center">
              <UserPlus className="w-5 h-5 text-[#1aa54c] mr-2" />
              Register Beneficiary Profile & Upload Aadhaar (Cloudinary)
            </h3>
            <form onSubmit={handleRegisterBeneficiary} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={benForm.fullName}
                  onChange={(e) => setBenForm({ ...benForm, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Aadhaar Number</label>
                  <input
                    type="text"
                    required
                    placeholder="9876-5432-1098"
                    value={benForm.aadhaarNumber}
                    onChange={(e) => setBenForm({ ...benForm, aadhaarNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Category</label>
                  <select
                    value={benForm.category}
                    onChange={(e) => setBenForm({ ...benForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  >
                    <option value="Farmer">Farmer</option>
                    <option value="SC/ST Women Entrepreneur">SC/ST Women Entrepreneur</option>
                    <option value="OBC">OBC</option>
                    <option value="BPL">BPL</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Annual Income (INR)</label>
                  <input
                    type="number"
                    required
                    value={benForm.annualIncome}
                    onChange={(e) => setBenForm({ ...benForm, annualIncome: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Administrative Region</label>
                  <select
                    value={benForm.region}
                    onChange={(e) => setBenForm({ ...benForm, region: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  >
                    <option value="North Region">North Region</option>
                    <option value="West Region">West Region</option>
                    <option value="South Region">South Region</option>
                    <option value="East Region">East Region</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Identity Document (Aadhaar/Income Cert) - Uploads to Cloudinary
                </label>
                <input
                  type="file"
                  onChange={(e) => setDocFile(e.target.files[0])}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-700 focus:outline-none"
                />
                <span className="text-[10px] text-[#1aa54c] mt-1 block">
                  Cloudinary destination: hkxztbcu/subsidy_grant_docs
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBeneficiaryModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow flex items-center"
                >
                  {uploading ? 'Uploading to Cloudinary...' : 'Submit Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
