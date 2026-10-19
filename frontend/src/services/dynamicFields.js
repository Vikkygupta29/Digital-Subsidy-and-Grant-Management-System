export const DEFAULT_SCHEME_DOCUMENTS_BY_CATEGORY = {
    'Education': [
        'Aadhaar Card',
        'College Admission / Bonafide Letter',
        'Class 12 / Semester Marksheet',
        'Bank Passbook'
    ],
    'Agriculture': [
        'Aadhaar Card',
        'Land Record / RoR',
        'Bank Passbook'
    ],
    'Renewable Energy': [
        'Aadhaar Card',
        'Land Revenue Receipt',
        'DISCOM Electricity Bill',
        'Bank Passbook'
    ],
    'Women Empowerment': [
        'Aadhaar Card',
        'Mother-Child Protection (MCP) Card',
        'Bank Passbook'
    ],
    'Micro Enterprise': [
        'Aadhaar Card',
        'Udyam Registration',
        'Quotation for Machinery',
        'Bank Passbook'
    ],
    'Healthcare': [
        'Aadhaar Card',
        'Medical Diagnosis Certificate',
        'Hospital Admission Letter',
        'Bank Passbook'
    ],
    'Housing': [
        'Aadhaar Card',
        'Rural Residence Proof',
        'Land Ownership / Allotment Document',
        'Bank Passbook'
    ],
    'Other': [
        'Aadhaar Card',
        'Bank Passbook',
        'Proof of Eligibility'
    ]
};

