import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, Eye, Edit3, CheckCircle, 
  Clock, CheckCircle2, XCircle, 
  Phone, Mail, FileText, CreditCard, X
} from 'lucide-react';
import { beneficiaryAPI } from '../services/api';
import { toast } from '../context/ToastContext';

export default function BeneficiaryPortalView({ beneficiaries = [], applications = [], currentUser, onRefresh, onRegisterBeneficiary, onUpdateBeneficiary }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeBeneficiary, setActiveBeneficiary] = useState(null);

  // Register New Beneficiary Form State
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    dob: '1990-01-01',
    gender: 'Male',
    mobileNumber: '',
    email: '',
    aadhaarNumber: '',
    panNumber: '',
    category: 'Farmer',
    address: '',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    block: 'Kashi Vidyapeeth',
    region: 'North Region',
    annualIncome: 180000,
    landSizeAcres: 2.0,
    bankName: 'State Bank of India',
    bankAccountNumber: '',
    ifscCode: '',
    documentType: 'Aadhaar Card',
  });

  const [docFile, setDocFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit Profile Form State
  const [editForm, setEditForm] = useState(null);

  const openRegisterModal = () => {
    setRegisterForm({
      fullName: '',
      dob: '1990-01-01',
      gender: 'Male',
      mobileNumber: '',
      email: '',
      aadhaarNumber: '',
      panNumber: '',
      category: 'Farmer',
      address: '',
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      block: 'Kashi Vidyapeeth',
      region: 'North Region',
      annualIncome: 180000,
      landSizeAcres: 2.0,
      bankName: 'State Bank of India',
      bankAccountNumber: '',
      ifscCode: '',
      documentType: 'Aadhaar Card',
    });
    setDocFile(null);
    setShowRegisterModal(true);
  };

  const openDetailsModal = (beneficiary) => {
    setActiveBeneficiary(beneficiary);
    setShowDetailsModal(true);
  };

  const openEditModal = (beneficiary) => {
    setActiveBeneficiary(beneficiary);
    setEditForm({
      id: beneficiary.id,
      fullName: beneficiary.fullName || '',
      dob: beneficiary.dob || '1990-01-01',
      gender: beneficiary.gender || 'Male',
      mobileNumber: beneficiary.mobileNumber || '',
      email: beneficiary.email || '',
      aadhaarNumber: beneficiary.aadhaarNumber || '',
      panNumber: beneficiary.panNumber || '',
      category: beneficiary.category || 'Farmer',
      address: beneficiary.address || '',
      state: beneficiary.state || 'Uttar Pradesh',
      district: beneficiary.district || 'Varanasi',
      block: beneficiary.block || 'Kashi Vidyapeeth',
      region: beneficiary.region || 'North Region',
      annualIncome: beneficiary.annualIncome || 180000,
      landSizeAcres: beneficiary.landSizeAcres || 1.5,
      bankName: beneficiary.bankName || 'State Bank of India',
      bankAccountNumber: beneficiary.bankAccountNumber || '',
      ifscCode: beneficiary.ifscCode || '',
      verificationStatus: beneficiary.verificationStatus || 'PENDING',
    });
    setShowEditModal(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newBeneficiary = {
        ...registerForm,
        id: Date.now(),
        verificationStatus: 'PENDING',
        registeredAt: new Date().toISOString(),
        identityDocumentUrl: docFile ? URL.createObjectURL(docFile) : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
      };

      // Call API if connected
      const formData = new FormData();
      formData.append('userId', currentUser?.id || 1);
      formData.append('fullName', registerForm.fullName);
      formData.append('aadhaarNumber', registerForm.aadhaarNumber);
      formData.append('panNumber', registerForm.panNumber || '');
      formData.append('category', registerForm.category);
      formData.append('annualIncome', registerForm.annualIncome);
      formData.append('landSizeAcres', registerForm.landSizeAcres);
      formData.append('region', registerForm.region);
      formData.append('address', `${registerForm.address}, Block: ${registerForm.block}, District: ${registerForm.district}, State: ${registerForm.state}`);
      if (docFile) formData.append('document', docFile);

      try {
        await beneficiaryAPI.register(formData);
      } catch (apiErr) {
        console.warn('Backend API offline, saved locally:', apiErr.message);
      }

      if (onRegisterBeneficiary) {
        onRegisterBeneficiary(newBeneficiary);
      }
      if (onRefresh) onRefresh();

      setSubmitting(false);
      setShowRegisterModal(false);
      toast.success(`Beneficiary "${registerForm.fullName}" registered successfully with status: PENDING VERIFICATION!`);
    } catch (err) {
      setSubmitting(false);
      toast.error('Failed to register beneficiary: ' + err.message);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm) return;

    if (onUpdateBeneficiary) {
      onUpdateBeneficiary(editForm);
    }
    if (onRefresh) onRefresh();

    setShowEditModal(false);
    if (activeBeneficiary && activeBeneficiary.id === editForm.id) {
      setActiveBeneficiary(editForm);
    }
    toast.success(`Beneficiary profile for "${editForm.fullName}" updated successfully!`);
  };

  const handleStatusChange = (newStatus) => {
    if (!activeBeneficiary) return;
    const updated = { ...activeBeneficiary, verificationStatus: newStatus };
    setActiveBeneficiary(updated);
    if (onUpdateBeneficiary) {
      onUpdateBeneficiary(updated);
    }
    if (onRefresh) onRefresh();
    toast.info(`Beneficiary status updated to: ${newStatus}`);
  };

  // Filter beneficiaries
  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesSearch = 
      (b.fullName && b.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.aadhaarNumber && b.aadhaarNumber.includes(searchQuery)) ||
      (b.district && b.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.mobileNumber && b.mobileNumber.includes(searchQuery));

    const matchesCategory = selectedCategory === 'ALL' || b.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || b.verificationStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</span>;
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300"><CheckCircle className="w-3 h-3 mr-1" /> Active</span>;
      case 'INACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300"><XCircle className="w-3 h-3 mr-1" /> Inactive</span>;
      case 'PENDING':
      case 'PENDING_VERIFICATION':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300"><Clock className="w-3 h-3 mr-1" /> Pending Verification</span>;
    }
  };

  // Find applications for active beneficiary
  const beneficiaryApplications = activeBeneficiary 
    ? applications.filter(a => a.beneficiaryId === activeBeneficiary.id || a.beneficiary?.id === activeBeneficiary.id)
    : [];

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Top Banner & Title */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#00142f] rounded-2xl text-white shadow-md">
              <Users className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-[#00142f] tracking-tight">Beneficiary Portal</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  Official Citizen Registry
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Dedicated Beneficiary Registration, Demographic Profiling, Aadhaar Reference & Direct Benefit Transfer Bank Details
              </p>
            </div>
          </div>

          <button
            onClick={openRegisterModal}
            className="px-4 py-2.5 bg-[#00142f] hover:bg-[#0f294a] text-white text-xs font-bold rounded-xl shadow transition flex items-center whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 mr-2 text-emerald-400" /> Register New Beneficiary
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Name, Aadhaar Reference, District, Mobile..."
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
              <option value="Farmer">Farmer</option>
              <option value="Women">Women</option>
              <option value="SC">SC (Scheduled Caste)</option>
              <option value="ST">ST (Scheduled Tribe)</option>
              <option value="OBC">OBC</option>
              <option value="Artisan">Artisan / Weaver</option>
              <option value="BPL">BPL (Below Poverty Line)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#00142f] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Beneficiary Registry Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-[#f8f9ff] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00142f]">
              Registered Beneficiaries List ({filteredBeneficiaries.length} Records)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Showing all state & district records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#00142f]">
            <thead className="bg-[#eff4ff] text-[#46617c] font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
              <tr>
                <th className="p-4">Beneficiary & Identity</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Location (District / Block)</th>
                <th className="p-4">Category & Holding</th>
                <th className="p-4">DBT Bank Details</th>
                <th className="p-4">Registration Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBeneficiaries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No beneficiaries match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBeneficiaries.map((ben) => (
                  <tr key={ben.id} className="hover:bg-[#f8f9ff] transition">
                    <td className="p-4">
                      <div className="font-bold text-[#00142f] text-sm">{ben.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Aadhaar: <span className="font-semibold text-[#0f294a]">{ben.aadhaarNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        DOB: {ben.dob || '1988-01-01'} &bull; Gender: {ben.gender || 'Male'}
                      </div>
                    </td>

                    <td className="p-4 space-y-0.5 text-slate-600">
                      <div className="flex items-center text-[11px]">
                        <Phone className="w-3 h-3 mr-1 text-slate-400" />
                        {ben.mobileNumber || '+91 98765 00000'}
                      </div>
                      <div className="flex items-center text-[11px] truncate max-w-[150px]">
                        <Mail className="w-3 h-3 mr-1 text-slate-400" />
                        {ben.email || 'citizen@subsidy.gov.in'}
                      </div>
                    </td>

                    <td className="p-4 text-slate-700">
                      <div className="font-semibold">{ben.district || 'Varanasi'}, {ben.state || 'UP'}</div>
                      <div className="text-[11px] text-slate-500">Block: {ben.block || 'Kashi Vidyapeeth'}</div>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#0f294a] border border-[#c4e0ff]">
                        {ben.category}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Income: ₹{(ben.annualIncome || 180000).toLocaleString()} &bull; Land: {ben.landSizeAcres || 0} Ac
                      </div>
                    </td>

                    <td className="p-4 font-mono text-[11px]">
                      <div className="font-bold text-[#00142f]">{ben.bankName || 'State Bank of India'}</div>
                      <div className="text-slate-500">A/C: {ben.bankAccountNumber || '••••••••4820'}</div>
                      <div className="text-[10px] text-slate-400">IFSC: {ben.ifscCode || 'SBIN0001234'}</div>
                    </td>

                    <td className="p-4">
                      {getStatusBadge(ben.verificationStatus)}
                    </td>

                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openDetailsModal(ben)}
                        className="px-2.5 py-1.5 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#00142f] rounded-lg font-bold text-[11px] border border-[#c4e0ff] inline-flex items-center transition"
                        title="View Profile Details & History"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" /> Details
                      </button>
                      <button
                        onClick={() => openEditModal(ben)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] border border-slate-200 inline-flex items-center transition"
                        title="Edit Profile"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Register New Beneficiary */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#00142f] text-white rounded-xl">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#00142f]">Register New Beneficiary</h3>
                  <p className="text-xs text-slate-500">Complete Citizen Registration & Bank Details for Direct Subsidy Transfer</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {/* Identity & Personal Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                  <span className="w-1.5 h-3.5 bg-[#1aa54c] rounded-full mr-2"></span>
                  1. Identity & Personal Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra Yadav"
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={registerForm.dob}
                      onChange={(e) => setRegisterForm({ ...registerForm, dob: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Gender *</label>
                    <select
                      value={registerForm.gender}
                      onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Beneficiary Category *</label>
                    <select
                      value={registerForm.category}
                      onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    >
                      <option value="Farmer">Farmer (Small / Marginal)</option>
                      <option value="Women">Women Entrepreneur / Homemaker</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="OBC">OBC (Other Backward Class)</option>
                      <option value="BPL">BPL (Below Poverty Line)</option>
                      <option value="Artisan">Artisan / Handloom Weaver</option>
                      <option value="General">General Category</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Identity / Aadhaar Reference *</label>
                    <input
                      type="text"
                      required
                      placeholder="XXXX-XXXX-1234"
                      value={registerForm.aadhaarNumber}
                      onChange={(e) => setRegisterForm({ ...registerForm, aadhaarNumber: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">PAN Reference (Optional)</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={registerForm.panNumber}
                      onChange={(e) => setRegisterForm({ ...registerForm, panNumber: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                  <span className="w-1.5 h-3.5 bg-blue-600 rounded-full mr-2"></span>
                  2. Contact & Financial Eligibility
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={registerForm.mobileNumber}
                      onChange={(e) => setRegisterForm({ ...registerForm, mobileNumber: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Email Address</label>
                    <input
                      type="email"
                      placeholder="citizen@subsidy.gov.in"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Annual Family Income (INR) *</label>
                    <input
                      type="number"
                      required
                      value={registerForm.annualIncome}
                      onChange={(e) => setRegisterForm({ ...registerForm, annualIncome: Number(e.target.value) })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Land Size (Acres, if applicable)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={registerForm.landSizeAcres}
                      onChange={(e) => setRegisterForm({ ...registerForm, landSizeAcres: Number(e.target.value) })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>
                </div>
              </div>

              {/* Address Hierarchy */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                  <span className="w-1.5 h-3.5 bg-amber-500 rounded-full mr-2"></span>
                  3. Address & Regional Jurisdiction
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">State *</label>
                    <input
                      type="text"
                      required
                      value={registerForm.state}
                      onChange={(e) => setRegisterForm({ ...registerForm, state: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">District *</label>
                    <input
                      type="text"
                      required
                      value={registerForm.district}
                      onChange={(e) => setRegisterForm({ ...registerForm, district: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Block / Tehsil *</label>
                    <input
                      type="text"
                      required
                      value={registerForm.block}
                      onChange={(e) => setRegisterForm({ ...registerForm, block: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-600 mb-1 font-semibold">Complete Street Address / Village *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. House No. 42, Village Rampur, Post Bilaspur"
                      value={registerForm.address}
                      onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details for DBT Transfer */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                  <span className="w-1.5 h-3.5 bg-purple-600 rounded-full mr-2"></span>
                  4. Direct Benefit Transfer (DBT) Bank Account Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Bank Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="State Bank of India"
                      value={registerForm.bankName}
                      onChange={(e) => setRegisterForm({ ...registerForm, bankName: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Bank Account Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="38291048201"
                      value={registerForm.bankAccountNumber}
                      onChange={(e) => setRegisterForm({ ...registerForm, bankAccountNumber: e.target.value })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">IFSC Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="SBIN0001234"
                      value={registerForm.ifscCode}
                      onChange={(e) => setRegisterForm({ ...registerForm, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                    />
                  </div>
                </div>
              </div>

              {/* Supporting Document Upload */}
              <div className="space-y-2 pt-2">
                <label className="block text-slate-600 font-semibold">Identity Document / RoR Upload (Optional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setDocFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#00142f] file:text-white hover:file:bg-[#0f294a]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold rounded-xl shadow transition"
                >
                  {submitting ? 'Registering...' : 'Register Beneficiary Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View Beneficiary Details & Application History */}
      {showDetailsModal && activeBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-extrabold text-[#00142f]">{activeBeneficiary.fullName}</h3>
                  {getStatusBadge(activeBeneficiary.verificationStatus)}
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  Aadhaar Reference: {activeBeneficiary.aadhaarNumber} &bull; Reg ID: #{activeBeneficiary.id}
                </p>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-[#00142f] uppercase text-[11px] flex items-center">
                  <Phone className="w-3.5 h-3.5 text-blue-600 mr-1.5" /> Contact & Personal Details
                </h4>
                <div className="space-y-1 text-slate-600">
                  <div>Mobile: <strong className="text-[#00142f]">{activeBeneficiary.mobileNumber || 'Not provided'}</strong></div>
                  <div>Email: <strong className="text-[#00142f]">{activeBeneficiary.email || 'Not provided'}</strong></div>
                  <div>DOB: <strong className="text-[#00142f]">{activeBeneficiary.dob || '1985-05-12'}</strong></div>
                  <div>Gender: <strong className="text-[#00142f]">{activeBeneficiary.gender || 'Male'}</strong></div>
                  <div>Social Category: <strong className="text-emerald-700 font-bold">{activeBeneficiary.category}</strong></div>
                  <div>Annual Income: <strong className="font-mono text-[#00142f]">₹{(activeBeneficiary.annualIncome || 180000).toLocaleString()}</strong></div>
                  <div>Land Holding: <strong className="text-[#00142f]">{activeBeneficiary.landSizeAcres || 0} Acres</strong></div>
                </div>
              </div>

              <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-[#00142f] uppercase text-[11px] flex items-center">
                  <CreditCard className="w-3.5 h-3.5 text-purple-600 mr-1.5" /> DBT Bank & Address
                </h4>
                <div className="space-y-1 text-slate-600">
                  <div>Bank Name: <strong className="text-[#00142f]">{activeBeneficiary.bankName || 'State Bank of India'}</strong></div>
                  <div>Account No: <strong className="font-mono text-[#00142f]">{activeBeneficiary.bankAccountNumber || '38291048201'}</strong></div>
                  <div>IFSC Code: <strong className="font-mono text-[#00142f]">{activeBeneficiary.ifscCode || 'SBIN0001234'}</strong></div>
                  <div className="border-t border-slate-200 pt-1 mt-1">
                    <div>State: <strong className="text-[#00142f]">{activeBeneficiary.state || 'Uttar Pradesh'}</strong></div>
                    <div>District: <strong className="text-[#00142f]">{activeBeneficiary.district || 'Varanasi'}</strong></div>
                    <div>Block: <strong className="text-[#00142f]">{activeBeneficiary.block || 'Kashi Vidyapeeth'}</strong></div>
                    <div>Address: <strong className="text-[#00142f]">{activeBeneficiary.address}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Status Controls */}
            <div className="p-4 bg-[#eff4ff] rounded-2xl border border-[#c4e0ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-[#00142f] block">Update Registration Status:</span>
                <span className="text-slate-500 text-[11px]">Authorized administrative status transition</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('PENDING')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                    activeBeneficiary.verificationStatus === 'PENDING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleStatusChange('VERIFIED')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                    activeBeneficiary.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  Verified
                </button>
                <button
                  onClick={() => handleStatusChange('ACTIVE')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                    activeBeneficiary.verificationStatus === 'ACTIVE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-800 border border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => handleStatusChange('INACTIVE')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                    activeBeneficiary.verificationStatus === 'INACTIVE'
                      ? 'bg-slate-700 text-white'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>

            {/* Application History */}
            <div className="space-y-3">
              <h4 className="font-bold text-[#00142f] uppercase tracking-wider text-[11px] flex items-center">
                <FileText className="w-4 h-4 text-emerald-600 mr-1.5" />
                Scheme Application History ({beneficiaryApplications.length})
              </h4>

              {beneficiaryApplications.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                  No subsidy grant applications filed by this beneficiary yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-[#00142f]">
                    <thead className="bg-[#f8f9ff] text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">Application No</th>
                        <th className="p-3">Applied Grant</th>
                        <th className="p-3">Eligibility Score</th>
                        <th className="p-3">Current Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {beneficiaryApplications.map((app) => (
                        <tr key={app.id}>
                          <td className="p-3 font-mono font-bold text-[#00142f]">{app.applicationNo}</td>
                          <td className="p-3 font-mono text-[#1aa54c] font-bold">₹{(app.appliedGrantAmount || 0).toLocaleString()}</td>
                          <td className="p-3 font-mono font-bold">{app.eligibilityScore} / 100</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff4ff] text-[#0f294a] border border-[#c4e0ff]">
                              {app.currentStage}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-[#00142f] text-white text-xs font-bold rounded-xl shadow hover:bg-[#0f294a] transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Beneficiary Profile */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#00142f]">Edit Beneficiary Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Mobile Number</label>
                  <input
                    type="text"
                    value={editForm.mobileNumber}
                    onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Registration Status</label>
                  <select
                    value={editForm.verificationStatus}
                    onChange={(e) => setEditForm({ ...editForm, verificationStatus: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    <option value="PENDING">Pending Verification</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Bank Name</label>
                  <input
                    type="text"
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Bank Account Number</label>
                  <input
                    type="text"
                    value={editForm.bankAccountNumber}
                    onChange={(e) => setEditForm({ ...editForm, bankAccountNumber: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">IFSC Code</label>
                  <input
                    type="text"
                    value={editForm.ifscCode}
                    onChange={(e) => setEditForm({ ...editForm, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Annual Income (INR)</label>
                  <input
                    type="number"
                    value={editForm.annualIncome}
                    onChange={(e) => setEditForm({ ...editForm, annualIncome: Number(e.target.value) })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-semibold">Full Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
