/* =============================================
   DROHNE112 FORM – LOGIC & WEBHOOK
   ============================================= */

// State
let currentStep = 1;
let totalSteps = 5;
let hasDrone = null; // 'ja' or 'nein'

const WEBHOOK_URL = 'https://bitautomationen.app.n8n.cloud/webhook/afcab86f-ef33-44ad-8d05-ce938c1c0441';

// =============================================
// NAVIGATION
// =============================================

function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const dots = document.querySelectorAll('.step-dot');
    const lines = document.querySelectorAll('.step-line');

    // Calculate effective step position
    let effectiveStep = currentStep;
    let effectiveTotal = totalSteps;

    // If user said "nein", step 3 is skipped, so remap
    if (hasDrone === 'nein') {
        if (currentStep >= 4) effectiveStep = currentStep - 1;
        effectiveTotal = totalSteps - 1;
    }

    const percentage = (effectiveStep / effectiveTotal) * 100;
    progressFill.style.width = percentage + '%';

    // Update step dots
    dots.forEach((dot, index) => {
        const stepNum = index + 1;
        dot.classList.remove('active', 'completed');

        if (stepNum < currentStep) {
            dot.classList.add('completed');
        } else if (stepNum === currentStep) {
            dot.classList.add('active');
        }

        // Hide step 3 dot if "nein"
        if (hasDrone === 'nein' && stepNum === 3) {
            dot.style.display = 'none';
        } else {
            dot.style.display = 'flex';
        }
    });

    // Update step lines
    lines.forEach((line, index) => {
        const afterStep = index + 1;
        line.classList.toggle('active', afterStep < currentStep);

        // Hide line before step 3 if "nein"
        if (hasDrone === 'nein' && (afterStep === 2)) {
            line.style.display = 'none';
        } else {
            line.style.display = 'block';
        }
    });
}

function showStep(step) {
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
    });

    const stepEl = document.getElementById('step' + step);
    if (stepEl) {
        stepEl.classList.add('active');
    }

    currentStep = step;
    updateProgress();

    // Hide privacy notice on success step
    const privacyNotice = document.getElementById('privacyNotice');
    if (step === 5) {
        privacyNotice.style.display = 'none';
    } else {
        privacyNotice.style.display = 'flex';
    }

    // Scroll to form top
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function nextStep(fromStep) {
    // Validate current step
    if (!validateStep(fromStep)) return;

    let nextStepNum = fromStep + 1;

    // If on step 2 and user said "nein", skip step 3
    if (fromStep === 2 && hasDrone === 'nein') {
        nextStepNum = 4;
    }

    showStep(nextStepNum);
}

function prevStep(fromStep) {
    let prevStepNum = fromStep - 1;

    // If on step 4 and user said "nein", skip back to step 2
    if (fromStep === 4 && hasDrone === 'nein') {
        prevStepNum = 2;
    }

    showStep(prevStepNum);
}

// =============================================
// VALIDATION
// =============================================

function validateStep(step) {
    if (step === 1) {
        return validateStep1();
    }
    if (step === 2) {
        return hasDrone !== null;
    }
    if (step === 3) {
        return validateStep3();
    }
    return true;
}

function validateStep1() {
    let valid = true;

    const name = document.getElementById('name');
    const einheit = document.getElementById('einheit');
    const email = document.getElementById('email');

    // Name
    if (!name.value.trim()) {
        showFieldError('name', 'nameError');
        valid = false;
    } else {
        clearFieldError('name', 'nameError');
    }

    // Einheit
    if (!einheit.value.trim()) {
        showFieldError('einheit', 'einheitError');
        valid = false;
    } else {
        clearFieldError('einheit', 'einheitError');
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
        showFieldError('email', 'emailError');
        valid = false;
    } else {
        clearFieldError('email', 'emailError');
    }

    return valid;
}

function validateStep3() {
    const manufacturer = document.getElementById('droneManufacturer').value;
    if (!manufacturer) return false;

    if (manufacturer === 'DIJ') {
        const dijModel = document.getElementById('dijModel').value;
        if (!dijModel) return false;

        if (dijModel === 'Anderes DIJ Modell') {
            const custom = document.getElementById('customDijModel').value.trim();
            if (!custom) return false;
        }
    }

    if (manufacturer === 'Andere') {
        const otherDrone = document.getElementById('otherDrone').value.trim();
        if (!otherDrone) return false;
    }

    return true;
}

function showFieldError(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    input.classList.add('error');
    if (error) error.classList.add('visible');
}

function clearFieldError(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    input.classList.remove('error');
    if (error) error.classList.remove('visible');
}

// Clear error on input
document.addEventListener('DOMContentLoaded', () => {
    ['name', 'einheit', 'email'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                clearFieldError(id, id + 'Error');
            });
        }
    });
});

// =============================================
// CONDITIONAL LOGIC
// =============================================

