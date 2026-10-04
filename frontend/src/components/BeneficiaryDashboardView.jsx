import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, CheckCircle2, FileText, Upload, DollarSign, Clock, ExternalLink, AlertCircle, Plus, Send, ChevronRight, Award, Layers, Globe, CheckCircle, FileCheck } from 'lucide-react';
import { beneficiaryAPI, applicationAPI, schemeAPI, disbursementAPI } from '../services/api';
import { toast } from '../context/ToastContext';

export default function BeneficiaryDashboardView({ currentUser, onRefresh }) {
  const [profile, setProfile] = useState(null);
  const [myApplications, setMyApplications] = useState([]);
  const [availableSchemes, setAvailableSchemes] = useState([]);
  const [selectedAppMilestones, setSelectedAppMilestones] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [activeTab, setActiveTab] = useState('schemes'); // 'schemes', 'applications', 'profile'
  const [loading, setLoading] = useState(true);

  // Profile Registration Form State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    aadhaarNumber: '',
    panNumber: '',
    fullName: currentUser ? currentUser.fullName : '',
    category: 'Farmer',
    annualIncome: 150000,
    landSizeAcres: 2.5,
    region: currentUser ? currentUser.region : 'North Region',
    address: '',
    documentType: 'Aadhaar Card',
  });
  const [docFile, setDocFile] = useState(null);

  // Application Submission Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [appliedAmount, setAppliedAmount] = useState(45000);
  const [schemeDocFile, setSchemeDocFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadBeneficiaryData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Fetch beneficiary profile
      const profRes = await beneficiaryAPI.getByUserId(currentUser.id).catch(() => null);
      if (profRes && profRes.data) {
        setProfile(profRes.data);
        // 2. Fetch applications for this beneficiary
        const appRes = await applicationAPI.getByBeneficiary(profRes.data.id).catch(() => ({ data: [] }));
        setMyApplications(appRes.data);

        if (appRes.data.length > 0) {
          const firstAppId = appRes.data[0].id;
          setSelectedAppId(firstAppId);
          const disRes = await disbursementAPI.getByApplication(firstAppId).catch(() => ({ data: [] }));
          setSelectedAppMilestones(disRes.data);
        }
      }

      // 3. Fetch available schemes
      const schRes = await schemeAPI.getAll().catch(() => ({ data: [] }));
      setAvailableSchemes(schRes.data);
      if (schRes.data.length > 0) setSelectedSchemeId(schRes.data[0].id);

      setLoading(false);
    } catch (err) {
      console.error('Error loading beneficiary data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaryData();
  }, [currentUser]);

  const handleRegisterProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('userId', currentUser.id);
      formData.append('aadhaarNumber', regForm.aadhaarNumber);
      formData.append('panNumber', regForm.panNumber);
      formData.append('fullName', regForm.fullName);
      formData.append('category', regForm.category);
      formData.append('annualIncome', regForm.annualIncome);
      formData.append('landSizeAcres', regForm.landSizeAcres);
      formData.append('region', regForm.region);
      formData.append('address', regForm.address);
      formData.append('documentType', regForm.documentType || 'Identity Document');
      if (docFile) formData.append('document', docFile);

      await beneficiaryAPI.register(formData);
      setSubmitting(false);
      setShowRegisterModal(false);
      toast.success('Beneficiary Profile & Supporting Document uploaded to Cloudinary successfully!');
      loadBeneficiaryData();
      if (onRefresh) onRefresh();
    } catch (err) {
      setSubmitting(false);
      toast.error('Registration failed: ' + (err.response?.data || err.message));
    }
  };

  const handleApplyScheme = async (e) => {
    e.preventDefault();
    if (!profile) {
      toast.warning('Please register your Beneficiary Profile first!');
      return;
    }
    const foundScheme = availableSchemes.find(s => s.id === Number(selectedSchemeId));
    if (!foundScheme) {
      toast.warning('Please select an active target scheme.');
      return;
    }
    const parsedAmount = Number(appliedAmount);
    if (!appliedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.warning('Applied grant amount must be a positive number greater than ₹0.');
      return;
    }
    if (foundScheme.maxGrantAmount && parsedAmount > foundScheme.maxGrantAmount) {
      toast.warning(`Applied grant amount (₹${parsedAmount.toLocaleString()}) cannot exceed scheme ceiling of ₹${foundScheme.maxGrantAmount.toLocaleString()}.`);
      return;
    }
    if (schemeDocFile) {
      if (schemeDocFile.size > 20 * 1024 * 1024) {
        toast.warning('Uploaded document exceeds maximum allowed size of 20MB.');
        return;
      }
      const allowed = ['pdf', 'jpg', 'jpeg', 'png'];
      const ext = schemeDocFile.name?.split('.').pop()?.toLowerCase();
      if (!ext || !allowed.includes(ext)) {
        toast.warning('Invalid file format. Allowed formats: PDF, JPG, PNG.');
        return;
      }
    }
    setSubmitting(true);
    try {
      if (schemeDocFile) {
        const formData = new FormData();
        formData.append('beneficiaryId', profile.id);
        formData.append('schemeId', Number(selectedSchemeId));
        formData.append('appliedGrantAmount', Number(appliedAmount));
        formData.append('schemeDocument', schemeDocFile);
        await applicationAPI.submitWithDoc(formData);
      } else {
        await applicationAPI.submit({
          beneficiaryId: profile.id,
          schemeId: Number(selectedSchemeId),
          appliedGrantAmount: Number(appliedAmount),
        });
      }
      setSubmitting(false);
      setShowApplyModal(false);
      setSchemeDocFile(null);
      toast.success('Grant Application submitted with Cloudinary document successfully!');
      loadBeneficiaryData();
      if (onRefresh) onRefresh();
    } catch (err) {
      setSubmitting(false);
      const msg = err.response?.data?.error || err.response?.data || err.message;
      toast.error('Application submission failed: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
    }
  };

  const selectApplicationForDisbursements = async (appId) => {
    setSelectedAppId(appId);
    try {
      const res = await disbursementAPI.getByApplication(appId);
      setSelectedAppMilestones(res.data);
    } catch (err) {
      setSelectedAppMilestones([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-600 font-medium">
        <div className="w-6 h-6 border-2 border-[#1aa54c] border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading Beneficiary Citizen Portal...
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-12">
      {/* Citizen Header Banner */}
      <div className="bg-[#00142f] text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">{currentUser ? currentUser.fullName : 'Beneficiary'}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase">
                  Beneficiary Citizen Portal
                </span>
              </div>
              <p className="text-xs text-[#7a91b7]">Direct Benefit Transfer (DBT) Direct Subsidy Administration</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {profile ? (
              <span className="px-3.5 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center shadow-sm">
                <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-400" /> Profile Registered & Verified
              </span>
            ) : (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Register Profile & Upload Document
              </button>
            )}

            {profile && (
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Apply for Scheme Grant
              </button>
            )}
          </div>
        </div>

        {/* Profile Alert if Not Registered */}
        {!profile && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Please complete your profile registration to unlock scheme applications.</span>
            </div>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition"
            >
              Register Now
            </button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab('schemes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center ${
            activeTab === 'schemes'
              ? 'bg-[#0f294a] text-white shadow-sm'
              : 'bg-[#eff4ff] text-[#46617c] hover:text-[#00142f]'
          }`}
        >
          <Layers className="w-4 h-4 mr-2" />
          Active Grant Schemes ({availableSchemes.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center ${
            activeTab === 'applications'
              ? 'bg-[#0f294a] text-white shadow-sm'
              : 'bg-[#eff4ff] text-[#46617c] hover:text-[#00142f]'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          My Applications & DBT Staged Disbursements ({myApplications.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center ${
            activeTab === 'profile'
              ? 'bg-[#0f294a] text-white shadow-sm'
              : 'bg-[#eff4ff] text-[#46617c] hover:text-[#00142f]'
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          My Profile & Document Verification
        </button>
      </div>

      {/* TAB 1: SCHEMES CATALOG */}
      {activeTab === 'schemes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#00142f]">Government Grant & Subsidy Schemes</h2>
            <span className="text-xs text-slate-500">Filter Region: <strong>{currentUser?.region || 'ALL'}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableSchemes.length === 0 ? (
              <div className="col-span-3 bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
                No active schemes available currently.
              </div>
            ) : (
              availableSchemes.map((s) => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-[#1aa54c]/50 transition space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                        {s.schemeCode}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {s.targetRegion || 'ALL'}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                          {s.category}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#00142f] mb-1">{s.name}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">{s.description}</p>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Max Grant Amount:</span>
                      <strong className="text-[#1aa54c] font-mono text-sm">₹{(s.maxGrantAmount || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Income Eligibility Criteria:</span>
                      <span className="text-slate-800 font-mono">₹{(s.maxIncomeCriteria || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Target Category:</span>
                      <span className="text-slate-800 font-medium truncate max-w-[140px]">{s.targetCategories}</span>
                    </div>
                    {s.requiredDocuments && (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <span className="font-bold text-[10px] text-slate-700 block mb-0.5">Required Documents:</span>
                        <span className="text-[11px] text-slate-600 font-medium block leading-tight">{s.requiredDocuments}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!profile) {
                        toast.warning('Please register your Beneficiary Profile first!');
                        setShowRegisterModal(true);
                        return;
                      }
                      setSelectedSchemeId(s.id);
                      setAppliedAmount(s.maxGrantAmount);
                      setShowApplyModal(true);
                    }}
                    className="w-full py-2.5 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold rounded-xl transition text-xs flex items-center justify-center shadow"
                  >
                    Apply for Scheme <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY APPLICATIONS & STAGED DISBURSEMENTS */}
      {activeTab === 'applications' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications Queue */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-[#00142f] flex items-center">
              <FileText className="w-4 h-4 text-[#1aa54c] mr-2" />
              My Grant Applications ({myApplications.length})
            </h2>

            {myApplications.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
                You have not submitted any grant applications yet. Browse the <strong>Active Grant Schemes</strong> tab and submit an application!
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => selectApplicationForDisbursements(app.id)}
                    className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 cursor-pointer transition ${
                      selectedAppId === app.id ? 'border-[#1aa54c] ring-2 ring-[#1aa54c]/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                          {app.applicationNo}
                        </span>
                        {app.fastTracked && (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            FAST-TRACKED
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        app.currentStage === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        app.currentStage === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Stage: {app.currentStage}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#00142f]">{app.scheme?.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Applied Amount: <strong className="text-[#1aa54c] font-mono text-sm">₹{(app.appliedGrantAmount || 0).toLocaleString()}</strong>
                      </p>
                    </div>

                    {app.schemeDocumentUrl && (
                      <div className="pt-2 border-t border-slate-100">
                        <a
                          href={app.schemeDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline font-bold inline-flex items-center"
                        >
                          View Uploaded Scheme Document (Cloudinary) <ExternalLink className="w-3.5 h-3.5 ml-1" />
                        </a>
                      </div>
                    )}

                    {/* Score Bar */}
                    <div className="bg-[#f8f9ff] p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-bold text-[#00142f]">
                        <span>Automated Eligibility Score</span>
                        <span className="text-[#1aa54c] font-mono">{app.eligibilityScore} / 100</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#1aa54c] h-2 rounded-full"
                          style={{ width: `${app.eligibilityScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staged Disbursements Roadmap */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#00142f] flex items-center">
              <DollarSign className="w-4 h-4 text-[#1aa54c] mr-2" />
              DBT Staged Milestone Roadmap
            </h2>

            {selectedAppMilestones.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                Select an application to view its 3-stage milestone release status.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedAppMilestones.map((m) => (
                  <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#0f294a]">Stage {m.stageNumber} ({m.grantPercentage}%)</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'FUND_RELEASED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-[#00142f]">{m.milestoneName}</h4>
                    <p className="text-slate-600">Disbursement Amount: <strong className="text-[#1aa54c] font-mono">₹{(m.scheduledAmount || 0).toLocaleString()}</strong></p>

                    {m.transactionRef && (
                      <div className="p-2 bg-[#eff4ff] rounded-lg font-mono text-[10px] text-[#0f294a] border border-[#c4e0ff]">
                        Txn Ref: {m.transactionRef}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 italic font-medium pt-1 border-t border-slate-100">
                      Direct Benefit Transfer (DBT) release managed via Public Financial Management System (PFMS)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BENEFICIARY PROFILE & VERIFICATION */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#00142f] flex items-center">
                <User className="w-5 h-5 text-[#1aa54c] mr-2" />
                Beneficiary Registry Profile
              </h2>
              <p className="text-xs text-slate-500">Personal & Socio-Economic Details for Subsidy Eligibility</p>
            </div>
            {profile && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                VERIFIED PROFILE
              </span>
            )}
          </div>

          {profile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-[#00142f] text-sm">Personal Identity</h3>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Full Name:</span>
                  <strong className="text-slate-900">{profile.fullName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Identity Number / Aadhaar:</span>
                  <strong className="text-slate-900 font-mono">{profile.aadhaarNumber}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">PAN / Tax ID:</span>
                  <strong className="text-slate-900 font-mono">{profile.panNumber || 'N/A'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Category:</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">{profile.category}</span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-bold text-[#00142f] text-sm">Socio-Economic & Document Verification</h3>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Annual Income:</span>
                  <strong className="text-[#1aa54c] font-mono">₹{(profile.annualIncome || 0).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Land Size (Acres):</span>
                  <strong className="text-slate-900">{profile.landSizeAcres} Acres</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Administrative Region:</span>
                  <strong className="text-blue-700">{profile.region}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Uploaded Document Type:</span>
                  <strong className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                    {profile.documentType || 'Identity Document'}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Cloudinary File Link:</span>
                  {profile.identityDocumentUrl ? (
                    <a
                      href={profile.identityDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-bold inline-flex items-center"
                    >
                      View File <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">No File Uploaded</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-4">
              <p className="text-xs text-slate-500">You have not registered your Beneficiary Profile yet.</p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-6 py-2.5 bg-[#1aa54c] text-white font-bold text-xs rounded-xl shadow hover:bg-emerald-600 transition"
              >
                Register Beneficiary Profile Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Register Beneficiary Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-[#00142f] flex items-center">
              <User className="w-5 h-5 text-[#1aa54c] mr-2" />
              Register Beneficiary Profile & Upload Supporting Document
            </h3>
            <form onSubmit={handleRegisterProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Aadhaar / Primary ID Number</label>
                  <input
                    type="text"
                    required
                    placeholder="9876-5432-1098"
                    value={regForm.aadhaarNumber}
                    onChange={(e) => setRegForm({ ...regForm, aadhaarNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Category</label>
                  <select
                    value={regForm.category}
                    onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
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
                    value={regForm.annualIncome}
                    onChange={(e) => setRegForm({ ...regForm, annualIncome: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Administrative Region</label>
                  <select
                    value={regForm.region}
                    onChange={(e) => setRegForm({ ...regForm, region: e.target.value })}
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
                <label className="block text-slate-600 mb-1 font-semibold">Select Dynamic Document Type</label>
                <select
                  value={regForm.documentType}
                  onChange={(e) => setRegForm({ ...regForm, documentType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Land Possession Certificate / Revenue Record">Land Possession Certificate / Revenue Record</option>
                  <option value="Income Certificate">Income Certificate</option>
                  <option value="Caste / Category Certificate">Caste / Category Certificate</option>
                  <option value="Ration Card / BPL Document">Ration Card / BPL Document</option>
                  <option value="Bank Passbook">Bank Passbook</option>
                  <option value="Other Official Supporting Document">Other Official Supporting Document</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Upload {regForm.documentType || 'Supporting Document'} (PDF/Images - Uploads to Cloudinary)
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
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow flex items-center"
                >
                  {submitting ? 'Uploading to Cloudinary...' : 'Submit Profile Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Scheme Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-[#00142f] flex items-center">
              <Plus className="w-5 h-5 text-emerald-600 mr-2" />
              Submit Grant Scheme Application
            </h3>
            <form onSubmit={handleApplyScheme} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Select Target Scheme</label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => {
                    setSelectedSchemeId(e.target.value);
                    const found = availableSchemes.find(s => s.id === Number(e.target.value));
                    if (found) setAppliedAmount(found.maxGrantAmount);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                >
                  {availableSchemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} [{s.schemeCode}] - Max Grant: ₹{s.maxGrantAmount}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Scheme Info */}
              {(() => {
                const scheme = availableSchemes.find(s => s.id === Number(selectedSchemeId));
                if (!scheme) return null;
                return (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-600">Category:</span>
                      <span className="text-slate-900">{scheme.category}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-600">Target Region:</span>
                      <span className="text-blue-700 font-bold">{scheme.targetRegion || 'ALL'}</span>
                    </div>
                    {scheme.requiredDocuments && (
                      <div className="pt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-700 text-[11px] block">Required Scheme Documents:</span>
                        <span className="text-emerald-700 font-medium block text-[11px]">{scheme.requiredDocuments}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Applied Grant Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={appliedAmount}
                  onChange={(e) => setAppliedAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0f294a]"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Upload Required Scheme Document (Cloudinary)
                </label>
                <input
                  type="file"
                  onChange={(e) => setSchemeDocFile(e.target.files[0])}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-700 focus:outline-none"
                />
                <span className="text-[10px] text-emerald-600 mt-1 block">
                  Cloudinary destination: hkxztbcu/subsidy_grant_docs
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow"
                >
                  {submitting ? 'Submitting with Document...' : 'Submit Grant Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