export const DEFAULT_DYNAMIC_FIELDS = {
    'PM-VIDYA-2026': [
        {
            key: 'collegeName',
            label: 'College / University Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. IIT Varanasi / BHU / Delhi University'
        },
        {
            key: 'degreeCourse',
            label: 'Degree Course Pursued',
            type: 'text',
            required: true,
            placeholder: 'e.g. B.Tech / MBBS / B.Sc / BCA / MBA'
        },
        {
            key: 'academicYear',
            label: 'Current Academic Year / Stage',
            type: 'select',
            required: true,
            options: [
                '1st Year (Fresh Admission - Starting from Beginning)',
                '2nd Year (Continuing Studies / Lateral Entry)',
                '3rd Year (Continuing Studies)',
                '4th Year (Continuing Studies)',
                'Final Year / Postgraduate (PG)'
            ]
        },
        {
            key: 'rollNumber',
            label: 'Enrollment / Student Roll Number',
            type: 'text',
            required: false,
            placeholder: 'e.g. ENROLL-2026-9812'
        }
    ],

    'PM-VIDYALAKSHMI': [
        {
            key: 'collegeName',
            label: 'College / University Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. IIT Varanasi / BHU / Delhi University'
        },
        {
            key: 'degreeCourse',
            label: 'Degree Course Pursued',
            type: 'text',
            required: true,
            placeholder: 'e.g. B.Tech / MBBS / B.Sc / BCA / MBA'
        },
        {
            key: 'academicYear',
            label: 'Current Academic Year / Stage',
            type: 'select',
            required: true,
            options: [
                '1st Year (Fresh Admission - Starting from Beginning)',
                '2nd Year (Continuing Studies / Lateral Entry)',
                '3rd Year (Continuing Studies)',
                '4th Year (Continuing Studies)',
                'Final Year / Postgraduate (PG)'
            ]
        },
        {
            key: 'rollNumber',
            label: 'Enrollment / Student Roll Number',
            type: 'text',
            required: false,
            placeholder: 'e.g. ENROLL-2026-9812'
        }
    ],

    'Education': [
        {
            key: 'collegeName',
            label: 'College / University Name',
            type: 'text',
            required: true,
            placeholder: 'e.g. IIT Varanasi / BHU / Delhi University'
        },
        {
            key: 'degreeCourse',
            label: 'Degree Course Pursued',
            type: 'text',
            required: true,
            placeholder: 'e.g. B.Tech / MBBS / B.Sc / BCA / MBA'
        },
        {
            key: 'academicYear',
            label: 'Current Academic Year / Stage',
            type: 'select',
            required: true,
            options: [
                '1st Year (Fresh Admission - Starting from Beginning)',
                '2nd Year (Continuing Studies / Lateral Entry)',
                '3rd Year (Continuing Studies)',
                '4th Year (Continuing Studies)',
                'Final Year / Postgraduate (PG)'
            ]
        }
    ],

    'PM-KISAN-2026': [
        {
            key: 'landSizeAcres',
            label: 'Land Size (Acres)',
            type: 'number',
            required: true,
            min: 0
        },
        {
            key: 'landOwnership',
            label: 'Land Ownership',
            type: 'select',
            required: true,
            options: [
                'OWNED',
                'LEASED',
                'JOINT'
            ]
        },
        {
            key: 'cropType',
            label: 'Primary Crop Type',
            type: 'select',
            required: true,
            options: [
                'WHEAT',
                'RICE',
                'PULSES',
                'VEGETABLES',
                'OTHER'
            ]
        },
        {
            key: 'irrigationType',
            label: 'Irrigation Type',
            type: 'select',
            required: true,
            options: [
                'TUBEWELL',
                'CANAL',
                'RAINFED',
                'DRIP',
                'OTHER'
            ]
        },
        {
            key: 'previousSubsidy',
            label: 'Received Government Subsidy Previously',
            type: 'boolean',
            required: true
        }
    ],

    'Agriculture': [
        {
            key: 'landSizeAcres',
            label: 'Land Size (Acres)',
            type: 'number',
            required: true,
            min: 0
        },
        {
            key: 'landOwnership',
            label: 'Land Ownership',
            type: 'select',
            required: true,
            options: [
                'OWNED',
                'LEASED',
                'JOINT'
            ]
        },
        {
            key: 'cropType',
            label: 'Primary Crop Type',
            type: 'select',
            required: true,
            options: [
                'WHEAT',
                'RICE',
                'PULSES',
                'VEGETABLES',
                'OTHER'
            ]
        }
    ],

    'PM-KUSUM-SOLAR': [
        {
            key: 'pumpCapacity',
            label: 'Required Pump Capacity (HP)',
            type: 'number',
            required: true,
            min: 1,
            max: 20
        },
        {
            key: 'farmSize',
            label: 'Farm Size (Acres)',
            type: 'number',
            required: true,
            min: 0
        },
        {
            key: 'discomConnection',
            label: 'DISCOM Electricity Connection Available',
            type: 'boolean',
            required: true
        },
        {
            key: 'electricityBillNumber',
            label: 'Electricity Bill Number',
            type: 'text',
            required: true
        },
        {
            key: 'pumpType',
            label: 'Pump Type',
            type: 'select',
            required: true,
            options: [
                'SUBMERSIBLE',
                'SURFACE',
                'GRID_CONNECTED'
            ]
        }
    ],

    'Renewable Energy': [
        {
            key: 'pumpCapacity',
            label: 'Required Pump / Unit Capacity (HP or kW)',
            type: 'number',
            required: true,
            min: 1
        },
        {
            key: 'discomConnection',
            label: 'Grid Connection Available',
            type: 'boolean',
            required: true
        },
        {
            key: 'consumerId',
            label: 'Electricity Consumer ID',
            type: 'text',
            required: true
        }
    ],

    'PM-MATRU-VANDANA': [
        {
            key: 'pregnancyRegistrationDate',
            label: 'Pregnancy Registration Date',
            type: 'date',
            required: true
        },
        {
            key: 'expectedDeliveryDate',
            label: 'Expected Delivery Date',
            type: 'date',
            required: true
        },
        {
            key: 'childOrder',
            label: 'Child Order',
            type: 'select',
            required: true,
            options: [
                'FIRST',
                'SECOND'
            ]
        },
        {
            key: 'mcpCardNumber',
            label: 'MCP Card Number',
            type: 'text',
            required: true
        },
        {
            key: 'institutionalDelivery',
            label: 'Institutional Delivery Planned',
            type: 'boolean',
            required: true
        }
    ],

    'Women Empowerment': [
        {
            key: 'mcpCardNumber',
            label: 'Mother-Child Protection (MCP) Card Number',
            type: 'text',
            required: true
        },
        {
            key: 'anganwadiCenterCode',
            label: 'Nearest Anganwadi Center Code',
            type: 'text',
            required: true
        }
    ],

    'NAT-LIVESTOCK-MIS': [
        {
            key: 'cattleCount',
            label: 'Number of Cattle',
            type: 'number',
            required: true,
            min: 1,
            max: 100
        },
        {
            key: 'cattleShed',
            label: 'Cattle Shed Available',
            type: 'boolean',
            required: true
        },
        {
            key: 'fodderSource',
            label: 'Primary Fodder Source',
            type: 'select',
            required: true,
            options: [
                'OWN_FARM',
                'PURCHASED',
                'COOPERATIVE',
                'OTHER'
            ]
        },
        {
            key: 'breedType',
            label: 'Breed Type',
            type: 'text',
            required: true
        },
        {
            key: 'veterinaryCertificate',
            label: 'Veterinary Certificate Number',
            type: 'text',
            required: true
        }
    ],

    'STANDUP-MSME-GRANT': [
        {
            key: 'enterpriseType',
            label: 'Enterprise Type',
            type: 'select',
            required: true,
            options: [
                'ARTISAN',
                'HANDICRAFT',
                'AGRO_PROCESSING',
                'FOOD_PROCESSING',
                'OTHER'
            ]
        },
        {
            key: 'udyamNumber',
            label: 'Udyam Registration Number',
            type: 'text',
            required: true
        },
        {
            key: 'businessActivity',
            label: 'Business Activity',
            type: 'textarea',
            required: true
        },
        {
            key: 'machineryRequired',
            label: 'Machinery Required',
            type: 'textarea',
            required: true
        },
        {
            key: 'projectCost',
            label: 'Estimated Project Cost (INR)',
            type: 'number',
            required: true,
            min: 0
        },
        {
            key: 'workerCount',
            label: 'Number of Workers',
            type: 'number',
            required: true,
            min: 0
        }
    ],

    'Micro Enterprise': [
        {
            key: 'udyamNumber',
            label: 'Udyam / MSME Registration Number',
            type: 'text',
            required: true
        },
        {
            key: 'businessActivity',
            label: 'Business / Trade Activity Description',
            type: 'textarea',
            required: true
        },
        {
            key: 'projectCost',
            label: 'Estimated Working Capital / Project Cost (INR)',
            type: 'number',
            required: true,
            min: 0
        }
    ]
};

