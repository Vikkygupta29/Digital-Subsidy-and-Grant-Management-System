import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, CheckCircle2, Clock, Upload, Plus,
  ArrowRight, X, Building, AlertTriangle, RotateCcw,
  ShieldCheck, Check, Info, FileText,
  ShieldAlert, Scale, FileCheck, ExternalLink,
  Paperclip, Trash2, Zap, Edit3, UserCheck, CreditCard
} from 'lucide-react';
import { applicationAPI, beneficiaryAPI, disbursementAPI } from '../services/api';
import { safeJsonParse } from '../utils/jsonUtils';
import {
  getDynamicFields,
  createEmptyAnswers,
  validateDynamicFields,
  getEffectiveRequiredDocs
} from '../services/dynamicFields';
import PriorityBadge from './PriorityBadge';

export function parseApplicationDocuments(schemeDocumentUrl) {
  if (!schemeDocumentUrl) return [];
  try {
    const trimmed = String(schemeDocumentUrl).trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = safeJsonParse(trimmed, null);
      if (parsed) return Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (e) {
    // fallback to single URL
  }
  return [{ name: 'Supporting Scheme Document', url: schemeDocumentUrl }];
}

export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
import { sortByPriority } from '../utils/priority';
import RejectionNoticeModal from './RejectionNoticeModal';
import { toast } from '../context/ToastContext';

export default function BeneficiaryUserDashboardView({
  currentTab = 'dashboard',
  currentUser,
  beneficiaries = [],
  schemes = [],
  applications = [],
  disbursements = [],
  complianceRecords = [],
  onRefresh,
  onSubmitApplication,
  onUploadProof
}) {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState(currentTab);

  useEffect(() => {
    if (currentTab) {
      setActiveSubTab(currentTab);
    }
  }, [currentTab]);

  const handleTabClick = (tabId) => {
    setActiveSubTab(tabId);
    const path = tabId === 'dashboard' ? '/beneficiary' : `/beneficiary/${tabId}`;
    navigate(path);
  };
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [appliedAmount, setAppliedAmount] = useState(45000);
  const [schemeDocFile, setSchemeDocFile] = useState(null);
  const [schemeDocFiles, setSchemeDocFiles] = useState({}); // { [docName]: File }
  const [reusedDocs, setReusedDocs] = useState({}); // { [docName]: { name, url, source } }
  const [customDocs, setCustomDocs] = useState([]); // [ { id, name, file } ]
  const [customDocInputName, setCustomDocInputName] = useState('');
  const [showAddCustomDoc, setShowAddCustomDoc] = useState(false);
  const [docErrors, setDocErrors] = useState({}); // { [docName]: string }
  const [submitting, setSubmitting] = useState(false);
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  const [dynamicErrors, setDynamicErrors] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Resubmit Modal State
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitApp, setResubmitApp] = useState(null);
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [resubmitAnswers, setResubmitAnswers] = useState({});
  const [resubmitDocUrl, setResubmitDocUrl] = useState('');
  const [resubmitSubmitting, setResubmitSubmitting] = useState(false);
  const [selectedRejectionApp, setSelectedRejectionApp] = useState(null);

  // Compliance proof upload state
  const [showProofUploadModal, setShowProofUploadModal] = useState(false);
  const [activeMilestoneForProof, setActiveMilestoneForProof] = useState(null);
  const [proofRemarks, setProofRemarks] = useState('');
  const [proofFile, setProofFile] = useState(null);

  const openResubmitModal = (app) => {
    setResubmitApp(app);
    setResubmitNotes('');
    const parsed = safeJsonParse(app?.dynamicFieldAnswersJson, {});
    setResubmitAnswers(parsed);
    setResubmitDocUrl(app.schemeDocumentUrl || '');
    setShowResubmitModal(true);
  };

  const handleResubmitSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!resubmitApp) return;
    setResubmitSubmitting(true);
    try {
      await applicationAPI.resubmit(resubmitApp.id, {
        notes: resubmitNotes || 'Application corrected and resubmitted by applicant.',
        dynamicFieldAnswersJson: JSON.stringify(resubmitAnswers),
        proofDocumentUrl: resubmitDocUrl,
        userId: currentUser?.id,
      });

      if (onRefresh) onRefresh();
      setShowResubmitModal(false);
      setResubmitSubmitting(false);
      toast.success('Application successfully resubmitted! It has returned to the field verification officer for inspection.');
    } catch (err) {
      setResubmitSubmitting(false);
      toast.error('Failed to resubmit application: ' + (err.response?.data?.error || err.message));
    }
  };

  // Edit / Complete Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    fullName: '',
    dob: '',
    gender: '',
    mobileNumber: '',
    category: '',
    aadhaarNumber: '',
    panNumber: '',
    annualIncome: '',
    landSizeAcres: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    state: '',
    district: '',
    block: '',
    region: '',
    address: '',
  });
  const [profileDocFile, setProfileDocFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Find logged-in beneficiary's profile strictly for current user
  const matchedProfile = beneficiaries.find(b =>
    (currentUser?.id && (b.userId === currentUser.id || b.user?.id === currentUser.id)) ||
    (currentUser?.email && (b.email?.toLowerCase() === currentUser.email?.toLowerCase() || b.user?.email?.toLowerCase() === currentUser.email?.toLowerCase())) ||
    (currentUser?.username && b.user?.username?.toLowerCase() === currentUser.username?.toLowerCase())
  );

  const fallbackProfile = {
    id: currentUser?.id,
    fullName: currentUser?.fullName || currentUser?.username || 'Citizen Beneficiary',
    email: currentUser?.email || '',
    category: currentUser?.citizenCategory || 'General',
    region: currentUser?.region || 'National',
    verificationStatus: 'PENDING',
    aadhaarNumber: null,
    panNumber: null,
    dob: null,
    gender: null,
    mobileNumber: currentUser?.mobileNumber || null,
    state: currentUser?.state || null,
    district: currentUser?.district || null,
    block: currentUser?.block || null,
    address: currentUser?.address || null,
    annualIncome: null,
    landSizeAcres: null,
    bankName: null,
    bankAccountNumber: null,
    ifscCode: null,
    identityDocumentUrl: null,
  };

  const myProfile = matchedProfile || fallbackProfile;

  const isProfileComplete = Boolean(
    myProfile?.aadhaarNumber &&
    !myProfile.aadhaarNumber.startsWith('AADHAAR-') &&
    myProfile?.bankAccountNumber &&
    myProfile?.ifscCode
  );

  const openProfileModal = () => {
    setProfileFormData({
      fullName: myProfile?.fullName || currentUser?.fullName || '',
      dob: myProfile?.dob || '',
      gender: myProfile?.gender || '',
      mobileNumber: myProfile?.mobileNumber || currentUser?.mobileNumber || '',
      category: myProfile?.category || currentUser?.citizenCategory || 'Farmer',
      aadhaarNumber: (myProfile?.aadhaarNumber && !myProfile.aadhaarNumber.startsWith('AADHAAR-')) ? myProfile.aadhaarNumber : '',
      panNumber: myProfile?.panNumber || '',
      annualIncome: (myProfile?.annualIncome != null && myProfile.annualIncome > 0) ? myProfile.annualIncome : '',
      landSizeAcres: (myProfile?.landSizeAcres != null && myProfile.landSizeAcres > 0) ? myProfile.landSizeAcres : '',
      bankName: myProfile?.bankName || '',
      bankAccountNumber: myProfile?.bankAccountNumber || '',
      ifscCode: myProfile?.ifscCode || '',
      state: myProfile?.state || '',
      district: myProfile?.district || '',
      block: myProfile?.block || '',
      region: myProfile?.region || currentUser?.region || 'North Region',
      address: (myProfile?.address && myProfile.address !== 'Registered Citizen Address') ? myProfile.address : '',
    });
    setProfileDocFile(null);
    setShowProfileModal(true);
  };

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault();
    setProfileSaving(true);
    try {
      const payload = {
        userId: currentUser?.id,
        id: matchedProfile?.id || myProfile?.id,
        ...profileFormData,
      };

      await beneficiaryAPI.updateProfile(payload);

      if (profileDocFile) {
        const docData = new FormData();
        docData.append('userId', currentUser?.id);
        docData.append('documentType', 'Identity Document (Aadhaar/KYC)');
        docData.append('file', profileDocFile);
        await beneficiaryAPI.uploadDoc(docData);
      }

      toast.success('Profile details saved successfully in database!');
      setShowProfileModal(false);
      setProfileSaving(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setProfileSaving(false);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      toast.error('Failed to update profile: ' + errMsg);
    }
  };

  // Strictly filter only this beneficiary's applications, sorted by priority (Score 100 first)
  const myApplications = sortByPriority(applications.filter(a =>
    (myProfile?.id && (a.beneficiaryId === myProfile.id || a.beneficiary?.id === myProfile.id)) ||
    (myProfile?.fullName && a.beneficiary?.fullName?.toLowerCase() === myProfile.fullName?.toLowerCase()) ||
    (currentUser?.fullName && a.beneficiary?.fullName?.toLowerCase() === currentUser.fullName?.toLowerCase())
  ));

  // Strictly filter only this beneficiary's disbursements
  const myAppIds = myApplications.map(a => a.id);
  const myDisbursements = disbursements.filter(d =>
    myAppIds.includes(d.applicationId) || myAppIds.includes(d.application?.id)
  );

  // Strictly filter only this beneficiary's compliance records
  const myComplianceRecords = complianceRecords.filter(c =>
    myApplications.some(a => a.applicationNo === c.applicationNo) ||
    (myProfile?.fullName && c.beneficiaryName === myProfile.fullName)
  );

  // Filter eligible schemes based on beneficiary's income, age, category
  const myEligibleSchemes = schemes.filter(s => {
    if (!myProfile) return true;
    const incomeMatches =
      s.maxIncomeCriteria === null ||
      s.maxIncomeCriteria === undefined ||
      Number(s.maxIncomeCriteria) <= 0 ||
      (myProfile?.annualIncome || 0) <= Number(s.maxIncomeCriteria);

    const userCat = (myProfile?.category || 'General').trim().toLowerCase();
    const targetCats = (s.targetCategories || '')
      .split(',')
      .map(c => c.trim().toLowerCase())
      .filter(Boolean);

    const categoryMatches =
      targetCats.length === 0 ||
      targetCats.includes('all') ||
      targetCats.includes('general') ||
      targetCats.includes(userCat) ||
      (userCat.includes('student') && targetCats.includes('student')) ||
      (userCat.includes('farmer') && targetCats.includes('farmer'));

    return incomeMatches && categoryMatches;
  });

  const selectedScheme =
    schemes.find(
      s => s.id === Number(selectedSchemeId)
    ) || null;

  const dynamicFields =
    getDynamicFields(selectedScheme);

  // Calculate totals strictly from DB records (no hardcoded fallback numbers!)
  const totalApprovedGrant = myApplications
    .filter(a => a.currentStage === 'APPROVED')
    .reduce(
      (acc, a) => acc + (a.appliedGrantAmount || 0),
      0
    );

  const totalDisbursedToMe = myDisbursements
    .filter(d => d.status === 'FUND_RELEASED')
    .reduce(
      (acc, d) => acc + (d.disbursedAmount || 0),
      0
    );

  const resetDynamicFields = (scheme) => {
    const fields = getDynamicFields(scheme);
    setDynamicAnswers(createEmptyAnswers(fields));
    setDynamicErrors({});
  };

  const getRequiredDocsForScheme = (scheme) => {
    return getEffectiveRequiredDocs(scheme);
  };

  const activeSelectedScheme = schemes.find(s => s.id === Number(selectedSchemeId));
  const requiredDocs = useMemo(() => {
    return getRequiredDocsForScheme(activeSelectedScheme);
  }, [activeSelectedScheme]);

  const totalRequiredCount = requiredDocs.length;
  const uploadedCount = useMemo(() => {
    return requiredDocs.filter(
      docName => Boolean(schemeDocFiles[docName]) || Boolean(reusedDocs[docName])
    ).length;
  }, [requiredDocs, schemeDocFiles, reusedDocs]);

  const isAllDocsUploaded = totalRequiredCount > 0 && uploadedCount === totalRequiredCount;
  const uploadProgressPct = totalRequiredCount > 0 ? Math.round((uploadedCount / totalRequiredCount) * 100) : 0;

  const openApplyModal = (scheme) => {
    setFormErrors({});
    setDynamicErrors({});
    setDocErrors({});
    setSchemeDocFiles({});
    setCustomDocs([]);
    setCustomDocInputName('');
    setShowAddCustomDoc(false);

    const targetScheme = scheme || (schemes.length > 0 ? schemes[0] : null);
    if (targetScheme) {
      setSelectedSchemeId(targetScheme.id);
      setAppliedAmount(targetScheme.maxGrantAmount || 50000);
      resetDynamicFields(targetScheme);

      // Auto-link verified profile Aadhaar if required
      const reqDocs = getRequiredDocsForScheme(targetScheme);
      const initialReused = {};
      if (myProfile?.identityDocumentUrl) {
        const aadhaarDoc = reqDocs.find(d =>
          d.toLowerCase().includes('aadhaar') || d.toLowerCase().includes('identity')
        );
        if (aadhaarDoc) {
          initialReused[aadhaarDoc] = {
            name: aadhaarDoc,
            url: myProfile.identityDocumentUrl,
            source: 'Verified Profile KYC'
          };
        }
      }
      setReusedDocs(initialReused);
    } else {
      setReusedDocs({});
    }
    setSchemeDocFile(null);
    setShowApplyModal(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const dErrors = {};

    // 1. Target Scheme Validation
    const targetScheme = schemes.find(s => s.id === Number(selectedSchemeId));
    if (!selectedSchemeId || !targetScheme) {
      errors.schemeId = 'Please select a valid target grant scheme.';
    }

    // 2. Applied Grant Amount Validation
    const parsedAmount = Number(appliedAmount);
    if (!appliedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.appliedAmount = 'Applied grant amount must be a positive number greater than ₹0.';
    } else if (targetScheme?.maxGrantAmount && parsedAmount > targetScheme.maxGrantAmount) {
      errors.appliedAmount = `Applied grant amount (₹${parsedAmount.toLocaleString()}) cannot exceed the scheme maximum ceiling of ₹${targetScheme.maxGrantAmount.toLocaleString()}.`;
    }

    // 3. Beneficiary Profile & DBT Readiness Validation
    if (!myProfile) {
      errors.profile = 'No citizen beneficiary profile linked. Please complete your registration under My Profile first.';
    } else if (!myProfile.aadhaarNumber) {
      errors.profile = 'Aadhaar identity number is required for DBT subsidy verification.';
    }

    // 4. Dynamic Scheme-Specific Fields Validation
    const dynamicValidationErrors = validateDynamicFields(
      dynamicFields,
      dynamicAnswers
    );
    setDynamicErrors(dynamicValidationErrors);

    // 5. Scheme-Specific Required Documents Validation (All Mandatory)
    const reqDocs = getRequiredDocsForScheme(targetScheme);
    const missingDocs = [];
    const allowedExts = ['pdf', 'jpg', 'jpeg', 'png'];
    const maxBytes = 20 * 1024 * 1024; // 20 MB

    reqDocs.forEach(docName => {
      const file = schemeDocFiles[docName];
      const reused = reusedDocs[docName];

      if (!file && !reused) {
        missingDocs.push(docName);
        dErrors[docName] = `This document is required for ${targetScheme?.name || 'this scheme'}.`;
      } else if (file) {
        if (file.size > maxBytes) {
          dErrors[docName] = `File exceeds the 20MB limit (${formatFileSize(file.size)}).`;
        }
        const ext = file.name?.split('.').pop()?.toLowerCase();
        if (!ext || !allowedExts.includes(ext)) {
          dErrors[docName] = 'Invalid file format. Only PDF, JPG, and PNG documents are accepted.';
        }
      }
    });

    // Custom docs validation
    customDocs.forEach(cd => {
      if (cd.file) {
        if (cd.file.size > maxBytes) {
          dErrors[cd.name] = 'File exceeds the 20MB limit.';
        }
        const ext = cd.file.name?.split('.').pop()?.toLowerCase();
        if (!ext || !allowedExts.includes(ext)) {
          dErrors[cd.name] = 'Invalid file format. Only PDF, JPG, and PNG documents are accepted.';
        }
      }
    });

    setDocErrors(dErrors);

    if (missingDocs.length > 0) {
      errors.documents = `Please upload all ${missingDocs.length} required scheme verification document(s).`;
    }

    setFormErrors(errors);

    const errorMessages = [
      ...Object.values(errors),
      ...Object.values(dynamicValidationErrors),
      ...Object.values(dErrors)
    ];

    if (errorMessages.length > 0) {
      toast.warning('Please complete all required fields and documents:\n\n• ' + errorMessages.join('\n• '));
      return;
    }

    setSubmitting(true);

    try {
      const uploadedEntries = Object.entries(schemeDocFiles).filter(([_, f]) => Boolean(f));
      const reusedEntries = Object.entries(reusedDocs).filter(([_, r]) => Boolean(r?.url));

      // Construct local document list for instant optimistic rendering
      const localDocs = [
        ...uploadedEntries.map(([name, file]) => ({
          name,
          fileName: file.name,
          fileSize: file.size,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString()
        })),
        ...reusedEntries.map(([name, r]) => ({
          name,
          fileName: `${name.replace(/\s+/g, '_')}_Verified.pdf`,
          fileSize: 102400,
          url: r.url,
          uploadedAt: new Date().toISOString(),
          source: r.source || 'CITIZEN_PROFILE_KYC'
        })),
        ...customDocs.filter(cd => Boolean(cd.file)).map(cd => ({
          name: cd.name || 'Additional Document',
          fileName: cd.file.name,
          fileSize: cd.file.size,
          url: URL.createObjectURL(cd.file),
          uploadedAt: new Date().toISOString()
        }))
      ];

      const effectiveBeneficiaryId = matchedProfile?.id || currentUser?.id || 1;

      const newApp = {
        id: Date.now(),
        applicationNo: `APP-2026-${targetScheme?.schemeCode?.split('-')[1] || 'SUB'}-${Math.floor(1000 + Math.random() * 9000)}`,
        beneficiaryId: effectiveBeneficiaryId,
        schemeId: Number(selectedSchemeId),
        appliedGrantAmount: Number(appliedAmount),
        currentStage: 'FIELD_VERIFICATION',
        status: 'UNDER_REVIEW',
        fastTracked: false,
        escalated: false,
        schemeDocumentUrl: JSON.stringify(localDocs),
        createdAt: new Date().toISOString(),
        scoreBreakdown: {
          incomeScore: 32,
          categoryScore: 25,
          regionScore: 20,
          docVerificationScore: 11,
          total: 0
        },
        dynamicFieldAnswers: dynamicAnswers
      };

      try {
        const formData = new FormData();
        formData.append('beneficiaryId', effectiveBeneficiaryId);
        formData.append('schemeId', selectedSchemeId);
        formData.append('appliedGrantAmount', appliedAmount);
        formData.append('dynamicFieldAnswersJson', JSON.stringify(dynamicAnswers));

        // Append multiple documents
        uploadedEntries.forEach(([name, file]) => {
          formData.append('schemeDocuments', file);
          formData.append('documentNames', name);
        });

        // Append custom docs
        customDocs.forEach(cd => {
          if (cd.file) {
            formData.append('schemeDocuments', cd.file);
            formData.append('documentNames', cd.name || 'Additional Document');
          }
        });

        // Backward compatibility fallback for single schemeDocument
        if (uploadedEntries.length > 0) {
          formData.append('schemeDocument', uploadedEntries[0][1]);
        }

        // Reused docs metadata
        if (reusedEntries.length > 0) {
          const reusedMetaList = reusedEntries.map(([name, r]) => ({
            name,
            url: r.url,
            fileName: `${name.replace(/\s+/g, '_')}_Verified.pdf`,
            fileSize: 102400,
            uploadedAt: new Date().toISOString(),
            source: r.source || 'CITIZEN_PROFILE_KYC'
          }));
          formData.append('documentsMetaJson', JSON.stringify(reusedMetaList));
        }

        const apiRes = await applicationAPI.submitWithDoc(formData);
        if (apiRes.data) {
          Object.assign(newApp, apiRes.data);
        }
      } catch (apiErr) {
        const errorMsg = apiErr.response?.data?.error || apiErr.response?.data || apiErr.message;
        console.warn('Backend API submit notice:', errorMsg);
        setSubmitting(false);
        setFormErrors({ general: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) });
        toast.error('Submission Failed: ' + (typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)));
        return;
      }

      if (onSubmitApplication) {
        onSubmitApplication(newApp);
      }

      if (onRefresh) {
        onRefresh();
      }

      setSubmitting(false);
      setShowApplyModal(false);
      setSchemeDocFiles({});
      setReusedDocs({});
      setCustomDocs([]);
      setFormErrors({});
      setDocErrors({});

      toast.success(`Application ${newApp.applicationNo} submitted successfully with ${localDocs.length} verification document(s)!`);
    } catch (err) {
      setSubmitting(false);
      toast.error('Application submission failed: ' + err.message);
    }
  };

  const handleProofSubmit = async (e) => {
    e.preventDefault();

    if (!activeMilestoneForProof) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      if (currentUser?.id) {
        formData.append('userId', currentUser.id);
      }
      if (proofRemarks) {
        formData.append('remarks', proofRemarks);
      }
      if (proofFile) {
        formData.append('proofFile', proofFile);
      }

      await disbursementAPI.submitProof(activeMilestoneForProof.id, formData);

      if (onUploadProof) {
        try {
          onUploadProof(
            activeMilestoneForProof.id,
            {
              remarks: proofRemarks,
              proofDocumentUrl: proofFile ? URL.createObjectURL(proofFile) : ''
            }
          );
        } catch (ignored) {}
      }

      if (onRefresh) {
        await onRefresh();
      }

      setSubmitting(false);
      setShowProofUploadModal(false);
      setProofRemarks('');
      setProofFile(null);

      toast.success(
        'Milestone compliance proof uploaded successfully! Sent to Field Officer for inspection.'
      );
    } catch (err) {
      setSubmitting(false);
      const errMsg = err.response?.data?.message || err.message || 'Unknown error';
      toast.error('Proof upload failed: ' + errMsg);
    }
  };

  const latestApp = myApplications[0];

  return (
    <div className="space-y-6 pt-2 pb-12">

      {/* Beneficiary Header Banner */}
      <div className="bg-[#00142f] text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => {
              const firstScheme = schemes.find(s => s.active !== false) || schemes[0];
              if (!firstScheme) {
                toast.info('No active scheme is currently available.');
                return;
              }
              openApplyModal(firstScheme);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Apply for Scheme
          </button>
        </div>

        {/* Sub Navigation Tabs for Beneficiary */}
        <div className="flex space-x-1 pt-3 border-t border-slate-800 overflow-x-auto scrollbar-none text-xs">

          {[
            { id: 'dashboard', label: 'Overview' },
            { id: 'profile', label: 'My Profile' },
            { id: 'schemes', label: `Schemes (${schemes.length})` },
            { id: 'applications', label: `My Applications (${myApplications.length})` },
            { id: 'documents', label: 'Documents' },
            { id: 'disbursements', label: 'Disbursements (DBT)' },
            { id: 'compliance', label: 'Compliance & Milestones' },
          ].map((tab) => (

            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${activeSubTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#7a91b7] hover:text-white hover:bg-white/5'
                }`}
            >
              {tab.label}
            </button>

          ))}

        </div>
      </div>

      {/* SUB-VIEW 1: OVERVIEW / DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">

          {/* Key Beneficiary Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs uppercase font-semibold block">
                Total Approved Grants
              </span>

              <div className="text-2xl font-black font-mono text-[#1aa54c]">
                ₹{totalApprovedGrant.toLocaleString()}
              </div>

              <span className="text-xs text-slate-400">
                Direct Subsidy Sanctioned
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs uppercase font-semibold block">
                Disbursed Funds (DBT Credited)
              </span>

              <div className="text-2xl font-black font-mono text-[#00142f]">
                ₹{totalDisbursedToMe.toLocaleString()}
              </div>

              <span className={`text-xs font-semibold ${myProfile?.bankAccountNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                {myProfile?.bankAccountNumber ? `Credited to Bank A/C (•••• ${myProfile.bankAccountNumber.slice(-4)})` : 'Bank A/C: Not Linked'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <span className="text-slate-500 text-xs uppercase font-semibold block">
                Eligible Schemes
              </span>

              <div className="text-2xl font-black font-mono text-[#0f294a]">
                {myEligibleSchemes.length} Schemes
              </div>

              <span className="text-xs text-blue-600 font-semibold">
                Matching your profile & income
              </span>
            </div>

          </div>

          {/* 1. Urgent Reapplication Required Banner */}
          {myApplications.some(a => a.status === 'REAPPLY_REQUIRED') && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-6 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-900">Immediate Action Required: Application Correction Requested</h3>
                  <p className="text-xs text-amber-800">An administrative officer reviewed your file and requested corrections before grant clearance.</p>
                </div>
              </div>
              {myApplications.filter(a => a.status === 'REAPPLY_REQUIRED').map(app => {
                const maxReapply = app.maxReapplyAllowed || 2;
                const currentAttempts = app.reapplyCount || 1;
                const isExhausted = app.reapplyExhausted || currentAttempts >= maxReapply;
                const remaining = Math.max(0, maxReapply - currentAttempts);

                return (
                  <div key={app.id} className="p-4 bg-white rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#00142f] font-bold bg-amber-100 px-2 py-0.5 rounded">{app.applicationNo}</span>
                        <span className="text-[#00142f] font-semibold">&bull; {app.scheme?.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isExhausted ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                          {isExhausted ? 'Attempts Limit Exhausted' : `Attempt ${currentAttempts} of ${maxReapply}`}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        Returned by: <strong>{app.lastReappliedByRole || 'Verification Officer'}</strong> &bull; Remaining corrections allowed: <strong className="text-amber-800 font-mono">{remaining}</strong>
                      </div>
                      <div className="text-amber-900 font-medium italic bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                        "{app.lastReapplyReason}"
                      </div>
                    </div>
                    {isExhausted ? (
                      <div className="text-right space-y-1">
                        <span className="text-[11px] text-red-700 font-bold block">Resubmission Locked (2/2 Used)</span>
                        <button
                          onClick={() => setSelectedRejectionApp(app)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition text-xs flex items-center"
                        >
                          <Scale className="w-3.5 h-3.5 mr-1" /> File Appeal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openResubmitModal(app)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow transition flex items-center whitespace-nowrap self-start sm:self-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Update & Resubmit ({remaining} left)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Formal Rejection Notice Banner */}
          {myApplications.some(a => a.status === 'REJECTED') && (
            <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-xl text-red-800">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-950">Statutory Rejection Orders & Disqualification Notices</h3>
                  <p className="text-xs text-red-800">Applications disqualified during scrutiny. You have the right to inspect the formal order and file a statutory appeal within 30 days.</p>
                </div>
              </div>
              {myApplications.filter(a => a.status === 'REJECTED').map(app => (
                <div key={app.id} className="p-4 bg-white rounded-2xl border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-red-950 font-bold bg-red-100 px-2 py-0.5 rounded">{app.applicationNo}</span>
                      <span className="text-slate-800 font-semibold">&bull; {app.scheme?.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                        {app.rejectionCategory || 'DISQUALIFIED'}
                      </span>
                    </div>
                    <div className="text-red-900 font-medium">
                      Rationale: <span className="italic font-normal">{app.rejectionReason || app.remarks || 'Statutory criteria verification failed.'}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Disqualified by: <strong>{app.rejectedBy || 'Review Authority'}</strong> ({app.rejectedByRole || 'DISTRICT_OFFICER'}) &bull; Date: {app.rejectedAt ? new Date(app.rejectedAt).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => setSelectedRejectionApp(app)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow transition text-xs flex items-center whitespace-nowrap"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" /> View Order
                    </button>
                    {app.canAppeal && (
                      <button
                        onClick={() => setSelectedRejectionApp(app)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition text-xs flex items-center whitespace-nowrap"
                      >
                        <Scale className="w-3.5 h-3.5 mr-1" /> File Appeal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Statutory Appeal / Re-Verification Under Review Banner */}
          {myApplications.some(a => a.status === 'RE_VERIFICATION_REQUESTED') && (
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-3xl p-6 shadow-sm space-y-3 animate-in fade-in">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-800">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-indigo-950">Statutory Re-Verification Appeal Under Review</h3>
                  <p className="text-xs text-indigo-800">Your grievance appeal and supplementary documents have been submitted to the District Review Authority for re-assessment.</p>
                </div>
              </div>
              {myApplications.filter(a => a.status === 'RE_VERIFICATION_REQUESTED').map(app => (
                <div key={app.id} className="p-4 bg-white rounded-2xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-950 font-bold bg-indigo-100 px-2 py-0.5 rounded">{app.applicationNo}</span>
                      <span className="text-slate-800 font-semibold">&bull; {app.scheme?.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                        APPEAL PENDING REVIEW
                      </span>
                    </div>
                    <div className="text-indigo-900 italic">
                      "Grounds: {app.reVerificationAppealGrounds || 'Citizen filed appeal with supplementary verification records.'}"
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-bold rounded-xl text-xs whitespace-nowrap self-start sm:self-auto">
                    District Hearing Queued
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Active Application Lifecycle Stepper */}
          {latestApp && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">

              <div className="flex items-center justify-between">

                <div>
                  <div className="flex items-center space-x-2">

                    <span className="font-mono text-xs font-bold text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                      {latestApp.applicationNo}
                    </span>

                    <h3 className="text-sm font-bold text-[#00142f]">
                      Application Progress Tracker
                    </h3>

                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    Live verification & sanction progress through sovereign administration
                  </p>
                </div>

                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  Eligibility Score: {latestApp.eligibilityScore} / 100
                </span>

              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs pt-2">

                <div className="p-2.5 bg-[#eff4ff] rounded-xl border border-[#c4e0ff]">
                  <span className="text-[10px] text-slate-500 font-bold block">
                    1. Submitted
                  </span>

                  <strong className="text-emerald-700 text-xs">
                    Completed ✓
                  </strong>

                  <div className="w-full bg-[#1aa54c] h-1.5 rounded-full mt-2"></div>
                </div>

                <div className="p-2.5 bg-[#eff4ff] rounded-xl border border-[#c4e0ff]">
                  <span className="text-[10px] text-slate-500 font-bold block">
                    2. Scoring
                  </span>

                  <strong className="text-emerald-700 text-xs">
                    {latestApp.eligibilityScore} Pts ✓
                  </strong>

                  <div className="w-full bg-[#1aa54c] h-1.5 rounded-full mt-2"></div>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${latestApp.currentStage === 'FIELD_VERIFICATION'
                      ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                      : 'bg-[#eff4ff] border-[#c4e0ff]'
                    }`}
                >
                  <span className="text-[10px] text-amber-700 font-bold block">
                    3. Field Check
                  </span>

                  <strong className="text-[#00142f] text-xs">
                    {latestApp.currentStage === 'FIELD_VERIFICATION'
                      ? 'In Progress'
                      : 'Completed ✓'}
                  </strong>

                  <div className="w-full bg-amber-500 h-1.5 rounded-full mt-2"></div>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${latestApp.currentStage === 'DISTRICT_REVIEW'
                      ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400'
                      : 'bg-[#eff4ff] border-[#c4e0ff]'
                    }`}
                >
                  <span className="text-[10px] text-indigo-700 font-bold block">
                    4. District Rev
                  </span>

                  <strong className="text-[#00142f] text-xs">
                    {latestApp.currentStage === 'DISTRICT_REVIEW'
                      ? 'In Progress'
                      : ['FINANCE_APPROVAL', 'APPROVED'].includes(
                        latestApp.currentStage
                      )
                        ? 'Cleared ✓'
                        : 'Queued'}
                  </strong>

                  <div className="w-full bg-indigo-500 h-1.5 rounded-full mt-2"></div>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${latestApp.currentStage === 'FINANCE_APPROVAL'
                      ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-400'
                      : 'bg-[#eff4ff] border-[#c4e0ff]'
                    }`}
                >
                  <span className="text-[10px] text-teal-700 font-bold block">
                    5. Finance Sign
                  </span>

                  <strong className="text-[#00142f] text-xs">
                    {latestApp.currentStage === 'FINANCE_APPROVAL'
                      ? 'Sanctioning'
                      : latestApp.currentStage === 'APPROVED'
                        ? 'Sanctioned ✓'
                        : 'Queued'}
                  </strong>

                  <div className="w-full bg-teal-500 h-1.5 rounded-full mt-2"></div>
                </div>

                <div
                  className={`p-2.5 rounded-xl border ${latestApp.currentStage === 'APPROVED'
                      ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
                      : 'bg-[#f8f9ff] border-slate-200'
                    }`}
                >
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    6. Disbursed
                  </span>

                  <strong className="text-emerald-800 text-xs">
                    {latestApp.currentStage === 'APPROVED'
                      ? 'Active DBT ✓'
                      : 'Awaiting'}
                  </strong>

                  <div className="w-full bg-emerald-500 h-1.5 rounded-full mt-2"></div>
                </div>

              </div>
            </div>
          )}

          {/* Staged Disbursements & Milestones for Beneficiary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">

            <div className="flex items-center justify-between">

              <div>
                <h3 className="text-sm font-bold text-[#00142f]">
                  My Grant Disbursement Milestones
                </h3>

                <p className="text-xs text-slate-500">
                  Staged fund transfers credited directly to your bank account via PFMS
                </p>
              </div>

            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">

              <table className="w-full text-left text-xs text-[#00142f]">

                <thead className="bg-[#eff4ff] text-[#46617c] font-bold uppercase text-[11px]">

                  <tr>
                    <th className="p-3">
                      Stage & Milestone
                    </th>

                    <th className="p-3 text-right">
                      Scheduled (INR)
                    </th>

                    <th className="p-3 text-right">
                      Disbursed (INR)
                    </th>

                    <th className="p-3">
                      Due Date
                    </th>

                    <th className="p-3">
                      Status
                    </th>

                    <th className="p-3">
                      PFMS Ref / UTR
                    </th>

                    <th className="p-3 text-right">
                      Action
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {myDisbursements.length === 0 ? (

                    <tr>
                      <td
                        colSpan="7"
                        className="p-6 text-center text-slate-500"
                      >
                        No active disbursement tranches yet. Apply for a scheme above to begin your grant lifecycle!
                      </td>
                    </tr>

                  ) : (

                    myDisbursements.map((m) => (

                      <tr
                        key={m.id}
                        className="hover:bg-[#f8f9ff]"
                      >

                        <td className="p-3 font-semibold">
                          Stage {m.stageNumber}: {m.milestoneName}
                        </td>

                        <td className="p-3 text-right font-mono font-bold">
                          ₹{(m.scheduledAmount || 0).toLocaleString()}
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-[#1aa54c]">
                          ₹{(m.disbursedAmount || 0).toLocaleString()}
                        </td>

                        <td className="p-3 text-slate-600">
                          {m.dueDate}
                        </td>

                        <td className="p-3">

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'FUND_RELEASED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                              }`}
                          >
                            {m.status.replace('_', ' ')}
                          </span>

                        </td>

                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {m.transactionRef}
                        </td>

                        <td className="p-3 text-right">

                          {m.stageNumber === 1 ? (
                            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Advance DBT Credited
                            </span>
                          ) : m.status === 'PENDING_COMPLIANCE' ? (
                            <button
                              onClick={() => {
                                setActiveMilestoneForProof(m);
                                setProofRemarks('');
                                setProofFile(null);
                                setShowProofUploadModal(true);
                              }}
                              className="px-2.5 py-1 bg-[#00142f] hover:bg-[#0f294a] text-white rounded-lg font-bold text-[11px] inline-flex items-center shadow-sm"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              Upload Proof
                            </button>
                          ) : m.status === 'PROOF_SUBMITTED' ? (
                            <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                              <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
                              Under Inspection
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Fund Released
                            </span>
                          )}

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </div>
        </div>
      )}

      {/* SUB-VIEW 2: MY PROFILE */}
      {activeSubTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">

          {/* Incomplete Profile Alert Banner */}
          {!isProfileComplete && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Profile Details Incomplete</h4>
                  <p className="text-[11px] text-amber-700">
                    Your citizen profile has not been fully completed. Add your Aadhaar, bank details, and address to enable instant DBT grant disbursements.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={openProfileModal}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center shrink-0 shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Complete Profile Now
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#00142f]">
                Beneficiary Profile & Identity Registry
              </h2>
              <p className="text-xs text-slate-500">
                Official citizen KYC credentials and bank information for Direct Benefit Transfer
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className={`px-3 py-1 font-bold text-xs rounded-full ${
                isProfileComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                STATUS: {isProfileComplete ? 'VERIFIED' : 'PENDING COMPLETION'}
              </span>
              <button
                type="button"
                onClick={openProfileModal}
                className="px-3.5 py-1.5 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold text-xs rounded-xl flex items-center shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Complete / Edit Profile
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">

            <div className="p-5 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-[#00142f] uppercase text-[11px] flex items-center">
                <User className="w-4 h-4 text-emerald-600 mr-2" />
                Personal & Demographic Information
              </h3>

              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Full Name:</span>
                  <strong className="text-[#00142f]">
                    {myProfile?.fullName || currentUser?.fullName || <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Date of Birth:</span>
                  <strong className="text-[#00142f]">
                    {myProfile?.dob || <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Gender:</span>
                  <strong className="text-[#00142f]">
                    {myProfile?.gender || <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Mobile Number:</span>
                  <strong className="text-[#00142f]">
                    {myProfile?.mobileNumber || currentUser?.mobileNumber || <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Social Category:</span>
                  <strong className="text-emerald-700 font-bold">
                    {myProfile?.category || currentUser?.citizenCategory || 'General'}
                  </strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Aadhaar Reference:</span>
                  {myProfile?.aadhaarNumber && !myProfile.aadhaarNumber.startsWith('AADHAAR-') ? (
                    <strong className="font-mono text-[#00142f]">{myProfile.aadhaarNumber}</strong>
                  ) : (
                    <span className="text-amber-600 font-medium italic">Not Provided • Complete Profile</span>
                  )}
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>PAN Reference:</span>
                  {myProfile?.panNumber ? (
                    <strong className="font-mono text-[#00142f]">{myProfile.panNumber}</strong>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not Provided</span>
                  )}
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Annual Family Income:</span>
                  {myProfile?.annualIncome != null && Number(myProfile.annualIncome) > 0 ? (
                    <strong className="font-mono text-[#00142f]">₹{Number(myProfile.annualIncome).toLocaleString()}</strong>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not Declared</span>
                  )}
                </div>

                {myProfile?.landSizeAcres != null && Number(myProfile.landSizeAcres) > 0 && (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Agricultural Land Size:</span>
                    <strong className="text-[#00142f]">{myProfile.landSizeAcres} Acres</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-[#00142f] uppercase text-[11px] flex items-center">
                <Building className="w-4 h-4 text-blue-600 mr-2" />
                Address & Direct Benefit Bank Details
              </h3>

              <div className="space-y-2 text-slate-700">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Bank Name:</span>
                  {myProfile?.bankName ? (
                    <strong className="text-[#00142f]">{myProfile.bankName}</strong>
                  ) : (
                    <span className="text-amber-600 font-medium italic">Not Linked</span>
                  )}
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Bank Account Number:</span>
                  {myProfile?.bankAccountNumber ? (
                    <strong className="font-mono text-[#00142f]">•••• {myProfile.bankAccountNumber.slice(-4)}</strong>
                  ) : (
                    <span className="text-amber-600 font-medium italic">Not Linked</span>
                  )}
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>IFSC Code:</span>
                  {myProfile?.ifscCode ? (
                    <strong className="font-mono text-[#00142f]">{myProfile.ifscCode}</strong>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not Provided</span>
                  )}
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>State & Region:</span>
                  <strong className="text-[#00142f]">
                    {myProfile?.state ? `${myProfile.state} • ` : ''}{myProfile?.region || currentUser?.region || 'National'}
                  </strong>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>District:</span>
                  {myProfile?.district ? (
                    <strong className="text-[#00142f]">{myProfile.district}</strong>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not Provided</span>
                  )}
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Block / Tehsil:</span>
                  {myProfile?.block ? (
                    <strong className="text-[#00142f]">{myProfile.block}</strong>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not Provided</span>
                  )}
                </div>

                <div className="flex justify-between">
                  <span>Full Address:</span>
                  {myProfile?.address && myProfile.address !== 'Registered Citizen Address' ? (
                    <strong className="text-[#00142f] text-right max-w-[200px] truncate">{myProfile.address}</strong>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not Provided</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-VIEW 3: SCHEMES & ELIGIBLE SCHEMES */}
      {activeSubTab === 'schemes' && (
        <div className="space-y-6">

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div>
              <h2 className="text-base font-extrabold text-[#00142f]">
                Government Subsidy Schemes
              </h2>

              <p className="text-xs text-slate-500">
                Explore central and state schemes with auto-filtered eligibility checks
              </p>
            </div>

            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              {myEligibleSchemes.length} Schemes Matching Your Profile
            </span>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {schemes.map((scheme) => {

              const isEligible =
                myEligibleSchemes.some(
                  s => s.id === scheme.id
                );

              return (
                <div
                  key={scheme.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-[#1aa54c]/50 transition space-y-4"
                >

                  <div>

                    <div className="flex items-center justify-between mb-2">

                      <span className="px-2.5 py-1 bg-[#eff4ff] text-[#00142f] text-xs font-mono font-bold rounded-lg border border-[#c4e0ff]">
                        {scheme.schemeCode}
                      </span>

                      {isEligible ? (

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ ELIGIBLE
                        </span>

                      ) : (

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          CRITERIA MISMATCH
                        </span>

                      )}

                    </div>

                    <h3 className="text-sm font-bold text-[#00142f] mb-1">
                      {scheme.name}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {scheme.description}
                    </p>

                    <div className="bg-[#f8f9ff] p-3 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600 mb-2">

                      <div className="flex justify-between">
                        <span>Max Grant:</span>

                        <strong className="font-mono text-[#1aa54c]">
                          ₹{(scheme.maxGrantAmount || 0).toLocaleString()}
                        </strong>
                      </div>

                      <div className="flex justify-between">
                        <span>Income Limit:</span>

                        <strong className="text-[#00142f]">
                          &le; ₹{(scheme.maxIncomeCriteria || 300000).toLocaleString()}
                        </strong>
                      </div>

                      <div className="flex justify-between">
                        <span>Target Category:</span>

                        <strong className="text-slate-800">
                          {scheme.targetCategories}
                        </strong>
                      </div>

                    </div>
                  </div>

                  <button
                    onClick={() => openApplyModal(scheme)}
                    className="w-full py-2 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center"
                  >
                    Apply for this Scheme
                    <ArrowRight className="w-3.5 h-3.5 ml-1 text-emerald-400" />
                  </button>

                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* SUB-VIEW 4: MY APPLICATIONS */}
      {activeSubTab === 'applications' && (
        <div className="space-y-4">

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">

            <h2 className="text-base font-extrabold text-[#00142f]">
              My Submitted Applications ({myApplications.length})
            </h2>

            <button
              onClick={() => openApplyModal()}
              className="px-4 py-2 bg-[#00142f] text-white font-bold text-xs rounded-xl shadow"
            >
              <Plus className="w-3.5 h-3.5 mr-1 inline" />
              New Application
            </button>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {myApplications.map((app) => {
              const maxReapply = app.maxReapplyAllowed || 2;
              const currentAttempts = app.reapplyCount || 0;
              const isExhausted = app.reapplyExhausted || currentAttempts >= maxReapply;
              const remaining = Math.max(0, maxReapply - currentAttempts);
              const isRejected = app.status === 'REJECTED';
              const isAppealPending = app.status === 'RE_VERIFICATION_REQUESTED';

              return (
              <div
                key={app.id}
                className={`bg-white border rounded-2xl p-6 shadow-sm space-y-3 transition ${
                  isRejected
                    ? 'border-red-400 bg-red-50/10 ring-2 ring-red-300/40'
                    : isAppealPending
                    ? 'border-indigo-400 bg-indigo-50/10 ring-2 ring-indigo-300/40'
                    : app.eligibilityScore >= 90
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : app.status === 'REAPPLY_REQUIRED'
                    ? 'border-amber-400 ring-2 ring-amber-300/50'
                    : 'border-slate-200'
                }`}
              >
                {/* Score >= 90 Direct Higher Officer Fast-Track Banner */}
                {app.eligibilityScore >= 90 && !isRejected && (
                  <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Direct Higher Officer Fast-Track (Score {app.eligibilityScore}/100 ≥ 90)
                    </span>
                    <span className="text-[11px] font-medium bg-white text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                      Green Channel • Ground Inspection Waived
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-[#00142f] bg-[#eff4ff] px-2.5 py-1 rounded-lg border border-[#c4e0ff]">
                    {app.applicationNo}
                  </span>

                  <div className="flex items-center gap-2">
                    <PriorityBadge score={app.eligibilityScore} />
                    {isRejected ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                        DISQUALIFIED / REJECTED
                      </span>
                    ) : isAppealPending ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">
                        APPEAL PENDING HEARING
                      </span>
                    ) : app.status === 'REAPPLY_REQUIRED' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-400 animate-pulse">
                        REAPPLY REQUIRED ({currentAttempts}/{maxReapply})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eff4ff] text-[#0f294a] border border-[#c4e0ff]">
                        {app.currentStage}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#00142f]">
                  {app.scheme?.name || 'Grant Scheme'}
                </h3>

                {/* 1. Reapply Reason Box with Attempt Counter */}
                {app.status === 'REAPPLY_REQUIRED' && (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-amber-900 font-bold text-xs">
                      <span className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-600" />
                        Correction Requested by Review Officer
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${isExhausted ? 'bg-red-100 text-red-800 font-bold' : 'bg-amber-200 text-amber-900'}`}>
                        {isExhausted ? 'Quota Exhausted' : `Attempt ${currentAttempts} of ${maxReapply}`}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 font-medium italic bg-white/70 p-2.5 rounded-xl border border-amber-200">
                      "{app.lastReapplyReason}"
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-amber-800">
                      <span>Officer: <strong>{app.lastReappliedByRole || 'Verification Officer'}</strong></span>
                      <span>Remaining Attempts: <strong>{remaining}</strong></span>
                    </div>
                    {isExhausted ? (
                      <div className="pt-2 border-t border-amber-200 text-center space-y-1">
                        <span className="text-xs text-red-700 font-bold block">
                          Maximum Reapplication Attempts Limit (2/2) Exhausted.
                        </span>
                        <button
                          onClick={() => setSelectedRejectionApp(app)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center"
                        >
                          <Scale className="w-3.5 h-3.5 mr-1.5" /> File Statutory Appeal to District Authority
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openResubmitModal(app)}
                        className="mt-2 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Update & Resubmit Application ({remaining} left)
                      </button>
                    )}
                  </div>
                )}

                {/* 2. Formal Rejection Notice Box */}
                {isRejected && (
                  <div className="p-4 bg-red-50 border border-red-300 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-red-900 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                        Disqualification Order
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        {app.rejectionCategory || 'DISQUALIFIED'}
                      </span>
                    </div>
                    <p className="text-xs text-red-900 bg-white/80 p-2.5 rounded-xl border border-red-200">
                      {app.rejectionReason || app.remarks || 'Statutory criteria verification failed.'}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-red-200 pt-1">
                      <span>Rejected by: <strong>{app.rejectedBy || 'Review Authority'}</strong></span>
                      <span>Date: {app.rejectedAt ? new Date(app.rejectedAt).toLocaleDateString() : 'Recent'}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setSelectedRejectionApp(app)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" /> View Official Notice
                      </button>
                      {app.canAppeal && (
                        <button
                          onClick={() => setSelectedRejectionApp(app)}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center"
                        >
                          <Scale className="w-3.5 h-3.5 mr-1" /> File Appeal
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Statutory Appeal in Progress Box */}
                {isAppealPending && (
                  <div className="p-4 bg-indigo-50 border border-indigo-300 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-indigo-900 font-bold text-xs">
                      <span className="flex items-center gap-1">
                        <Scale className="w-4 h-4 text-indigo-600" />
                        Grievance Appeal Under Review
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200">
                        District Review Stage
                      </span>
                    </div>
                    <p className="text-xs text-indigo-900 italic bg-white/80 p-2.5 rounded-xl border border-indigo-200">
                      "{app.reVerificationAppealGrounds || 'Citizen filed appeal with supplementary verification records.'}"
                    </p>
                    <div className="text-[11px] text-slate-500">
                      Submitted: {app.reVerificationRequestedAt ? new Date(app.reVerificationRequestedAt).toLocaleDateString() : 'Recent'} &bull; Status: <strong>Awaiting District Authority Disposal</strong>
                    </div>
                  </div>
                )}

                <div className="bg-[#f8f9ff] p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>Automated Eligibility Score:</span>
                    <strong className="text-[#1aa54c] font-mono text-sm">{app.eligibilityScore} / 100</strong>
                  </div>
                  <PriorityBadge score={app.eligibilityScore} short={true} />
                </div>

                {/* Scheme-Specific Dynamic Answers Display */}
                {(() => {
                  const answers = app.dynamicFieldAnswers || safeJsonParse(app.dynamicFieldAnswersJson, {});
                  const entries = Object.entries(answers);
                  if (entries.length === 0) return null;

                  return (
                    <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-xl space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide block">
                        Scheme-Specific Dynamic Attributes ({entries.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {entries.map(([k, v]) => (
                          <div key={k} className="bg-white p-2 rounded-lg border border-blue-100 text-[11px]">
                            <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                              {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                            <strong className="text-[#00142f]">
                              {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v || 'N/A')}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Uploaded Verification Documents */}
                {(() => {
                  const docs = parseApplicationDocuments(app.schemeDocumentUrl);
                  if (docs.length === 0) return null;

                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          Attached Verification Documents ({docs.length})
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Authenticated &bull; Cloudinary
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {docs.map((doc, idx) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-400 rounded-lg text-xs font-semibold text-slate-800 transition shadow-xs group"
                          >
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            <span className="truncate max-w-[160px]">{doc.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 ml-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-between items-center text-xs text-slate-600 border-t border-slate-100 pt-2">

                  <span>
                    Sanctioned Amount:{' '}
                    <strong className="text-[#1aa54c] font-mono">
                      ₹{(app.appliedGrantAmount || 0).toLocaleString()}
                    </strong>
                  </span>

                  <span>
                    Applied: {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: DOCUMENTS */}
      {activeSubTab === 'documents' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">

          <div>
            <h2 className="text-base font-extrabold text-[#00142f] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#0f294a]" />
              Uploaded Identity & Scheme Documents
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official digital verification records securely stored in Cloudinary sovereign storage
            </p>
          </div>

          {/* Section 1: Citizen Master KYC Documents */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              1. Master Citizen Identity & PFMS KYC Proofs
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#00142f] block">
                    Aadhaar Card & Identity RoR
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    UIDAI Authenticated
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  {myProfile?.aadhaarNumber ? `Aadhaar: ${myProfile.aadhaarNumber}` : 'Verified during registration'}
                </p>
                {myProfile?.identityDocumentUrl ? (
                  <a
                    href={myProfile.identityDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 underline pt-1"
                  >
                    View Original Document <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">No document file attached</span>
                )}
              </div>

              <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#00142f] block">
                    PFMS DBT Bank Passbook / Mandate
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    myProfile?.bankAccountNumber ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    {myProfile?.bankAccountNumber ? 'PFMS DBT Ready' : 'Bank Mandate Required'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  {myProfile?.bankAccountNumber ? (
                    <>A/C: •••• {myProfile.bankAccountNumber.slice(-4)} &bull; IFSC: {myProfile.ifscCode || '—'}</>
                  ) : (
                    <span className="text-amber-600 font-medium">Bank Account not linked in profile</span>
                  )}
                </p>
                <div className="flex items-center space-x-1.5 text-xs pt-1">
                  {myProfile?.bankAccountNumber ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Direct Benefit Transfer Active</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-700 font-bold">Complete KYC in My Profile for automated release</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Scheme Application Documents */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              2. Scheme-Specific Submitted Verification Proofs
            </h3>

            {myApplications.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                No scheme applications submitted yet. When you apply for a scheme, all uploaded documents will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {myApplications.map((app) => {
                  const docs = parseApplicationDocuments(app.schemeDocumentUrl);
                  return (
                    <div key={app.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900 bg-[#eff4ff] px-2 py-0.5 rounded border border-[#c4e0ff]">
                            {app.applicationNo}
                          </span>
                          <span className="ml-2 text-xs font-bold text-slate-800">
                            {app.scheme?.name || 'Grant Scheme'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Submitted: {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {docs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No supplementary scheme documents on record.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {docs.map((doc, idx) => (
                            <a
                              key={idx}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between transition group shadow-2xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <div className="truncate">
                                  <p className="text-xs font-bold text-slate-800 truncate">{doc.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{doc.fileName || 'Verified Record'}</p>
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 ml-1 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 6 & 7: DISBURSEMENTS & COMPLIANCE */}
      {(activeSubTab === 'disbursements' ||
        activeSubTab === 'compliance') && (

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">

              <div>
                <h2 className="text-base font-extrabold text-[#00142f]">
                  Milestones & Utilization Proofs
                </h2>

                <p className="text-xs text-slate-500">
                  Upload progress proofs to trigger next staged fund release
                </p>
              </div>

            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">

              <table className="w-full text-left text-xs text-[#00142f]">

                <thead className="bg-[#eff4ff] text-[#46617c] font-bold uppercase text-[11px]">

                  <tr>
                    <th className="p-3">
                      Milestone Name
                    </th>

                    <th className="p-3 text-right">
                      Amount (INR)
                    </th>

                    <th className="p-3">
                      Due Date
                    </th>

                    <th className="p-3">
                      Compliance Status
                    </th>

                    <th className="p-3 text-right">
                      Action
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {myDisbursements.map((m) => (

                    <tr key={m.id}>

                      <td className="p-3 font-semibold">
                        {m.milestoneName}
                      </td>

                      <td className="p-3 text-right font-mono font-bold">
                        ₹{(m.scheduledAmount || 0).toLocaleString()}
                      </td>

                      <td className="p-3 text-slate-600">
                        {m.dueDate}
                      </td>

                      <td className="p-3">

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'FUND_RELEASED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                          {m.status.replace('_', ' ')}
                        </span>

                      </td>

                      <td className="p-3 text-right">

                        {m.stageNumber === 1 ? (
                          <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Advance DBT Credited
                          </span>
                        ) : m.status === 'PENDING_COMPLIANCE' ? (
                          <button
                            onClick={() => {
                              setActiveMilestoneForProof(m);
                              setProofRemarks('');
                              setProofFile(null);
                              setShowProofUploadModal(true);
                            }}
                            className="px-2.5 py-1 bg-[#00142f] hover:bg-[#0f294a] text-white rounded-lg font-bold text-[11px] inline-flex items-center shadow-sm"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Submit Proof
                          </button>
                        ) : m.status === 'PROOF_SUBMITTED' ? (
                          <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                            <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
                            Under Inspection
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Fund Released
                          </span>
                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          </div>
        )}

      {/* Modal: Apply for Scheme */}
      {showApplyModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">

          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl space-y-4 my-8 max-h-[calc(100vh-2rem)] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">

              <h3 className="text-base font-extrabold text-[#00142f]">
                Submit Scheme Grant Application
              </h3>

              <button
                onClick={() =>
                  setShowApplyModal(false)
                }
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <form
              onSubmit={handleApplySubmit}
              className="space-y-4 text-xs"
            >
              {/* Profile / General Validation Alerts */}
              {(formErrors.profile || formErrors.general) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs">KYC / Submission Requirement:</div>
                    <div className="text-[11px] mt-0.5">{formErrors.profile || formErrors.general}</div>
                  </div>
                </div>
              )}

              {/* Target Scheme */}
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">
                  Target Scheme *
                </label>

                <select
                  value={selectedSchemeId}
                  onChange={(e) => {
                    const schemeId = e.target.value;
                    const found = schemes.find(s => s.id === Number(schemeId));
                    setSelectedSchemeId(schemeId);
                    if (found) {
                      setAppliedAmount(found.maxGrantAmount || 50000);
                      resetDynamicFields(found);
                      setFormErrors(prev => ({ ...prev, schemeId: undefined, appliedAmount: undefined, documents: undefined }));
                      setDocErrors({});
                      const reqDocs = getRequiredDocsForScheme(found);
                      setSchemeDocFiles(prev => {
                        const next = {};
                        reqDocs.forEach(r => {
                          if (prev[r]) next[r] = prev[r];
                        });
                        return next;
                      });
                      if (myProfile?.identityDocumentUrl) {
                        const aadhaarDoc = reqDocs.find(d =>
                          d.toLowerCase().includes('aadhaar') || d.toLowerCase().includes('identity')
                        );
                        if (aadhaarDoc) {
                          setReusedDocs({
                            [aadhaarDoc]: {
                              name: aadhaarDoc,
                              url: myProfile.identityDocumentUrl,
                              source: 'Verified Profile KYC'
                            }
                          });
                        } else {
                          setReusedDocs({});
                        }
                      } else {
                        setReusedDocs({});
                      }
                    }
                  }}
                  className={`w-full bg-[#f8f9ff] border rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none transition ${
                    formErrors.schemeId ? 'border-red-400 bg-red-50/40' : 'border-slate-300 focus:border-indigo-500'
                  }`}
                >
                  <option value="">-- Choose Government Scheme --</option>
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} [{s.schemeCode}] &bull; Max Grant ₹{(s.maxGrantAmount || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
                {formErrors.schemeId && (
                  <p className="text-[10px] text-red-600 mt-1 font-semibold">{formErrors.schemeId}</p>
                )}
              </div>

              {/* Applied Grant Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 font-semibold">
                    Applied Grant Amount (INR) *
                  </label>
                  {selectedScheme && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                      Max Ceiling: ₹{(selectedScheme.maxGrantAmount || 0).toLocaleString()}
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  required
                  value={appliedAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAppliedAmount(val === '' ? '' : Number(val));
                    setFormErrors(prev => ({ ...prev, appliedAmount: undefined }));
                  }}
                  className={`w-full bg-[#f8f9ff] border rounded-xl px-3 py-2 text-slate-900 font-mono outline-none transition ${
                    formErrors.appliedAmount ? 'border-red-400 bg-red-50/40' : 'border-slate-300 focus:border-indigo-500'
                  }`}
                  placeholder="Enter grant amount in INR"
                />
                {formErrors.appliedAmount && (
                  <p className="text-[10px] text-red-600 mt-1 font-semibold">{formErrors.appliedAmount}</p>
                )}
              </div>

              {/* =====================================================
                  STEP 12: DYNAMIC SCHEME-SPECIFIC FIELDS
                  ===================================================== */}
              {dynamicFields.length > 0 && (

                <div className="space-y-4 p-4 bg-[#f8faff] border border-[#c4e0ff] rounded-2xl">

                  <div>

                    <h4 className="text-xs font-extrabold text-[#00142f]">
                      Scheme-Specific Information
                    </h4>

                    <p className="text-[10px] text-slate-500 mt-1">
                      These fields are required specifically for the
                      selected scheme.
                    </p>

                  </div>

                  {dynamicFields.map((field) => {

                    const value =
                      dynamicAnswers[field.key];

                    const error =
                      dynamicErrors[field.key];

                    const inputClass =
                      `w-full bg-white border rounded-xl px-3 py-2 text-slate-900 ${error
                        ? 'border-red-400'
                        : 'border-slate-300'
                      }`;

                    return (

                      <div key={field.key}>

                        <label className="block text-slate-600 mb-1 font-semibold">

                          {field.label}

                          {field.required && (

                            <span className="text-red-500 ml-1">
                              *
                            </span>

                          )}

                        </label>

                        {/* TEXT */}
                        {field.type === 'text' && (

                          <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => {

                              setDynamicAnswers(
                                prev => ({
                                  ...prev,
                                  [field.key]:
                                    e.target.value
                                })
                              );

                              setDynamicErrors(
                                prev => ({
                                  ...prev,
                                  [field.key]:
                                    undefined
                                })
                              );

                            }}
                            className={inputClass}
                          />

                        )}

                        {/* NUMBER */}
                        {field.type === 'number' && (

                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            value={value ?? ''}
                            onChange={(e) => {

                              setDynamicAnswers(
                                prev => ({
                                  ...prev,
                                  [field.key]:
                                    e.target.value
                                })
                              );

                              setDynamicErrors(
                                prev => ({
                                  ...prev,
                                  [field.key]:
                                    undefined
                                })
                              );

                            }}
                            className={inputClass}
                          />

                        )}

                        {/* DATE */}
                        {field.type === 'date' && (

                          <input
                            type="date"
                            value={value || ''}
                            onChange={(e) => {

                              setDynamicAnswers(
                                prev => ({
                                  ...prev,
                                  [field.key]:
                                    e.target.value
                                })
                              );

                              setDynamicErrors(
                                prev => ({
                                  ...prev,
                                  [field.key]:
                                    undefined
                                })
                              );

                            }}
                            className={inputClass}
                          />

                        )}

                        {/* TEXTAREA */}
                        {field.type === 'textarea' && (

                          <textarea
                            rows={3}
                            value={value || ''}
                            onChange={(e) => {

                              setDynamicAnswers(
                                prev => ({
                                  ...prev,
                                  [field.key]:
                                    e.target.value
                                })
                              );

                              setDynamicErrors(
                                prev => ({
                                  ...prev,
                                  [field.key]:
                                    undefined
                                })
                              );

                            }}
                            className={inputClass}
                          />

                        )}

                        {/* SELECT */}
                        {field.type === 'select' && (

                          <select
                            value={value || ''}
                            onChange={(e) => {

                              setDynamicAnswers(
                                prev => ({
                                  ...prev,
                                  [field.key]:
                                    e.target.value
                                })
                              );

                              setDynamicErrors(
                                prev => ({
                                  ...prev,
                                  [field.key]:
                                    undefined
                                })
                              );

                            }}
                            className={inputClass}
                          >

                            <option value="">
                              Select {field.label}
                            </option>

                            {field.options?.map(
                              option => (

                                <option
                                  key={option}
                                  value={option}
                                >
                                  {option.replaceAll(
                                    '_',
                                    ' '
                                  )}
                                </option>

                              )
                            )}

                          </select>

                        )}

                        {/* BOOLEAN */}
                        {field.type === 'boolean' && (

                          <label className="flex items-center gap-2 p-3 bg-white border border-slate-300 rounded-xl">

                            <input
                              type="checkbox"
                              checked={Boolean(value)}
                              onChange={(e) => {

                                setDynamicAnswers(
                                  prev => ({
                                    ...prev,
                                    [field.key]:
                                      e.target.checked
                                  })
                                );

                                setDynamicErrors(
                                  prev => ({
                                    ...prev,
                                    [field.key]:
                                      undefined
                                  })
                                );

                              }}
                              className="w-4 h-4"
                            />

                            <span className="text-slate-700">
                              Yes / Confirm
                            </span>

                          </label>

                        )}

                        {/* VALIDATION ERROR */}
                        {error && (

                          <p className="text-[10px] text-red-600 mt-1 font-semibold">
                            {error}
                          </p>

                        )}

                      </div>

                    );
                  })}

                </div>

              )}

              {/* =====================================================
                  REQUIRED SCHEME DOCUMENTS (MULTI-DOCUMENT UPLOAD)
                  ===================================================== */}
              <div className="space-y-3 p-4 bg-[#f8faff] border border-[#c4e0ff] rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-[#c4e0ff]/60">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#00142f] flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-[#0f294a]" />
                      Required Verification Documents
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        * All Required
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Upload clear, legible copies (PDF, JPG, PNG &bull; Max 20MB per document)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                      {uploadedCount} of {totalRequiredCount} Uploaded
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isAllDocsUploaded ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${uploadProgressPct}%` }}
                  />
                </div>

                {/* Document Slots */}
                <div className="space-y-2.5 pt-1">
                  {requiredDocs.map((docName, idx) => {
                    const file = schemeDocFiles[docName];
                    const reused = reusedDocs[docName];
                    const error = docErrors[docName];
                    const isUploaded = Boolean(file || reused);

                    return (
                      <div
                        key={docName}
                        className={`p-3 rounded-xl border transition ${
                          error
                            ? 'border-red-400 bg-red-50/30'
                            : isUploaded
                            ? 'border-emerald-300 bg-emerald-50/20'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-mono text-slate-700">
                              {idx + 1}
                            </span>
                            {docName}
                            <span className="text-red-500">*</span>
                          </span>

                          {isUploaded ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {reused ? 'Profile KYC Verified' : 'Uploaded'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              Required *
                            </span>
                          )}
                        </div>

                        {/* Uploaded state */}
                        {file && (
                          <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <div className="truncate">
                                <p className="font-semibold text-slate-800 truncate text-[11px]">{file.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <label
                                htmlFor={`upload-${idx}`}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer underline"
                              >
                                Replace
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setSchemeDocFiles(prev => {
                                    const next = { ...prev };
                                    delete next[docName];
                                    return next;
                                  });
                                }}
                                className="text-slate-400 hover:text-red-600 p-1"
                                title="Remove file"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Reused profile state */}
                        {reused && !file && (
                          <div className="flex items-center justify-between bg-blue-50/50 p-2 rounded-lg border border-blue-200 text-xs">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="text-[11px] text-blue-900 font-medium">
                                Linked from verified citizen profile Aadhaar
                              </span>
                            </div>
                            <label
                              htmlFor={`upload-${idx}`}
                              className="text-[11px] text-blue-700 hover:text-blue-900 font-bold cursor-pointer underline flex-shrink-0"
                            >
                              Upload Fresh File
                            </label>
                          </div>
                        )}

                        {/* Empty / upload state */}
                        {!isUploaded && (
                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              htmlFor={`upload-${idx}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00142f] hover:bg-[#0f294a] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition"
                            >
                              <Upload className="w-3.5 h-3.5" /> Choose File
                            </label>

                            {/* 1-click attach Aadhaar if available */}
                            {myProfile?.identityDocumentUrl &&
                              (docName.toLowerCase().includes('aadhaar') || docName.toLowerCase().includes('identity')) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReusedDocs(prev => ({
                                      ...prev,
                                      [docName]: {
                                        name: docName,
                                        url: myProfile.identityDocumentUrl,
                                        source: 'Verified Profile KYC'
                                      }
                                    }));
                                    setDocErrors(prev => ({ ...prev, [docName]: undefined }));
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition"
                                >
                                  ⚡ Use Profile Aadhaar
                                </button>
                              )}

                            <span className="text-[10px] text-slate-400">
                              PDF, JPG, PNG &bull; Max 20MB
                            </span>
                          </div>
                        )}

                        {/* Hidden file input */}
                        <input
                          id={`upload-${idx}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const selected = e.target.files?.[0];
                            if (selected) {
                              setSchemeDocFiles(prev => ({
                                ...prev,
                                [docName]: selected
                              }));
                              setReusedDocs(prev => {
                                const next = { ...prev };
                                delete next[docName];
                                return next;
                              });
                              setDocErrors(prev => ({ ...prev, [docName]: undefined }));
                              setFormErrors(prev => ({ ...prev, documents: undefined }));
                            }
                          }}
                        />

                        {/* Error message */}
                        {error && (
                          <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            {error}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Additional / Optional Documents */}
                <div className="pt-2 border-t border-[#c4e0ff]/60">
                  {!showAddCustomDoc ? (
                    <button
                      type="button"
                      onClick={() => setShowAddCustomDoc(true)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Attach Supplementary Document (Optional)
                    </button>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Add Supplementary Document</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCustomDoc(false);
                            setCustomDocInputName('');
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Document Title (e.g. Disability Certificate, Affidavit)"
                          value={customDocInputName}
                          onChange={(e) => setCustomDocInputName(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800"
                        />
                        <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center justify-center gap-1">
                          <Upload className="w-3 h-3" /> Select File
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const name = customDocInputName.trim() || f.name.replace(/\.[^/.]+$/, '');
                                setCustomDocs(prev => [...prev, { id: Date.now(), name, file: f }]);
                                setCustomDocInputName('');
                                setShowAddCustomDoc(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* List of custom docs */}
                  {customDocs.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {customDocs.map((cd) => (
                        <div key={cd.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                            <span className="font-semibold text-slate-800 text-[11px] truncate">
                              {cd.name}: <span className="text-slate-500 font-normal">{cd.file?.name}</span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCustomDocs(prev => prev.filter(item => item.id !== cd.id))}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {formErrors.documents && (
                  <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
                    ⚠ {formErrors.documents}
                  </p>
                )}
              </div>

              {/* Automated Verification */}
              <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#c4e0ff] text-[11px] text-[#0f294a]">
                ⚡ <strong>Automated Verification:</strong> Your application will be evaluated against scheme eligibility, income limits, and demographic criteria.
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">

                <button
                  type="button"
                  onClick={() =>
                    setShowApplyModal(false)
                  }
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow hover:bg-[#0f294a]"
                >
                  {submitting
                    ? 'Submitting...'
                    : 'Submit Grant Application'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* Modal: Upload Milestone Proof */}
      {showProofUploadModal &&
        activeMilestoneForProof && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">

            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-4 my-8">

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">

                <h3 className="text-base font-extrabold text-[#00142f]">
                  Upload Milestone Compliance Proof
                </h3>

                <button
                  onClick={() =>
                    setShowProofUploadModal(false)
                  }
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

              <form
                onSubmit={handleProofSubmit}
                className="space-y-4 text-xs"
              >

                <div className="p-3 bg-[#f8f9ff] rounded-xl border border-slate-200">

                  <div>
                    Milestone:{' '}
                    <strong className="text-[#00142f]">
                      {activeMilestoneForProof.milestoneName}
                    </strong>
                  </div>

                  <div>
                    Tranche Amount:{' '}
                    <strong className="font-mono text-[#1aa54c]">
                      ₹{(
                        activeMilestoneForProof.scheduledAmount ||
                        0
                      ).toLocaleString()}
                    </strong>
                  </div>

                </div>

                <div>

                  <label className="block text-slate-600 mb-1 font-semibold">
                    Proof Remarks / Vendor Invoice Details *
                  </label>

                  <textarea
                    rows="2"
                    required
                    placeholder="Enter milestone completion details"
                    value={proofRemarks}
                    onChange={(e) =>
                      setProofRemarks(
                        e.target.value
                      )
                    }
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />

                </div>

                <div>

                  <label className="block text-slate-600 mb-1 font-semibold">
                    Upload Photo / Certificate *
                  </label>

                  <input
                    type="file"
                    required
                    accept="image/*,.pdf"
                    onChange={(e) =>
                      setProofFile(
                        e.target.files[0]
                      )
                    }
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-[#00142f] file:text-white"
                  />

                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">

                  <button
                    type="button"
                    onClick={() =>
                      setShowProofUploadModal(false)
                    }
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#00142f] text-white font-bold rounded-xl shadow"
                  >
                    {submitting
                      ? 'Uploading...'
                      : 'Submit Proof'}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {/* Resubmit Application Modal */}
        {showResubmitModal && resubmitApp && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#00142f]">Update & Resubmit Application</h3>
                    <p className="text-xs text-slate-500">Respond to officer feedback and submit corrected details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResubmitModal(false)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-slate-600">
                  Application: <strong className="font-mono text-[#00142f]">{resubmitApp.applicationNo}</strong> &bull; Scheme: <strong className="text-[#00142f]">{resubmitApp.scheme?.name}</strong>
                </div>
              </div>

              {/* Officer Correction Request Reason */}
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-1 text-xs text-amber-950">
                <div className="font-bold flex items-center text-amber-900">
                  <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-700" />
                  Officer Requested Correction:
                </div>
                <p className="italic">"{resubmitApp.lastReapplyReason}"</p>
                <div className="text-[11px] text-amber-800 pt-1">
                  Returned by: <strong>{resubmitApp.lastReappliedByRole || 'Verification Officer'}</strong> &bull; Reapply cycle #{resubmitApp.reapplyCount || 1}
                </div>
              </div>

              <form onSubmit={handleResubmitSubmit} className="space-y-4 text-xs">
                {/* Dynamic Attributes Inputs */}
                {Object.keys(resubmitAnswers).length > 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <span className="font-bold text-[#00142f] uppercase text-[11px] block">
                      Update Scheme Specifications / Attributes
                    </span>
                    <div className="space-y-2">
                      {Object.entries(resubmitAnswers).map(([k, v]) => (
                        <div key={k}>
                          <label className="block text-slate-600 mb-1 font-semibold">
                            {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <input
                            type="text"
                            value={v || ''}
                            onChange={(e) => setResubmitAnswers({ ...resubmitAnswers, [k]: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">
                    Correction Summary / Citizen Remarks *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the corrections you made"
                    value={resubmitNotes}
                    onChange={(e) => setResubmitNotes(e.target.value)}
                    className="w-full bg-[#f8f9ff] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowResubmitModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resubmitSubmitting}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow transition"
                  >
                    {resubmitSubmitting ? 'Resubmitting...' : 'Resubmit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complete / Edit Citizen Profile Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 my-auto text-xs animate-in fade-in zoom-in-95">

              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                    <UserCheck className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#00142f]">
                      Complete / Update Citizen Profile
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Save official demographic, KYC, and direct benefit bank details to your database profile
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">

                {/* Section 1: Demographics */}
                <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-[#00142f] uppercase text-[11px] flex items-center">
                    <User className="w-4 h-4 text-emerald-600 mr-2" />
                    1. Demographic & Personal Information
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Full Legal Name *</label>
                      <input
                        type="text"
                        required
                        value={profileFormData.fullName}
                        onChange={(e) => setProfileFormData({ ...profileFormData, fullName: e.target.value })}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Mobile Number</label>
                      <input
                        type="tel"
                        value={profileFormData.mobileNumber}
                        onChange={(e) => setProfileFormData({ ...profileFormData, mobileNumber: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Date of Birth</label>
                      <input
                        type="date"
                        value={profileFormData.dob}
                        onChange={(e) => setProfileFormData({ ...profileFormData, dob: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Gender</label>
                      <select
                        value={profileFormData.gender}
                        onChange={(e) => setProfileFormData({ ...profileFormData, gender: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Citizen / Social Category *</label>
                      <select
                        required
                        value={profileFormData.category}
                        onChange={(e) => setProfileFormData({ ...profileFormData, category: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Farmer">Farmer / Agricultural Applicant</option>
                        <option value="Student">Student</option>
                        <option value="Woman Entrepreneur">Woman Entrepreneur</option>
                        <option value="MSME Owner">MSME / Small Business Owner</option>
                        <option value="Self-Employed">Self-Employed Citizen</option>
                        <option value="Worker">Worker / Labourer</option>
                        <option value="Senior Citizen">Senior Citizen</option>
                        <option value="General">General Category</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="Other Citizen">Other Citizen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Annual Family Income (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={profileFormData.annualIncome}
                        onChange={(e) => setProfileFormData({ ...profileFormData, annualIncome: e.target.value })}
                        placeholder="e.g. 180000"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Agricultural Land Holding (Acres)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={profileFormData.landSizeAcres}
                        onChange={(e) => setProfileFormData({ ...profileFormData, landSizeAcres: e.target.value })}
                        placeholder="e.g. 2.5 (if applicable)"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Identity & KYC */}
                <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-[#00142f] uppercase text-[11px] flex items-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mr-2" />
                    2. Identity & Statutory KYC
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Aadhaar Number (12 Digits)</label>
                      <input
                        type="text"
                        maxLength="14"
                        value={profileFormData.aadhaarNumber}
                        onChange={(e) => setProfileFormData({ ...profileFormData, aadhaarNumber: e.target.value })}
                        placeholder="e.g. 2312-8754-4821"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-400">Required for official DBT subsidy verification</span>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">PAN Card Number</label>
                      <input
                        type="text"
                        maxLength="10"
                        value={profileFormData.panNumber}
                        onChange={(e) => setProfileFormData({ ...profileFormData, panNumber: e.target.value.toUpperCase() })}
                        placeholder="e.g. ABCDE1234F"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 mb-1 font-semibold">Upload KYC / Identity Document (Optional)</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setProfileDocFile(e.target.files[0])}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-[#00142f] file:text-white"
                      />
                      <span className="text-[10px] text-slate-400">Aadhaar Card, Voter ID, Land RoR or Income Certificate (.pdf or image)</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: DBT Bank Details */}
                <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-[#00142f] uppercase text-[11px] flex items-center">
                    <CreditCard className="w-4 h-4 text-purple-600 mr-2" />
                    3. Direct Benefit Transfer (DBT) Bank Account
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Bank Name</label>
                      <input
                        type="text"
                        value={profileFormData.bankName}
                        onChange={(e) => setProfileFormData({ ...profileFormData, bankName: e.target.value })}
                        placeholder="e.g. State Bank of India"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Bank Account Number</label>
                      <input
                        type="text"
                        value={profileFormData.bankAccountNumber}
                        onChange={(e) => setProfileFormData({ ...profileFormData, bankAccountNumber: e.target.value })}
                        placeholder="e.g. 38291048201"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">IFSC Code</label>
                      <input
                        type="text"
                        maxLength="11"
                        value={profileFormData.ifscCode}
                        onChange={(e) => setProfileFormData({ ...profileFormData, ifscCode: e.target.value.toUpperCase() })}
                        placeholder="e.g. SBIN0001234"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Address & Location */}
                <div className="p-4 bg-[#f8f9ff] rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-[#00142f] uppercase text-[11px] flex items-center">
                    <Building className="w-4 h-4 text-blue-600 mr-2" />
                    4. Residential Address & Jurisdiction
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Administrative Region *</label>
                      <select
                        required
                        value={profileFormData.region}
                        onChange={(e) => setProfileFormData({ ...profileFormData, region: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="North Region">North Region</option>
                        <option value="West Region">West Region</option>
                        <option value="South Region">South Region</option>
                        <option value="East Region">East Region</option>
                        <option value="National HQ">National HQ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">State</label>
                      <input
                        type="text"
                        value={profileFormData.state}
                        onChange={(e) => setProfileFormData({ ...profileFormData, state: e.target.value })}
                        placeholder="e.g. Uttar Pradesh"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">District</label>
                      <input
                        type="text"
                        value={profileFormData.district}
                        onChange={(e) => setProfileFormData({ ...profileFormData, district: e.target.value })}
                        placeholder="e.g. Varanasi"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Block / Tehsil</label>
                      <input
                        type="text"
                        value={profileFormData.block}
                        onChange={(e) => setProfileFormData({ ...profileFormData, block: e.target.value })}
                        placeholder="e.g. Kashi Vidyapeeth"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-700 mb-1 font-semibold">Full Residential Address</label>
                      <textarea
                        rows={2}
                        value={profileFormData.address}
                        onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                        placeholder="e.g. Village Harhua, Post Shivpur"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-2.5 bg-[#00142f] hover:bg-[#0f294a] text-white font-bold rounded-xl shadow-md transition flex items-center"
                  >
                    {profileSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1.5 text-emerald-400" /> Save Profile Details
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Rejection Notice & Statutory Appeal Modal */}
        {selectedRejectionApp && (
          <RejectionNoticeModal
            application={selectedRejectionApp}
            currentUser={currentUser}
            onClose={() => setSelectedRejectionApp(null)}
            onRefresh={onRefresh}
          />
        )}

    </div>
  );
}