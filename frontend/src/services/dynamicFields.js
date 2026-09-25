export const DEFAULT_DYNAMIC_FIELDS = {
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
    ]
};


export function getDynamicFields(scheme) {
    if (!scheme) {
        return [];
    }

    if (Array.isArray(scheme.dynamicFields) && scheme.dynamicFields.length > 0) {
        return scheme.dynamicFields;
    }

    if (
        scheme.dynamicFieldsJson &&
        typeof scheme.dynamicFieldsJson === 'string'
    ) {
        try {
            const parsed =
                JSON.parse(scheme.dynamicFieldsJson);

            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (error) {
            console.warn(
                'Invalid dynamicFieldsJson:',
                error
            );
        }
    }

    return DEFAULT_DYNAMIC_FIELDS[
        scheme.schemeCode
    ] || [];
}


export function createEmptyAnswers(fields) {
    return fields.reduce((result, field) => {

        result[field.key] =
            field.type === 'boolean'
                ? false
                : '';

        return result;

    }, {});
}


export function validateDynamicFields(
    fields,
    answers
) {
    const errors = {};

    fields.forEach((field) => {

        const value = answers[field.key];

        const isEmpty =
            value === undefined ||
            value === null ||
            value === '' ||
            (
                typeof value === 'string' &&
                value.trim() === ''
            );

        if (field.required && isEmpty) {
            errors[field.key] =
                `${field.label} is required.`;

            return;
        }

        if (isEmpty) {
            return;
        }

        if (field.type === 'number') {

            const numberValue =
                Number(value);

            if (!Number.isFinite(numberValue)) {
                errors[field.key] =
                    `${field.label} must be a valid number.`;
                return;
            }

            if (
                field.min !== undefined &&
                numberValue < field.min
            ) {
                errors[field.key] =
                    `${field.label} must be at least ${field.min}.`;
            }

            if (
                field.max !== undefined &&
                numberValue > field.max
            ) {
                errors[field.key] =
                    `${field.label} must not exceed ${field.max}.`;
            }
        }

        if (
            field.type === 'select' &&
            Array.isArray(field.options) &&
            !field.options.includes(value)
        ) {
            errors[field.key] =
                `${field.label} contains an invalid selection.`;
        }

        if (field.type === 'boolean') {

            if (typeof value !== 'boolean') {
                errors[field.key] =
                    `${field.label} must be true or false.`;
            }
        }
    });

    return errors;
}