/**
 * Returns scheme-appropriate preset configuration (required documents and dynamic attributes)
 * based on category and scheme code.
 */
export function getSchemePreset(category, schemeCode) {
    const code = schemeCode || '';
    const cat = category || 'General';

    // 1. Dynamic Attributes
    const dynamicFields = DEFAULT_DYNAMIC_FIELDS[code] || DEFAULT_DYNAMIC_FIELDS[cat] || [];

    // 2. Required Documents
    const docs = DEFAULT_SCHEME_DOCUMENTS_BY_CATEGORY[cat] || DEFAULT_SCHEME_DOCUMENTS_BY_CATEGORY['Other'];

    return {
        requiredDocuments: docs.join(', '),
        dynamicFields: JSON.parse(JSON.stringify(dynamicFields))
    };
}

/**
 * Cleanly determines required documents for a scheme.
 * Crucially: For Higher Education & Technical Grant schemes (e.g. PM-Vidyalaxmi)
 * that do NOT enforce a low-income cap, "Income Certificate" is automatically
 * filtered out so that students are not unnecessarily blocked.
 */
export function getEffectiveRequiredDocs(scheme) {
    if (!scheme) return ['Supporting Identity & Scheme Document'];

    let docs = [];
    if (scheme.requiredDocuments && typeof scheme.requiredDocuments === 'string') {
        docs = scheme.requiredDocuments
            .split(',')
            .map(d => d.trim())
            .filter(Boolean);
    }

    if (docs.length === 0) {
        const catDocs = DEFAULT_SCHEME_DOCUMENTS_BY_CATEGORY[scheme.category] || ['Aadhaar Card', 'Bank Passbook'];
        docs = [...catDocs];
    }

    const isEducationScheme =
        scheme.category === 'Education' ||
        (scheme.schemeCode && scheme.schemeCode.toUpperCase().includes('VIDYA')) ||
        (scheme.name && scheme.name.toLowerCase().includes('vidyalaxmi')) ||
        (scheme.name && scheme.name.toLowerCase().includes('higher education'));

    const hasStrictIncomeLimit =
        scheme.maxIncomeCriteria !== undefined &&
        scheme.maxIncomeCriteria !== null &&
        Number(scheme.maxIncomeCriteria) > 0 &&
        Number(scheme.maxIncomeCriteria) <= 300000;

    // If it's an Education scheme without a strict low-income ceiling (e.g. general higher education grant or loan subsidy),
    // Income Certificate is NOT a necessary mandatory document!
    if (isEducationScheme && !hasStrictIncomeLimit) {
        docs = docs.filter(d => !d.toLowerCase().includes('income certificate') && !d.toLowerCase().includes('income proof'));
    }

    return docs.length > 0 ? docs : ['Supporting Identity & Scheme Document'];
}