function selectDroneOwnership(value) {
    hasDrone = value;

    // Visual feedback
    document.getElementById('choiceJa').classList.toggle('selected', value === 'ja');
    document.getElementById('choiceNein').classList.toggle('selected', value === 'nein');

    // Enable next button
    document.getElementById('step2NextBtn').disabled = false;
}

function onManufacturerChange() {
    const value = document.getElementById('droneManufacturer').value;

    const dijGroup = document.getElementById('dijModelGroup');
    const customDijGroup = document.getElementById('customDijModelGroup');
    const otherGroup = document.getElementById('otherManufacturerGroup');

    // Reset all
    dijGroup.style.display = 'none';
    customDijGroup.style.display = 'none';
    otherGroup.style.display = 'none';

    if (value === 'DIJ') {
        dijGroup.style.display = 'block';
        // Reset DIJ model
        document.getElementById('dijModel').value = '';
    } else if (value === 'Andere') {
        otherGroup.style.display = 'block';
    }
}

function onDijModelChange() {
    const value = document.getElementById('dijModel').value;
    const customGroup = document.getElementById('customDijModelGroup');

    if (value === 'Anderes DIJ Modell') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
}

function toggleNotesField() {
    // Notes field is always visible but this can add emphasis
    const notesGroup = document.getElementById('notesGroup');
    const isAndereChecked = document.getElementById('interest_andere').checked;

    if (isAndereChecked) {
        notesGroup.style.display = 'block';
        notesGroup.classList.add('highlighted');
        document.getElementById('notizen').focus();
    } else {
        notesGroup.classList.remove('highlighted');
    }
}

// =============================================
// FORM SUBMISSION
// =============================================

function submitForm() {
    // Collect all data
    const data = collectFormData();
    console.log('Form data collected:', JSON.stringify(data, null, 2));

    // Show loading
    document.getElementById('loadingOverlay').classList.add('active');

    // Send directly to n8n webhook
    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            console.log('✅ Webhook response:', result);
            document.getElementById('loadingOverlay').classList.remove('active');
            showStep(5);
        })
        .catch(error => {
            console.error('❌ Webhook error:', error);
            document.getElementById('loadingOverlay').classList.remove('active');
            alert('Fehler beim Senden. Bitte versuchen Sie es erneut.');
        });
}

function collectFormData() {
    const data = {
        timestamp: new Date().toISOString(),
        kontaktdaten: {
            name: document.getElementById('name').value.trim(),
            einheit: document.getElementById('einheit').value.trim(),
            email: document.getElementById('email').value.trim(),
            telefon: document.getElementById('telefon').value.trim() || null
        },
        hat_drohne: hasDrone,
        aktuelle_drohne: null,
        interessen: [],
        notizen: document.getElementById('notizen').value.trim() || null
    };

    // Current drone info (if "ja")
    if (hasDrone === 'ja') {
        const manufacturer = document.getElementById('droneManufacturer').value;
        data.aktuelle_drohne = {
            hersteller: manufacturer
        };

        if (manufacturer === 'DIJ') {
            const dijModel = document.getElementById('dijModel').value;
            if (dijModel === 'Anderes DIJ Modell') {
                data.aktuelle_drohne.modell = document.getElementById('customDijModel').value.trim();
                data.aktuelle_drohne.ist_anderes_modell = true;
            } else {
                data.aktuelle_drohne.modell = dijModel;
            }
        } else if (manufacturer === 'Andere') {
            data.aktuelle_drohne.modell = document.getElementById('otherDrone').value.trim();
        }
    }

    // Interests (multi-select)
    document.querySelectorAll('input[name="interests"]:checked').forEach(cb => {
        data.interessen.push(cb.value);
    });

    return data;
}

// =============================================
// REGENERATE / RESET
// =============================================

function regenerateForm() {
    // Reset state
    hasDrone = null;
    currentStep = 1;

    // Reset form
    document.getElementById('drohneForm').reset();

    // Reset visual selections
    document.getElementById('choiceJa').classList.remove('selected');
    document.getElementById('choiceNein').classList.remove('selected');
    document.getElementById('step2NextBtn').disabled = true;

    // Hide conditional fields
    document.getElementById('dijModelGroup').style.display = 'none';
    document.getElementById('customDijModelGroup').style.display = 'none';
    document.getElementById('otherManufacturerGroup').style.display = 'none';

    // Clear errors
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.field-error').forEach(el => el.classList.remove('visible'));

    // Reset step dots
    document.querySelectorAll('.step-dot').forEach(dot => dot.style.display = 'flex');
    document.querySelectorAll('.step-line').forEach(line => line.style.display = 'block');

    // Show privacy notice
    document.getElementById('privacyNotice').style.display = 'flex';

    // Go to step 1
    showStep(1);

    // Animate button
    const btn = document.getElementById('regenerateBtn');
    const icon = btn.querySelector('.regenerate-icon');
    icon.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        icon.style.transform = '';
    }, 600);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    showStep(1);
});