export function getDynamicFields(scheme) {
    if (!scheme) {
        return [];
    }

    let fields = [];

    if (Array.isArray(scheme.dynamicFields) && scheme.dynamicFields.length > 0) {
        fields = [...scheme.dynamicFields];
    } else if (
        scheme.dynamicFieldsJson &&
        typeof scheme.dynamicFieldsJson === 'string'
    ) {
        try {
            const parsed = JSON.parse(scheme.dynamicFieldsJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
                fields = parsed;
            }
        } catch (error) {
            console.warn('Invalid dynamicFieldsJson:', error);
        }
    }

    if (fields.length === 0) {
        if (scheme.schemeCode && DEFAULT_DYNAMIC_FIELDS[scheme.schemeCode]) {
            return DEFAULT_DYNAMIC_FIELDS[scheme.schemeCode];
        }
        if (scheme.category && DEFAULT_DYNAMIC_FIELDS[scheme.category]) {
            return DEFAULT_DYNAMIC_FIELDS[scheme.category];
        }
        return [];
    }

    // Safety check: for Education schemes, ensure all required fields including academicYear exist
    const isEducationScheme =
        scheme.category === 'Education' ||
        (scheme.schemeCode && scheme.schemeCode.toUpperCase().includes('VIDYA')) ||
        (scheme.name && scheme.name.toLowerCase().includes('vidyalaxmi')) ||
        (scheme.name && scheme.name.toLowerCase().includes('higher education'));

    if (isEducationScheme) {
        const defaultEduFields = DEFAULT_DYNAMIC_FIELDS['PM-VIDYA-2026'] || DEFAULT_DYNAMIC_FIELDS['Education'];
        if (defaultEduFields) {
            // If the fields array from DB only has 2 old fields (e.g. institutionName & courseEnrolled),
            // upgrade to the official comprehensive 4 fields so deployed app matches local perfectly!
            const hasAcademicYear = fields.some(f => f.key === 'academicYear' || (f.label && f.label.toLowerCase().includes('academic year')));
            if (!hasAcademicYear) {
                if (fields.length <= 2) {
                    return defaultEduFields;
                }
                const yearField = defaultEduFields.find(f => f.key === 'academicYear');
                if (yearField) fields.push(yearField);
            }
        }
    }

    return fields;
}

export function createEmptyAnswers(fields) {
    return fields.reduce((result, field) => {
        result[field.key] = field.type === 'boolean' ? false : '';
        return result;
    }, {});
}

export function validateDynamicFields(fields, answers) {
    const errors = {};

    fields.forEach((field) => {
        const value = answers[field.key];
        const isEmpty =
            value === undefined ||
            value === null ||
            value === '' ||
            (typeof value === 'string' && value.trim() === '');

        if (field.required && isEmpty) {
            errors[field.key] = `${field.label} is required.`;
            return;
        }

        if (isEmpty) {
            return;
        }

        if (field.type === 'number') {
            const numberValue = Number(value);
            if (!Number.isFinite(numberValue)) {
                errors[field.key] = `${field.label} must be a valid number.`;
                return;
            }

            if (field.min !== undefined && numberValue < field.min) {
                errors[field.key] = `${field.label} must be at least ${field.min}.`;
            }

            if (field.max !== undefined && numberValue > field.max) {
                errors[field.key] = `${field.label} must not exceed ${field.max}.`;
            }
        }

        if (
            field.type === 'select' &&
            Array.isArray(field.options) &&
            !field.options.includes(value)
        ) {
            errors[field.key] = `${field.label} contains an invalid selection.`;
        }

        if (field.type === 'boolean') {
            if (typeof value !== 'boolean') {
                errors[field.key] = `${field.label} must be true or false.`;
            }
        }
    });

    return errors;
}