// VocaBox - Flashcard App
// Main Application Logic

// --- Toast Notification Utility ---
function showToast({ title = 'Success', description = '', icon = '✅', timeout = 2500 } = {}) {
    const wrap = document.getElementById('appToastContainer');
    if (!wrap) {
        console.error('Toast container not found');
        return { close: () => {} };
    }
    
    const t = document.createElement('div');
    t.className = 'vb-toast';
    t.innerHTML = `
        <div class="vb-toast__icon">${icon}</div>
        <div>
            <div class="vb-toast__title">${title}</div>
            ${description ? `<div class="vb-toast__desc">${description}</div>` : ''}
        </div>
        <button class="vb-toast__close" aria-label="Close">×</button>
    `;
    wrap.appendChild(t);
    
    const close = () => { 
        t.style.opacity = '0';
        t.style.transition = 'opacity 0.2s ease';
        setTimeout(() => t.remove(), 200);
    };
    
    t.querySelector('.vb-toast__close').addEventListener('click', close);
    if (timeout) setTimeout(close, timeout);
    
    return { close };
}

// --- Confirm Modal Utility ---
function showConfirm({ 
    title = 'Confirm', 
    description = 'Are you sure?', 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    variant = 'primary' // 'primary' | 'danger'
} = {}) {
    return new Promise(resolve => {
        const modal = document.getElementById('appConfirmModal');
        if (!modal) {
            console.error('Confirm modal not found');
            resolve(false);
            return;
        }
        
        const titleEl = document.getElementById('vbConfirmTitle');
        const descEl = document.getElementById('vbConfirmDesc');
        const okBtn = document.getElementById('vbConfirmBtn');
        const cancelBtn = document.getElementById('vbCancelBtn');
        
        if (!titleEl || !descEl || !okBtn || !cancelBtn) {
            console.error('Confirm modal elements not found');
            resolve(false);
            return;
        }
        
        titleEl.textContent = title;
        descEl.textContent = description;
        okBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;
        
        okBtn.classList.remove('btn-primary', 'btn-danger');
        okBtn.classList.add(variant === 'danger' ? 'btn-danger' : 'btn-primary');
        
        const cleanup = () => {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onBackdrop);
        };
        
        const onOk = () => { 
            cleanup(); 
            resolve(true); 
        };
        
        const onCancel = () => { 
            cleanup(); 
            resolve(false); 
        };
        
        const onBackdrop = (e) => { 
            if (e.target.dataset.close) onCancel(); 
        };
        
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        modal.addEventListener('click', onBackdrop);
        
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
    });
}

// --- Replace native dialogs globally ---
const originalAlert = window.alert;
const originalConfirm = window.confirm;

window.alert = (msg) => {
    showToast({ 
        title: 'Notice', 
        description: String(msg), 
        icon: '💡', 
        timeout: 3000 
    });
};

window.confirm = (msg) => {
    // Return a Promise<boolean> to mimic async usage
    return showConfirm({ 
        title: 'Please Confirm', 
        description: String(msg),
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'primary'
    });
};

// --- Audio Pronunciation Helper ---
// Configuration constant for speech language
const SPEECH_LANGUAGE = 'en-US';

// Track current speech to prevent overlapping playback
let currentSpeech = null;
let audioPronunciationSupported = null; // null = not checked yet, true/false = checked

/**
 * Play pronunciation of a word using Web Speech API
 * @param {string} text - The text to pronounce (typically the front word of a card)
 * @returns {boolean} - Returns true if pronunciation started, false if not supported or disabled
 */
function speakText(text) {
    // Check feature flag
    if (typeof CONFIG !== 'undefined' && CONFIG.features && !CONFIG.features.enableAudioPronunciation) {
        return false;
    }
    
    // Check if Web Speech API is supported (only check once)
    if (audioPronunciationSupported === null) {
        audioPronunciationSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
        if (!audioPronunciationSupported) {
            // Show friendly message once
            showToast({
                title: 'Audio Not Supported',
                description: 'Your browser does not support audio pronunciation.',
                icon: '<img src="music.png" alt="Audio" style="width: 20px; height: 20px; vertical-align: middle;">',
                timeout: 3000
            });
            return false;
        }
    }
    
    if (!audioPronunciationSupported) {
        return false;
    }
    
    // Cancel any ongoing speech to prevent overlapping
    if (currentSpeech) {
        window.speechSynthesis.cancel();
        currentSpeech = null;
    }
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = typeof CONFIG !== 'undefined' && CONFIG.audio ? CONFIG.audio.language : SPEECH_LANGUAGE;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Track current speech
    currentSpeech = utterance;
    
    // Clean up when speech ends
    utterance.onend = () => {
        currentSpeech = null;
    };
    
    utterance.onerror = () => {
        currentSpeech = null;
    };
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
    return true;
}

class VocaBox {
    constructor() {
        try {
            console.log("INIT: VocaBox constructor starting");
        this.currentUser = this.loadCurrentUser();
            this.cards = []; // Will be loaded asynchronously
        this.currentTestIndex = 0;
        this.isFlipped = false;
        this.currentEditingCardId = null;
        this.isImportingIELTS = false; // Prevent multiple simultaneous imports
        this.currentTypingIndex = 0;
        this.typingTestCards = [];
        this.flipTestCards = [];
            this.mcTestCards = [];
            this.currentMcIndex = 0;
            this.mcSelectedFolderId = 'all';
            this.mcAutoAdvanceTimeout = null;
        this.customColors = this.loadCustomColors();
        this.pendingDeleteId = null;
        this.audioDB = null;
        
        // Folder system
        this.folders = this.loadFolders();
        this.currentFolder = 'all';
        this.typingSelectedFolderId = 'all'; // Track selected folder for typing mode
            this.selectedFolderId = 'all'; // Track selected folder for Card Flipping mode
        
        // Card navigation
        this.currentCardIndex = 0; // Index of currently displayed card
        
        // Test results tracking
        this.testResults = {
            answers: [], // Array to store {questionIndex, isCorrect, userAnswer, correctAnswer}
            correctCount: 0,
            incorrectCount: 0
        };
        this.currentAudioId = null;
        this.currentPlayingAudio = null; // Track currently playing audio
            
            // Supabase client (initialized if configured)
            this.supabase = null;
            this.initSupabase();
            
            // Subscription management
            this.userSubscription = this.loadUserSubscription();
            
            console.log("INIT: VocaBox constructor complete, calling init()");
        this.init();
        } catch (error) {
            console.error("INIT ERROR in constructor", error);
            console.error("INIT ERROR stack:", error.stack);
            throw error;
        }
    }

    // Initialize Supabase client if configured
    initSupabase() {
        try {
            if (typeof CONFIG === 'undefined') {
                console.log('[Supabase] CONFIG not defined. Using localStorage only.');
                return;
            }
            if (CONFIG.features && CONFIG.features.useSupabase && CONFIG.supabase && CONFIG.supabase.url && CONFIG.supabase.anonKey) {
                if (typeof supabase !== 'undefined') {
                    this.supabase = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
                    console.log('[Supabase] Client initialized successfully');
                } else {
                    console.warn('[Supabase] Supabase library not loaded. Make sure the CDN script is included.');
                }
            } else {
                console.log('[Supabase] Not configured. Using localStorage only.');
            }
        } catch (e) {
            console.error('[Supabase] Error initializing client:', e);
            // Don't throw - app should work without Supabase
        }
    }

    async init() {
        console.log("INIT: starting app init");
        try {
            
            // Load cards asynchronously (supports Supabase)
            // CRITICAL: Ensure result is always an array
            console.log("INIT: loading cards...");
            const loadedCards = await this.loadCards();
            this.cards = Array.isArray(loadedCards) ? loadedCards : [];
            console.log(`INIT: loaded ${this.cards.length} cards`);
            
        // Clean up orphaned legacy folders on app load
        this.cleanupOrphanedLegacyFolders();
        // Clean up orphaned cards (cards with invalid folderIds)
        this.cleanupOrphanedCards();
        // Force cleanup orphaned cards again and analyze what's left
        this.analyzeAndCleanupOrphanedCards();
        // Delete specific orphaned cards by content (DISABLED - was too aggressive)
        // this.deleteSpecificOrphanedCards();
        // Migrate folder-level cards to List 01 (one-time migration)
        this.migrateFolderLevelCardsToList1();
        
        // Analyze current state after all cleanup
        this.logCurrentCardState();
        
        // Delete the specific orphaned card (try with and without trailing space)
        const cardText = "How has China moved so fast? In autonomous driving, as in so many spheres (n. domains) of technology, hyper-competition and strong supply chains enable the \"China speed' foreign firms covet (v. to want sth very much, especially sth that belongs to sb else).";
        this.deleteSingleCardByContent(cardText);
        // Also try with trailing space in case the stored version has it
        this.deleteSingleCardByContent(cardText + " ");
        
            console.log("INIT: caching DOM elements...");
        this.cacheDOMElements();
            
            console.log("INIT: initializing audio DB...");
        await this.initAudioDB();
            
            console.log("INIT: attaching event listeners...");
        this.attachEventListeners();
            
            console.log("INIT: updating UI...");
        this.updateAuthUI();
        this.renderFolders();
        this.updateFolderSelectors();
        this.updateListDropdownForHeader();
        this.renderCards();
        this.updateCardCount();
        this.updateCurrentFolderInfo(); // Explicitly update the button on page load
        this.loadFontSize();
        this.applyCustomColors();
        
            console.log("INIT: initialization complete");
            
            // Auto-import IELTS 8000 if not present (from data/IELTS_8000_exact.txt - fail-safe, don't block app if it fails)
            console.log("INIT: attempting auto-import IELTS (non-blocking)...");
            this.autoImportIELTS().catch(error => {
                console.error("INIT: IELTS auto-import failed (non-critical):", error);
                // Don't show error to user, app should work without IELTS deck
            });
        
        // Close folder dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.folder-dropdown-container')) {
                this.closeAllFolderDropdowns();
            }
        });
        
        // Global event delegation for folder options
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('folder-option')) {
                e.preventDefault();
                e.stopPropagation();
                const folderId = e.target.dataset.folderId;
                const cardId = e.target.closest('.folder-dropdown-menu').dataset.cardId;
                this.changeCardFolder(cardId, folderId);
                this.closeAllFolderDropdowns();
            }
        });
        } catch (error) {
            console.error("INIT ERROR", error);
            console.error("INIT ERROR stack:", error.stack);
            // Try to show a user-friendly error message
            try {
                alert("Failed to initialize app. Please refresh the page. Error: " + error.message);
            } catch (e) {
                // If alert fails, at least log it
                console.error("Could not show error alert:", e);
            }
            // Re-throw to prevent silent failures
            throw error;
        }
    }

    cacheDOMElements() {
        try {
        // Auth elements
        this.signInBtn = document.querySelector('.sign-in-btn');
        this.signUpBtn = document.querySelector('.sign-up-btn');
        this.signOutBtn = document.querySelector('.sign-out-btn');
        this.authButtons = document.getElementById('authButtons');
        this.userInfo = document.getElementById('userInfo');
        this.usernameDisplay = document.getElementById('usernameDisplay');
        this.signInModal = document.getElementById('signInModal');
        this.signUpModal = document.getElementById('signUpModal');
        this.closeSignInBtn = document.getElementById('closeSignInBtn');
        this.closeSignUpBtn = document.getElementById('closeSignUpBtn');
        this.cancelSignInBtn = document.getElementById('cancelSignInBtn');
        this.cancelSignUpBtn = document.getElementById('cancelSignUpBtn');
        this.signInForm = document.getElementById('signInForm');
        this.signUpForm = document.getElementById('signUpForm');
        this.signInContact = document.getElementById('signInContact');
        this.signInPassword = document.getElementById('signInPassword');
        this.signUpUsername = document.getElementById('signUpUsername');
        this.signUpContact = document.getElementById('signUpContact');
        this.signUpPassword = document.getElementById('signUpPassword');
        this.signUpPasswordConfirm = document.getElementById('signUpPasswordConfirm');
        this.signInError = document.getElementById('signInError');
        this.signUpError = document.getElementById('signUpError');
        this.switchToSignUp = document.getElementById('switchToSignUp');
        this.switchToSignIn = document.getElementById('switchToSignIn');
        this.forgotPasswordLink = document.getElementById('forgotPasswordLink');
        
        // Forgot password elements
        this.forgotPasswordModal = document.getElementById('forgotPasswordModal');
        this.closeForgotPasswordBtn = document.getElementById('closeForgotPasswordBtn');
        this.cancelForgotPasswordBtn = document.getElementById('cancelForgotPasswordBtn');
        this.forgotPasswordForm = document.getElementById('forgotPasswordForm');
        this.forgotContact = document.getElementById('forgotContact');
        this.forgotPasswordError = document.getElementById('forgotPasswordError');
        
        // Verify code elements
        this.verifyCodeModal = document.getElementById('verifyCodeModal');
        this.closeVerifyCodeBtn = document.getElementById('closeVerifyCodeBtn');
        this.cancelVerifyCodeBtn = document.getElementById('cancelVerifyCodeBtn');
        this.verifyCodeForm = document.getElementById('verifyCodeForm');
        this.verificationCode = document.getElementById('verificationCode');
        this.recoveredUsername = document.getElementById('recoveredUsername');
        this.newUsername = document.getElementById('newUsername');
        this.newPassword = document.getElementById('newPassword');
        this.newPasswordConfirm = document.getElementById('newPasswordConfirm');
        this.verifyCodeError = document.getElementById('verifyCodeError');
        this.maskedContact = document.getElementById('maskedContact');
        this.displayCode = document.getElementById('displayCode');
        
        // Store recovery data temporarily
        this.recoveryData = null;
        
        // Subscription button
        this.subscriptionBtn = document.getElementById('subscriptionBtn');
        
        // Special Access elements
        this.specialAccessBtn = document.getElementById('specialAccessBtn');
        this.specialAccessModal = document.getElementById('specialAccessModal');
        this.closeSpecialAccessBtn = document.getElementById('closeSpecialAccessBtn');
        this.cancelSpecialAccessBtn = document.getElementById('cancelSpecialAccessBtn');
        this.specialAccessForm = document.getElementById('specialAccessForm');
        this.activationCode = document.getElementById('activationCode');
        this.specialAccessError = document.getElementById('specialAccessError');

        // Color customization modal elements
        this.colorCustomizationModal = document.getElementById('colorCustomizationModal');
        this.closeColorCustomBtn = document.getElementById('closeColorCustomBtn');
        this.cancelColorCustomBtn = document.getElementById('cancelColorCustomBtn');
        this.confirmColorCustomBtn = document.getElementById('confirmColorCustomBtn');
        this.customColorPresetNum = document.getElementById('customColorPresetNum');
        this.customColorInput = document.getElementById('customColorInput');
        this.customColorHexInput = document.getElementById('customColorHexInput');
        this.colorPreviewBox = document.getElementById('colorPreviewBox');
        this.colorPreviewText = document.getElementById('colorPreviewText');
        this.colorHexDisplay = document.getElementById('colorHexDisplay');
        this.pendingColorPreset = null;

        // Custom Color Picker Modal Elements
        this.customColorPickerModal = document.getElementById('customColorPickerModal');
        this.customColorPickerInput = document.getElementById('customColorPickerInput');
        this.customColorPickerHexInput = document.getElementById('customColorPickerHexInput');
        this.customColorPickerPreviewBox = document.getElementById('customColorPickerPreviewBox');
        this.customColorPickerPreviewText = document.getElementById('customColorPickerPreviewText');
        this.customColorPickerHexDisplay = document.getElementById('customColorPickerHexDisplay');
        this.confirmCustomColorPickerBtn = document.getElementById('confirmCustomColorPickerBtn');
        this.closeCustomColorPickerBtn = document.getElementById('closeCustomColorPickerBtn');
        this.cancelCustomColorPickerBtn = document.getElementById('cancelCustomColorPickerBtn');
        this.pendingCustomColorContext = null;

        // Main elements
        this.addCardBtn = document.getElementById('addCardBtn');
        this.testModeBtn = document.getElementById('testModeBtn');
        this.cardsContainer = document.getElementById('cardsContainer');
        this.cardsEmptyState = document.getElementById('cardsEmptyState');
        this.cardCount = document.getElementById('cardCount');
        this.currentFolderInfo = document.getElementById('currentFolderInfo');
        this.currentFolderContent = document.getElementById('currentFolderContent');
        this.cardsNavigation = document.getElementById('cardsNavigation');
        this.prevCardViewBtn = document.getElementById('prevCardViewBtn');
        this.nextCardViewBtn = document.getElementById('nextCardViewBtn');
        this.mainCardArrowLeft = document.getElementById('mainCardArrowLeft');
        this.mainCardArrowRight = document.getElementById('mainCardArrowRight');
        
        // Font size control elements
        this.decreaseFontBtn = document.getElementById('decreaseFontBtn');
        this.increaseFontBtn = document.getElementById('increaseFontBtn');
        this.resetFontBtn = document.getElementById('resetFontBtn');
        this.fontSizeValue = document.getElementById('fontSizeValue');
        this.cardPosition = document.getElementById('cardPosition');
        
        // Folder elements
        this.createFolderBtn = document.getElementById('createFolderBtn');
        this.folderList = document.getElementById('folderList');
        this.listDropdown = document.getElementById('listDropdown');
        this.addCardFolder = document.getElementById('addCardFolder');
        this.addCardList = document.getElementById('addCardList');
        this.addCardListGroup = document.getElementById('addCardListGroup');
        this.createListForAddCardBtn = document.getElementById('createListForAddCardBtn');
        this.createFolderForAddCardBtn = document.getElementById('createFolderForAddCardBtn');

        // Modal elements
        this.addCardModal = document.getElementById('addCardModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // Folder modal elements
        this.createFolderModal = document.getElementById('createFolderModal');
        this.closeCreateFolderBtn = document.getElementById('closeCreateFolderBtn');
        this.cancelCreateFolderBtn = document.getElementById('cancelCreateFolderBtn');
        this.createFolderForm = document.getElementById('createFolderForm');
        this.folderName = document.getElementById('folderName');
        this.folderDescription = document.getElementById('folderDescription');
        
        // Create List modal elements
        this.createListModal = document.getElementById('createListModal');
        this.closeCreateListBtn = document.getElementById('closeCreateListBtn');
        this.cancelCreateListBtn = document.getElementById('cancelCreateListBtn');
        this.createListForm = document.getElementById('createListForm');
        this.listParentFolder = document.getElementById('listParentFolder');
        this.listName = document.getElementById('listName');
        
        this.addNextCardBtn = document.getElementById('addNextCardBtn');
        this.finishBtn = document.getElementById('finishBtn');
        this.addCardForm = document.getElementById('addCardForm');
        this.addFrontText = document.getElementById('addFrontText');
        this.addBackText = document.getElementById('addBackText');
        this.colorPickerAddFront = document.getElementById('colorPickerAddFront');
        this.colorPickerAddBack = document.getElementById('colorPickerAddBack');

        // Edit modal elements
        this.editCardModal = document.getElementById('editCardModal');
        this.closeEditModalBtn = document.getElementById('closeEditModalBtn');
        this.cancelEditBtn = document.getElementById('cancelEditBtn');
        this.editCardForm = document.getElementById('editCardForm');
        this.editFrontText = document.getElementById('editFrontText');
        this.editBackText = document.getElementById('editBackText');
        this.editCardFolder = document.getElementById('editCardFolder');
        this.editPrevCardBtn = document.getElementById('editPrevCardBtn');
        this.editNextCardBtn = document.getElementById('editNextCardBtn');
        this.editCardNum = document.getElementById('editCardNum');
        this.colorPickerFront = document.getElementById('colorPickerFront');
        this.colorPickerBack = document.getElementById('colorPickerBack');

        // Add Test modal elements (removed from UI but keeping for modal functionality)
        // this.createTestBtn = document.getElementById('createTestBtn');
        this.createTestModal = document.getElementById('createTestModal');
        this.closeCreateTestBtn = document.getElementById('closeCreateTestBtn');
        this.cancelCreateTestBtn = document.getElementById('cancelCreateTestBtn');
        this.createTestForm = document.getElementById('createTestForm');
        this.testFrontText = document.getElementById('testFrontText');
        this.testBackText = document.getElementById('testBackText');
        this.colorPickerTestFront = document.getElementById('colorPickerTestFront');
        this.colorPickerTestBack = document.getElementById('colorPickerTestBack');

        // Import Word List modal elements
        this.importWordListBtn = document.getElementById('importWordListBtn');
        this.importWordListModal = document.getElementById('importWordListModal');
        this.closeImportModalBtn = document.getElementById('closeImportModalBtn');
        this.cancelImportBtn = document.getElementById('cancelImportBtn');
        // Support both old and new IDs for backward compatibility
        this.confirmImportBtn = document.getElementById('importCardsBtn') || document.getElementById('confirmImportBtn');
        // Support both old and new IDs for backward compatibility
        this.wordListTextarea = document.getElementById('bulkTextInput') || document.getElementById('wordListTextarea');
        this.importError = document.getElementById('importError');
        // Support both old and new IDs for backward compatibility
        this.previewCount = document.getElementById('importPreviewCount') || document.getElementById('previewCount');
        this.previewCardsContainer = document.getElementById('previewCardsContainer');
        // Support both old and new IDs for backward compatibility
        this.customTermDelimiter = document.getElementById('customTermDefDelim') || document.getElementById('customTermDelimiter');
        this.customCardDelimiter = document.getElementById('customCardDelim') || document.getElementById('customCardDelimiter');
        
        // File upload elements
        this.vocabularyFileInput = document.getElementById('vocabularyFileInput');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.selectedFileName = document.getElementById('selectedFileName');
        // Support both old and new IDs for backward compatibility
        this.importTargetFolder = document.getElementById('importFolderSelect') || document.getElementById('importTargetFolder');
        this.importTargetList = document.getElementById('importListSelect') || document.getElementById('importTargetList');
        this.importListGroup = document.getElementById('importListGroup');
        this.createFolderForImportBtn = document.getElementById('createFolderForImportBtn');
        this.createListForImportBtn = document.getElementById('createListForImportBtn');

        // Collections UI
        this.collectionsBtn = document.getElementById('collectionsBtn');
        this.collectionsModal = document.getElementById('collectionsModal');
        this.closeCollectionsBtn = document.getElementById('closeCollectionsBtn');
        this.importIELTSBtn = document.getElementById('importIELTSBtn');
        this.ieltsPrefixInput = document.getElementById('ieltsPrefixInput');
        this.collectionsError = document.getElementById('collectionsError');
        this.importIELTSFromLocalBtn = document.getElementById('importIELTSFromLocalBtn');
        this.ieltsLocalFile = document.getElementById('ieltsLocalFile');
        this.deleteIELTSBtn = document.getElementById('deleteIELTSBtn');

        // Export/Import Data UI
        this.exportDataBtn = document.getElementById('exportDataBtn');
        this.importDataBtn = document.getElementById('importDataBtn');
        this.exportImportModal = document.getElementById('exportImportModal');
        this.closeExportImportBtn = document.getElementById('closeExportImportBtn');
        this.exportImportModalTitle = document.getElementById('exportImportModalTitle');
        this.exportSection = document.getElementById('exportSection');
        this.importSection = document.getElementById('importSection');
        this.exportCards = document.getElementById('exportCards');
        this.exportFolders = document.getElementById('exportFolders');
        this.exportSettings = document.getElementById('exportSettings');
        this.confirmExportBtn = document.getElementById('confirmExportBtn');
        this.cancelExportBtn = document.getElementById('cancelExportBtn');
        this.importFileInput = document.getElementById('importFileInput');
        this.selectImportFileBtn = document.getElementById('selectImportFileBtn');
        this.selectedDataFileName = document.getElementById('selectedFileName');
        this.fileNameDisplay = document.getElementById('fileNameDisplay');
        this.confirmImportDataBtn = document.getElementById('confirmImportBtn');
        this.cancelImportDataBtn = document.getElementById('cancelImportDataBtn');
        this.importDataError = document.getElementById('importError');

        // Upgrade/Subscription Modal elements
        this.upgradeModal = document.getElementById('upgradeModal');
        this.closeUpgradeBtn = document.getElementById('closeUpgradeBtn');
        this.manageSubscriptionBtn = document.getElementById('manageSubscriptionBtn');
        this.upgradeToPremiumBtn = document.getElementById('upgradeToPremiumBtn');
        this.upgradeToProBtn = document.getElementById('upgradeToProBtn');

        // Delete confirmation modal elements
        this.deleteConfirmModal = document.getElementById('deleteConfirmModal');
        this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        // Test mode selection elements
        this.testModeSelectModal = document.getElementById('testModeSelectModal');
        this.closeTestSelectBtn = document.getElementById('closeTestSelectBtn');
        this.selectFlipMode = document.getElementById('selectFlipMode');
        this.selectTypingMode = document.getElementById('selectTypingMode');
        this.selectMultipleChoiceMode = document.getElementById('selectMultipleChoiceMode');
        
        // Multiple Choice mode elements
        this.multipleChoiceFolderSelectModal = document.getElementById('multipleChoiceFolderSelectModal');
        this.multipleChoiceFolderSelectionContainer = document.getElementById('multipleChoiceFolderSelectionContainer');
        this.closeMultipleChoiceFolderBtn = document.getElementById('closeMultipleChoiceFolderBtn');
        this.backToMultipleChoiceModeBtn = document.getElementById('backToMultipleChoiceModeBtn');
        this.multipleChoiceModeScreen = document.getElementById('multipleChoiceModeScreen');
        this.exitMultipleChoiceBtn = document.getElementById('exitMultipleChoiceBtn');
        this.mcQuestion = document.getElementById('mcQuestion');
        this.multipleChoiceOptions = document.getElementById('multipleChoiceOptions');
        this.mcCardNum = document.getElementById('mcCardNum');
        this.mcTotalCards = document.getElementById('mcTotalCards');
        this.mcProgressFill = document.getElementById('mcProgressFill');
        this.mcPrevBtn = document.getElementById('mcPrevBtn');
        this.mcNextBtn = document.getElementById('mcNextBtn');
        this.mcCardArrowLeft = document.getElementById('mcCardArrowLeft');
        this.mcCardArrowRight = document.getElementById('mcCardArrowRight');
        this.mcAudioReplay = document.getElementById('mcAudioReplay');
        this.replayMcAudioBtn = document.getElementById('replayMcAudioBtn');
        this.finishMcTestBtn = document.getElementById('finishMcTestBtn');
        this.currentMcAudioId = null;
        
        // Side selection modal elements
        this.flipSideSelectModal = document.getElementById('flipSideSelectModal');
        this.closeFlipSideBtn = document.getElementById('closeFlipSideBtn');
        this.backToFlipModeBtn = document.getElementById('backToFlipModeBtn');
        this.selectFrontFirst = document.getElementById('selectFrontFirst');
        this.selectBackFirst = document.getElementById('selectBackFirst');
        
        // Shared folder/list selection modal
        this.sharedFolderSelectModal = document.getElementById('sharedFolderSelectModal');
        this.sharedFolderSelectionContainer = document.getElementById('sharedFolderSelectionContainer');
        this.closeSharedFolderBtn = document.getElementById('closeSharedFolderBtn');
        this.backFromSharedFolderBtn = document.getElementById('backFromSharedFolderBtn');
        this.sharedFolderSelectTitle = document.getElementById('sharedFolderSelectTitle');
        this.sharedFolderSelectCallback = null; // Callback function when folder/list is selected
        this.sharedFolderSelectMode = null; // 'typing', 'flip', or 'multipleChoice'
        
        this.typingFolderSelectModal = document.getElementById('typingFolderSelectModal');
        this.typingFolderSelectionContainer = document.getElementById('typingFolderSelectionContainer');
        this.closeTypingFolderBtn = document.getElementById('closeTypingFolderBtn');
        this.backFromTypingFolderBtn = document.getElementById('backFromTypingFolderBtn');
        
        this.typingSideSelectModal = document.getElementById('typingSideSelectModal');
        this.closeTypingSideBtn = document.getElementById('closeTypingSideBtn');
        this.backToTypingModeBtn = document.getElementById('backToTypingModeBtn');
        this.selectSeeFrontTypeBack = document.getElementById('selectSeeFrontTypeBack');
        this.selectSeeBackTypeFront = document.getElementById('selectSeeBackTypeFront');

        // Category selection elements
        this.categorySelectModal = document.getElementById('categorySelectModal');
        this.closeCategorySelectBtn = document.getElementById('closeCategorySelectBtn');
        this.backToCategoryBtn = document.getElementById('backToCategoryBtn');
        this.selectCardsCategory = document.getElementById('selectCardsCategory');
        this.selectTestsCategory = document.getElementById('selectTestsCategory');

        // Typing mode elements
        this.typingModeScreen = document.getElementById('typingModeScreen');
        this.exitTypingBtn = document.getElementById('exitTypingBtn');
        this.typingQuestion = document.getElementById('typingQuestion');
        this.typingAnswer = document.getElementById('typingAnswer');
        this.checkAnswerBtn = document.getElementById('checkAnswerBtn');
        this.answerResult = document.getElementById('answerResult');
        this.resultTitle = document.getElementById('resultTitle');
        this.correctAnswerContent = document.getElementById('correctAnswerContent');
        this.typingCardNum = document.getElementById('typingCardNum');
        this.typingTotalCards = document.getElementById('typingTotalCards');
        this.typingProgressFill = document.getElementById('typingProgressFill');
        this.typingPrevBtn = document.getElementById('typingPrevBtn');
        this.typingNextBtn = document.getElementById('typingNextBtn');
        this.typingCardArrowLeft = document.getElementById('typingCardArrowLeft');
        this.typingCardArrowRight = document.getElementById('typingCardArrowRight');
        this.typingAudioReplay = document.getElementById('typingAudioReplay');
        this.replayTypingAudioBtn = document.getElementById('replayTypingAudioBtn');
        this.currentTypingAudioId = null;
        this.finishTestBtn = document.getElementById('finishTestBtn');

        // Test Results Modal elements
        this.testResultsModal = document.getElementById('testResultsModal');
        this.closeResultsBtn = document.getElementById('closeResultsBtn');
        this.gradePercentage = document.getElementById('gradePercentage');
        this.totalQuestions = document.getElementById('totalQuestions');
        this.correctAnswers = document.getElementById('correctAnswers');
        this.incorrectAnswers = document.getElementById('incorrectAnswers');
        this.unansweredAnswers = document.getElementById('unansweredAnswers');
        this.performanceMessage = document.getElementById('performanceMessage');
        this.reviewTestBtn = document.getElementById('reviewTestBtn');
        this.retakeTestBtn = document.getElementById('retakeTestBtn');
        this.exitToHomeBtn = document.getElementById('exitToHomeBtn');

        // Test mode elements
        this.testModeScreen = document.getElementById('testModeScreen');
        this.exitTestBtn = document.getElementById('exitTestBtn');
        this.flashcard = document.getElementById('flashcard');
        this.flashcardInner = document.getElementById('flashcardInner');
        this.cardFront = document.getElementById('cardFront');
        this.cardBack = document.getElementById('cardBack');
        this.flipCardBtn = document.getElementById('flipCardBtn');
        this.prevCardBtn = document.getElementById('prevCardBtn');
        this.nextCardBtn = document.getElementById('nextCardBtn');
        this.flipCardArrowLeft = document.getElementById('flipCardArrowLeft');
        this.flipCardArrowRight = document.getElementById('flipCardArrowRight');
        this.currentCardNum = document.getElementById('currentCardNum');
        this.totalCards = document.getElementById('totalCards');
        this.progressFill = document.getElementById('progressFill');
        this.flipAudioReplay = document.getElementById('flipAudioReplay');
        this.replayFlipAudioBtn = document.getElementById('replayFlipAudioBtn');
        this.currentFlipAudioId = null;
        
        // Audio elements (Edit Modal)
        this.audioFileInput = document.getElementById('audioFileInput');
        this.uploadAudioBtn = document.getElementById('uploadAudioBtn');
        this.removeAudioBtn = document.getElementById('removeAudioBtn');
        this.currentAudio = document.getElementById('currentAudio');
        this.audioUploadSection = document.getElementById('audioUploadSection');
        this.editAudioPlayer = document.getElementById('editAudioPlayer');
        
        // Audio elements (Add Modal)
        this.addAudioFileInput = document.getElementById('addAudioFileInput');
        this.addUploadAudioBtn = document.getElementById('addUploadAudioBtn');
        this.addRemoveAudioBtn = document.getElementById('addRemoveAudioBtn');
        this.addCurrentAudio = document.getElementById('addCurrentAudio');
        this.addAudioUploadSection = document.getElementById('addAudioUploadSection');
        this.addAudioPlayer = document.getElementById('addAudioPlayer');
        this.pendingAddAudioId = null;
        
        // Audio elements (Add Test Modal)
        this.testAudioFileInput = document.getElementById('testAudioFileInput');
        this.testUploadAudioBtn = document.getElementById('testUploadAudioBtn');
        this.testRemoveAudioBtn = document.getElementById('testRemoveAudioBtn');
        this.testCurrentAudio = document.getElementById('testCurrentAudio');
        this.testAudioUploadSection = document.getElementById('testAudioUploadSection');
        this.testAudioPlayer = document.getElementById('testAudioPlayer');
        this.pendingTestAudioId = null;
        } catch (error) {
            console.error("INIT ERROR in cacheDOMElements:", error);
            throw error;
        }
    }

    // Helper function to preserve and restore text selection
    preserveSelection(editor, callback) {
        const sel = window.getSelection();
        let savedRange = null;
        
        // Save current selection if it exists and is within the editor
        if (sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (editor.contains(range.commonAncestorContainer) || editor === range.commonAncestorContainer) {
                savedRange = range.cloneRange();
            }
        }
        
        // Execute the callback
        callback();
        
        // Restore selection after a brief delay to ensure DOM updates are complete
        if (savedRange) {
            setTimeout(() => {
                try {
                    const newSel = window.getSelection();
                    newSel.removeAllRanges();
                    newSel.addRange(savedRange);
                } catch (e) {
                    console.log('Selection restore failed:', e);
                }
            }, 10);
        }
    }

    attachEventListeners() {
        try {
        // Auth buttons
            if (this.signInBtn) {
        this.signInBtn.addEventListener('click', () => this.openSignInModal());
            } else {
                console.warn("INIT: signInBtn not found");
            }
            if (this.signUpBtn) {
        this.signUpBtn.addEventListener('click', () => this.openSignUpModal());
            } else {
                console.warn("INIT: signUpBtn not found");
            }
            if (this.signOutBtn) {
        this.signOutBtn.addEventListener('click', () => this.signOut());
            } else {
                console.warn("INIT: signOutBtn not found");
            }
        this.closeSignInBtn.addEventListener('click', () => this.closeSignInModal());
        this.closeSignUpBtn.addEventListener('click', () => this.closeSignUpModal());
        this.cancelSignInBtn.addEventListener('click', () => this.closeSignInModal());
        this.cancelSignUpBtn.addEventListener('click', () => this.closeSignUpModal());
        this.signInForm.addEventListener('submit', (e) => this.handleSignIn(e));
        this.signUpForm.addEventListener('submit', (e) => this.handleSignUp(e));
        this.switchToSignUp.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeSignInModal();
            this.openSignUpModal();
        });
        this.switchToSignIn.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeSignUpModal();
            this.openSignInModal();
        });
        this.forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeSignInModal();
            this.openForgotPasswordModal();
        });

        // Forgot password handlers
        this.closeForgotPasswordBtn.addEventListener('click', () => this.closeForgotPasswordModal());
        this.cancelForgotPasswordBtn.addEventListener('click', () => this.closeForgotPasswordModal());
        this.forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));

        // Verify code handlers
        this.closeVerifyCodeBtn.addEventListener('click', () => this.closeVerifyCodeModal());
        this.cancelVerifyCodeBtn.addEventListener('click', () => this.closeVerifyCodeModal());
        this.verifyCodeForm.addEventListener('submit', (e) => this.handleVerifyCode(e));
        
        // Special Access handlers
        if (this.specialAccessBtn) {
            this.specialAccessBtn.addEventListener('click', () => {
                // Close subscription modal and open special access modal
                this.closeUpgradeModal();
                this.openSpecialAccessModal();
            });
        }
        if (this.closeSpecialAccessBtn) {
            this.closeSpecialAccessBtn.addEventListener('click', () => this.closeSpecialAccessModal());
        }
        if (this.cancelSpecialAccessBtn) {
            this.cancelSpecialAccessBtn.addEventListener('click', () => this.closeSpecialAccessModal());
        }
        if (this.specialAccessForm) {
            this.specialAccessForm.addEventListener('submit', (e) => this.handleSpecialAccessActivation(e));
        }
        if (this.specialAccessModal) {
            this.specialAccessModal.addEventListener('click', (e) => {
                if (e.target === this.specialAccessModal) {
                    this.closeSpecialAccessModal();
                }
            });
        }

        // Close modals on outside click
        this.signInModal.addEventListener('click', (e) => {
            if (e.target === this.signInModal) {
                this.closeSignInModal();
            }
        });
        this.signUpModal.addEventListener('click', (e) => {
            if (e.target === this.signUpModal) {
                this.closeSignUpModal();
            }
        });
        this.forgotPasswordModal.addEventListener('click', (e) => {
            if (e.target === this.forgotPasswordModal) {
                this.closeForgotPasswordModal();
            }
        });
        this.verifyCodeModal.addEventListener('click', (e) => {
            if (e.target === this.verifyCodeModal) {
                this.closeVerifyCodeModal();
            }
        });

        // Custom Color Picker Modal handlers
        this.closeCustomColorPickerBtn.addEventListener('click', () => this.closeCustomColorPickerModal());
        this.cancelCustomColorPickerBtn.addEventListener('click', () => this.closeCustomColorPickerModal());
        this.confirmCustomColorPickerBtn.addEventListener('click', () => this.confirmCustomColorPicker());
        this.customColorPickerModal.addEventListener('click', (e) => {
            if (e.target === this.customColorPickerModal) {
                this.closeCustomColorPickerModal();
            }
        });
        
        // Custom Color Picker live preview
        this.customColorPickerInput.addEventListener('input', (e) => {
            const color = e.target.value;
            this.updateCustomColorPickerPreview(color);
            this.customColorPickerHexInput.value = color.substring(1).toUpperCase();
        });
        
        // Custom Color Picker hex input
        this.customColorPickerHexInput.addEventListener('input', (e) => {
            let hexValue = e.target.value.trim();
            if (hexValue.startsWith('#')) {
                hexValue = hexValue.substring(1);
            }
            if (/^[0-9A-Fa-f]{3}$/.test(hexValue)) {
                hexValue = hexValue.split('').map(c => c + c).join('');
            }
            if (/^[0-9A-Fa-f]{6}$/.test(hexValue)) {
                const color = '#' + hexValue;
                this.customColorPickerInput.value = color;
                this.updateCustomColorPickerPreview(color);
                this.customColorPickerHexInput.style.borderColor = '#ddd';
            } else if (hexValue.length > 0) {
                this.customColorPickerHexInput.style.borderColor = '#e74c3c';
            } else {
                this.customColorPickerHexInput.style.borderColor = '#ddd';
            }
        });

        // Color customization modal handlers
        this.closeColorCustomBtn.addEventListener('click', () => this.closeColorCustomModal());
        this.cancelColorCustomBtn.addEventListener('click', () => this.closeColorCustomModal());
        this.confirmColorCustomBtn.addEventListener('click', () => this.confirmColorCustomization());
        this.colorCustomizationModal.addEventListener('click', (e) => {
            if (e.target === this.colorCustomizationModal) {
                this.closeColorCustomModal();
            }
        });
        
        // Live preview for color picker changes
        this.customColorInput.addEventListener('input', (e) => {
            const color = e.target.value;
            this.updateColorPreview(color);
            // Update hex input to match
            this.customColorHexInput.value = color.toUpperCase();
        });

        // Handle hex input changes
        this.customColorHexInput.addEventListener('input', (e) => {
            let hexValue = e.target.value.trim();
            
            // Remove # if present
            if (hexValue.startsWith('#')) {
                hexValue = hexValue.substring(1);
            }
            
            // Validate hex format (3 or 6 characters)
            if (/^[0-9A-Fa-f]{3}$/.test(hexValue)) {
                // Expand 3-digit hex to 6-digit
                hexValue = hexValue.split('').map(c => c + c).join('');
            }
            
            if (/^[0-9A-Fa-f]{6}$/.test(hexValue)) {
                const color = '#' + hexValue;
                this.customColorInput.value = color;
                this.updateColorPreview(color);
                // Remove error styling
                this.customColorHexInput.style.borderColor = '#ddd';
            } else if (hexValue.length > 0) {
                // Show error styling for invalid hex
                this.customColorHexInput.style.borderColor = '#e74c3c';
            } else {
                // Reset styling when empty
                this.customColorHexInput.style.borderColor = '#ddd';
            }
        });

        // Add card button
            // Main action buttons - critical for app functionality
            if (this.addCardBtn) {
        this.addCardBtn.addEventListener('click', () => this.openAddCardModal());
                console.log("INIT: addCardBtn event listener attached");
            } else {
                console.error("INIT ERROR: addCardBtn not found!");
            }

        // Test mode button - opens selection modal
            if (this.testModeBtn) {
        this.testModeBtn.addEventListener('click', () => this.openTestModeSelection());
                console.log("INIT: testModeBtn event listener attached");
            } else {
                console.error("INIT ERROR: testModeBtn not found!");
            }

        // Import Word List button
        if (this.importWordListBtn) {
            this.importWordListBtn.addEventListener('click', () => {
                console.log('[Event] Import button clicked');
                this.openImportModal();
            });
                console.log("INIT: importWordListBtn event listener attached");
        } else {
                console.error("INIT ERROR: importWordListBtn not found!");
        }

            // Collections button (Word Books)
            if (this.collectionsBtn) {
        this.collectionsBtn.addEventListener('click', () => this.openCollectionsModal());
                console.log("INIT: collectionsBtn event listener attached");
            } else {
                console.error("INIT ERROR: collectionsBtn not found!");
            }

        // Export/Import Data buttons
        if (this.exportDataBtn) {
            this.exportDataBtn.addEventListener('click', () => this.openExportModal());
        }
        if (this.importDataBtn) {
            this.importDataBtn.addEventListener('click', () => this.openImportDataModal());
        }
        if (this.closeExportImportBtn) {
            this.closeExportImportBtn.addEventListener('click', () => this.closeExportImportModal());
        }
        if (this.cancelExportBtn) {
            this.cancelExportBtn.addEventListener('click', () => this.closeExportImportModal());
        }
        if (this.confirmExportBtn) {
            this.confirmExportBtn.addEventListener('click', () => this.exportData());
        }
        if (this.selectImportFileBtn) {
            this.selectImportFileBtn.addEventListener('click', () => {
                if (this.importFileInput) {
                    this.importFileInput.click();
                }
            });
        }
        if (this.importFileInput) {
            this.importFileInput.addEventListener('change', (e) => this.handleImportFileSelect(e));
        }
        if (this.confirmImportDataBtn) {
            this.confirmImportDataBtn.addEventListener('click', () => this.importData());
        }
        if (this.cancelImportDataBtn) {
            this.cancelImportDataBtn.addEventListener('click', () => this.closeExportImportModal());
        }
        if (this.exportImportModal) {
            this.exportImportModal.addEventListener('click', (e) => {
                if (e.target === this.exportImportModal) {
                    this.closeExportImportModal();
                }
            });
        }

        // Subscription button handler
        if (this.subscriptionBtn) {
            this.subscriptionBtn.addEventListener('click', () => this.showUpgradeModal());
        }
        
        // Upgrade/Subscription Modal handlers
        if (this.closeUpgradeBtn) {
            this.closeUpgradeBtn.addEventListener('click', () => this.closeUpgradeModal());
        }
        if (this.manageSubscriptionBtn) {
            this.manageSubscriptionBtn.addEventListener('click', () => this.openSubscriptionManagement());
        }
        if (this.upgradeToPremiumBtn) {
            this.upgradeToPremiumBtn.addEventListener('click', () => this.handleUpgrade('premium'));
        }
        if (this.upgradeToProBtn) {
            this.upgradeToProBtn.addEventListener('click', () => this.handleUpgrade('pro'));
        }
        if (this.upgradeModal) {
            this.upgradeModal.addEventListener('click', (e) => {
                if (e.target === this.upgradeModal) {
                    this.closeUpgradeModal();
                }
            });
        }

        // Folder functionality
        if (this.createFolderBtn) {
            this.createFolderBtn.addEventListener('click', () => this.openCreateFolderModal());
        }
        if (this.closeCreateFolderBtn) {
            this.closeCreateFolderBtn.addEventListener('click', () => this.closeCreateFolderModal());
        }
        if (this.cancelCreateFolderBtn) {
            this.cancelCreateFolderBtn.addEventListener('click', () => this.closeCreateFolderModal());
        }
        this.createFolderForm.addEventListener('submit', (e) => this.handleCreateFolder(e));
        
        // Create List modal functionality
        if (this.closeCreateListBtn) {
            this.closeCreateListBtn.addEventListener('click', () => this.closeCreateListModal());
        }
        if (this.cancelCreateListBtn) {
            this.cancelCreateListBtn.addEventListener('click', () => this.closeCreateListModal());
        }
        if (this.createListForm) {
            this.createListForm.addEventListener('submit', (e) => this.handleCreateList(e));
        }
        if (this.listDropdown) {
            this.listDropdown.addEventListener('change', (e) => {
                const folderId = this.listDropdown.value;
                if (folderId && folderId !== '') {
                    this.selectFolder(folderId);
                    // Update dropdown after selection to ensure it reflects current folder
                    this.updateListDropdownForHeader();
                }
            });
        }
        
        // Card navigation
        this.prevCardViewBtn.addEventListener('click', () => this.previousCardView());
        this.nextCardViewBtn.addEventListener('click', () => this.nextCardView());
        
        // Arrow buttons for main card view
        if (this.mainCardArrowLeft) {
            this.mainCardArrowLeft.addEventListener('click', () => this.previousCardView());
        }
        if (this.mainCardArrowRight) {
            this.mainCardArrowRight.addEventListener('click', () => this.nextCardView());
        }
        
        // Font size control (now on each card, not in header)
        // These buttons are dynamically added to each card in createCardElement()
        if (this.decreaseFontBtn) {
            this.decreaseFontBtn.addEventListener('click', () => this.decreaseFontSize());
        }
        if (this.increaseFontBtn) {
            this.increaseFontBtn.addEventListener('click', () => this.increaseFontSize());
        }
        if (this.resetFontBtn) {
            this.resetFontBtn.addEventListener('click', () => this.resetFontSize());
        }

        // Modal close buttons
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeAddCardModal();
            });
        }
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.closeAddCardModal());
        }
        if (this.addNextCardBtn) {
            this.addNextCardBtn.addEventListener('click', () => this.addNextCard());
        }

        // Edit modal close buttons
        if (this.closeEditModalBtn) {
            this.closeEditModalBtn.addEventListener('click', () => this.closeEditCardModal());
        }
        if (this.cancelEditBtn) {
            this.cancelEditBtn.addEventListener('click', () => this.closeEditCardModal());
        }

        // Add Test modal close buttons
        if (this.closeCreateTestBtn) {
            this.closeCreateTestBtn.addEventListener('click', () => this.closeCreateTestModal());
        }
        if (this.cancelCreateTestBtn) {
            this.cancelCreateTestBtn.addEventListener('click', () => this.closeCreateTestModal());
        }

        // Import Word List modal close buttons
        if (this.closeImportModalBtn) {
            this.closeImportModalBtn.addEventListener('click', () => this.closeImportModal());
        }
        if (this.cancelImportBtn) {
            this.cancelImportBtn.addEventListener('click', () => this.closeImportModal());
        }
        this.confirmImportBtn.addEventListener('click', () => this.handleImport());
        
        // File upload functionality
        this.selectFileBtn.addEventListener('click', () => this.vocabularyFileInput.click());
        this.vocabularyFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.createFolderForImportBtn.addEventListener('click', () => this.createFolderForImport());
        if (this.createListForImportBtn) {
        this.createListForImportBtn.addEventListener('click', () => this.createListForImport());
        }
        
        // Import folder/list selector updates - use bindOnce to prevent double-binding
        if (this.importTargetFolder) {
            this.bindOnce(this.importTargetFolder, 'change', () => {
                console.log('[Event] Import folder selector changed to:', this.importTargetFolder.value);
                this.refreshImportListSection();
            });
        }
        
        // Add Card list functionality
        if (this.addCardFolder) {
            this.addCardFolder.addEventListener('change', () => this.updateAddCardListSelector());
        }
        if (this.createListForAddCardBtn) {
            this.createListForAddCardBtn.addEventListener('click', () => this.createListForAddCard());
        }
        if (this.createFolderForAddCardBtn) {
            this.createFolderForAddCardBtn.addEventListener('click', () => this.createFolderForAddCard());
        }
        
        // Delimiter option listeners
        if (this.wordListTextarea) {
        this.wordListTextarea.addEventListener('input', () => this.updatePreview());
        } else {
            console.error('[attachEventListeners] wordListTextarea not found!');
        }
        // Support both old and new names for backward compatibility
        document.querySelectorAll('input[name="termDefDelimiter"], input[name="termDelimiter"]').forEach(radio => {
            radio.addEventListener('change', () => this.updatePreview());
        });
        document.querySelectorAll('input[name="cardDelimiter"]').forEach(radio => {
            radio.addEventListener('change', () => this.updatePreview());
        });
        if (this.customTermDelimiter) {
        this.customTermDelimiter.addEventListener('input', () => this.updatePreview());
        }
        if (this.customCardDelimiter) {
        this.customCardDelimiter.addEventListener('input', () => this.updatePreview());
        }

        // Collections modal listeners
        if (this.closeCollectionsBtn) {
            this.closeCollectionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeCollectionsModal();
            });
        }
        this.importIELTSBtn.addEventListener('click', () => this.handleImportIELTSCollection());
        if (this.importIELTSFromLocalBtn && this.ieltsLocalFile) {
            this.importIELTSFromLocalBtn.addEventListener('click', () => this.ieltsLocalFile.click());
            this.ieltsLocalFile.addEventListener('change', (e) => this.handleImportIELTSFromLocal(e));
        }
        if (this.deleteIELTSBtn) {
            this.deleteIELTSBtn.addEventListener('click', () => this.handleDeleteIELTSCollection());
        }

        // Delete confirmation modal buttons
        this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteConfirmModal());
        this.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());

        // Delete confirmation modal keyboard support
        this.deleteConfirmModal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === 'Return') {
                e.preventDefault();
                this.confirmDelete();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.closeDeleteConfirmModal();
            }
        });

        // Test mode selection modal
        if (this.closeTestSelectBtn) {
            this.closeTestSelectBtn.addEventListener('click', () => this.closeTestModeSelection());
        }
        this.selectFlipMode.addEventListener('click', () => this.openSharedFolderSelection('flip'));
        this.selectTypingMode.addEventListener('click', () => this.openSharedFolderSelection('typing'));
        
        // Multiple Choice mode selection
        if (this.selectMultipleChoiceMode) {
            this.selectMultipleChoiceMode.addEventListener('click', () => this.openSharedFolderSelection('multipleChoice'));
        }
        
        // Shared folder selection modal
        if (this.closeSharedFolderBtn) {
            this.closeSharedFolderBtn.addEventListener('click', () => this.closeSharedFolderSelection());
        }
        if (this.backFromSharedFolderBtn) {
            this.backFromSharedFolderBtn.addEventListener('click', () => this.backToTestModeSelection());
        }

        // Multiple Choice folder selection modal
        if (this.closeMultipleChoiceFolderBtn) {
            this.closeMultipleChoiceFolderBtn.addEventListener('click', () => this.closeMultipleChoiceFolderSelection());
        }
        if (this.backToMultipleChoiceModeBtn) {
            this.backToMultipleChoiceModeBtn.addEventListener('click', () => this.backToTestModeSelection());
        }
        
        // Multiple Choice mode screen
        if (this.exitMultipleChoiceBtn) {
            this.exitMultipleChoiceBtn.addEventListener('click', () => this.exitMultipleChoiceMode());
        }
        if (this.mcPrevBtn) {
            this.mcPrevBtn.addEventListener('click', () => this.prevMcCard());
        }
        if (this.mcNextBtn) {
            this.mcNextBtn.addEventListener('click', () => this.nextMcCard());
        }
        
        // Arrow buttons for multiple choice mode
        if (this.mcCardArrowLeft) {
            this.mcCardArrowLeft.addEventListener('click', () => this.prevMcCard());
        }
        if (this.mcCardArrowRight) {
            this.mcCardArrowRight.addEventListener('click', () => this.nextMcCard());
        }
        
        if (this.replayMcAudioBtn) {
            this.replayMcAudioBtn.addEventListener('click', () => this.replayMcAudio());
        }
        if (this.finishMcTestBtn) {
            this.finishMcTestBtn.addEventListener('click', () => this.finishMcTest());
        }

        // Typing folder selection modal
        if (this.closeTypingFolderBtn) {
            this.closeTypingFolderBtn.addEventListener('click', () => this.closeTypingFolderSelection());
        }
        if (this.backFromTypingFolderBtn) {
            this.backFromTypingFolderBtn.addEventListener('click', () => this.backToTestModeSelection());
        }

        // Side selection modals
        if (this.closeFlipSideBtn) {
            this.closeFlipSideBtn.addEventListener('click', () => this.closeFlipSideSelection());
        }
        if (this.backToFlipModeBtn) {
            this.backToFlipModeBtn.addEventListener('click', () => this.backToTestModeSelection());
        }
        if (this.selectFrontFirst) {
            this.selectFrontFirst.addEventListener('click', () => this.startFlipModeWithSide('front'));
        }
        if (this.selectBackFirst) {
            this.selectBackFirst.addEventListener('click', () => this.startFlipModeWithSide('back'));
        }
        
        if (this.closeTypingSideBtn) {
            this.closeTypingSideBtn.addEventListener('click', () => this.closeTypingSideSelection());
        }
        if (this.backToTypingModeBtn) {
            this.backToTypingModeBtn.addEventListener('click', () => this.backToTypingFolderSelection());
        }
        if (this.selectSeeFrontTypeBack) {
            this.selectSeeFrontTypeBack.addEventListener('click', () => this.startTypingModeWithSides('front', 'back'));
        }
        if (this.selectSeeBackTypeFront) {
            this.selectSeeBackTypeFront.addEventListener('click', () => this.startTypingModeWithSides('back', 'front'));
        }

        // Category selection modal
        if (this.closeCategorySelectBtn) {
            this.closeCategorySelectBtn.addEventListener('click', () => this.closeCategorySelection());
        }
        if (this.backToCategoryBtn) {
            this.backToCategoryBtn.addEventListener('click', () => this.backToTestModeFromCategory());
        }
        if (this.selectCardsCategory) {
            this.selectCardsCategory.addEventListener('click', () => this.startFlipMode('card'));
        }
        if (this.selectTestsCategory) {
            this.selectTestsCategory.addEventListener('click', () => this.startFlipMode('test'));
        }

        // Edit modal navigation buttons
        this.editPrevCardBtn.addEventListener('click', () => this.editPreviousCard());
        this.editNextCardBtn.addEventListener('click', () => this.editNextCard());

        // Form submission
        this.addCardForm.addEventListener('submit', (e) => this.handleAddCard(e));
        this.editCardForm.addEventListener('submit', (e) => this.handleEditCard(e));
        this.createTestForm.addEventListener('submit', (e) => this.handleCreateTest(e));

        // Flip mode controls
        this.exitTestBtn.addEventListener('click', () => this.exitTestMode());
        this.flipCardBtn.addEventListener('click', () => this.flipCard());
        this.flashcard.addEventListener('click', () => this.flipCard());
        this.prevCardBtn.addEventListener('click', () => this.previousCard());
        this.nextCardBtn.addEventListener('click', () => this.nextCard());
        
        // Arrow buttons for card flipping mode
        if (this.flipCardArrowLeft) {
            this.flipCardArrowLeft.addEventListener('click', () => this.previousCard());
        }
        if (this.flipCardArrowRight) {
            this.flipCardArrowRight.addEventListener('click', () => this.nextCard());
        }
        this.replayFlipAudioBtn.addEventListener('click', () => this.replayFlipAudio());

        // Typing mode controls
        this.exitTypingBtn.addEventListener('click', () => this.exitTypingMode());
        this.checkAnswerBtn.addEventListener('click', () => this.checkAnswer());
        this.typingPrevBtn.addEventListener('click', () => this.previousTypingCard());
        this.typingNextBtn.addEventListener('click', () => this.nextTypingCard());
        
        // Arrow buttons for typing mode
        if (this.typingCardArrowLeft) {
            this.typingCardArrowLeft.addEventListener('click', () => this.previousTypingCard());
        }
        if (this.typingCardArrowRight) {
            this.typingCardArrowRight.addEventListener('click', () => this.nextTypingCard());
        }
        this.replayTypingAudioBtn.addEventListener('click', () => this.replayTypingAudio());

        // Keyboard shortcuts for typing mode
        if (this.typingAnswer) {
            // Save base line-height for later reset
            const baseComputed = window.getComputedStyle(this.typingAnswer);
            this._typingAnswerBaseLineHeight = baseComputed.lineHeight === 'normal'
                ? (parseFloat(baseComputed.fontSize) * 1.4) + 'px'
                : baseComputed.lineHeight;

            // Centering updater for textarea (vertical + horizontal for single-line)
            this.updateTypingAnswerCentering = () => {
                const ta = this.typingAnswer;
                if (!ta) return;
                // Consider single-line when no newlines and content height <= ~1.5 lines
                const style = window.getComputedStyle(ta);
                const lineHeightPx = style.lineHeight === 'normal'
                    ? parseFloat(style.fontSize) * 1.4
                    : parseFloat(style.lineHeight);
                const hasNewline = /\n/.test(ta.value);
                const contentHeight = ta.scrollHeight - (parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
                const isSingle = !hasNewline && contentHeight <= lineHeightPx * 1.2;
                if (isSingle) {
                    ta.classList.add('single-line');
                    ta.style.lineHeight = ta.clientHeight + 'px';
                } else {
                    ta.classList.remove('single-line');
                    ta.style.lineHeight = this._typingAnswerBaseLineHeight;
                }
            };

            this.typingAnswer.addEventListener('keydown', (e) => {
                // Avoid triggering while composing IME text
                if (e.isComposing) return;
                // Only act when typing mode screen is active/visible
                if (!this.typingModeScreen || !this.typingModeScreen.classList.contains('active')) {
                    return;
                }
                
                const isAnswerChecked = this.answerResult && this.answerResult.style.display === 'block';
                
                // Enter without Shift
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (isAnswerChecked) {
                        // Answer already checked - move to next card
                        if (this.currentTypingIndex < this.typingTestCards.length - 1) {
                            this.nextTypingCard();
                        } else {
                            // Last card - show results
                            this.showTestResults();
                        }
                    } else {
                        // Answer not checked yet - check the answer
                        this.checkAnswer();
                    }
                }
            });

            this.typingAnswer.addEventListener('input', () => this.updateTypingAnswerCentering());
            window.addEventListener('resize', () => this.updateTypingAnswerCentering());
        }
        
        // Global keyboard listener for typing mode (for arrow keys)
        // This handles navigation when answer is already checked
        document.addEventListener('keydown', (e) => {
            // Only handle if typing mode is active
            if (!this.typingModeScreen || !this.typingModeScreen.classList.contains('active')) {
                return;
            }
            
            const isAnswerChecked = this.answerResult && this.answerResult.style.display === 'block';
            
            // Right Arrow - move to next card if answer is checked
            if (e.key === 'ArrowRight' && isAnswerChecked) {
                e.preventDefault();
                if (this.currentTypingIndex < this.typingTestCards.length - 1) {
                    this.nextTypingCard();
                } else {
                    // Last card - show results
                    this.showTestResults();
                }
            }
            
            // Left Arrow - move to previous card if answer is checked
            if (e.key === 'ArrowLeft' && isAnswerChecked) {
                e.preventDefault();
                if (this.currentTypingIndex > 0) {
                    this.previousTypingCard();
                }
            }
            
            // Note: Enter key is handled in the typingAnswer field listener above
            // to distinguish between checking answer and moving to next card
        });

        // Global keyboard listener for main card view (front page)
        document.addEventListener('keydown', (e) => {
            // Only handle if on main card view (not in test mode, not in modals)
            const isModalOpen = document.querySelector('.modal.active');
            const isTestModeActive = this.testModeScreen && this.testModeScreen.classList.contains('active');
            const isTypingModeActive = this.typingModeScreen && this.typingModeScreen.classList.contains('active');
            
            // Don't handle if any modal is open or in test/typing modes
            if (isModalOpen || isTestModeActive || isTypingModeActive) {
                return;
            }
            
            // Check if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }
            
            // Enter/Return - flip the current card
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentCard = this.cardsContainer.querySelector('.card-item');
                if (currentCard) {
                    const flipContainer = currentCard.querySelector('.card-flip-container');
                    if (flipContainer) {
                        flipContainer.click(); // Trigger the flip
                    }
                }
            }
            
            // Right Arrow - move to next card
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextCardView();
            }
            
            // Left Arrow - move to previous card
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.previousCardView();
            }
        });

        // Global keyboard listener for card flipping mode (Learn/Test)
        document.addEventListener('keydown', (e) => {
            // Only handle if card flipping mode is active
            if (!this.testModeScreen || !this.testModeScreen.classList.contains('active')) {
                return;
            }
            
            // Check if user is typing in an input field
            const activeElement = document.activeElement;
            if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
                return;
            }
            
            // Enter/Return - flip the current card only (do not move to next)
            if (e.key === 'Enter' || e.key === 'Return') {
                e.preventDefault();
                this.flipCard();
                return;
            }
            
            // Right Arrow - move to next card
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.nextCard();
                return;
            }
            
            // Left Arrow - move to previous card
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.previousCard();
                return;
            }
            
            // Space - flip card (keep existing behavior)
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                this.flipCard();
            }
        });

        // Finish Test button
        if (this.finishTestBtn) {
            this.finishTestBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showTestResults();
            });
        }

        // Test Results Modal event listeners
        if (this.closeResultsBtn) {
            this.closeResultsBtn.addEventListener('click', () => this.closeTestResults());
        }
        if (this.retakeTestBtn) {
            this.retakeTestBtn.addEventListener('click', () => this.retakeTest());
        }
        if (this.exitToHomeBtn) {
            this.exitToHomeBtn.addEventListener('click', () => this.exitToHome());
        }
        this.testResultsModal.addEventListener('click', (e) => {
            if (e.target === this.testResultsModal) {
                this.closeTestResults();
            }
        });

        // Helper: center single-line content for arbitrary element
        this.applySingleLineCentering = (el) => {
            if (!el) return;
            // Remove existing class first
            el.classList.remove('single-line-centered');
            // Measure lines
            const style = window.getComputedStyle(el);
            const lineHeight = style.lineHeight === 'normal' ? parseFloat(style.fontSize) * 1.4 : parseFloat(style.lineHeight);
            const hasExplicitBreaks = /<br\s*\/?>|\n/.test(el.innerHTML);
            const blocky = el.querySelector('p, ul, ol, li, div');
            const isSingleLine = !hasExplicitBreaks && !blocky && el.scrollHeight <= lineHeight * 1.4;
            if (isSingleLine) {
                el.classList.add('single-line-centered');
            }
        };

        // Close modal on outside click (disabled for Add Card and Add Test modals)
        // this.addCardModal.addEventListener('click', (e) => {
        //     if (e.target === this.addCardModal) {
        //         this.closeAddCardModal();
        //     }
        // });

        this.editCardModal.addEventListener('click', (e) => {
            if (e.target === this.editCardModal) {
                this.closeEditCardModal();
            }
        });

        // this.createTestModal.addEventListener('click', (e) => {
        //     if (e.target === this.createTestModal) {
        //         this.closeCreateTestModal();
        //     }
        // });

        this.importWordListModal.addEventListener('click', (e) => {
            if (e.target === this.importWordListModal) {
                this.closeImportModal();
            }
        });

        this.deleteConfirmModal.addEventListener('click', (e) => {
            if (e.target === this.deleteConfirmModal) {
                this.closeDeleteConfirmModal();
            }
        });

        this.collectionsModal.addEventListener('click', (e) => {
            if (e.target === this.collectionsModal) {
                this.closeCollectionsModal();
            }
        });

        this.testModeSelectModal.addEventListener('click', (e) => {
            if (e.target === this.testModeSelectModal) {
                this.closeTestModeSelection();
            }
        });

        this.categorySelectModal.addEventListener('click', (e) => {
            if (e.target === this.categorySelectModal) {
                this.closeCategorySelection();
            }
        });

        // Audio upload handlers (Edit Modal)
        this.uploadAudioBtn.addEventListener('click', () => this.audioFileInput.click());
        this.audioFileInput.addEventListener('change', (e) => this.handleAudioUpload(e));
        this.removeAudioBtn.addEventListener('click', () => this.removeAudio());
        
        // Audio upload handlers (Add Modal)
        this.addUploadAudioBtn.addEventListener('click', () => this.addAudioFileInput.click());
        this.addAudioFileInput.addEventListener('change', (e) => this.handleAddAudioUpload(e));
        this.addRemoveAudioBtn.addEventListener('click', () => this.removeAddAudio());
        
        // Audio upload handlers (Add Test Modal)
        this.testUploadAudioBtn.addEventListener('click', () => this.testAudioFileInput.click());
        this.testAudioFileInput.addEventListener('change', (e) => this.handleTestAudioUpload(e));
        this.testRemoveAudioBtn.addEventListener('click', () => this.removeTestAudio());

        // Rich text editor toolbar buttons
        this.setupRichTextEditor();
        this.setupCreateTestEditor();
        this.setupAddCardEditor();
        
        // Setup paste handlers to strip formatting
        this.setupPasteHandlers();
        } catch (error) {
            console.error("INIT ERROR in attachEventListeners:", error);
            console.error("INIT ERROR stack:", error.stack);
            // Don't throw - log and continue, but log which buttons failed
            console.error("INIT: Some event listeners may not have been attached. Check console for missing elements.");
        }
    }

    // Authentication Methods
    loadCurrentUser() {
        // Try Supabase session first if configured
        if (this.supabase) {
            const session = this.supabase.auth.session();
            if (session && session.user) {
                return {
                    id: session.user.id,
                    username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
                    email: session.user.email
                };
            }
        }

        // Fall back to localStorage
        const user = localStorage.getItem('vocaBoxCurrentUser');
        return user ? JSON.parse(user) : null;
    }

    saveCurrentUser(user) {
        if (user) {
            localStorage.setItem('vocaBoxCurrentUser', JSON.stringify(user));
            // Reload subscription when user changes
            if (this.loadUserSubscription) {
                this.userSubscription = this.loadUserSubscription();
            }
        } else {
            localStorage.removeItem('vocaBoxCurrentUser');
            this.userSubscription = { tier: 'free', status: 'active' };
        }
    }

    // Subscription Management Methods
    loadUserSubscription() {
        // Support both logged-in users and guest users
        const userKey = this.currentUser 
            ? (this.currentUser.id || this.currentUser.username)
            : 'guest';
        
        const subscription = localStorage.getItem(`vocaBoxSubscription_${userKey}`);
        
        if (subscription) {
            const parsed = JSON.parse(subscription);
            // Ensure viaAccessCode and accessCodeLabel fields exist (for backward compatibility)
            if (parsed.viaAccessCode === undefined) {
                parsed.viaAccessCode = false;
            }
            if (parsed.accessCodeLabel === undefined) {
                parsed.accessCodeLabel = null;
            }
            return parsed;
        }

        // Default to free tier
        const defaultSub = {
            tier: typeof CONFIG !== 'undefined' ? CONFIG.subscription.defaultTier : 'free',
            status: 'active',
            expiresAt: null,
            viaAccessCode: false,
            accessCodeLabel: null
        };
        this.saveUserSubscription(defaultSub);
        return defaultSub;
    }

    saveUserSubscription(subscription) {
        // Support both logged-in users and guest users
        if (this.currentUser) {
            const userKey = this.currentUser.id || this.currentUser.username;
            localStorage.setItem(`vocaBoxSubscription_${userKey}`, JSON.stringify(subscription));
        } else {
            // For guest users, use a guest key
            localStorage.setItem('vocaBoxSubscription_guest', JSON.stringify(subscription));
        }
        this.userSubscription = subscription;
    }

    /**
     * Apply an access code to unlock a subscription tier
     * @param {string} code - The access code to validate and apply
     * @returns {Object|null} - Returns the matched access code config, or null if invalid
     */
    applyAccessCode(code) {
        if (!code || typeof code !== 'string') {
            return null;
        }
        
        const trimmedCode = code.trim().toUpperCase();
        
        // Check if CONFIG and whitelist exist
        if (typeof CONFIG === 'undefined' || !CONFIG.whitelist || !CONFIG.whitelist.accessCodes) {
            console.warn('[applyAccessCode] CONFIG.whitelist.accessCodes not found');
            return null;
        }
        
        // Find matching access code
        const matchedCode = CONFIG.whitelist.accessCodes.find(
            ac => ac.code.toUpperCase() === trimmedCode
        );
        
        if (!matchedCode) {
            return null;
        }
        
        // Validate tier exists in CONFIG
        if (!CONFIG.subscription || !CONFIG.subscription.tiers || !CONFIG.subscription.tiers[matchedCode.tier]) {
            console.error(`[applyAccessCode] Invalid tier "${matchedCode.tier}" in access code config`);
            return null;
        }
        
        // Save subscription with access code metadata
        const subscription = {
            tier: matchedCode.tier,
            status: 'active',
            expiresAt: null, // Access codes are permanent
            viaAccessCode: true,
            accessCodeLabel: matchedCode.label || null
        };
        
        this.saveUserSubscription(subscription);
        
        return matchedCode;
    }

    getUserSubscriptionTier() {
        // Check for access code subscription first (overrides everything)
        if (this.userSubscription?.viaAccessCode && this.userSubscription?.tier) {
            return this.userSubscription.tier;
        }
        
        // Legacy: Check old whitelist status (for backward compatibility)
        const whitelistStatus = localStorage.getItem('whitelistStatus');
        if (whitelistStatus === 'active') {
            return 'whitelist';
        }
        
        return this.userSubscription?.tier || (typeof CONFIG !== 'undefined' ? CONFIG.subscription.defaultTier : 'free');
    }

    getSubscriptionLimits() {
        const tier = this.getUserSubscriptionTier();
        
        // Whitelist users get unlimited everything
        if (tier === 'whitelist') {
            return {
                maxCards: Infinity,
                maxFolders: Infinity
            };
        }
        
        if (typeof CONFIG === 'undefined' || !CONFIG.subscription) {
            return { maxCards: 100, maxFolders: 3 };
        }
        
        const tierConfig = CONFIG.subscription.tiers[tier] || CONFIG.subscription.tiers.free;
        return {
            maxCards: tierConfig.maxCards === -1 ? Infinity : tierConfig.maxCards,
            maxFolders: tierConfig.maxFolders === -1 ? Infinity : tierConfig.maxFolders
        };
    }

    hasFeature(featureName) {
        const tier = this.getUserSubscriptionTier();
        if (typeof CONFIG === 'undefined' || !CONFIG.subscription) {
            // Default free tier features
            return ['basicTestModes', 'exportData', 'importData'].includes(featureName);
        }
        
        const tierConfig = CONFIG.subscription.tiers[tier] || CONFIG.subscription.tiers.free;
        return tierConfig.features[featureName] || false;
    }

    // Helper function to count only user-created cards (excluding system/built-in cards)
    getUserCardCount() {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        // Count only cards that are NOT system cards
        // Cards without isSystemCard property (legacy cards) are treated as user cards
        return this.cards.filter(card => !card.isSystemCard).length;
    }

    canAddCard() {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        const limits = this.getSubscriptionLimits();
        // Check for unlimited (either -1 or Infinity)
        if (limits.maxCards === -1 || limits.maxCards === Infinity) return true;
        
        // Count only user cards (system cards don't count toward limit)
        const currentUserCardCount = this.getUserCardCount();
        return currentUserCardCount < limits.maxCards;
    }

    canAddFolder() {
        const limits = this.getSubscriptionLimits();
        // Check for unlimited (either -1 or Infinity)
        if (limits.maxFolders === -1 || limits.maxFolders === Infinity) return true;
        
        // Count only parent folders (not child lists)
        const parentFolders = this.folders.filter(f => !f.parentFolderId);
        const currentFolderCount = parentFolders.length;
        return currentFolderCount < limits.maxFolders;
    }

    getRemainingCards() {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        const limits = this.getSubscriptionLimits();
        // Check for unlimited (either -1 or Infinity)
        if (limits.maxCards === -1 || limits.maxCards === Infinity) return 'Unlimited';
        
        // Count only user cards (system cards don't count toward limit)
        const currentUserCardCount = this.getUserCardCount();
        const remaining = limits.maxCards - currentUserCardCount;
        return Math.max(0, remaining);
    }

    getRemainingFolders() {
        const limits = this.getSubscriptionLimits();
        // Check for unlimited (either -1 or Infinity)
        if (limits.maxFolders === -1 || limits.maxFolders === Infinity) return 'Unlimited';
        
        const parentFolders = this.folders.filter(f => !f.parentFolderId);
        const currentFolderCount = parentFolders.length;
        const remaining = limits.maxFolders - currentFolderCount;
        return Math.max(0, remaining);
    }

    // Supabase Authentication Methods
    async signInWithSupabase(email, password) {
        if (!this.supabase) {
            throw new Error('Supabase not configured');
        }

        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        if (data.user) {
            this.currentUser = {
                id: data.user.id,
                username: data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'user',
                email: data.user.email
            };
            this.saveCurrentUser(this.currentUser);
            return this.currentUser;
        }

        return null;
    }

    async signUpWithSupabase(username, email, password) {
        if (!this.supabase) {
            throw new Error('Supabase not configured');
        }

        const { data, error } = await this.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username
                }
            }
        });

        if (error) throw error;

        if (data.user) {
            this.currentUser = {
                id: data.user.id,
                username: username,
                email: email
            };
            this.saveCurrentUser(this.currentUser);
            return this.currentUser;
        }

        return null;
    }

    async signOutFromSupabase() {
        if (this.supabase) {
            await this.supabase.auth.signOut();
        }
        this.currentUser = null;
        this.saveCurrentUser(null);
    }

    updateAuthUI() {
        if (this.currentUser) {
            this.authButtons.style.display = 'none';
            this.userInfo.style.display = 'flex';
            this.usernameDisplay.textContent = this.currentUser.username;
            this.updateSubscriptionBadge();
        } else {
            this.authButtons.style.display = 'flex';
            this.userInfo.style.display = 'none';
        }
    }


    openSignInModal() {
        this.signInModal.classList.add('active');
        this.signInError.style.display = 'none';
        this.signInContact.focus();
    }

    closeSignInModal() {
        this.signInModal.classList.remove('active');
        this.signInForm.reset();
        this.signInError.style.display = 'none';
    }

    openSpecialAccessModal() {
        if (this.specialAccessModal) {
            this.specialAccessModal.classList.add('active');
            this.specialAccessError.style.display = 'none';
            if (this.activationCode) {
                this.activationCode.focus();
            }
        }
    }

    closeSpecialAccessModal() {
        if (this.specialAccessModal) {
            this.specialAccessModal.classList.remove('active');
            if (this.specialAccessForm) {
                this.specialAccessForm.reset();
            }
            if (this.specialAccessError) {
                this.specialAccessError.style.display = 'none';
            }
        }
    }

    handleSpecialAccessActivation(e) {
        e.preventDefault();
        if (!this.activationCode) return;
        
        const code = this.activationCode.value.trim();
        
        if (!code) {
            this.showError(this.specialAccessError, 'Please enter an activation code');
            return;
        }
        
        // Try to apply the access code
        const matchedCode = this.applyAccessCode(code);
        
        if (!matchedCode) {
            this.showError(this.specialAccessError, 'Invalid activation code');
            return;
        }
        
        // Success - access code applied
        const tierName = CONFIG.subscription.tiers[matchedCode.tier]?.name || matchedCode.tier;
        const successMessage = matchedCode.label 
            ? `${tierName} access activated via ${matchedCode.label}!`
            : `${tierName} access activated!`;
        
        // Close modal and show success
        this.closeSpecialAccessModal();
        this.showNotification(successMessage, 'success');
        
        // Update badge and refresh UI
        this.updateSubscriptionBadge();
        this.renderCards();
        this.renderFolders();
    }

    openSignUpModal() {
        this.signUpModal.classList.add('active');
        this.signUpError.style.display = 'none';
        this.signUpUsername.focus();
    }

    closeSignUpModal() {
        this.signUpModal.classList.remove('active');
        this.signUpForm.reset();
        this.signUpError.style.display = 'none';
    }

    async handleSignIn(e) {
        e.preventDefault();
        const contact = this.signInContact.value.trim();
        const password = this.signInPassword.value;

        if (!contact || !password) {
            this.showError(this.signInError, 'Please fill in all fields');
            return;
        }

        // Validate contact format (must be email for Supabase)
        if (!this.validateContact(contact)) {
            this.showError(this.signInError, 'Please enter a valid email or phone number');
            return;
        }

        // Try Supabase authentication first if configured
        if (this.supabase && CONFIG.features.useSupabase && this.validateEmail(contact)) {
            try {
                await this.signInWithSupabase(contact, password);
                this.updateAuthUI();
                this.closeSignInModal();
                this.showNotification(`Welcome back, ${this.currentUser.username}!`, 'success');
                
                // Reload cards for this user
                const loadedCards = await this.loadCards();
                this.cards = Array.isArray(loadedCards) ? loadedCards : [];
                this.renderCards();
                this.updateCardCount();
                return;
            } catch (error) {
                this.showError(this.signInError, error.message || 'Sign in failed. Please try again.');
                return;
            }
        }

        // Fall back to localStorage authentication
        const users = this.getUsers();
        const user = users.find(u => u.contact === contact);

        if (!user) {
            this.showError(this.signInError, 'No account found with this email or phone number');
            return;
        }

        if (user.password !== password) {
            this.showError(this.signInError, 'Incorrect password');
            return;
        }

        // Sign in successful
        this.currentUser = { username: user.username };
        this.saveCurrentUser(this.currentUser);
        this.updateAuthUI();
        this.closeSignInModal();
        this.showNotification(`Welcome back, ${user.username}!`, 'success');
        
        // Reload cards for this user
        const loadedCards = await this.loadCards();
        this.cards = Array.isArray(loadedCards) ? loadedCards : [];
        this.renderCards();
        this.updateCardCount();
    }

    async handleSignUp(e) {
        e.preventDefault();
        const username = this.signUpUsername.value.trim();
        const contact = this.signUpContact.value.trim();
        const password = this.signUpPassword.value;
        const passwordConfirm = this.signUpPasswordConfirm.value;

        if (!username || !contact || !password || !passwordConfirm) {
            this.showError(this.signUpError, 'Please fill in all fields');
            return;
        }

        if (username.length < 3) {
            this.showError(this.signUpError, 'Username must be at least 3 characters');
            return;
        }

        // Validate email or phone
        if (!this.validateContact(contact)) {
            this.showError(this.signUpError, 'Please enter a valid email or phone number');
            return;
        }

        // Validate password strength
        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.valid) {
            this.showError(this.signUpError, passwordValidation.message);
            return;
        }

        if (password !== passwordConfirm) {
            this.showError(this.signUpError, 'Passwords do not match');
            return;
        }

        // Try Supabase authentication first if configured and contact is email
        if (this.supabase && CONFIG.features.useSupabase && this.validateEmail(contact)) {
            try {
                await this.signUpWithSupabase(username, contact, password);
                this.updateAuthUI();
                this.closeSignUpModal();
                
                // Initialize empty cards for new user
                this.cards = [];
                this.saveCards();
                this.renderCards();
                this.updateCardCount();
                this.showNotification(`Account created successfully! Welcome, ${username}! 🎉`, 'success');
                return;
            } catch (error) {
                this.showError(this.signUpError, error.message || 'Sign up failed. Please try again.');
                return;
            }
        }

        // Fall back to localStorage authentication
        const users = this.getUsers();
        
        // Check if username already exists
        if (users.find(u => u.username === username)) {
            this.showError(this.signUpError, 'Username already exists');
            return;
        }

        // Create new user
        const newUser = { username, password, contact };
        users.push(newUser);
        this.saveUsers(users);

        // Sign in the new user
        this.currentUser = { username: username };
        this.saveCurrentUser(this.currentUser);
        this.updateAuthUI();
        this.closeSignUpModal();
        
        // Initialize empty cards for new user
        this.cards = [];
        this.saveCards();
        this.renderCards();
        this.updateCardCount();
        
        this.showNotification(`Account created successfully! Welcome, ${username}! 🎉`, 'success');
    }

    validatePassword(password) {
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Password must contain at least one uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, message: 'Password must contain at least one lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'Password must contain at least one number' };
        }
        return { valid: true };
    }

    validateContact(contact) {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Phone validation (simple - accepts various formats)
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
        
        return emailRegex.test(contact) || phoneRegex.test(contact);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    maskContact(contact) {
        // Mask email: j***@g***.com
        if (contact.includes('@')) {
            const [localPart, domain] = contact.split('@');
            const [domainName, domainExt] = domain.split('.');
            return `${localPart[0]}***@${domainName[0]}***.${domainExt}`;
        }
        // Mask phone: +1***567890 or ***567890
        else {
            if (contact.length > 6) {
                return `${contact.substring(0, Math.min(2, contact.length - 6))}***${contact.substring(contact.length - 6)}`;
            }
            return `***${contact.substring(Math.max(0, contact.length - 4))}`;
        }
    }

    openForgotPasswordModal() {
        this.forgotPasswordModal.classList.add('active');
        this.forgotPasswordError.style.display = 'none';
        this.forgotContact.focus();
    }

    closeForgotPasswordModal() {
        this.forgotPasswordModal.classList.remove('active');
        this.forgotPasswordForm.reset();
        this.forgotPasswordError.style.display = 'none';
    }

    handleForgotPassword(e) {
        e.preventDefault();
        const contact = this.forgotContact.value.trim();

        if (!contact) {
            this.showError(this.forgotPasswordError, 'Please enter your email or phone number');
            return;
        }

        // Validate contact format
        if (!this.validateContact(contact)) {
            this.showError(this.forgotPasswordError, 'Please enter a valid email or phone number');
            return;
        }

        // Get users from localStorage
        const users = this.getUsers();
        const user = users.find(u => u.contact === contact);

        if (!user) {
            this.showError(this.forgotPasswordError, 'No account found with this email or phone number');
            return;
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store recovery data
        this.recoveryData = {
            username: user.username,
            code: code,
            contact: user.contact,
            timestamp: Date.now()
        };

        // In real app, send code via email/SMS here
        console.log(`Recovery code for ${user.username} (${contact}): ${code}`);

        // Show verify code modal
        this.closeForgotPasswordModal();
        this.openVerifyCodeModal();
    }

    openVerifyCodeModal() {
        if (!this.recoveryData) return;
        
        this.verifyCodeModal.classList.add('active');
        this.verifyCodeError.style.display = 'none';
        this.maskedContact.textContent = this.maskContact(this.recoveryData.contact);
        this.displayCode.textContent = this.recoveryData.code;
        this.recoveredUsername.value = this.recoveryData.username;
        this.newUsername.value = '';
        this.verificationCode.focus();
    }

    closeVerifyCodeModal() {
        this.verifyCodeModal.classList.remove('active');
        this.verifyCodeForm.reset();
        this.verifyCodeError.style.display = 'none';
        this.recoveryData = null;
    }

    handleVerifyCode(e) {
        e.preventDefault();
        
        if (!this.recoveryData) {
            this.showError(this.verifyCodeError, 'Session expired. Please try again.');
            return;
        }

        const code = this.verificationCode.value.trim();
        const newUsername = this.newUsername.value.trim();
        const newPassword = this.newPassword.value;
        const newPasswordConfirm = this.newPasswordConfirm.value;

        if (!code || !newPassword || !newPasswordConfirm) {
            this.showError(this.verifyCodeError, 'Please fill in all required fields');
            return;
        }

        // Check if code is expired (10 minutes)
        if (Date.now() - this.recoveryData.timestamp > 10 * 60 * 1000) {
            this.showError(this.verifyCodeError, 'Code expired. Please request a new one.');
            return;
        }

        // Verify code
        if (code !== this.recoveryData.code) {
            this.showError(this.verifyCodeError, 'Invalid code. Please try again.');
            return;
        }

        // Validate new password
        const passwordValidation = this.validatePassword(newPassword);
        if (!passwordValidation.valid) {
            this.showError(this.verifyCodeError, passwordValidation.message);
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            this.showError(this.verifyCodeError, 'Passwords do not match');
            return;
        }

        // Validate new username if provided
        if (newUsername && newUsername !== this.recoveryData.username) {
            if (newUsername.length < 3) {
                this.showError(this.verifyCodeError, 'Username must be at least 3 characters');
                return;
            }

            // Check if new username already exists
            const users = this.getUsers();
            if (users.find(u => u.username === newUsername && u.username !== this.recoveryData.username)) {
                this.showError(this.verifyCodeError, 'Username already exists');
                return;
            }
        }

        // Update user data
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.username === this.recoveryData.username);
        
        if (userIndex !== -1) {
            // Update password
            users[userIndex].password = newPassword;
            
            // Update username if provided
            if (newUsername && newUsername !== this.recoveryData.username) {
                users[userIndex].username = newUsername;
            }
            
            this.saveUsers(users);
            
            this.closeVerifyCodeModal();
            
            if (newUsername && newUsername !== this.recoveryData.username) {
                this.showNotification('Account updated successfully! Username and password have been changed.', 'success');
            } else {
            this.showNotification('Password reset successfully! Please sign in with your new password.', 'success');
            }
            
            // Open sign in modal
            setTimeout(() => {
                this.openSignInModal();
            }, 500);
        } else {
            this.showError(this.verifyCodeError, 'User not found');
        }
    }

    async signOut() {
        // Sign out from Supabase if configured
        if (this.supabase) {
            await this.signOutFromSupabase();
        }
        
        // Clear localStorage user
        if (confirm('Are you sure you want to sign out?')) {
            this.currentUser = null;
            this.saveCurrentUser(null);
            this.updateAuthUI();
            
            // Clear current cards from view
            this.cards = [];
            this.renderCards();
            this.updateCardCount();
            
            this.showNotification('Signed out successfully! 👋', 'success');
        }
    }

    getUsers() {
        const users = localStorage.getItem('vocaBoxUsers');
        return users ? JSON.parse(users) : [];
    }

    saveUsers(users) {
        localStorage.setItem('vocaBoxUsers', JSON.stringify(users));
    }

    showError(errorElement, message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#5FB3A7' : '#e74c3c'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Color Customization Modal Methods
    openColorCustomModal(presetNumber) {
        this.pendingColorPreset = presetNumber;
        this.customColorPresetNum.textContent = presetNumber;
        
        // Set current color
        const currentColor = this.customColors[presetNumber];
        this.customColorInput.value = currentColor;
        this.customColorHexInput.value = currentColor.toUpperCase();
        this.customColorHexInput.style.borderColor = '#ddd';
        
        // Update preview
        this.updateColorPreview(currentColor);
        
        // Show modal
        this.colorCustomizationModal.classList.add('active');
    }

    updateColorPreview(color) {
        this.colorPreviewBox.style.backgroundColor = color;
        this.colorPreviewText.style.color = color;
        this.colorHexDisplay.textContent = color.toUpperCase();
    }

    closeColorCustomModal() {
        this.colorCustomizationModal.classList.remove('active');
        this.pendingColorPreset = null;
    }

    confirmColorCustomization() {
        if (!this.pendingColorPreset) return;
        
        const newColor = this.customColorInput.value;
        const presetNum = this.pendingColorPreset;
        
        // Update the custom colors
        this.customColors[presetNum] = newColor;
        this.saveCustomColors();
        this.applyCustomColors();
        
        // Close modal
        this.closeColorCustomModal();
        
        // Show success notification
        this.showNotification(`✓ Preset Color ${presetNum} updated successfully!`, 'success');
    }

    // Custom Color Picker Modal Methods
    openCustomColorPickerModal(editor, savedSelection) {
        this.pendingCustomColorContext = { editor, savedSelection };
        
        // Set default color to black
        const defaultColor = '#000000';
        this.customColorPickerInput.value = defaultColor;
        this.customColorPickerHexInput.value = '000000';
        this.customColorPickerHexInput.style.borderColor = '#ddd';
        
        // Update preview
        this.updateCustomColorPickerPreview(defaultColor);
        
        // Show modal
        this.customColorPickerModal.classList.add('active');
    }

    updateCustomColorPickerPreview(color) {
        this.customColorPickerPreviewBox.style.backgroundColor = color;
        this.customColorPickerPreviewText.style.color = color;
        this.customColorPickerHexDisplay.textContent = color.toUpperCase();
    }

    closeCustomColorPickerModal() {
        this.customColorPickerModal.classList.remove('active');
        this.pendingCustomColorContext = null;
    }

    confirmCustomColorPicker() {
        if (!this.pendingCustomColorContext) return;
        
        const { editor, savedSelection } = this.pendingCustomColorContext;
        const selectedColor = this.customColorPickerInput.value;
        
        // Restore selection and apply color
        if (savedSelection) {
            try {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(savedSelection.cloneRange());
            } catch (e) {
                console.log('Selection restore failed:', e);
            }
        }
        
        editor.focus();
        document.execCommand('foreColor', false, selectedColor);
        
        // Close modal
        this.closeCustomColorPickerModal();
        
        // Show success notification
        this.showNotification('✓ Color applied successfully!', 'success');
    }

    // IndexedDB Audio Management
    async initAudioDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('VocaBoxAudioDB', 1);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB');
                resolve(); // Continue even if DB fails
            };
            
            request.onsuccess = (event) => {
                this.audioDB = event.target.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('audioFiles')) {
                    db.createObjectStore('audioFiles', { keyPath: 'id' });
                }
            };
        });
    }

    async saveAudioFile(audioId, audioBlob, filename, fileType) {
        if (!this.audioDB) {
            throw new Error('Audio database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.audioDB.transaction(['audioFiles'], 'readwrite');
            const store = transaction.objectStore('audioFiles');
            
            const audioData = {
                id: audioId,
                blob: audioBlob,
                filename: filename,
                type: fileType,
                uploadDate: new Date().toISOString(),
                size: audioBlob.size
            };
            
            const request = store.put(audioData);
            
            request.onsuccess = () => resolve(audioId);
            request.onerror = () => reject(new Error('Failed to save audio'));
        });
    }

    async getAudioFile(audioId) {
        if (!this.audioDB) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.audioDB.transaction(['audioFiles'], 'readonly');
            const store = transaction.objectStore('audioFiles');
            const request = store.get(audioId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to retrieve audio'));
        });
    }

    async deleteAudioFile(audioId) {
        if (!this.audioDB || !audioId) {
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.audioDB.transaction(['audioFiles'], 'readwrite');
            const store = transaction.objectStore('audioFiles');
            const request = store.delete(audioId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete audio'));
        });
    }

    async handleAudioUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
            alert('Please upload a valid audio file (MP3, WAV, M4A, OGG, WEBM)');
            this.audioFileInput.value = '';
            return;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert('Audio file is too large. Maximum size is 10MB.');
            this.audioFileInput.value = '';
            return;
        }

        try {
            // Show loading indicator
            this.uploadAudioBtn.disabled = true;
            this.uploadAudioBtn.innerHTML = '<span class="btn-icon">⏳</span> Uploading...';

            // Generate audio ID
            const audioId = `audio_${this.currentEditingCardId}_${Date.now()}`;

            // Save to IndexedDB
            await this.saveAudioFile(audioId, file, file.name, file.type);

            // Update current audio ID
            this.currentAudioId = audioId;

            // Display audio player
            await this.displayAudioPlayer(audioId);

            // Reset file input
            this.audioFileInput.value = '';

            // Show success message
            this.showNotification('Audio uploaded successfully! 🎵', 'success');

        } catch (error) {
            console.error('Error uploading audio:', error);
            alert('Failed to upload audio. Please try again.');
        } finally {
            // Reset button
            this.uploadAudioBtn.disabled = false;
            this.uploadAudioBtn.innerHTML = '<span class="btn-icon">📁</span> Upload Audio File';
        }
    }

    async displayAudioPlayer(audioId) {
        if (!audioId) {
            this.currentAudio.style.display = 'none';
            this.audioUploadSection.style.display = 'block';
            return;
        }

        try {
            const audioData = await this.getAudioFile(audioId);
            if (!audioData) {
                this.currentAudio.style.display = 'none';
                this.audioUploadSection.style.display = 'block';
                return;
            }

            // Create object URL from blob
            const audioURL = URL.createObjectURL(audioData.blob);
            this.editAudioPlayer.src = audioURL;

            // Show player, hide upload button
            this.currentAudio.style.display = 'block';
            this.audioUploadSection.style.display = 'none';

        } catch (error) {
            console.error('Error displaying audio:', error);
            this.currentAudio.style.display = 'none';
            this.audioUploadSection.style.display = 'block';
        }
    }

    async removeAudio() {
        if (!this.currentAudioId) return;

        if (confirm('Are you sure you want to remove this audio?')) {
            try {
                // Delete from IndexedDB
                await this.deleteAudioFile(this.currentAudioId);

                // Clear current audio
                this.currentAudioId = null;
                this.editAudioPlayer.src = '';

                // Update UI
                this.currentAudio.style.display = 'none';
                this.audioUploadSection.style.display = 'block';

                this.showNotification('Audio removed successfully', 'success');

            } catch (error) {
                console.error('Error removing audio:', error);
                alert('Failed to remove audio. Please try again.');
            }
        }
    }

    // Add Card Audio Upload Methods
    async handleAddAudioUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
            alert('Please upload a valid audio file (MP3, WAV, M4A, OGG, WEBM)');
            this.addAudioFileInput.value = '';
            return;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Audio file is too large. Maximum size is 10MB.');
            this.addAudioFileInput.value = '';
            return;
        }

        try {
            // Show loading indicator
            this.addUploadAudioBtn.disabled = true;
            this.addUploadAudioBtn.innerHTML = '<span class="btn-icon">⏳</span> Uploading...';

            // Generate audio ID
            const audioId = `audio_new_${Date.now()}`;

            // Save to IndexedDB
            await this.saveAudioFile(audioId, file, file.name, file.type);

            // Update pending audio ID
            this.pendingAddAudioId = audioId;

            // Display audio player
            await this.displayAddAudioPlayer(audioId);

            // Reset file input
            this.addAudioFileInput.value = '';

            // Show success message
            this.showNotification('Audio uploaded successfully! 🎵', 'success');

        } catch (error) {
            console.error('Error uploading audio:', error);
            alert('Failed to upload audio. Please try again.');
        } finally {
            // Reset button
            this.addUploadAudioBtn.disabled = false;
            this.addUploadAudioBtn.innerHTML = '<span class="btn-icon">📁</span> Upload Audio File';
        }
    }

    async displayAddAudioPlayer(audioId) {
        if (!audioId) {
            this.addCurrentAudio.style.display = 'none';
            this.addAudioUploadSection.style.display = 'block';
            return;
        }

        try {
            const audioData = await this.getAudioFile(audioId);
            if (!audioData) {
                this.addCurrentAudio.style.display = 'none';
                this.addAudioUploadSection.style.display = 'block';
                return;
            }

            // Create object URL from blob
            const audioURL = URL.createObjectURL(audioData.blob);
            this.addAudioPlayer.src = audioURL;

            // Show player, hide upload button
            this.addCurrentAudio.style.display = 'block';
            this.addAudioUploadSection.style.display = 'none';

        } catch (error) {
            console.error('Error displaying audio:', error);
            this.addCurrentAudio.style.display = 'none';
            this.addAudioUploadSection.style.display = 'block';
        }
    }

    async removeAddAudio() {
        if (!this.pendingAddAudioId) return;

        if (confirm('Are you sure you want to remove this audio?')) {
            try {
                // Delete from IndexedDB
                await this.deleteAudioFile(this.pendingAddAudioId);

                // Clear pending audio
                this.pendingAddAudioId = null;
                this.addAudioPlayer.src = '';

                // Update UI
                this.addCurrentAudio.style.display = 'none';
                this.addAudioUploadSection.style.display = 'block';

                this.showNotification('Audio removed successfully', 'success');

            } catch (error) {
                console.error('Error removing audio:', error);
                alert('Failed to remove audio. Please try again.');
            }
        }
    }

    // Add Test Audio Upload Methods
    async handleTestAudioUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
            alert('Please upload a valid audio file (MP3, WAV, M4A, OGG, WEBM)');
            this.testAudioFileInput.value = '';
            return;
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Audio file is too large. Maximum size is 10MB.');
            this.testAudioFileInput.value = '';
            return;
        }

        try {
            // Show loading indicator
            this.testUploadAudioBtn.disabled = true;
            this.testUploadAudioBtn.innerHTML = '<span class="btn-icon">⏳</span> Uploading...';

            // Generate audio ID
            const audioId = `audio_test_${Date.now()}`;

            // Save to IndexedDB
            await this.saveAudioFile(audioId, file, file.name, file.type);

            // Update pending audio ID
            this.pendingTestAudioId = audioId;

            // Display audio player
            await this.displayTestAudioPlayer(audioId);

            // Reset file input
            this.testAudioFileInput.value = '';

            // Show success message
            this.showNotification('Audio uploaded successfully! 🎵', 'success');

        } catch (error) {
            console.error('Error uploading audio:', error);
            alert('Failed to upload audio. Please try again.');
        } finally {
            // Reset button
            this.testUploadAudioBtn.disabled = false;
            this.testUploadAudioBtn.innerHTML = '<span class="btn-icon">📁</span> Upload Audio File';
        }
    }

    async displayTestAudioPlayer(audioId) {
        if (!audioId) {
            this.testCurrentAudio.style.display = 'none';
            this.testAudioUploadSection.style.display = 'block';
            return;
        }

        try {
            const audioData = await this.getAudioFile(audioId);
            if (!audioData) {
                this.testCurrentAudio.style.display = 'none';
                this.testAudioUploadSection.style.display = 'block';
                return;
            }

            // Create object URL from blob
            const audioURL = URL.createObjectURL(audioData.blob);
            this.testAudioPlayer.src = audioURL;

            // Show player, hide upload button
            this.testCurrentAudio.style.display = 'block';
            this.testAudioUploadSection.style.display = 'none';

        } catch (error) {
            console.error('Error displaying audio:', error);
            this.testCurrentAudio.style.display = 'none';
            this.testAudioUploadSection.style.display = 'block';
        }
    }

    async removeTestAudio() {
        if (!this.pendingTestAudioId) return;

        if (confirm('Are you sure you want to remove this audio?')) {
            try {
                // Delete from IndexedDB
                await this.deleteAudioFile(this.pendingTestAudioId);

                // Clear pending audio
                this.pendingTestAudioId = null;
                this.testAudioPlayer.src = '';

                // Update UI
                this.testCurrentAudio.style.display = 'none';
                this.testAudioUploadSection.style.display = 'block';

                this.showNotification('Audio removed successfully', 'success');

            } catch (error) {
                console.error('Error removing audio:', error);
                alert('Failed to remove audio. Please try again.');
            }
        }
    }

    // Card Management
    // Helper method to ensure this.cards is always an array
    ensureCardsIsArray() {
        if (!Array.isArray(this.cards)) {
            console.warn('[ensureCardsIsArray] this.cards is not an array, initializing to empty array');
            this.cards = [];
        }
        return this.cards;
    }

    async loadCards() {
        // Try Supabase first if configured (async)
        if (this.supabase && this.currentUser && typeof CONFIG !== 'undefined' && CONFIG.features.enableCloudSync) {
            try {
                const supabaseCards = await this.loadCardsFromSupabase();
                if (supabaseCards !== null && supabaseCards.length > 0) {
                    // Transform Supabase format to app format
                    const cards = supabaseCards.map(item => item.card_data);
                    // Ensure it's an array
                    if (!Array.isArray(cards)) {
                        console.warn('[loadCards] Supabase returned non-array, using empty array');
                        return [];
                    }
                    // Also save to localStorage as backup
                    const userKey = this.currentUser ? `vocaBoxCards_${this.currentUser.username}` : 'vocaBoxCards_guest';
                    localStorage.setItem(userKey, JSON.stringify(cards));
                    return cards;
                }
            } catch (e) {
                console.warn('[Supabase] Error loading from cloud, falling back to localStorage:', e);
            }
        }

        // Fall back to localStorage (synchronous)
        const userKey = this.currentUser ? `vocaBoxCards_${this.currentUser.username}` : 'vocaBoxCards_guest';
        const savedCards = localStorage.getItem(userKey);
        if (savedCards) {
            try {
                const parsed = JSON.parse(savedCards);
                // Ensure it's an array
                if (!Array.isArray(parsed)) {
                    console.warn('[loadCards] localStorage data is not an array, using empty array');
                    return [];
                }
                return parsed;
            } catch (e) {
                console.error('[loadCards] Error parsing localStorage data:', e);
                return [];
            }
        } else {
            // Return empty array for new users - they can add cards or import from Collections
            const emptyCards = [];
            localStorage.setItem(userKey, JSON.stringify(emptyCards));
            return emptyCards;
        }
    }

    // Custom Colors Management
    loadCustomColors() {
        const savedColors = localStorage.getItem('vocaBoxCustomColors');
        if (savedColors) {
            return JSON.parse(savedColors);
        } else {
            // Default colors
            return {
                1: '#457B9D',
                2: '#9E2A2B',
                3: '#4D908E'
            };
        }
    }

    saveCustomColors() {
        localStorage.setItem('vocaBoxCustomColors', JSON.stringify(this.customColors));
    }

    applyCustomColors() {
        // Apply custom colors to all preset buttons
        for (let i = 1; i <= 3; i++) {
            const color = this.customColors[i];
            
            // Update front toolbar
            const frontIndicator = document.querySelector(`.preset-${i}-front`);
            const frontButton = document.querySelector(`.preset-color-btn[data-target="front"][data-preset="${i}"]`);
            const frontPicker = document.getElementById(`customColorPicker${i}Front`);
            if (frontIndicator) frontIndicator.style.backgroundColor = color;
            if (frontButton) frontButton.setAttribute('data-color', color);
            if (frontPicker) frontPicker.value = color;
            
            // Update back toolbar
            const backIndicator = document.querySelector(`.preset-${i}-back`);
            const backButton = document.querySelector(`.preset-color-btn[data-target="back"][data-preset="${i}"]`);
            const backPicker = document.getElementById(`customColorPicker${i}Back`);
            if (backIndicator) backIndicator.style.backgroundColor = color;
            if (backButton) backButton.setAttribute('data-color', color);
            if (backPicker) backPicker.value = color;
        }
        
        // Also update test toolbar colors
        this.applyCustomColorsToTestToolbar();
    }

    getSampleCards() {
        return [
            {
                id: 1001,
                front: "None can afford to squander (to waste money, time, etc. in a stupid or careless way) the potential of the young.",
                back: "squander v. to waste money, time, etc. in a stupid or careless way",
                category: 'card',
                createdAt: new Date().toISOString()
            },
            {
                id: 1002,
                front: "That leads to another lesson: it would be futile to try to stamp out (eliminate / eradicate / get rid of completely ) gig work in the hope that (with the expectation or desire that something will happen) permanent jobs will take its place.",
                back: "stamp out =eliminate to get rid of sth that is bad, unpleasant or dangerous, especially by using force or a lot of effort\nin the hope that with the expectation or desire that something will happen",
                category: 'card',
                createdAt: new Date().toISOString()
            },
            {
                id: 1003,
                front: "In many parts of Asia, including China, day labourers still huddle (to gather closely together, usually because of cold or fear) on the roadside early in the morning, waiting for employers to pick them from the throng (a crowd of people).",
                back: "huddle v. (of people or animals) to gather closely together, usually because of cold or fear\nthrong n. (literary) a crowd of people",
                category: 'card',
                createdAt: new Date().toISOString()
            },
            {
                id: 1004,
                front: "China could make mandatory (a. =compulsory F; required by law ) contributions from employers less onerous (a. F; burdensome, heavy, difficult, or causing a lot of trouble or responsibility), cutting their incentive to choose gig workers over permanent ones.",
                back: "mandatory a. (formal) required by law\n= compulsory\nonerous a. (formal) needing great effort; causing trouble or worry",
                category: 'card',
                createdAt: new Date().toISOString()
            },
            {
                id: 1005,
                front: "Others, lacking their parents' tolerance for drudgery (n. hard menial or dull work), are unwilling to perform the same repetitive task week in, week out.",
                back: "drudgery n. hard boring work",
                category: 'card',
                createdAt: new Date().toISOString()
            },
            {
                id: 1006,
                front: "Having left their rural hometowns, they may fail ot set down roots in the cities where they work so promiscuously (in a scattered, uncommitted, irregular way).",
                back: "promiscuous a. (formal) taken from a wide range of sources, especially without careful thought",
                category: 'card',
                createdAt: new Date().toISOString()
            }
        ];
    }

    saveCards() {
        // Always save to localStorage first (synchronous, immediate)
        try {
        const userKey = this.currentUser ? `vocaBoxCards_${this.currentUser.username}` : 'vocaBoxCards_guest';
            const dataToSave = JSON.stringify(this.cards);
            localStorage.setItem(userKey, dataToSave);
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                this.showNotification('Storage quota exceeded! Please export some data or clear space.', 'error');
                console.error('Storage quota exceeded');
                return; // Don't throw, just log and show notification
            } else {
                console.error('Error saving cards:', e);
                this.showNotification('Error saving cards. Please try again.', 'error');
                return;
            }
        }

        // Try Supabase sync in background (async, fire-and-forget)
        if (this.supabase && this.currentUser && typeof CONFIG !== 'undefined' && CONFIG.features.enableCloudSync) {
            this.saveCardsToSupabase().catch(err => {
                console.warn('[Supabase] Background sync failed, data saved to localStorage:', err);
            });
        }
    }

    // Get localStorage quota information
    getLocalStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate().then(estimate => ({
                quota: estimate.quota || 0,
                usage: estimate.usage || 0
            }));
        }
        // Fallback for browsers that don't support StorageManager
        return Promise.resolve({
            quota: 5 * 1024 * 1024, // Assume 5MB
            usage: this.estimateLocalStorageUsage()
        });
    }

    // Estimate localStorage usage
    estimateLocalStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    addCard(front, back, category = 'card', audioId = null, folderId = 'default') {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        // Check subscription limits
        if (!this.canAddCard()) {
            const limits = this.getSubscriptionLimits();
            this.showUpgradeModal('cards', limits.maxCards);
            return false;
        }

        const card = {
            id: Date.now(),
            front: front,
            back: back,
            category: category, // 'card' or 'test'
            audioId: audioId || undefined,
            folderId: folderId,
            createdAt: new Date().toISOString()
        };
        this.cards.unshift(card);
        this.saveCards();
        this.renderCards();
        this.updateCardCount();
        this.renderFolders(); // Update folder counts
        return true;
    }

    // Optimized bulk add without save/render; call saveCards/render manually after batch
    // isSystemCard: if true, card won't count toward free tier limit (for built-in decks)
    addCardSilent(front, back, category = 'card', audioId = null, folderId = 'default', isSystemCard = false) {
        // Ensure cards is an array
        if (!Array.isArray(this.cards)) {
            console.warn('[addCardSilent] this.cards is not an array, initializing...');
            this.cards = [];
        }
        
        // If this is a user card (not system), check limits before adding
        if (!isSystemCard && !this.canAddCard()) {
            // Limit check failed - caller should handle this
            return false;
        }
        
        this.cards.unshift({
            id: Date.now() + Math.random(),
            front: front,
            back: back,
            category: category,
            audioId: audioId || undefined,
            folderId: folderId,
            isSystemCard: isSystemCard || undefined, // Only set if true, to keep existing cards clean
            createdAt: new Date().toISOString()
        });
        
        return true;
    }

    deleteCard(id) {
        this.pendingDeleteId = id;
        this.openDeleteConfirmModal();
    }

    changeCardFolder(cardId, newFolderId) {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        // Find the card and update its folder
        const cardIndex = this.cards.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            this.cards[cardIndex].folderId = newFolderId;
            
            // Update folder name for display
            if (newFolderId === 'default') {
                this.cards[cardIndex].folderName = 'Default Folder';
            } else {
                const folder = this.folders.find(f => f.id === newFolderId);
                this.cards[cardIndex].folderName = folder ? folder.name : 'Unknown Folder';
            }
            
            // Save to localStorage
            this.saveCards();
            
            // Update the specific card element instead of re-rendering all cards
            this.updateCardElement(cardId);
            this.updateFolderCounts();
        }
    }

    updateCardElement(cardId) {
        // Find the card element in the DOM
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`).closest('.card-item');
        if (cardElement) {
            // Find the card data
            const card = this.cards.find(c => c.id === cardId);
            if (card) {
                // Update the folder name in the button
                const folderNameSpan = cardElement.querySelector('.folder-name');
                if (folderNameSpan) {
                    folderNameSpan.textContent = card.folderName || 'Default Folder';
                }
                
                // Update the card color class
                const folderClass = this.getFolderColorClass(card.folderId);
                // Remove all existing folder classes
                cardElement.classList.remove('folder-default', 'folder-ielts', 'folder-unlock', 'folder-toefl', 'folder-gre', 'folder-sat', 'folder-vocabulary', 'folder-grammar', 'folder-folder9', 'folder-folder10');
                // Add the new folder class
                if (folderClass) {
                    cardElement.classList.add(folderClass);
                }
                
            }
        }
    }

    getFolderColorClass(folderId) {
        // Define the 10 colors for folder identification
        const folderColors = [
            '#CD7D88', // 1
            '#BFDCDB', // 2
            '#87ABC5', // 3
            '#C5B5D3', // 4
            '#DE9C73', // 5
            '#5F2312', // 6
            '#DE634D', // 7
            '#E1A102', // 8
            '#3A989E', // 9
            '#B66899'  // 10
        ];
        
        // Get all folders and sort them consistently to match sidebar colors
        const allFolders = [
            { id: 'default', name: 'Default Folder' },
            ...this.folders.filter(f => f.id !== 'default').sort((a, b) => {
                // Sort by name for consistent ordering (case-insensitive)
                return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            })
        ];
        
        // Find the index of the current folder
        const folderIndex = allFolders.findIndex(f => f.id === folderId);
        
        // Use the color index (0-9) to determine which color to use
        const colorIndex = folderIndex >= 0 ? folderIndex % folderColors.length : 0;
        
        // Return the appropriate CSS class based on color index
        const colorClasses = [
            'folder-default',    // #CD7D88
            'folder-ielts',      // #BFDCDB
            'folder-unlock',     // #87ABC5
            'folder-toefl',      // #C5B5D3
            'folder-gre',        // #DE9C73
            'folder-sat',        // #5F2312
            'folder-vocabulary', // #DE634D
            'folder-grammar',    // #E1A102
            'folder-folder9',    // #3A989E
            'folder-folder10'    // #B66899
        ];
        
        return colorClasses[colorIndex] || 'folder-default';
    }

    toggleFolderDropdown(cardId) {
        // Close all other dropdowns first
        this.closeAllFolderDropdowns();
        
        // Toggle the current dropdown
        const folderBtn = document.querySelector(`.folder-dropdown-btn[data-card-id="${cardId}"]`);
        if (folderBtn) {
            const dropdownMenu = folderBtn.parentElement.querySelector('.folder-dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('active');
                folderBtn.classList.toggle('active');
            }
        }
    }

    closeAllFolderDropdowns() {
        const allDropdowns = document.querySelectorAll('.folder-dropdown-menu');
        const allButtons = document.querySelectorAll('.folder-dropdown-btn');
        
        allDropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
        
        allButtons.forEach(button => {
            button.classList.remove('active');
        });
    }

    openDeleteConfirmModal() {
        this.deleteConfirmModal.classList.add('active');
        // Make modal focusable and focus it for keyboard events
        this.deleteConfirmModal.setAttribute('tabindex', '-1');
        this.deleteConfirmModal.focus();
    }

    closeDeleteConfirmModal() {
        this.deleteConfirmModal.classList.remove('active');
        this.pendingDeleteId = null;
    }

    async confirmDelete() {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        if (this.pendingDeleteId) {
            const card = this.cards.find(c => c.id === this.pendingDeleteId);
            
            // Delete associated audio if exists
            if (card && card.audioId) {
                await this.deleteAudioFile(card.audioId);
            }
            
            // Get cards to show before deletion
            const cardsToShowBefore = this.getCardsForCurrentFolder();
            const deletedIndex = cardsToShowBefore.findIndex(c => c.id === this.pendingDeleteId);
            
            this.cards = this.cards.filter(card => card.id !== this.pendingDeleteId);
            this.saveCards();
            
            // Adjust current card index if needed
            if (deletedIndex !== -1 && deletedIndex < this.currentCardIndex) {
                this.currentCardIndex--;
            } else if (deletedIndex !== -1 && deletedIndex === this.currentCardIndex && this.currentCardIndex > 0) {
                this.currentCardIndex--;
            }
            
            this.renderCards();
            this.updateCardCount();
            this.closeDeleteConfirmModal();
        }
    }

    renderCards() {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        console.log('[renderCards] Starting render...');
        this.cardsContainer.innerHTML = '';

        // Show cards for current folder
        const cardsToShow = this.getCardsForCurrentFolder();
        console.log('[renderCards] Cards to show:', cardsToShow.length);

        // Show/hide empty state
        if (cardsToShow.length === 0) {
            console.log('[renderCards] No cards to show - displaying empty state');
            this.cardsEmptyState.classList.remove('hidden');
            this.cardsNavigation.style.display = 'none';
            // Hide arrow buttons when no cards
            if (this.mainCardArrowLeft) {
                this.mainCardArrowLeft.style.display = 'none';
            }
            if (this.mainCardArrowRight) {
                this.mainCardArrowRight.style.display = 'none';
            }
            // Hide decoration cat when no cards
            const cardsDecoration = document.querySelector('.cat-decoration');
            if (cardsDecoration) cardsDecoration.style.display = 'none';
        } else {
            console.log('[renderCards] Showing cards, currentCardIndex:', this.currentCardIndex);
            this.cardsEmptyState.classList.add('hidden');
            this.cardsNavigation.style.display = 'flex';
            // Show decoration cat when cards exist
            const cardsDecoration = document.querySelector('.cat-decoration');
            if (cardsDecoration) cardsDecoration.style.display = 'block';
            
            // Reset card index if out of bounds
            if (this.currentCardIndex >= cardsToShow.length) {
                this.currentCardIndex = 0;
            }
            
            // Show/hide arrow buttons based on card position
            if (this.mainCardArrowLeft) {
                this.mainCardArrowLeft.style.display = this.currentCardIndex > 0 ? 'flex' : 'none';
            }
            if (this.mainCardArrowRight) {
                this.mainCardArrowRight.style.display = this.currentCardIndex < cardsToShow.length - 1 ? 'flex' : 'none';
            }
            
            // Show only the current card
            const currentCard = cardsToShow[this.currentCardIndex];
            if (currentCard) {
                // Ensure folderId and folderName are consistent
                const folder = this.folders.find(f => f.id === currentCard.folderId);
                if (!folder) {
                    // If card.folderId points to a non-existent folder, find parent or assign to 'default'
                    currentCard.folderId = currentCard.folderId || 'default';
                    currentCard.folderName = 'Default Folder';
                } else {
                    // Update folderName to match actual folder name
                    currentCard.folderName = folder.name;
                }
                const cardElement = this.createCardElement(currentCard);
                this.cardsContainer.appendChild(cardElement);
            }
            
            // Update navigation
            this.updateCardNavigation(cardsToShow.length);
        }
        
        // Reapply font size after rendering
        setTimeout(() => this.applyFontSize(), 50);
    }
    
    updateCardNavigation(totalCards) {
        if (totalCards > 0) {
            this.cardPosition.textContent = `${this.currentCardIndex + 1} / ${totalCards}`;
            this.prevCardViewBtn.disabled = this.currentCardIndex === 0;
            this.nextCardViewBtn.disabled = this.currentCardIndex === totalCards - 1;
        }
    }
    
    previousCardView() {
        const cardsToShow = this.getCardsForCurrentFolder();
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.renderCards();
        }
    }
    
    nextCardView() {
        const cardsToShow = this.getCardsForCurrentFolder();
        if (this.currentCardIndex < cardsToShow.length - 1) {
            this.currentCardIndex++;
            this.renderCards();
        }
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-item';
        cardDiv.dataset.flipped = 'false';
        
        // Add folder-specific color class
        // Cards always use their own folder color, not the selected folder's color
        // First, validate and find the actual folder for this card
        let folderIdForColor = card.folderId || 'default';
        
        // If folderId points to a child folder, we need to find the parent folder for color
        const cardFolder = this.folders.find(f => f.id === folderIdForColor);
        if (cardFolder && cardFolder.parentFolderId) {
            // Card is in a child folder - use the parent folder's color
            folderIdForColor = cardFolder.parentFolderId;
        } else if (!cardFolder) {
            // Invalid folderId - default to 'default'
            folderIdForColor = 'default';
        }
        
        const folderClass = this.getFolderColorClass(folderIdForColor);
        if (folderClass) {
            cardDiv.classList.add(folderClass);
        }
        
        const hasAudio = card.audioId ? true : false;
        
        // Check if audio pronunciation is enabled
        const audioEnabled = typeof CONFIG !== 'undefined' && CONFIG.features && CONFIG.features.enableAudioPronunciation;
        const speakerIcon = audioEnabled ? '<button class="speaker-btn" title="Pronounce word" aria-label="Pronounce word"><img src="music.png" alt="Pronounce" style="width: 20px; height: 20px;"></button>' : '';
        
        cardDiv.innerHTML = `
            <div class="card-flip-container">
                <div class="card-flip-inner">
                    <div class="card-face card-front">
                        <div class="card-header-with-speaker">
                            ${speakerIcon}
                            <div class="card-content">
                                ${card.front}
                            </div>
                        </div>
                    </div>
                    <div class="card-face card-back">
                        <div class="card-content">
                            ${card.back}
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <div class="card-action-left">
                    <div class="font-size-control-inline">
                        <span class="font-size-label">Font Size:</span>
                        <button class="font-size-btn font-decrease-btn" title="Decrease font size">−</button>
                        <span class="font-size-value" id="fontSizeValue">100%</span>
                        <button class="font-size-btn font-increase-btn" title="Increase font size">+</button>
                        <button class="font-size-btn font-size-reset font-reset-btn" title="Reset to default">Reset</button>
                    </div>
                </div>
                <div class="card-action-right">
                    ${hasAudio ? `<button class="play-audio-btn" data-audio-id="${card.audioId}" title="Play audio"><img src="music.png" alt="Play" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;"> Play</button>` : ''}
                    <button class="edit-btn" data-id="${card.id}"><img src="pencil.png" alt="Edit" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 4px;"> Edit</button>
                    <button class="delete-btn" data-id="${card.id}"><img src="trashbin.png" alt="Delete" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 4px;"> Delete</button>
                </div>
            </div>
        `;

        // Add event listeners after innerHTML
        const editBtn = cardDiv.querySelector('.edit-btn');
        const deleteBtn = cardDiv.querySelector('.delete-btn');
        const fontDecreaseBtn = cardDiv.querySelector('.font-decrease-btn');
        const fontIncreaseBtn = cardDiv.querySelector('.font-increase-btn');
        const fontResetBtn = cardDiv.querySelector('.font-reset-btn');
        const fontSizeValue = cardDiv.querySelector('.font-size-value');
        
        editBtn.addEventListener('click', () => this.openEditCardModal(card.id));
        deleteBtn.addEventListener('click', () => this.deleteCard(card.id));
        
        // Add font size control listeners
        fontDecreaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.decreaseFontSize();
            fontSizeValue.textContent = `${this.currentFontSize}%`;
        });
        fontIncreaseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.increaseFontSize();
            fontSizeValue.textContent = `${this.currentFontSize}%`;
        });
        fontResetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.resetFontSize();
            fontSizeValue.textContent = `${this.currentFontSize}%`;
        });
        // Set initial font size display
        fontSizeValue.textContent = `${this.currentFontSize || 100}%`;

        // Add audio play button listener
        if (hasAudio) {
            const playBtn = cardDiv.querySelector('.play-audio-btn');
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playCardAudio(card.audioId);
            });
        }
        
        // Add flip functionality
        const flipContainer = cardDiv.querySelector('.card-flip-container');
        flipContainer.addEventListener('click', () => {
            const isFlipped = cardDiv.dataset.flipped === 'true';
            cardDiv.dataset.flipped = isFlipped ? 'false' : 'true';
            const flipInner = cardDiv.querySelector('.card-flip-inner');
            if (isFlipped) {
                flipInner.style.transform = 'rotateX(0deg)';
            } else {
                flipInner.style.transform = 'rotateX(180deg)';
            }
        });

        // Apply single-line centering to both faces initially
        cardDiv.querySelectorAll('.card-content').forEach(el => this.applySingleLineCentering(el));
        // Re-center on window resize
        const recalc = () => cardDiv.querySelectorAll('.card-content').forEach(el => this.applySingleLineCentering(el));
        window.addEventListener('resize', recalc);
        
        // Prevent button clicks from triggering flip
        const actionButtons = cardDiv.querySelectorAll('.card-actions button, .card-header button');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
        
        // Add speaker button click handler
        const speakerBtn = cardDiv.querySelector('.speaker-btn');
        if (speakerBtn) {
            speakerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const frontText = card.front || '';
                // Extract just the word (before comma or first line)
                const wordToSpeak = frontText.split(/[,\n]/)[0].trim();
                if (wordToSpeak) {
                    speakText(wordToSpeak);
                }
            });
        }

        return cardDiv;
    }

    async playCardAudio(audioId) {
        if (!audioId) return;

        try {
            // Stop any currently playing audio
            if (this.currentPlayingAudio) {
                this.currentPlayingAudio.pause();
                this.currentPlayingAudio.currentTime = 0;
                this.currentPlayingAudio = null;
            }

            const audioData = await this.getAudioFile(audioId);
            if (!audioData) {
                this.showNotification('Audio file not found', 'error');
                return;
            }

            // Create and play audio
            const audioURL = URL.createObjectURL(audioData.blob);
            const audio = new Audio(audioURL);
            
            // Store reference to currently playing audio
            this.currentPlayingAudio = audio;
            
            audio.play().catch(error => {
                console.error('Error playing audio:', error);
                this.showNotification('Failed to play audio', 'error');
                this.currentPlayingAudio = null;
            });

            // Clean up when audio ends or errors
            audio.addEventListener('ended', () => {
                URL.revokeObjectURL(audioURL);
                if (this.currentPlayingAudio === audio) {
                    this.currentPlayingAudio = null;
                }
            });

            audio.addEventListener('error', () => {
                URL.revokeObjectURL(audioURL);
                if (this.currentPlayingAudio === audio) {
                    this.currentPlayingAudio = null;
                }
            });

        } catch (error) {
            console.error('Error loading audio:', error);
            this.showNotification('Failed to load audio', 'error');
        }
    }

    updateCardCount() {
        // Show count for the current selection (folder or list), not global total
        const visibleCount = this.getCardsForCurrentFolder().length;
        
        // Safety check: ensure element exists
        if (!this.cardCount) {
            console.warn('Card count element not found, re-caching');
            this.cardCount = document.getElementById('cardCount');
            
            // If still not found, skip but continue with other updates
            if (!this.cardCount) {
                console.warn('Could not find card count element, skipping update');
            } else {
                this.cardCount.textContent = visibleCount;
            }
        } else {
            this.cardCount.textContent = visibleCount;
        }
        
        // Update current folder info display
        this.updateCurrentFolderInfo();
    }
    
    updateCurrentFolderInfo() {
        if (!this.currentFolderInfo || !this.currentFolderContent) {
            console.log('[updateCurrentFolderInfo] Elements not found');
            return;
        }
        
        console.log(`[updateCurrentFolderInfo] Updating for folder: ${this.currentFolder}`);
        
        // Show folder info - always visible
        if (this.currentFolder === 'all') {
            // Count all cards
            const cardCount = this.cards.length;
            const text = `All Folders-${cardCount} cards`;
            console.log(`[updateCurrentFolderInfo] Setting text to: ${text}`);
            this.currentFolderContent.textContent = text;
            this.currentFolderInfo.style.display = 'flex';
            return;
        }
        
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        // Find the current folder
        const folder = this.folders.find(f => f.id === this.currentFolder);
        if (!folder) {
            console.log(`[updateCurrentFolderInfo] Folder not found for ID: ${this.currentFolder}`);
            const cardCount = this.cards.length;
            const text = `All Folders-${cardCount} cards`;
            this.currentFolderContent.textContent = text;
            this.currentFolderInfo.style.display = 'flex';
            return;
        }
        
        console.log(`[updateCurrentFolderInfo] Found folder: ${folder.name}`);
        
        // Count cards in this folder (using same logic as createFolderElement)
        let cardCount = 0;
        let formattedText = '';
        
        if (folder.parentFolderId) {
            // Child folder: own cards only
            cardCount = this.cards.filter(card => card.folderId === folder.id).length;
            
            // Get parent folder name
            const parentFolder = this.folders.find(f => f.id === folder.parentFolderId);
            if (parentFolder) {
                // Format: "ParentName-ChildName-cardCount cards"
                formattedText = `${parentFolder.name}-${folder.name}-${cardCount} cards`;
            } else {
                // Parent not found, just show child name
                formattedText = `${folder.name}-${cardCount} cards`;
            }
        } else {
            // Parent folder: check if it has child folders
            const childIds = this.getChildFolderIdsForParent(folder.id);
            if (childIds.size > 0) {
                // Has children: count cards in child folders only, NOT cards directly in parent
                this.cards.forEach(c => { if (childIds.has(c.folderId)) cardCount++; });
            } else {
                // No children: count cards directly in this folder
                cardCount = this.cards.filter(card => card.folderId === folder.id).length;
            }
            // Format: "FolderName-cardCount cards"
            formattedText = `${folder.name}-${cardCount} cards`;
        }
        
        console.log(`[updateCurrentFolderInfo] Setting button text to: ${formattedText}`);
        
        // Update display
        this.currentFolderContent.textContent = formattedText;
        this.currentFolderInfo.style.display = 'flex';
        
        console.log(`[updateCurrentFolderInfo] Button text updated successfully`);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Modal Functions
    openAddCardModal() {
        this.addCardModal.classList.add('active');
        this.pendingAddAudioId = null;
        this.addCurrentAudio.style.display = 'none';
        this.addAudioUploadSection.style.display = 'block';
        this.addAudioPlayer.src = '';
        
        // Update list selector based on currently selected folder
        this.updateAddCardListSelector();
        
        this.addFrontText.focus();
    }

    async closeAddCardModal() {
        // Clean up pending audio if card wasn't saved
        if (this.pendingAddAudioId) {
            await this.deleteAudioFile(this.pendingAddAudioId);
            this.pendingAddAudioId = null;
        }
        
        this.addCardModal.classList.remove('active');
        this.addCardForm.reset();
        this.addFrontText.innerHTML = '';
        this.addBackText.innerHTML = '';
        this.addCurrentAudio.style.display = 'none';
        this.addAudioUploadSection.style.display = 'block';
        this.addAudioPlayer.src = '';
    }

    async handleAddCard(e) {
        e.preventDefault();
        const front = this.addFrontText.innerHTML.trim();
        const back = this.addBackText.innerHTML.trim();
        
        // Use list if selected, otherwise use folder
        let folderId = this.addCardFolder.value;
        if (this.addCardList && this.addCardList.value) {
            folderId = this.addCardList.value;
        }

        if (front || back) {
            const success = this.addCard(front, back, 'card', this.pendingAddAudioId, folderId);
            if (!success) return; // Limit reached, upgrade modal shown
            this.pendingAddAudioId = null;
            this.closeAddCardModal();
        } else {
            this.showNotification('Please fill in at least one field (front or back).', 'error');
        }
    }

    async addNextCard() {
        const front = this.addFrontText.innerHTML.trim();
        const back = this.addBackText.innerHTML.trim();

        if (front || back) {
            const success = this.addCard(front, back, 'card', this.pendingAddAudioId);
            if (!success) {
                this.pendingAddAudioId = null;
                return; // Limit reached, upgrade modal shown
            }
            this.pendingAddAudioId = null;
            this.clearAddCardForm();
            this.showNotification('Card added! Ready for next card.', 'success');
            this.addFrontText.focus();
        } else {
            this.showNotification('Please fill in at least one field (front or back).', 'error');
        }
    }

    clearAddCardForm() {
        this.addCardForm.reset();
        this.addFrontText.innerHTML = '';
        this.addBackText.innerHTML = '';
        this.addCurrentAudio.style.display = 'none';
        this.addAudioUploadSection.style.display = 'block';
        this.addAudioPlayer.src = '';
    }

    // Edit Modal Functions
    async openEditCardModal(cardId) {
        this.currentEditingCardId = cardId;
        const card = this.cards.find(c => c.id === cardId);
        
        if (card) {
            await this.loadCardIntoEditor(card);
            this.editCardModal.classList.add('active');
            this.updateEditNavigation();
            this.editFrontText.focus();
        }
    }

    async loadCardIntoEditor(card) {
        this.editFrontText.innerHTML = card.front;
        this.editBackText.innerHTML = card.back;
        
        // Set folder selection
        this.editCardFolder.value = card.folderId || 'default';
        
        // Load audio if exists
        this.currentAudioId = card.audioId || null;
        await this.displayAudioPlayer(this.currentAudioId);
        
        // Update card number display
        const currentIndex = this.cards.findIndex(c => c.id === this.currentEditingCardId);
        this.editCardNum.textContent = `(${currentIndex + 1}/${this.cards.length})`;
    }

    updateEditNavigation() {
        const currentIndex = this.cards.findIndex(c => c.id === this.currentEditingCardId);
        
        // Disable/enable navigation buttons based on position
        this.editPrevCardBtn.disabled = currentIndex === 0;
        this.editNextCardBtn.disabled = currentIndex === this.cards.length - 1;
    }

    async editPreviousCard() {
        // Save current card first
        await this.saveCurrentEditingCard();
        
        const currentIndex = this.cards.findIndex(c => c.id === this.currentEditingCardId);
        if (currentIndex > 0) {
            this.currentEditingCardId = this.cards[currentIndex - 1].id;
            await this.loadCardIntoEditor(this.cards[currentIndex - 1]);
            this.updateEditNavigation();
        }
    }

    async editNextCard() {
        // Save current card first
        await this.saveCurrentEditingCard();
        
        const currentIndex = this.cards.findIndex(c => c.id === this.currentEditingCardId);
        if (currentIndex < this.cards.length - 1) {
            this.currentEditingCardId = this.cards[currentIndex + 1].id;
            await this.loadCardIntoEditor(this.cards[currentIndex + 1]);
            this.updateEditNavigation();
        }
    }

    async saveCurrentEditingCard(shouldRender = false) {
        if (!this.currentEditingCardId) return;
        
        const front = this.editFrontText.innerHTML.trim();
        const back = this.editBackText.innerHTML.trim();
        
        // Check if content is actually empty (accounting for HTML tags)
        const frontText = this.editFrontText.textContent.trim();
        const backText = this.editBackText.textContent.trim();

        if ((front && frontText) || (back && backText)) {
            const cardIndex = this.cards.findIndex(c => c.id === this.currentEditingCardId);
            if (cardIndex !== -1) {
                // Preserve existing category when editing
                const existingCategory = this.cards[cardIndex].category || 'card';
                const oldAudioId = this.cards[cardIndex].audioId;
                const folderId = this.editCardFolder.value;
                
                this.cards[cardIndex].front = front;
                this.cards[cardIndex].back = back;
                this.cards[cardIndex].category = existingCategory;
                this.cards[cardIndex].audioId = this.currentAudioId;
                this.cards[cardIndex].folderId = folderId;
                
                // Delete old audio if it was replaced
                if (oldAudioId && oldAudioId !== this.currentAudioId) {
                    await this.deleteAudioFile(oldAudioId);
                }
                
                this.saveCards();
                
                // Update folder counts
                this.renderFolders();
                
                // Only re-render if explicitly requested (when closing modal)
                if (shouldRender) {
                    this.renderCards();
                }
            }
        }
    }

    async closeEditCardModal() {
        // Save current card before closing
        await this.saveCurrentEditingCard(false);
        
        this.editCardModal.classList.remove('active');
        this.currentEditingCardId = null;
        this.currentAudioId = null;
        this.editFrontText.innerHTML = '';
        this.editBackText.innerHTML = '';
        this.editAudioPlayer.src = '';
        
        // Re-render cards only when closing the modal
        this.renderCards();
    }

    async handleEditCard(e) {
        e.preventDefault();
        await this.closeEditCardModal();
    }

    // Add Test Modal Functions
    openCreateTestModal() {
        this.createTestModal.classList.add('active');
        this.pendingTestAudioId = null;
        this.testCurrentAudio.style.display = 'none';
        this.testAudioUploadSection.style.display = 'block';
        this.testAudioPlayer.src = '';
        this.testFrontText.focus();
    }

    async closeCreateTestModal() {
        // Clean up pending audio if test wasn't saved
        if (this.pendingTestAudioId) {
            await this.deleteAudioFile(this.pendingTestAudioId);
            this.pendingTestAudioId = null;
        }
        
        this.createTestModal.classList.remove('active');
        this.createTestForm.reset();
        this.testFrontText.innerHTML = '';
        this.testBackText.innerHTML = '';
        this.testCurrentAudio.style.display = 'none';
        this.testAudioUploadSection.style.display = 'block';
        this.testAudioPlayer.src = '';
    }

    async handleCreateTest(e) {
        e.preventDefault();
        const front = this.testFrontText.innerHTML.trim();
        const back = this.testBackText.innerHTML.trim();

        if (front || back) {
            const success = this.addCard(front, back, 'test', this.pendingTestAudioId);
            if (!success) return; // Limit reached, upgrade modal shown
            this.pendingTestAudioId = null;
            this.closeCreateTestModal();
        } else {
            this.showNotification('Please fill in at least one field (front or back).', 'error');
        }
    }

    // Import Word List Methods
    openImportModal() {
        // Re-cache modal element first in case it wasn't in DOM when initialized
        if (!this.importWordListModal) {
            this.importWordListModal = document.getElementById('importWordListModal');
        }
        
        if (!this.importWordListModal) {
            console.error('[openImportModal] Modal element not found!');
            return;
        }
        
        console.log('[openImportModal] Modal element found, adding active class');
        this.importWordListModal.classList.add('active');
        console.log('[openImportModal] Modal classList after adding active:', this.importWordListModal.classList.toString());
        console.log('[openImportModal] Modal computed display:', window.getComputedStyle(this.importWordListModal).display);
        
        // Re-cache elements in case modal wasn't in DOM when initialized
        this.wordListTextarea = document.getElementById('bulkTextInput') || document.getElementById('wordListTextarea');
        this.previewCount = document.getElementById('importPreviewCount') || document.getElementById('previewCount');
        this.customTermDelimiter = document.getElementById('customTermDefDelim') || document.getElementById('customTermDelimiter');
        this.customCardDelimiter = document.getElementById('customCardDelim') || document.getElementById('customCardDelimiter');
        this.importTargetFolder = document.getElementById('importFolderSelect') || document.getElementById('importTargetFolder');
        this.importTargetList = document.getElementById('importListSelect') || document.getElementById('importTargetList');
        this.importListGroup = document.getElementById('importListGroup');
        this.createListForImportBtn = document.getElementById('createListForImportBtn');
        
        console.log('[openImportModal] Re-cached elements:', {
            wordListTextarea: !!this.wordListTextarea,
            previewCount: !!this.previewCount,
            importTargetFolder: !!this.importTargetFolder,
            importTargetList: !!this.importTargetList,
            importListGroup: !!this.importListGroup,
            createListForImportBtn: !!this.createListForImportBtn
        });
        
        // Re-attach event listener for create list button if needed
        if (this.createListForImportBtn && !this.createListForImportBtn.hasAttribute('data-listener-attached')) {
            this.createListForImportBtn.addEventListener('click', () => this.createListForImport());
            this.createListForImportBtn.setAttribute('data-listener-attached', 'true');
        }
        
        this.resetImportModal();
        this.updateImportFolderSelector();
        
        // Set the import target folder to the currently selected folder
        if (this.currentFolder && this.currentFolder !== 'all') {
            const selectedFolder = this.folders.find(f => f.id === this.currentFolder);
            if (selectedFolder && !selectedFolder.parentFolderId) {
                // If current folder is a parent, select it
                this.importTargetFolder.value = this.currentFolder;
            } else if (selectedFolder && selectedFolder.parentFolderId) {
                // If current folder is a child (list), select its parent and the list
                this.importTargetFolder.value = selectedFolder.parentFolderId;
                this.updateImportListSelector();
                if (this.importTargetList) {
                    this.importTargetList.value = this.currentFolder;
                }
            } else {
                this.importTargetFolder.value = this.currentFolder;
            }
        } else {
            // If no folder selected or "all" is selected, default to "default" folder
            // This ensures the list group is always visible when a parent folder exists
            if (this.importTargetFolder) {
                this.importTargetFolder.value = 'default';
            }
        }
        
        // Refresh list section immediately
        this.refreshImportListSection();
        
        // Update preview if there's already text in the textarea
        setTimeout(() => {
            if (this.wordListTextarea && this.wordListTextarea.value.trim()) {
                console.log('[openImportModal] Text found in textarea, updating preview');
                this.updatePreview();
            }
        }, 100);
    }

    closeImportModal() {
        this.importWordListModal.classList.remove('active');
        this.resetImportModal();
    }

    resetImportModal() {
        this.wordListTextarea.value = '';
        this.importError.style.display = 'none';
        this.previewCount.textContent = '0';
        this.previewCardsContainer.innerHTML = '<div class="preview-placeholder">Nothing to preview yet.</div>';
        this.customTermDelimiter.value = '';
        this.customCardDelimiter.value = '';
        this.vocabularyFileInput.value = '';
        this.selectedFileName.style.display = 'none';
        this.importTargetFolder.value = 'default';
        // Reset radio buttons to defaults
        // Support both old and new names for backward compatibility
        const termSpaceRadio = document.querySelector('input[name="termDefDelimiter"][value="space"]') || document.querySelector('input[name="termDelimiter"][value="space"]');
        const cardNewlineRadio = document.querySelector('input[name="cardDelimiter"][value="newline"]');
        if (termSpaceRadio) termSpaceRadio.checked = true;
        if (cardNewlineRadio) cardNewlineRadio.checked = true;
    }

    // Collections Methods
    openCollectionsModal() {
        this.collectionsModal.classList.add('active');
        this.collectionsError.style.display = 'none';
    }

    closeCollectionsModal() {
        this.collectionsModal.classList.remove('active');
    }

    async handleImportIELTSCollection() {
        try {
            // Prevent multiple simultaneous imports
            if (this.isImportingIELTS) {
                this.showCollectionsError('Import already in progress. Please wait...');
                return;
            }
            this.isImportingIELTS = true;
            // Use default prefix since input field was removed
            const prefix = (this.ieltsPrefixInput?.value || 'IELTS 8000 - List').trim();
            
            // One-click apply: always use the built-in dataset from data/IELTS_8000_exact.txt (8000 cleaned entries)
            const text = await this.getEmbeddedIELTSData();
            if (!text) {
                throw new Error('Failed to load IELTS 8000 data. Please check that data/IELTS_8000_exact.txt exists.');
            }
            const parentFolderId = await this.importIELTSText(text, prefix);
            // Auto-select parent folder so users can see the dropdown with all lists
            if (parentFolderId) {
                this.selectFolder(parentFolderId);
                this.updateListDropdownForHeader();
            }
        } catch (err) {
            this.showCollectionsError('Failed to import IELTS collection: ' + err.message);
        } finally {
            this.isImportingIELTS = false;
        }
    }

    showCollectionsError(message) {
        this.collectionsError.textContent = message;
        this.collectionsError.style.display = 'block';
    }

    async handleImportIELTSFromLocal(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.txt')) {
            this.showCollectionsError('Please choose a .txt file.');
            // Reset file input
            if (this.ieltsLocalFile) {
                this.ieltsLocalFile.value = '';
            }
            return;
        }
        const prefix = (this.ieltsPrefixInput?.value || 'IELTS 8000 - List').trim();
        try {
            // Prevent multiple simultaneous imports
            if (this.isImportingIELTS) {
                this.showCollectionsError('Import already in progress. Please wait...');
                if (this.ieltsLocalFile) {
                    this.ieltsLocalFile.value = '';
                }
                return;
            }
            this.isImportingIELTS = true;
            const text = await this.readFileAsText(file);
            const parentFolderId = await this.importIELTSText(text, prefix);
            // Auto-select parent folder so users can see the dropdown with all lists
            if (parentFolderId) {
                this.selectFolder(parentFolderId);
                this.updateListDropdownForHeader();
            }
        } catch (err) {
            this.showCollectionsError('Failed to read local file: ' + err.message);
        } finally {
            this.isImportingIELTS = false;
            // Always reset file input to allow re-selecting the same file
            if (this.ieltsLocalFile) {
                this.ieltsLocalFile.value = '';
            }
        }
    }

    async fetchLocalCollectionText(path) {
        const resp = await fetch(path, { cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return await resp.text();
    }

    async importIELTSText(text, prefix) {
        // CRITICAL: Ensure cards is always an array before any operations
        // If it's not an array, load it or initialize to empty array
        if (!Array.isArray(this.cards)) {
            try {
                this.cards = await this.loadCards();
            } catch (e) {
                console.error('[importIELTSText] Error loading cards, using empty array:', e);
                this.cards = [];
            }
        }
        // Double-check after async operation
        this.ensureCardsIsArray();
        
        // Parse raw rows from source text
        let items = this.parseIELTSFormat(text);
        console.log(`[importIELTSText] Parsed ${items.length} items from IELTS file`);
        
        // Deduplicate by word (front) case-insensitively and normalize whitespace
        // Also normalize the key to catch duplicates with different spacing
        const seenFront = new Set();
        const deduped = [];
        for (const row of items) {
            // Normalize: trim, lowercase, and collapse multiple spaces
            const normalizedKey = (row.front || '').trim().toLowerCase().replace(/\s+/g, ' ');
            if (!normalizedKey) continue;
            if (seenFront.has(normalizedKey)) continue;
            seenFront.add(normalizedKey);
            deduped.push(row);
        }
        console.log(`[importIELTSText] After deduplication: ${deduped.length} unique items`);
        
        const TARGET_WORDS = 8000;
        items = deduped.slice(0, TARGET_WORDS);
        console.log(`[importIELTSText] Final item count: ${items.length} (target: ${TARGET_WORDS})`);
        
        if (items.length === 0) {
            this.showCollectionsError('No items parsed from IELTS collection.');
            return;
        }
        
        if (items.length !== TARGET_WORDS) {
            console.warn(`[importIELTSText] Warning: Expected ${TARGET_WORDS} items, but got ${items.length}. Check parsing logic.`);
        }
        
        // DEBUG: Confirm IELTS_8000_exact.txt is being used
        console.log("DEBUG: Loaded IELTS_8000_exact.txt", {
            totalCards: items.length,
            sample: items.slice(0, 5).map(c => ({ front: c.front, back: c.back }))
        });
        
        // Extract parent name from prefix (e.g., "IELTS 8000 - List" -> "IELTS 8000")
        const parentName = prefix.replace(/\s*-\s*List\s*$/, '').trim() || prefix.split(' - ')[0] || 'IELTS 8000';
        // Ensure parent exists
        let parentFolder = this.folders.find(f => !f.parentFolderId && f.name === parentName);
        if (!parentFolder) {
            this.createFolder(parentName, 'IELTS vocabulary collection', null);
            parentFolder = this.folders[this.folders.length - 1];
        }
        // Always wipe any existing children (new-style or legacy-named) to avoid duplication
        const legacyPrefix = `${parentName} - List `;
        // Find all child folders: those with parentFolderId OR legacy naming pattern
        // Also check for folders that might have just "List XX" pattern if they were created under this parent
        const childFoldersExisting = this.folders.filter(f => {
            // New style: has parentFolderId pointing to this parent
            if (f.parentFolderId === parentFolder.id) return true;
            // Legacy style: name starts with "ParentName - List "
            if (f.name.startsWith(legacyPrefix)) return true;
            // Also check for "List XX" folders that might be orphaned children
            // Only include if they match the pattern and don't have a different parent
            const listMatch = f.name.match(/^List\s+(\d+)$/i);
            if (listMatch && !f.parentFolderId) {
                // Check if this folder might belong to this parent by checking if there are other children with similar patterns
                // This is a safety check to avoid deleting unrelated "List XX" folders
                const hasOtherChildren = this.folders.some(other => 
                    other.parentFolderId === parentFolder.id || other.name.startsWith(legacyPrefix)
                );
                // Only include if there are other children (suggesting this is part of the same collection)
                return hasOtherChildren;
            }
            return false;
        });
        if (childFoldersExisting.length > 0) {
            const childIds = new Set(childFoldersExisting.map(f => f.id));
            // CRITICAL: Ensure cards is always an array before filtering
            this.ensureCardsIsArray();
            // Remove cards in those child folders
            this.cards = this.cards.filter(c => !childIds.has(c.folderId));
            // Remove child folders
            this.folders = this.folders.filter(f => !childIds.has(f.id));
            this.saveCards();
            this.saveFolders(this.folders);
        }
        const parentFolderId = parentFolder.id;
        
        // IELTS 8000 is a built-in system deck - cards don't count toward free tier limit
        // Mark all cards as isSystemCard: true so they don't consume user's 100 free card slots
        const chunks = this.chunkArray(items, 200);
        let created = 0;
        const createdFolderIds = [];
        
        chunks.forEach((chunk, index) => {
            const listName = `List ${String(index + 1).padStart(2, '0')}`;
            // Create child folder with parentFolderId
            const folder = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: listName,
                description: 'Prebuilt IELTS list',
                parentFolderId: parentFolderId,
                createdAt: new Date().toISOString()
            };
            this.folders.push(folder);
            createdFolderIds.push(folder.id);
            
            // Bulk add silently - mark as system cards so they don't count toward free tier limit
            chunk.forEach(row => {
                // Pass isSystemCard: true - these cards won't count toward user's 100-card limit
                this.addCardSilent(row.front, row.back, 'card', null, folder.id, true);
                created++;
            });
        });
        
        // Save folders after creating all child folders
        this.saveFolders(this.folders);
        
        // Single save + render after batch
        this.saveCards();
        this.renderFolders();
        this.renderCards();
        this.updateCardCount();
        this.closeCollectionsModal();
        
        // Show success notification - system cards don't count toward limit, so always allowed
        this.showNotification(`Imported ${created} words into ${chunks.length} lists.`, 'success');
        
        return parentFolderId;
    }

    // Permanently remove the IELTS 8000 collection: parent folder, child lists, and all cards
    handleDeleteIELTSCollection() {
        const parentName = (this.ieltsPrefixInput?.value || 'IELTS 8000 - List').replace(/\s*-\s*List\s*$/, '').trim() || 'IELTS 8000';
        // Find parent folder
        const parent = this.folders.find(f => !f.parentFolderId && f.name === parentName) || this.folders.find(f => !f.parentFolderId && f.name === 'IELTS 8000');
        if (!parent) {
            this.showNotification('No IELTS 8000 collection found to delete.', 'warning');
            return;
        }
        const legacyPrefix = `${parent.name} - List `;
        const childFolders = this.folders.filter(f => f.parentFolderId === parent.id || f.name.startsWith(legacyPrefix));
        const childIds = new Set(childFolders.map(f => f.id));
        // Remove cards within these child folders
        const beforeCards = this.cards.length;
        this.cards = this.cards.filter(c => !childIds.has(c.folderId));
        const removedCards = beforeCards - this.cards.length;
        // Remove child folders and the parent
        this.folders = this.folders.filter(f => f.id !== parent.id && !childIds.has(f.id));
        this.saveCards();
        this.saveFolders(this.folders);
        // Refresh UI
        this.renderFolders();
        // If current selection was inside the deleted tree, reset to 'default' if exists or 'all'
        if (this.currentFolder === parent.id || childIds.has(this.currentFolder)) {
            const fallback = this.folders.find(f => f.id === 'default')?.id || 'all';
            this.selectFolder(fallback);
        } else {
            this.renderCards();
            this.updateCardCount();
        }
        this.showNotification(`Deleted IELTS 8000 collection (${removedCards} cards).`, 'success');
    }

    // Remove any cards under a given parent folder that are not present in the built-in IELTS dataset (data/IELTS_8000_exact.txt),
    // and de-duplicate by exact front+back pair (keep first occurrence)
    async cleanIELTSCollection(parentName = 'IELTS 8000') {
        const parent = this.folders.find(f => !f.parentFolderId && f.name === parentName);
        if (!parent) return { removed: 0, kept: 0 };
        const legacyPrefix = `${parent.name} - List `;
        const childFolders = this.folders.filter(f => f.parentFolderId === parent.id || f.name.startsWith(legacyPrefix));
        const childIds = new Set(childFolders.map(f => f.id));
        const text = await this.getEmbeddedIELTSData();
        if (!text) {
            console.error('[cleanIELTSCollection] Failed to load IELTS data');
            return { removed: 0, kept: this.cards.length };
        }
        const allowedRows = this.parseIELTSFormat(text);
        const allowedSet = new Set(allowedRows.map(r => `${r.front}\u0001${r.back}`));
        const seen = new Set();
        const before = this.cards.length;
        this.cards = this.cards.filter(card => {
            if (!childIds.has(card.folderId)) return true; // keep cards outside this collection
            const key = `${card.front}\u0001${card.back}`;
            if (!allowedSet.has(key)) return false; // not in dataset
            if (seen.has(key)) return false; // duplicate
            seen.add(key);
            return true;
        });
        const removed = before - this.cards.length;
        this.saveCards();
        this.renderFolders();
        this.renderCards();
        this.updateCardCount();
        return { removed, kept: this.cards.length };
    }

    parseIELTSFormat(text) {
        // Remove BOM (Byte Order Mark) if present
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.slice(1);
        }
        // Normalize line endings and split
        const lines = text.split(/\r?\n/);
        const rows = [];
        for (const line of lines) {
            // Trim and normalize whitespace (multiple spaces to single space)
            let trimmed = line.trim().replace(/\s+/g, ' ');
            if (!trimmed) continue;
            // Expected like: "3. divide, v. 中文释义"
            const afterNumber = trimmed.replace(/^\s*\d+\.?\s*/, '');
            const firstComma = afterNumber.indexOf(',');
            if (firstComma === -1) continue;
            const word = afterNumber.slice(0, firstComma).trim().replace(/\s+/g, ' ');
            const rest = afterNumber.slice(firstComma + 1).trim().replace(/\s+/g, ' ');
            // Skip if word is empty after normalization
            if (!word) continue;
            // Treat everything after first comma as back/definition (word form + Chinese)
            const front = word;
            const back = rest;
            rows.push({ front, back });
        }
        return rows;
    }

    chunkArray(arr, size) {
        const result = [];
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size));
        }
        return result;
    }

    // Built-in IELTS 8000 now uses data/IELTS_8000_exact.txt (8000 cleaned entries).
    async getEmbeddedIELTSData() {
        // Fetch IELTS 8000 data from data/IELTS_8000_exact.txt
        try {
            const response = await fetch('data/IELTS_8000_exact.txt', { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const text = await response.text();
            console.log('[getEmbeddedIELTSData] Successfully loaded IELTS_8000_exact.txt');
            return text;
        } catch (error) {
            console.error('[getEmbeddedIELTSData] Error fetching IELTS_8000_exact.txt:', error);
            throw error;
        }
    }

    getDelimiters() {
        // Support both old and new names for backward compatibility
        const termDelimiterRadio = document.querySelector('input[name="termDefDelimiter"]:checked') || document.querySelector('input[name="termDelimiter"]:checked');
        const cardDelimiterRadio = document.querySelector('input[name="cardDelimiter"]:checked');
        
        if (!termDelimiterRadio || !cardDelimiterRadio) {
            console.error('[getDelimiters] Could not find delimiter radio buttons');
            return { termDelim: ' ', cardDelim: '\n' };
        }
        
        const termDelimiter = termDelimiterRadio.value;
        const cardDelimiter = cardDelimiterRadio.value;
        
        let termDelim = ' ';
        if (termDelimiter === 'comma') termDelim = ',';
        else if (termDelimiter === 'dash') termDelim = '-';
        else if (termDelimiter === 'custom') termDelim = this.customTermDelimiter.value || ' ';
        
        let cardDelim = '\n';
        if (cardDelimiter === 'semicolon') cardDelim = ';';
        else if (cardDelimiter === 'custom') cardDelim = this.customCardDelimiter.value || '\n';
        
        return { termDelim, cardDelim };
    }

    parseSimpleText(text) {
        const { termDelim, cardDelim } = this.getDelimiters();
        
        console.log('[parseSimpleText] Parsing text with delimiters:', { termDelim, cardDelim, termDelimLength: termDelim.length, cardDelimLength: cardDelim.length });
        console.log('[parseSimpleText] Text length:', text.length, 'First 200 chars:', text.substring(0, 200));
        
        // Split by card delimiter
        const cards = text.split(cardDelim).map(card => card.trim()).filter(card => card);
        console.log('[parseSimpleText] Cards after splitting by cardDelim:', cards.length, 'Sample cards:', cards.slice(0, 3));
        
        const data = [];
        
        for (const card of cards) {
            // Split by term delimiter
            const parts = card.split(termDelim);
            console.log('[parseSimpleText] Card parts:', parts.length, 'Parts:', parts);
            
            if (parts.length >= 2) {
                const front = parts[0].trim();
                const back = parts.slice(1).join(termDelim).trim();
                
                if (front && back) {
                    data.push({
                        front: front,
                        back: back,
                        category: 'imported'
                    });
                    console.log('[parseSimpleText] Added card:', { front, back });
                } else {
                    console.log('[parseSimpleText] Skipped card - empty front or back:', { front, back });
                }
            } else {
                console.log('[parseSimpleText] Skipped card - not enough parts:', parts);
            }
        }
        
        console.log('[parseSimpleText] Final parsed data count:', data.length);
        return data;
    }

    updatePreview() {
        // Re-cache textarea if needed
        if (!this.wordListTextarea) {
            this.wordListTextarea = document.getElementById('bulkTextInput') || document.getElementById('wordListTextarea');
        }
        
        if (!this.wordListTextarea) {
            console.error('[updatePreview] Textarea not found!');
            return;
        }
        
        const text = this.wordListTextarea.value.trim();
        console.log('[updatePreview] Called with text length:', text.length);
        
        // Safety check: ensure elements exist
        if (!this.previewCount || !this.previewCardsContainer) {
            console.warn('Preview elements not found, re-caching DOM elements');
            this.previewCount = document.getElementById('importPreviewCount') || document.getElementById('previewCount');
            this.previewCardsContainer = document.getElementById('previewCardsContainer');
            
            // If still not found, return silently
            if (!this.previewCount || !this.previewCardsContainer) {
                console.error('Could not find preview elements');
                return;
            }
        }
        
        if (!text) {
            this.previewCount.textContent = '0';
            this.previewCardsContainer.innerHTML = '<div class="preview-placeholder">Nothing to preview yet.</div>';
            return;
        }
        
        try {
            const parsedData = this.parseSimpleText(text);
            console.log('[updatePreview] Parsed', parsedData.length, 'cards');
            this.previewCount.textContent = parsedData.length;
            
            if (parsedData.length === 0) {
                this.previewCardsContainer.innerHTML = '<div class="preview-placeholder">No valid cards found. Check your delimiter settings.</div>';
                return;
            }
            
            // Generate preview cards (show first 5)
            const previewData = parsedData.slice(0, 5);
            this.previewCardsContainer.innerHTML = '';
            
            previewData.forEach((card, index) => {
                const cardElement = this.createPreviewCard(card, index + 1);
                this.previewCardsContainer.appendChild(cardElement);
            });
            
            if (parsedData.length > 5) {
                const moreElement = document.createElement('div');
                moreElement.className = 'preview-placeholder';
                moreElement.textContent = `... and ${parsedData.length - 5} more cards`;
                this.previewCardsContainer.appendChild(moreElement);
            }
        } catch (error) {
            this.previewCardsContainer.innerHTML = '<div class="preview-placeholder">Error parsing text. Check your delimiter settings.</div>';
        }
    }

    createPreviewCard(card, index) {
        const cardElement = document.createElement('div');
        cardElement.className = 'preview-card';
        
        cardElement.innerHTML = `
            <div class="preview-card-term">
                <div class="preview-card-content">${card.front}</div>
                <div class="preview-card-label">TERM</div>
            </div>
            <div class="preview-card-separator"></div>
            <div class="preview-card-definition">
                <div class="preview-card-content">${card.back}</div>
                <div class="preview-card-label">DEFINITION</div>
            </div>
        `;
        
        return cardElement;
    }

    showImportError(message) {
        // Safety check: ensure element exists
        if (!this.importError) {
            console.warn('Import error element not found, re-caching');
            this.importError = document.getElementById('importError');
            
            if (!this.importError) {
                console.error('Could not find import error element');
                alert(message); // Fallback to alert
                return;
            }
        }
        
        this.importError.textContent = message;
        this.importError.style.display = 'block';
    }

    // File upload methods
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.txt')) {
            this.showImportError('Please select a .txt file.');
            return;
        }
        
        try {
            const text = await this.readFileAsText(file);
            this.wordListTextarea.value = text;
            this.selectedFileName.textContent = `Selected: ${file.name}`;
            this.selectedFileName.style.display = 'block';
            this.updatePreview();
        } catch (error) {
            this.showImportError('Error reading file: ' + error.message);
        }
    }
    
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    createFolderForImport() {
        // Open the create folder modal
        this.openCreateFolderModal();
    }
    
    createListForImport() {
        // Store that we're creating from import modal
        this.listCreationContext = 'import';
        
        // Open the create list modal
        this.openCreateListModalForImport();
    }

    openCreateListModalForImport() {
        // Populate parent folder dropdown with all parent folders
        this.listParentFolder.innerHTML = '<option value="">Select a parent folder</option>';
        const parentFolders = this.folders.filter(f => !f.parentFolderId);
        
        if (parentFolders.length === 0) {
            this.showNotification('Please create a parent folder first.', 'error');
            return;
        }
        
        parentFolders.forEach(folder => {
            const option = document.createElement('option');
            option.value = this._toStr(folder.id);
            option.textContent = folder.name;
            this.listParentFolder.appendChild(option);
        });
        
        // Pre-select the currently selected folder in Import modal if it's a parent folder
        const currentFolderId = this.importTargetFolder ? this._toStr(this.importTargetFolder.value) : null;
        if (currentFolderId) {
            const currentFolder = this.folders.find(f => this._toStr(f.id) === currentFolderId);
        if (currentFolder && !currentFolder.parentFolderId) {
                this.listParentFolder.value = this._toStr(currentFolder.id);
            }
        }
        
        // Clear the list name input
        this.listName.value = '';
        
        // Show the modal
        this.createListModal.classList.add('active');
        this.listName.focus();
    }
    
    updateImportFolderSelector(selectedFolderId = null) {
        if (!this.importTargetFolder) return;

        // Remember currently selected value so we can restore it after rebuilding options
        const previousValue = selectedFolderId || this.importTargetFolder.value || 'default';

        this.importTargetFolder.innerHTML = '<option value="default">Default Folder</option>';
        
        // Show only parent folders (not children)
        const parentFolders = this.folders.filter(f => !f.parentFolderId);
        
        parentFolders.forEach(parent => {
            const parentOption = document.createElement('option');
            parentOption.value = parent.id;
            parentOption.textContent = parent.name;
            this.importTargetFolder.appendChild(parentOption);
        });

        // Try to restore the previous selection if it still exists
        const options = Array.from(this.importTargetFolder.options).map(opt => opt.value);
        if (previousValue && options.includes(previousValue)) {
            this.importTargetFolder.value = previousValue;
        } else {
            this.importTargetFolder.value = 'default';
        }

        console.log('[updateImportFolderSelector] Selected folder after rebuild:', this.importTargetFolder.value);
        
        // Update list selector when folder selector is updated
        this.updateImportListSelector();
    }
    
    updateImportListSelector() {
        // Re-cache elements if needed
        if (!this.importTargetList) {
            this.importTargetList = document.getElementById('importListSelect') || document.getElementById('importTargetList');
        }
        if (!this.importListGroup) {
            this.importListGroup = document.getElementById('importListGroup');
        }
        
        if (!this.importTargetList || !this.importListGroup) {
            console.warn('[updateImportListSelector] Elements not found:', {
                importTargetList: !!this.importTargetList,
                importListGroup: !!this.importListGroup
            });
            return;
        }
        
        if (!this.importTargetFolder) {
            this.importTargetFolder = document.getElementById('importFolderSelect') || document.getElementById('importTargetFolder');
        }
        
        if (!this.importTargetFolder) {
            console.warn('[updateImportListSelector] importTargetFolder not found');
            return;
        }
        
        // Reload folders to ensure we have the latest data (including newly created lists)
        this.folders = this.loadFolders();
        
        const selectedFolderId = this.importTargetFolder.value;
        console.log('[updateImportListSelector] Reloading folders.');
        console.log('[updateImportListSelector] Selected folder ID:', selectedFolderId);
        console.log('[updateImportListSelector] All folders:', this.folders.map(f => ({ id: f.id, name: f.name, parentFolderId: f.parentFolderId })));
        
        // Try to find folder with strict equality first, then try string comparison
        let selectedFolder = this.folders.find(f => f.id === selectedFolderId);
        if (!selectedFolder) {
            selectedFolder = this.folders.find(f => String(f.id) === String(selectedFolderId));
        }
        console.log('[updateImportListSelector] Selected folder:', selectedFolder);
        
        // Keep previous selection so we can restore it when rebuilding options
        const previousValue = this.importTargetList.value;
        
        // Clear existing options
        this.importTargetList.innerHTML = '';
        
        // Show list selector only if a parent folder is selected
        if (selectedFolder && !selectedFolder.parentFolderId) {
            // Always show the list group for parent folders
            this.importListGroup.style.display = 'block';
            console.log('[updateImportListSelector] Showing list group for parent folder:', selectedFolder.name);
            
            // Populate with child folders (lists) of the selected parent
            // Use both strict and string comparison to handle type mismatches
            const selectedFolderIdStr = String(selectedFolderId);
            console.log('[updateImportListSelector] Looking for children of folder ID:', selectedFolderId, 'type:', typeof selectedFolderId);
            console.log('[updateImportListSelector] All folders with parentFolderId:', this.folders.filter(f => f.parentFolderId).map(f => ({ id: f.id, name: f.name, parentFolderId: f.parentFolderId, parentFolderIdType: typeof f.parentFolderId })));
            
            const childFolders = this.folders.filter(f => {
                if (!f.parentFolderId) return false;
                const parentIdStr = String(f.parentFolderId);
                // Try multiple comparison methods
                const match1 = f.parentFolderId === selectedFolderId;
                const match2 = parentIdStr === selectedFolderIdStr;
                const match3 = String(f.parentFolderId) === String(selectedFolderId);
                const matches = match1 || match2 || match3;
                
                if (matches) {
                    console.log('[updateImportListSelector] ✓ Matched child folder:', f.name, 'parentFolderId:', f.parentFolderId, 'type:', typeof f.parentFolderId, 'selectedFolderId:', selectedFolderId, 'type:', typeof selectedFolderId);
                } else {
                    console.log('[updateImportListSelector] ✗ No match:', f.name, 'parentFolderId:', f.parentFolderId, 'type:', typeof f.parentFolderId, 'vs selectedFolderId:', selectedFolderId, 'type:', typeof selectedFolderId);
                }
                return matches;
            });
            console.log('[updateImportListSelector] Child folders found:', childFolders.length, childFolders.map(f => ({ id: f.id, name: f.name, parentFolderId: f.parentFolderId, parentFolderIdType: typeof f.parentFolderId })));
            
            if (childFolders.length === 0) {
                // No lists exist yet - show "No List (Save to Folder)" option
                const noListOption = document.createElement('option');
                noListOption.value = '';
                noListOption.textContent = 'No List (Save to Folder)';
                this.importTargetList.appendChild(noListOption);
                this.importTargetList.value = '';
                console.log('[updateImportListSelector] No child lists available. Showing "No List" option.');
            } else {
                // Lists exist - only show the actual lists, NO "No List" option
            childFolders.forEach(child => {
                const option = document.createElement('option');
                option.value = child.id;
                option.textContent = child.name;
                this.importTargetList.appendChild(option);
                    console.log('[updateImportListSelector] Added option:', child.name, 'with value:', child.id);
            });

                // Restore previous selection if possible, otherwise default to the first child
                const optionValues = Array.from(this.importTargetList.options).map(opt => opt.value);
                if (previousValue && optionValues.includes(previousValue)) {
                    this.importTargetList.value = previousValue;
        } else {
                    this.importTargetList.value = childFolders[0].id;
                }
                console.log('[updateImportListSelector] Selected list after rebuild:', this.importTargetList.value);
            }
        } else {
            console.log('[updateImportListSelector] Not showing list selector - selectedFolder:', selectedFolder, 'has parentFolderId:', selectedFolder?.parentFolderId);
            // Hide list group only if we have a valid folder that is NOT a parent
            if (selectedFolder && selectedFolder.parentFolderId) {
                // This is a child folder (list), so hide the list selector
                this.importListGroup.style.display = 'none';
                this.importTargetList.value = '';
            } else if (!selectedFolder) {
                // No folder selected or folder not found - hide list group
            this.importListGroup.style.display = 'none';
            this.importTargetList.value = '';
            }
            // If selectedFolder is null but we have a folderId, it might be a parent folder that wasn't found
            // In that case, we'll keep the list group visible if it was already visible
        }
    }

    async handleImport() {
        // Re-cache textarea if needed
        if (!this.wordListTextarea) {
            this.wordListTextarea = document.getElementById('bulkTextInput') || document.getElementById('wordListTextarea');
        }
        
        if (!this.wordListTextarea) {
            this.showImportError('Textarea element not found. Please refresh the page.');
            console.error('[handleImport] Textarea not found!');
            return;
        }
        
        const text = this.wordListTextarea.value.trim();
        console.log('[handleImport] Text from textarea, length:', text.length, 'First 100 chars:', text.substring(0, 100));
        
        if (!text) {
            this.showImportError('Please enter some words and definitions.');
            return;
        }

        try {
            const parsedData = this.parseSimpleText(text);
            
            if (parsedData.length === 0) {
                this.showImportError('No valid word pairs found. Make sure each word is followed by its definition on the next line.');
                return;
            }
            
            // Reload folders to ensure we have latest data (including newly created lists)
            this.folders = this.loadFolders();
            
            // Use list if selected, otherwise auto-create/reuse List 01
            let targetListId = this.importTargetList && this.importTargetList.value && this.importTargetList.value !== 'none' ? this.importTargetList.value : null;
            const targetFolderId = this.importTargetFolder.value;
            
            // If "No List" is selected, auto-create/reuse List 01
            if (!targetListId && targetFolderId) {
                const folder = this.folders.find(f => f.id === targetFolderId || String(f.id) === String(targetFolderId));
                if (folder && !folder.parentFolderId) {
                    // It's a parent folder, create/get List 01
                    console.log('[handleImport] No list selected, auto-creating List 01 for folder:', folder.name);
                    const list1 = await this.getOrCreateList1(folder);
                    if (list1) {
                        targetListId = list1.id;
                        // Update the dropdown to show the selected list
                        if (this.importTargetList) {
                            this.importTargetList.value = targetListId;
                            this.refreshImportListSection(); // Refresh to ensure it's in the dropdown
                        }
                        console.log('[handleImport] Auto-selected List 01:', list1.name);
                    }
                }
            }
            
            const finalTargetId = targetListId || targetFolderId;
            
            console.log('[handleImport] Target folder ID:', this.importTargetFolder.value);
            console.log('[handleImport] Target list ID:', targetListId);
            console.log('[handleImport] Final target ID (list or folder):', finalTargetId);
            console.log('[handleImport] Current folder before import:', this.currentFolder);
            console.log('[handleImport] Cards to import:', parsedData.length);
            
            // Verify the target exists
            if (targetListId) {
                // Verify the list exists
                let listFolder = this.folders.find(f => f.id === targetListId);
                if (!listFolder) {
                    listFolder = this.folders.find(f => String(f.id) === String(targetListId));
                }
                if (!listFolder) {
                    console.error('[handleImport] List not found! ID:', targetListId);
                    console.error('[handleImport] Available folders:', this.folders.map(f => ({ id: f.id, name: f.name, parentFolderId: f.parentFolderId })));
                    this.showImportError('List not found. Please select a valid list.');
                    return;
                }
                console.log('[handleImport] Verified list exists:', listFolder.name, 'parentFolderId:', listFolder.parentFolderId);
            }
            
            // Check subscription limits before bulk import
            // Count only user cards (system cards don't count toward limit)
            const limits = this.getSubscriptionLimits();
            const canImportUnlimited = limits.maxCards === -1 || limits.maxCards === Infinity;
            const remainingSlotsValue = this.getRemainingCards();
            // getRemainingCards() returns 'Unlimited' for unlimited tiers, or a number for limited tiers
            const remainingSlots = (remainingSlotsValue === 'Unlimited' || canImportUnlimited) ? Infinity : remainingSlotsValue;
            
            // If no remaining slots and not unlimited, show upgrade modal
            if (!canImportUnlimited && remainingSlots === 0) {
                this.showUpgradeModal('cards', limits.maxCards);
                this.showImportError(`You've reached the free tier limit of ${limits.maxCards} cards. Upgrade to Premium for unlimited cards!`);
                return;
            }
            
            // Calculate how many cards we can actually import
            const cardsToImport = canImportUnlimited ? parsedData.length : Math.min(parsedData.length, remainingSlots);
            const willExceedLimit = !canImportUnlimited && parsedData.length > remainingSlots;
            
            // Use bulk import with addCardSilent to avoid rendering after each card
            let importedCount = 0;
            
            for (let i = 0; i < cardsToImport; i++) {
                const row = parsedData[i];
                // addCardSilent will check limits internally for user cards
                const added = this.addCardSilent(row.front, row.back, row.category, null, finalTargetId, false);
                if (added) {
                    importedCount++;
                } else {
                    // Limit reached during import (shouldn't happen if we calculated correctly, but safety check)
                    break;
                }
            }
            
            // Show appropriate notifications
            if (willExceedLimit && importedCount > 0) {
                const skipped = parsedData.length - importedCount;
                this.showNotification(`Imported ${importedCount} cards. ${skipped} cards were skipped because you've reached the free tier limit of ${limits.maxCards} cards. Upgrade to Premium for unlimited cards!`, 'warning');
                this.showUpgradeModal('cards', limits.maxCards);
            } else if (willExceedLimit) {
                // No cards could be imported
                this.showUpgradeModal('cards', limits.maxCards);
                this.showImportError(`You've reached the free tier limit of ${limits.maxCards} cards. Upgrade to Premium for unlimited cards!`);
            } else if (importedCount > 0) {
                this.showNotification(`Successfully imported ${importedCount} card${importedCount !== 1 ? 's' : ''}.`, 'success');
            }
            
            console.log('[handleImport] Cards added with folderId:', finalTargetId);
            console.log('[handleImport] Sample card folderIds after import:', this.cards.slice(0, 3).map(c => ({ id: c.id, folderId: c.folderId })));
            
            console.log('[handleImport] Cards added, total cards now:', this.cards.length);
            console.log('[handleImport] First card folderId:', this.cards[0]?.folderId);
            
            // Now save and render once after all cards are added
            this.saveCards();
            // Ensure folders are saved before we try to look them up
            this.saveFolders(this.folders);
            this.renderFolders();
            
            // Determine which folder to switch to after import
            // If importing to a list, switch to the list itself so cards are visible
            // Otherwise, switch to the target folder
            let folderToSwitchTo = finalTargetId;
            
            // Debug: Log all cards and their folderIds
            console.log('[handleImport] Total cards after import:', this.cards.length);
            console.log('[handleImport] Cards with folderIds:', this.cards.map(c => ({ id: c.id, folderId: c.folderId })));
            console.log('[handleImport] All folders:', this.folders.map(f => ({ id: f.id, name: f.name, parentFolderId: f.parentFolderId })));
            
            // Switch to the appropriate folder to ensure cards are visible
            if (folderToSwitchTo && folderToSwitchTo !== this.currentFolder) {
                console.log('[handleImport] Switching to folder:', folderToSwitchTo);
                this.selectFolder(folderToSwitchTo);
                console.log('[handleImport] After selectFolder, currentFolder:', this.currentFolder);
                
                // If we imported to a list, update the header dropdown to show the list
                if (targetListId) {
                    // Update the list dropdown in the header to show the newly imported list
                    setTimeout(() => {
                        this.updateListDropdownForHeader();
                        // Try to select the list in the header dropdown
                        if (this.listDropdown) {
                            this.listDropdown.value = targetListId;
                            // Trigger change event to switch to the list view
                            this.listDropdown.dispatchEvent(new Event('change'));
                        }
                    }, 150);
                }
                
                // Force a re-render to ensure cards show up
                setTimeout(() => {
            this.renderCards();
            this.updateCardCount();
            this.updateCurrentFolderInfo();
                }, 100);
            } else {
                // If already on the correct folder, just render cards
                console.log('[handleImport] Already on correct folder, rendering cards...');
                
                // If we imported to a list, update the header dropdown to show the list
                if (targetListId) {
                    this.updateListDropdownForHeader();
                    // Try to select the list in the header dropdown
                    if (this.listDropdown) {
                        this.listDropdown.value = targetListId;
                        // Trigger change event to switch to the list view
                        this.listDropdown.dispatchEvent(new Event('change'));
                    }
                }
                
                this.renderCards();
                this.updateCardCount();
                this.updateCurrentFolderInfo();
            }
            
            this.showImportSuccess(importedCount);
            this.closeImportModal();
        } catch (error) {
            this.showImportError('Error importing cards: ' + error.message);
        }
    }

    showImportSuccess(count) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'import-success';
        successDiv.innerHTML = `
            <h4>✅ Import Successful!</h4>
            <p>Successfully imported ${count} cards to your collection.</p>
        `;
        
        // Insert at the top of the modal body
        const modalBody = this.importWordListModal.querySelector('.modal-body');
        modalBody.insertBefore(successDiv, modalBody.firstChild);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    // Add Card Rich Text Editor Setup
    setupAddCardEditor() {
        const toolbarButtons = document.querySelectorAll('.toolbar-btn[data-target="addfront"], .toolbar-btn[data-target="addback"]');
        const colorPickerButtons = document.querySelectorAll('.color-picker-btn[data-target="addfront"], .color-picker-btn[data-target="addback"]');
        const presetColorButtons = document.querySelectorAll('.preset-color-btn[data-target="addfront"], .preset-color-btn[data-target="addback"]');

        // Store selection
        let savedSelection = null;

        // Formatting buttons
        toolbarButtons.forEach(btn => {
            if (!btn.classList.contains('color-btn')) {
                let savedSelection = null;
                
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault(); // Prevent focus loss
                    // Save current selection
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        savedSelection = sel.getRangeAt(0).cloneRange();
                    }
                });
                
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const command = btn.getAttribute('data-command');
                    const target = btn.getAttribute('data-target');
                    
                    const editor = target === 'addfront' ? this.addFrontText : this.addBackText;
                    
                    // Restore selection BEFORE focusing
                    if (savedSelection) {
                        try {
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(savedSelection.cloneRange());
                        } catch (e) {
                            console.log('Selection restore failed:', e);
                        }
                    }
                    
                    editor.focus();
                    
                    // If still no selection, place cursor at end
                    const sel = window.getSelection();
                    if (!sel.rangeCount || sel.isCollapsed) {
                        const range = document.createRange();
                        range.selectNodeContents(editor);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    
                    // Execute command
                    document.execCommand(command, false, null);
                    
                    // Restore selection after command
                    setTimeout(() => {
                        if (savedSelection) {
                            try {
                                const sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(savedSelection.cloneRange());
                            } catch (e) {
                                console.log('Selection restore failed:', e);
                            }
                        }
                    }, 10);
                });
            }
        });

        // Highlight to hide functionality
        const highlightButtons = document.querySelectorAll('[data-command="highlightHide"]');
        highlightButtons.forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                // Save current selection
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    savedSelection = sel.getRangeAt(0).cloneRange();
                }
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('data-target');
                const editor = target === 'addfront' ? this.addFrontText : this.addBackText;
                
                // Restore selection
                if (savedSelection) {
                    try {
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(savedSelection.cloneRange());
                    } catch (e) {
                        console.log('Selection restore failed:', e);
                    }
                }
                
                editor.focus();
                
                const selection = window.getSelection();
                
                // First, check if the current selection is inside a hidden element
                let targetHiddenElement = null;
                let node = selection.anchorNode;
                if (node) {
                    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
                    while (el && el !== editor) {
                        if (el.classList && el.classList.contains('hidden-content')) { 
                            targetHiddenElement = el; 
                            break; 
                        }
                        el = el.parentElement;
                    }
                }
                
                // If no hidden element found, check if selection overlaps with any hidden elements
                if (!targetHiddenElement && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const allHiddenElements = editor.querySelectorAll('.hidden-content');
                    for (let hiddenEl of allHiddenElements) {
                        if (range.intersectsNode(hiddenEl)) {
                            targetHiddenElement = hiddenEl;
                            break;
                        }
                    }
                }
                
                if (targetHiddenElement) {
                    // We found a hidden element - unhide it
                    const hiddenText = targetHiddenElement.textContent;
                    const textNode = document.createTextNode(hiddenText);
                    targetHiddenElement.parentNode.replaceChild(textNode, targetHiddenElement);
                    
                    // Select the unhidden text
                    const newRange = document.createRange();
                    newRange.setStart(textNode, 0);
                    newRange.setEnd(textNode, hiddenText.length);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    // Clear undo history to prevent issues
                    editor.focus();
                } else if (selection.rangeCount > 0 && !selection.isCollapsed) {
                    // No hidden elements found - hide the selected text
                    const range = selection.getRangeAt(0);
                    const selectedText = range.toString();
                    
                    if (selectedText.trim()) {
                        // Store the original text for potential undo
                        const originalText = selectedText;
                        
                        const span = document.createElement('span');
                        span.className = 'hidden-content';
                        span.textContent = selectedText;
                        span.setAttribute('data-hidden', 'true');
                        span.setAttribute('data-original-text', originalText);
                        
                        range.deleteContents();
                        range.insertNode(span);
                        
                        // Clear selection
                        selection.removeAllRanges();
                        
                        // Clear undo history to prevent issues
                        editor.focus();
                    }
                }
            });
        });

        // Color picker buttons
        colorPickerButtons.forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                // Save current selection
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    savedSelection = sel.getRangeAt(0).cloneRange();
                }
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('data-target');
                const editor = target === 'addfront' ? this.addFrontText : this.addBackText;
                this.openCustomColorPickerModal(editor, savedSelection);
            });
        });

        // Preset color buttons
        presetColorButtons.forEach(btn => {
            // Left click - apply color
            btn.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // Left click only
                    e.preventDefault();
                    // Save current selection
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        savedSelection = sel.getRangeAt(0).cloneRange();
                    }
                }
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('data-target');
                const color = btn.getAttribute('data-color');
                
                const editor = target === 'addfront' ? this.addFrontText : this.addBackText;
                    editor.focus();
                
                // Restore selection
                if (savedSelection) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(savedSelection);
                }
                
                // Store the selected text before command
                const selectedText = savedSelection ? savedSelection.toString() : '';
                
                document.execCommand('foreColor', false, color);
                
                // CRITICAL: Restore selection by finding the text in the editor
                setTimeout(() => {
                    if (selectedText && selectedText.trim()) {
                        try {
                            const sel = window.getSelection();
                            const range = document.createRange();
                            
                            // Find the selected text in the editor
                            const editorText = editor.textContent || editor.innerText;
                            const textIndex = editorText.indexOf(selectedText);
                            
                            if (textIndex !== -1) {
                                // Create a new range for the found text
                                const walker = document.createTreeWalker(
                                    editor,
                                    NodeFilter.SHOW_TEXT,
                                    null,
                                    false
                                );
                                
                                let currentPos = 0;
                                let startNode = null;
                                let endNode = null;
                                let startOffset = 0;
                                let endOffset = 0;
                                
                                let node;
                                while (node = walker.nextNode()) {
                                    const nodeText = node.textContent;
                                    const nodeLength = nodeText.length;
                                    
                                    if (!startNode && currentPos + nodeLength > textIndex) {
                                        startNode = node;
                                        startOffset = textIndex - currentPos;
                                    }
                                    
                                    if (!endNode && currentPos + nodeLength >= textIndex + selectedText.length) {
                                        endNode = node;
                                        endOffset = (textIndex + selectedText.length) - currentPos;
                                        break;
                                    }
                                    
                                    currentPos += nodeLength;
                                }
                                
                                if (startNode && endNode) {
                                    range.setStart(startNode, startOffset);
                                    range.setEnd(endNode, endOffset);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    savedSelection = range.cloneRange();
                                }
                            }
                        } catch (e) {
                            console.log('Text-based selection restore failed:', e);
                        }
                    }
                }, 10);
            });

            // Right click - customize color via new modal
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const preset = parseInt(btn.getAttribute('data-preset'));
                
                // Open color customization modal
                this.openColorCustomModal(preset);
            });
        });

        // Hidden color pickers
        [this.colorPickerAddFront, this.colorPickerAddBack].forEach(picker => {
            picker.addEventListener('change', (e) => {
                const color = e.target.value;
                const target = picker.getAttribute('data-target');
                
                const editor = target === 'addfront' ? this.addFrontText : this.addBackText;
                editor.focus();
                
                // Restore selection
                if (savedSelection) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(savedSelection);
                }
                
                // Store the selected text before command
                const selectedText = savedSelection ? savedSelection.toString() : '';
                
                document.execCommand('foreColor', false, color);
                
                // CRITICAL: Restore selection by finding the text in the editor
                setTimeout(() => {
                    if (selectedText && selectedText.trim()) {
                        try {
                            const sel = window.getSelection();
                            const range = document.createRange();
                            
                            // Find the selected text in the editor
                            const editorText = editor.textContent || editor.innerText;
                            const textIndex = editorText.indexOf(selectedText);
                            
                            if (textIndex !== -1) {
                                // Create a new range for the found text
                                const walker = document.createTreeWalker(
                                    editor,
                                    NodeFilter.SHOW_TEXT,
                                    null,
                                    false
                                );
                                
                                let currentPos = 0;
                                let startNode = null;
                                let endNode = null;
                                let startOffset = 0;
                                let endOffset = 0;
                                
                                let node;
                                while (node = walker.nextNode()) {
                                    const nodeText = node.textContent;
                                    const nodeLength = nodeText.length;
                                    
                                    if (!startNode && currentPos + nodeLength > textIndex) {
                                        startNode = node;
                                        startOffset = textIndex - currentPos;
                                    }
                                    
                                    if (!endNode && currentPos + nodeLength >= textIndex + selectedText.length) {
                                        endNode = node;
                                        endOffset = (textIndex + selectedText.length) - currentPos;
                                        break;
                                    }
                                    
                                    currentPos += nodeLength;
                                }
                                
                                if (startNode && endNode) {
                                    range.setStart(startNode, startOffset);
                                    range.setEnd(endNode, endOffset);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    savedSelection = range.cloneRange();
                                }
                            }
                        } catch (e) {
                            console.log('Text-based selection restore failed:', e);
                        }
                    }
                }, 10);
            });
        });

        // Apply custom colors
        this.applyCustomColorsToAddToolbar();
    }

    applyCustomColorsToAddToolbar() {
        for (let i = 1; i <= 3; i++) {
            const color = this.customColors[i];
            
            const frontIndicator = document.querySelector(`.preset-${i}-addfront`);
            const frontButton = document.querySelector(`.preset-color-btn[data-target="addfront"][data-preset="${i}"]`);
            if (frontIndicator) frontIndicator.style.backgroundColor = color;
            if (frontButton) frontButton.setAttribute('data-color', color);
            
            const backIndicator = document.querySelector(`.preset-${i}-addback`);
            const backButton = document.querySelector(`.preset-color-btn[data-target="addback"][data-preset="${i}"]`);
            if (backIndicator) backIndicator.style.backgroundColor = color;
            if (backButton) backButton.setAttribute('data-color', color);
        }
    }

    // Add Test Rich Text Editor Setup
    setupCreateTestEditor() {
        const toolbarButtons = document.querySelectorAll('.toolbar-btn[data-target="testfront"], .toolbar-btn[data-target="testback"]');
        const colorPickerButtons = document.querySelectorAll('.color-picker-btn[data-target="testfront"], .color-picker-btn[data-target="testback"]');
        const presetColorButtons = document.querySelectorAll('.preset-color-btn[data-target="testfront"], .preset-color-btn[data-target="testback"]');

        // Store selection
        let savedSelection = null;

        // Formatting buttons
        toolbarButtons.forEach(btn => {
            if (!btn.classList.contains('color-btn')) {
                let savedSelection = null;
                
                btn.addEventListener('mousedown', (e) => {
                    e.preventDefault(); // Prevent focus loss
                    // Save current selection
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        savedSelection = sel.getRangeAt(0).cloneRange();
                    }
                });
                
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const command = btn.getAttribute('data-command');
                    const target = btn.getAttribute('data-target');
                    
                    const editor = target === 'testfront' ? this.testFrontText : this.testBackText;
                    
                    // Restore selection BEFORE focusing
                    if (savedSelection) {
                        try {
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(savedSelection.cloneRange());
                        } catch (e) {
                            console.log('Selection restore failed:', e);
                        }
                    }
                    
                    editor.focus();
                    
                    // If still no selection, place cursor at end
                    const sel = window.getSelection();
                    if (!sel.rangeCount || sel.isCollapsed) {
                        const range = document.createRange();
                        range.selectNodeContents(editor);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    
                    // Execute command
                    document.execCommand(command, false, null);
                    
                    // Restore selection after command
                    setTimeout(() => {
                        if (savedSelection) {
                            try {
                                const sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(savedSelection.cloneRange());
                            } catch (e) {
                                console.log('Selection restore failed:', e);
                            }
                        }
                    }, 10);
                });
            }
        });

        // Highlight to hide functionality
        const highlightButtons = document.querySelectorAll('[data-command="highlightHide"]');
        highlightButtons.forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                // Save current selection
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    savedSelection = sel.getRangeAt(0).cloneRange();
                }
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('data-target');
                const editor = target === 'testfront' ? this.testFrontText : this.testBackText;
                
                // Restore selection
                if (savedSelection) {
                    try {
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(savedSelection.cloneRange());
                    } catch (e) {
                        console.log('Selection restore failed:', e);
                    }
                }
                
                editor.focus();
                
                const selection = window.getSelection();
                
                // First, check if the current selection is inside a hidden element
                let targetHiddenElement = null;
                let node = selection.anchorNode;
                if (node) {
                    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
                    while (el && el !== editor) {
                        if (el.classList && el.classList.contains('hidden-content')) { 
                            targetHiddenElement = el; 
                            break; 
                        }
                        el = el.parentElement;
                    }
                }
                
                // If no hidden element found, check if selection overlaps with any hidden elements
                if (!targetHiddenElement && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const allHiddenElements = editor.querySelectorAll('.hidden-content');
                    for (let hiddenEl of allHiddenElements) {
                        if (range.intersectsNode(hiddenEl)) {
                            targetHiddenElement = hiddenEl;
                            break;
                        }
                    }
                }
                
                if (targetHiddenElement) {
                    // We found a hidden element - unhide it
                    const hiddenText = targetHiddenElement.textContent;
                    const textNode = document.createTextNode(hiddenText);
                    targetHiddenElement.parentNode.replaceChild(textNode, targetHiddenElement);
                    
                    // Select the unhidden text
                    const newRange = document.createRange();
                    newRange.setStart(textNode, 0);
                    newRange.setEnd(textNode, hiddenText.length);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    // Clear undo history to prevent issues
                    editor.focus();
                } else if (selection.rangeCount > 0 && !selection.isCollapsed) {
                    // No hidden elements found - hide the selected text
                    const range = selection.getRangeAt(0);
                    const selectedText = range.toString();
                    
                    if (selectedText.trim()) {
                        // Store the original text for potential undo
                        const originalText = selectedText;
                        
                        const span = document.createElement('span');
                        span.className = 'hidden-content';
                        span.textContent = selectedText;
                        span.setAttribute('data-hidden', 'true');
                        span.setAttribute('data-original-text', originalText);
                        
                        range.deleteContents();
                        range.insertNode(span);
                        
                        // Clear selection
                        selection.removeAllRanges();
                        
                        // Clear undo history to prevent issues
                        editor.focus();
                    }
                }
            });
        });

        // Color picker buttons
        colorPickerButtons.forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                // Save current selection
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    savedSelection = sel.getRangeAt(0).cloneRange();
                }
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('data-target');
                const editor = target === 'testfront' ? this.testFrontText : this.testBackText;
                this.openCustomColorPickerModal(editor, savedSelection);
            });
        });

        // Preset color buttons
        presetColorButtons.forEach(btn => {
            // Left click - apply color
            btn.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // Left click only
                    e.preventDefault();
                    // Save current selection
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        savedSelection = sel.getRangeAt(0).cloneRange();
                    }
                }
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('data-target');
                const color = btn.getAttribute('data-color');
                
                const editor = target === 'testfront' ? this.testFrontText : this.testBackText;
                editor.focus();
                
                // Restore selection
                if (savedSelection) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(savedSelection);
                }
                
                // Store the selected text before command
                const selectedText = savedSelection ? savedSelection.toString() : '';
                
                document.execCommand('foreColor', false, color);
                
                // CRITICAL: Restore selection by finding the text in the editor
                setTimeout(() => {
                    if (selectedText && selectedText.trim()) {
                        try {
                            const sel = window.getSelection();
                            const range = document.createRange();
                            
                            // Find the selected text in the editor
                            const editorText = editor.textContent || editor.innerText;
                            const textIndex = editorText.indexOf(selectedText);
                            
                            if (textIndex !== -1) {
                                // Create a new range for the found text
                                const walker = document.createTreeWalker(
                                    editor,
                                    NodeFilter.SHOW_TEXT,
                                    null,
                                    false
                                );
                                
                                let currentPos = 0;
                                let startNode = null;
                                let endNode = null;
                                let startOffset = 0;
                                let endOffset = 0;
                                
                                let node;
                                while (node = walker.nextNode()) {
                                    const nodeText = node.textContent;
                                    const nodeLength = nodeText.length;
                                    
                                    if (!startNode && currentPos + nodeLength > textIndex) {
                                        startNode = node;
                                        startOffset = textIndex - currentPos;
                                    }
                                    
                                    if (!endNode && currentPos + nodeLength >= textIndex + selectedText.length) {
                                        endNode = node;
                                        endOffset = (textIndex + selectedText.length) - currentPos;
                                        break;
                                    }
                                    
                                    currentPos += nodeLength;
                                }
                                
                                if (startNode && endNode) {
                                    range.setStart(startNode, startOffset);
                                    range.setEnd(endNode, endOffset);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    savedSelection = range.cloneRange();
                                }
                            }
                        } catch (e) {
                            console.log('Text-based selection restore failed:', e);
                        }
                    }
                }, 10);
            });

            // Right click - customize color via new modal
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const preset = parseInt(btn.getAttribute('data-preset'));
                
                // Open color customization modal
                this.openColorCustomModal(preset);
            });
        });

        // Hidden color pickers
        [this.colorPickerTestFront, this.colorPickerTestBack].forEach(picker => {
            picker.addEventListener('change', (e) => {
                const color = e.target.value;
                const target = picker.getAttribute('data-target');
                
                const editor = target === 'testfront' ? this.testFrontText : this.testBackText;
                editor.focus();
                
                // Restore selection
                if (savedSelection) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(savedSelection);
                }
                
                // Store the selected text before command
                const selectedText = savedSelection ? savedSelection.toString() : '';
                
                document.execCommand('foreColor', false, color);
                
                // CRITICAL: Restore selection by finding the text in the editor
                setTimeout(() => {
                    if (selectedText && selectedText.trim()) {
                        try {
                            const sel = window.getSelection();
                            const range = document.createRange();
                            
                            // Find the selected text in the editor
                            const editorText = editor.textContent || editor.innerText;
                            const textIndex = editorText.indexOf(selectedText);
                            
                            if (textIndex !== -1) {
                                // Create a new range for the found text
                                const walker = document.createTreeWalker(
                                    editor,
                                    NodeFilter.SHOW_TEXT,
                                    null,
                                    false
                                );
                                
                                let currentPos = 0;
                                let startNode = null;
                                let endNode = null;
                                let startOffset = 0;
                                let endOffset = 0;
                                
                                let node;
                                while (node = walker.nextNode()) {
                                    const nodeText = node.textContent;
                                    const nodeLength = nodeText.length;
                                    
                                    if (!startNode && currentPos + nodeLength > textIndex) {
                                        startNode = node;
                                        startOffset = textIndex - currentPos;
                                    }
                                    
                                    if (!endNode && currentPos + nodeLength >= textIndex + selectedText.length) {
                                        endNode = node;
                                        endOffset = (textIndex + selectedText.length) - currentPos;
                                        break;
                                    }
                                    
                                    currentPos += nodeLength;
                                }
                                
                                if (startNode && endNode) {
                                    range.setStart(startNode, startOffset);
                                    range.setEnd(endNode, endOffset);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    savedSelection = range.cloneRange();
                                }
                            }
                        } catch (e) {
                            console.log('Text-based selection restore failed:', e);
                        }
                    }
                }, 10);
            });
        });

        // Apply custom colors to create test toolbar
        this.applyCustomColorsToTestToolbar();
    }

    applyCustomColorsToTestToolbar() {
        for (let i = 1; i <= 3; i++) {
            const color = this.customColors[i];
            
            const frontIndicator = document.querySelector(`.preset-${i}-testfront`);
            const frontButton = document.querySelector(`.preset-color-btn[data-target="testfront"][data-preset="${i}"]`);
            if (frontIndicator) frontIndicator.style.backgroundColor = color;
            if (frontButton) frontButton.setAttribute('data-color', color);
            
            const backIndicator = document.querySelector(`.preset-${i}-testback`);
            const backButton = document.querySelector(`.preset-color-btn[data-target="testback"][data-preset="${i}"]`);
            if (backIndicator) backIndicator.style.backgroundColor = color;
            if (backButton) backButton.setAttribute('data-color', color);
        }
    }

    // Setup Paste Handlers to strip formatting
    setupPasteHandlers() {
        const editors = [
            this.addFrontText,
            this.addBackText,
            this.editFrontText,
            this.editBackText,
            this.testFrontText,
            this.testBackText
        ];

        editors.forEach(editor => {
            if (editor) {
                editor.addEventListener('paste', (e) => {
                    e.preventDefault();
                    
                    // Get plain text from clipboard
                    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                    
                    // Insert plain text as black color without any formatting
                    document.execCommand('insertText', false, text);
                    
                    // Alternative method that ensures black color
                    // const selection = window.getSelection();
                    // if (selection.rangeCount > 0) {
                    //     const range = selection.getRangeAt(0);
                    //     range.deleteContents();
                    //     const textNode = document.createTextNode(text);
                    //     range.insertNode(textNode);
                    //     range.setStartAfter(textNode);
                    //     range.setEndAfter(textNode);
                    //     selection.removeAllRanges();
                    //     selection.addRange(range);
                    // }
                });
            }
        });
    }

    // Add undo handling for hide/unhide operations
    addUndoHandling() {
        const editors = [this.addFrontText, this.addBackText, this.editFrontText, this.editBackText, this.testFrontText, this.testBackText];
        
        editors.forEach(editor => {
            if (editor) {
                // Store the last known good state before hide operations
                let lastGoodState = null;
                
                editor.addEventListener('input', () => {
                    // Store the current state as good state
                    lastGoodState = editor.innerHTML;
                });
                
                editor.addEventListener('keydown', (e) => {
                    // Handle Command+Z (Mac) or Ctrl+Z (Windows/Linux)
                    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                        // Check if there are any hidden elements that might be affected
                        const hiddenElements = editor.querySelectorAll('.hidden-content');
                        if (hiddenElements.length > 0) {
                            // Prevent default undo behavior
                            e.preventDefault();
                            
                            // If we have a last good state, restore it
                            if (lastGoodState) {
                                editor.innerHTML = lastGoodState;
                            }
                            
                            // Focus the editor
                            editor.focus();
                            
                            // Show a helpful message
                            this.showNotification('Undo completed. Use HIDE button to toggle content visibility.', 'success');
                        }
                    }
                });
            }
        });
    }

    // Rich Text Editor Setup
    setupRichTextEditor() {
        const toolbarButtons = document.querySelectorAll('.toolbar-btn:not(.color-btn)');
        const colorPickerButtons = document.querySelectorAll('.color-picker-btn');
        const presetColorButtons = document.querySelectorAll('.preset-color-btn');

        // Store selection
        let savedSelection = null;
        
        // Add undo handling for hide/unhide operations
        this.addUndoHandling();

        // Formatting buttons (Bold, Underline, Lists)
        toolbarButtons.forEach(btn => {
            let savedSelection = null;
            
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent focus loss
                // Save current selection
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    savedSelection = sel.getRangeAt(0).cloneRange();
                }
            });
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.getAttribute('data-command');
                const target = btn.getAttribute('data-target');
                
                // Focus on the appropriate editor
                const editor = target === 'front' ? this.editFrontText : this.editBackText;
                
                // Restore selection BEFORE focusing
                if (savedSelection) {
                    try {
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(savedSelection.cloneRange());
                    } catch (e) {
                        console.log('Selection restore failed:', e);
                    }
                }
                
                editor.focus();
                
                // If still no selection, place cursor at end
                const sel = window.getSelection();
                if (!sel.rangeCount || sel.isCollapsed) {
                    const range = document.createRange();
                    range.selectNodeContents(editor);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                
                // Execute the formatting command
                document.execCommand(command, false, null);
                
                // Restore selection after command
                setTimeout(() => {
                    if (savedSelection) {
                        try {
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(savedSelection.cloneRange());
                        } catch (e) {
                            console.log('Selection restore failed:', e);
                        }
                    }
                }, 10);
            });
        });

        // Highlight to hide functionality
        const highlightButtons = document.querySelectorAll('[data-command="highlightHide"]');
        highlightButtons.forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                // Save current selection
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    savedSelection = sel.getRangeAt(0).cloneRange();
                }
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('data-target');
                const editor = target === 'front' ? this.editFrontText : this.editBackText;
                
                // Restore selection
                if (savedSelection) {
                    try {
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(savedSelection.cloneRange());
                    } catch (e) {
                        console.log('Selection restore failed:', e);
                    }
                }
                
                editor.focus();
                
                const selection = window.getSelection();
                
                // First, check if the current selection is inside a hidden element
                let targetHiddenElement = null;
                let node = selection.anchorNode;
                if (node) {
                    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
                    while (el && el !== editor) {
                        if (el.classList && el.classList.contains('hidden-content')) { 
                            targetHiddenElement = el; 
                            break; 
                        }
                        el = el.parentElement;
                    }
                }
                
                // If no hidden element found, check if selection overlaps with any hidden elements
                if (!targetHiddenElement && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const allHiddenElements = editor.querySelectorAll('.hidden-content');
                    for (let hiddenEl of allHiddenElements) {
                        if (range.intersectsNode(hiddenEl)) {
                            targetHiddenElement = hiddenEl;
                            break;
                        }
                    }
                }
                
                if (targetHiddenElement) {
                    // We found a hidden element - unhide it
                    const hiddenText = targetHiddenElement.textContent;
                    const textNode = document.createTextNode(hiddenText);
                    targetHiddenElement.parentNode.replaceChild(textNode, targetHiddenElement);
                    
                    // Select the unhidden text
                    const newRange = document.createRange();
                    newRange.setStart(textNode, 0);
                    newRange.setEnd(textNode, hiddenText.length);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    // Clear undo history to prevent issues
                    editor.focus();
                } else if (selection.rangeCount > 0 && !selection.isCollapsed) {
                    // No hidden elements found - hide the selected text
                    const range = selection.getRangeAt(0);
                    const selectedText = range.toString();
                    
                    if (selectedText.trim()) {
                        // Store the original text for potential undo
                        const originalText = selectedText;
                        
                        const span = document.createElement('span');
                        span.className = 'hidden-content';
                        span.textContent = selectedText;
                        span.setAttribute('data-hidden', 'true');
                        span.setAttribute('data-original-text', originalText);
                        
                        range.deleteContents();
                        range.insertNode(span);
                        
                        // Clear selection
                        selection.removeAllRanges();
                        
                        // Clear undo history to prevent issues
                        editor.focus();
                    }
                }
            });
        });

        // Color picker buttons (🎨) - open custom color modal
        colorPickerButtons.forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                // Save current selection
                const sel = window.getSelection();
                if (sel.rangeCount > 0) {
                    savedSelection = sel.getRangeAt(0).cloneRange();
                }
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('data-target');
                const editor = target === 'front' ? this.editFrontText : this.editBackText;
                this.openCustomColorPickerModal(editor, savedSelection);
            });
        });

        // Preset color buttons - apply color immediately
        presetColorButtons.forEach(btn => {
            // Left click - apply color
            btn.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // Left click only
                    e.preventDefault();
                    // Save current selection
                    const sel = window.getSelection();
                    if (sel.rangeCount > 0) {
                        savedSelection = sel.getRangeAt(0).cloneRange();
                    }
                }
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = btn.getAttribute('data-target');
                const color = btn.getAttribute('data-color');
                
                // Focus on the appropriate editor
                const editor = target === 'front' ? this.editFrontText : this.editBackText;
                editor.focus();
                
                // Restore selection
                if (savedSelection) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(savedSelection);
                }
                
                // Apply color
                // Store the selected text before command
                const selectedText = savedSelection ? savedSelection.toString() : '';
                
                document.execCommand('foreColor', false, color);
                
                // CRITICAL: Restore selection by finding the text in the editor
                setTimeout(() => {
                    if (selectedText && selectedText.trim()) {
                        try {
                            const sel = window.getSelection();
                            const range = document.createRange();
                            
                            // Find the selected text in the editor
                            const editorText = editor.textContent || editor.innerText;
                            const textIndex = editorText.indexOf(selectedText);
                            
                            if (textIndex !== -1) {
                                // Create a new range for the found text
                                const walker = document.createTreeWalker(
                                    editor,
                                    NodeFilter.SHOW_TEXT,
                                    null,
                                    false
                                );
                                
                                let currentPos = 0;
                                let startNode = null;
                                let endNode = null;
                                let startOffset = 0;
                                let endOffset = 0;
                                
                                let node;
                                while (node = walker.nextNode()) {
                                    const nodeText = node.textContent;
                                    const nodeLength = nodeText.length;
                                    
                                    if (!startNode && currentPos + nodeLength > textIndex) {
                                        startNode = node;
                                        startOffset = textIndex - currentPos;
                                    }
                                    
                                    if (!endNode && currentPos + nodeLength >= textIndex + selectedText.length) {
                                        endNode = node;
                                        endOffset = (textIndex + selectedText.length) - currentPos;
                                        break;
                                    }
                                    
                                    currentPos += nodeLength;
                                }
                                
                                if (startNode && endNode) {
                                    range.setStart(startNode, startOffset);
                                    range.setEnd(endNode, endOffset);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    savedSelection = range.cloneRange();
                                }
                            }
                        } catch (e) {
                            console.log('Text-based selection restore failed:', e);
                        }
                    }
                }, 10);
            });

            // Right click - customize color via new modal
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const preset = parseInt(btn.getAttribute('data-preset'));
                
                // Open color customization modal
                this.openColorCustomModal(preset);
            });
        });

        // Hidden color pickers - apply color when changed
        [this.colorPickerFront, this.colorPickerBack].forEach(picker => {
            picker.addEventListener('change', (e) => {
                const color = e.target.value;
                const target = picker.getAttribute('data-target');
                
                // Focus on the appropriate editor
                const editor = target === 'front' ? this.editFrontText : this.editBackText;
                editor.focus();
                
                // Restore selection
                if (savedSelection) {
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(savedSelection);
                }
                
                // Apply color
                // Store the selected text before command
                const selectedText = savedSelection ? savedSelection.toString() : '';
                
                document.execCommand('foreColor', false, color);
                
                // CRITICAL: Restore selection by finding the text in the editor
                setTimeout(() => {
                    if (selectedText && selectedText.trim()) {
                        try {
                            const sel = window.getSelection();
                            const range = document.createRange();
                            
                            // Find the selected text in the editor
                            const editorText = editor.textContent || editor.innerText;
                            const textIndex = editorText.indexOf(selectedText);
                            
                            if (textIndex !== -1) {
                                // Create a new range for the found text
                                const walker = document.createTreeWalker(
                                    editor,
                                    NodeFilter.SHOW_TEXT,
                                    null,
                                    false
                                );
                                
                                let currentPos = 0;
                                let startNode = null;
                                let endNode = null;
                                let startOffset = 0;
                                let endOffset = 0;
                                
                                let node;
                                while (node = walker.nextNode()) {
                                    const nodeText = node.textContent;
                                    const nodeLength = nodeText.length;
                                    
                                    if (!startNode && currentPos + nodeLength > textIndex) {
                                        startNode = node;
                                        startOffset = textIndex - currentPos;
                                    }
                                    
                                    if (!endNode && currentPos + nodeLength >= textIndex + selectedText.length) {
                                        endNode = node;
                                        endOffset = (textIndex + selectedText.length) - currentPos;
                                        break;
                                    }
                                    
                                    currentPos += nodeLength;
                                }
                                
                                if (startNode && endNode) {
                                    range.setStart(startNode, startOffset);
                                    range.setEnd(endNode, endOffset);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                    savedSelection = range.cloneRange();
                                }
                            }
                        } catch (e) {
                            console.log('Text-based selection restore failed:', e);
                        }
                    }
                }, 10);
            });
        });

    }

    // Learn/Test Mode Selection
    openTestModeSelection() {
        if (this.cards.length === 0) {
            alert('Please add some cards first!');
            return;
        }
        this.testModeSelectModal.classList.add('active');
    }

    closeTestModeSelection() {
        this.testModeSelectModal.classList.remove('active');
    }

    // Shared Folder/List Selection Methods
    openSharedFolderSelection(mode) {
        this.sharedFolderSelectMode = mode;
        this.testModeSelectModal.classList.remove('active');
        this.sharedFolderSelectModal.classList.add('active');
        
        // Set title based on mode
        if (mode === 'typing') {
            this.sharedFolderSelectTitle.innerHTML = '<img src="keyboard.png" alt="Keyboard" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;"> Choose Folder';
        } else if (mode === 'flip') {
            this.sharedFolderSelectTitle.innerHTML = '<img src="cards.png" alt="Cards" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;"> Choose Folder';
        } else if (mode === 'multipleChoice') {
            this.sharedFolderSelectTitle.innerHTML = '<img src="writing.png" alt="Multiple Choice" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;"> Choose Folder';
        }
        
        this.renderSharedFolderSelection();
    }

    closeSharedFolderSelection() {
        this.sharedFolderSelectModal.classList.remove('active');
        this.sharedFolderSelectCallback = null;
        this.sharedFolderSelectMode = null;
    }

    // Side Selection Methods (for Card Flipping - after folder selection)
    openFlipSideSelection() {
        this.sharedFolderSelectModal.classList.remove('active');
        this.flipSideSelectModal.classList.add('active');
    }

    closeFlipSideSelection() {
        this.flipSideSelectModal.classList.remove('active');
    }

    // Typing Folder Selection Methods (now redirects to shared)
    openTypingFolderSelection() {
        this.openSharedFolderSelection('typing');
    }

    closeTypingFolderSelection() {
        this.closeSharedFolderSelection();
    }

    backToTypingFolderSelection() {
        this.typingSideSelectModal.classList.remove('active');
        this.sharedFolderSelectModal.classList.add('active');
    }

    openTypingSideSelection() {
        this.sharedFolderSelectModal.classList.remove('active');
        this.typingSideSelectModal.classList.add('active');
    }

    closeTypingSideSelection() {
        this.typingSideSelectModal.classList.remove('active');
    }

    backToTestModeSelection() {
        this.flipSideSelectModal.classList.remove('active');
        this.sharedFolderSelectModal.classList.remove('active');
        this.typingFolderSelectModal.classList.remove('active');
        this.typingSideSelectModal.classList.remove('active');
        this.testModeSelectModal.classList.add('active');
    }

    startFlipModeWithSide(startingSide) {
        this.closeFlipSideSelection();
        // Pass 'all' to use all cards from the selected folder/list (no category filtering)
        // Category filtering can be enabled in the future via explicit UI selection
        this.startFlipMode('all', startingSide);
    }

    startTypingModeWithSides(seeSide, typeSide) {
        this.closeTypingSideSelection();
        this.startTypingMode(seeSide, typeSide);
    }

    // Category Selection
    openCategorySelection() {
        this.testModeSelectModal.classList.remove('active');
        this.categorySelectModal.classList.add('active');
    }

    closeCategorySelection() {
        this.categorySelectModal.classList.remove('active');
    }

    backToTestModeFromCategory() {
        this.categorySelectModal.classList.remove('active');
        this.testModeSelectModal.classList.add('active');
    }

    // Flip Mode Functions
    startFlipMode(category, startingSide = 'front') {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        console.log('[startFlipMode] Starting with category:', category, 'selectedFolderId:', this.selectedFolderId);
        
        // Parse folderId and listId from selectedFolderId
        let folderId = this.selectedFolderId || 'all';
        let listId = null;
        
        if (folderId !== 'all') {
            // Check if the selected ID is a child folder (list)
            const selectedFolder = this.folders.find(f => f.id === folderId || String(f.id) === String(folderId));
            if (selectedFolder && selectedFolder.parentFolderId) {
                // It's a list - extract parent and list IDs
                listId = folderId;
                folderId = selectedFolder.parentFolderId;
                console.log('[startFlipMode] Selected is a list. listId:', listId, 'parent folderId:', folderId);
            } else {
                console.log('[startFlipMode] Selected is a parent folder. folderId:', folderId);
            }
        }
        
        console.log('[startFlipMode] Selected folder ID:', folderId, 'Selected list ID:', listId);
        
        // Build deck using shared function
        const deckCards = this.buildTestDeckFromSelection(folderId, listId);
        console.log('[startFlipMode] Deck cards from buildTestDeckFromSelection (before category filter):', deckCards.length);
        
        // Only apply category filtering if category is explicitly set and not 'all'
        // This allows future UI to enable category filtering, but defaults to using all cards
        if (category && category !== 'all') {
            console.log('[startFlipMode] Applying category filter for:', category);
            // Filter cards based on selected category
            // If a card has no category property, default it to 'card'
            // NOTE: We do NOT filter by isSystemCard - both user and system cards should be testable
            this.flipTestCards = deckCards.filter(card => {
                const cardCategory = card.category || 'card';
                return cardCategory === category;
            });
            console.log('[startFlipMode] After category filter (', category, '):', this.flipTestCards.length);
        } else {
            // No category filtering - use all cards from the selected folder/list
            console.log('[startFlipMode] No category filter applied (using all cards)');
            this.flipTestCards = deckCards;
        }
        
        console.log('[startFlipMode] Final flipTestCards count:', this.flipTestCards.length);
        console.log('[startFlipMode] Sample flipTestCards:', this.flipTestCards.slice(0, 5).map(c => ({ id: c.id, front: c.front?.substring(0, 30), folderId: c.folderId, category: c.category || 'card', isSystemCard: c.isSystemCard })));
        
        if (this.flipTestCards.length === 0) {
            const categoryName = category && category !== 'all' ? (category === 'card' ? 'Cards' : 'Tests') : 'cards';
            const folderName = this.selectedFolderId === 'all' ? 'all folders' : 
                this.folders.find(f => f.id === this.selectedFolderId || String(f.id) === String(this.selectedFolderId))?.name || 'selected folder';
            alert(`No ${categoryName} available in ${folderName}! Please add some ${categoryName.toLowerCase()} first.`);
            this.closeFlipSideSelection();
            return;
        }

        this.closeFlipSideSelection();
        this.currentTestIndex = 0;
        this.isFlipped = startingSide === 'back';
        this.testModeScreen.classList.add('active');
        this.totalCards.textContent = this.flipTestCards.length;
        this.loadTestCard();
    }

    exitTestMode() {
        this.testModeScreen.classList.remove('active');
        this.flashcardInner.classList.remove('flipped');
    }

    // Typing Mode Functions
    startTypingMode(seeSide = 'front', typeSide = 'back') {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        // Use shared deck building function
        // Parse folderId and listId from typingSelectedFolderId
        // If it's a list ID, we need to find its parent folder
        let folderId = this.typingSelectedFolderId;
        let listId = null;
        
        if (folderId !== 'all') {
            // Check if the selected ID is a child folder (list)
            const selectedFolder = this.folders.find(f => f.id === folderId || String(f.id) === String(folderId));
            if (selectedFolder && selectedFolder.parentFolderId) {
                // It's a list - extract parent and list IDs
                listId = folderId;
                folderId = selectedFolder.parentFolderId;
            }
        }
        
        console.log('[startTypingMode] Selected folder ID:', folderId, 'Selected list ID:', listId);
        this.typingTestCards = this.buildTestDeckFromSelection(folderId, listId);
        console.log('[startTypingMode] Typing test cards count:', this.typingTestCards.length);
        
        if (this.typingTestCards.length === 0) {
            const folderName = this.typingSelectedFolderId === 'all' ? 'all folders' : 
                this.folders.find(f => f.id === this.typingSelectedFolderId || String(f.id) === String(this.typingSelectedFolderId))?.name || 'selected folder';
            alert(`No cards available in ${folderName}! Please add some cards first.`);
            this.closeTypingFolderSelection();
            return;
        }
        
        // Store the side configuration
        this.typingSeeSide = seeSide;
        this.typingTypeSide = typeSide;
        
        // Reset test results
        this.testResults = {
            answers: [],
            correctCount: 0,
            incorrectCount: 0
        };

        this.closeTypingSideSelection();
        this.currentTypingIndex = 0;
        this.typingModeScreen.classList.add('active');
        this.typingTotalCards.textContent = this.typingTestCards.length;
        this.loadTypingCard();
    }

    exitTypingMode() {
        this.typingModeScreen.classList.remove('active');
        this.typingAnswer.value = '';
        this.answerResult.style.display = 'none';
    }

    async loadTypingCard() {
        const card = this.typingTestCards[this.currentTypingIndex];
        // Use the configured side to display
        const audioEnabled = typeof CONFIG !== 'undefined' && CONFIG.features && CONFIG.features.enableAudioPronunciation;
        const questionText = this.typingSeeSide === 'front' ? card.front : card.back;
        const speakerIcon = audioEnabled ? '<button class="speaker-btn-inline" title="Pronounce word" aria-label="Pronounce word" style="background: none; border: none; cursor: pointer; padding: 5px; margin-left: 10px; vertical-align: middle;"><img src="music.png" alt="Pronounce" style="width: 24px; height: 24px;"></button>' : '';
        
        this.typingQuestion.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap;">${questionText}${speakerIcon}</div>`;
        
        // Add speaker button click handler
        if (audioEnabled) {
            const speakerBtn = this.typingQuestion.querySelector('.speaker-btn-inline');
            if (speakerBtn) {
                speakerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const wordToSpeak = questionText.split(/[,\n]/)[0].trim();
                    if (wordToSpeak) {
                        speakText(wordToSpeak);
                    }
                });
            }
        }
        
        this.typingAnswer.value = '';
        this.answerResult.style.display = 'none';
        this.typingCardNum.textContent = this.currentTypingIndex + 1;
        this.updateTypingProgress();
        // Reset centering state for new question
        if (this.updateTypingAnswerCentering) {
            // Defer to ensure layout is ready
            setTimeout(() => this.updateTypingAnswerCentering(), 0);
        }
        
        // Update arrow button visibility
        if (this.typingCardArrowLeft) {
            this.typingCardArrowLeft.style.display = this.currentTypingIndex > 0 ? 'flex' : 'none';
        }
        if (this.typingCardArrowRight) {
            this.typingCardArrowRight.style.display = this.currentTypingIndex < this.typingTestCards.length - 1 ? 'flex' : 'none';
        }
        
        // Add click handlers for hidden content
        this.addHiddenContentClickHandlers();
        
        // Reapply font size
        setTimeout(() => this.applyFontSize(), 50);
        
        // Enable/disable navigation buttons
        this.typingPrevBtn.disabled = this.currentTypingIndex === 0;
        this.typingNextBtn.disabled = this.currentTypingIndex === this.typingTestCards.length - 1;
        
        // Store current audio ID and show/hide replay button
        this.currentTypingAudioId = card.audioId || null;
        if (this.currentTypingAudioId) {
            this.typingAudioReplay.style.display = 'flex';
            // Auto-play audio
            await this.playCardAudio(card.audioId);
        } else {
            this.typingAudioReplay.style.display = 'none';
        }
    }

    async replayTypingAudio() {
        if (this.currentTypingAudioId) {
            await this.playCardAudio(this.currentTypingAudioId);
        }
    }

    checkAnswer() {
        const userAnswer = this.typingAnswer.value.trim();
        const card = this.typingTestCards[this.currentTypingIndex];
        // Use the configured side to check against
        const correctAnswer = this.typingTypeSide === 'front' ? card.front : card.back;
        
        if (!userAnswer) {
            alert('Please type an answer first!');
            return;
        }

        // Remove HTML tags for comparison
        const correctText = this.stripHTML(correctAnswer).trim();
        const userText = userAnswer.trim();
        
        // Normalize text and whitespace for comparison
        const normalizedCorrect = this.normalizeText(correctText).replace(/\s+/g, ' ');
        const normalizedUser = this.normalizeText(userText).replace(/\s+/g, ' ');
        
        // Check if exactly correct (case-sensitive but ignoring visual-only differences)
        const isCorrect = normalizedCorrect === normalizedUser;
        
        // Track the answer (update if already checked, add if new)
        const existingIndex = this.testResults.answers.findIndex(a => a.cardId === card.id);
        const answerRecord = {
            cardId: card.id,
            questionIndex: this.currentTypingIndex,
            isCorrect: isCorrect,
            userAnswer: userText,
            correctAnswer: correctText
        };
        
        if (existingIndex >= 0) {
            // Update existing answer
            const wasCorrect = this.testResults.answers[existingIndex].isCorrect;
            this.testResults.answers[existingIndex] = answerRecord;
            
            // Update counts
            if (wasCorrect !== isCorrect) {
                if (isCorrect) {
                    this.testResults.correctCount++;
                    this.testResults.incorrectCount--;
                } else {
                    this.testResults.incorrectCount++;
                    this.testResults.correctCount--;
                }
            }
        } else {
            // Add new answer
            this.testResults.answers.push(answerRecord);
            if (isCorrect) {
                this.testResults.correctCount++;
            } else {
                this.testResults.incorrectCount++;
            }
        }
        
        this.answerResult.style.display = 'block';
        this.answerResult.className = 'answer-result ' + (isCorrect ? 'correct' : 'incorrect');
        this.resultTitle.textContent = isCorrect ? '✅ Correct!' : '❌ Not Quite Right';
        
        // Show comparison if incorrect
        if (!isCorrect) {
            const { highlightedUser, highlightedCorrect } = this.compareTexts(userText, correctText);
            this.correctAnswerContent.innerHTML = `
                <div class="comparison-section">
                    <div class="user-typed">
                        <strong>You typed:</strong>
                        <div class="typed-text">${highlightedUser}</div>
                    </div>
                    <div class="correct-answer-section">
                        <strong>Correct Answer:</strong>
                        <div class="correct-text">${highlightedCorrect}</div>
                    </div>
                </div>
            `;
        } else {
            this.correctAnswerContent.innerHTML = `<div style="text-align: center; color: #4CAF50; font-size: 1.2rem;">Perfect! 🎉</div>`;
        }
    }

    normalizeText(text) {
        // Normalize visually similar characters to standard ones
        return text
            // Normalize apostrophes and single quotes
            .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
            // Normalize double quotes
            .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
            // Normalize dashes
            .replace(/[\u2013\u2014\u2015]/g, '-')
            // Normalize spaces
            .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ');
    }

    compareTexts(userText, correctText) {
        // Normalize text to handle visual-only differences
        const normalizedUserText = this.normalizeText(userText);
        const normalizedCorrectText = this.normalizeText(correctText);
        
        // Split by spaces to get word chunks
        const userWords = normalizedUserText.split(/\s+/).filter(w => w.length > 0);
        const correctWords = normalizedCorrectText.split(/\s+/).filter(w => w.length > 0);
        
        // Use dynamic programming to find the best alignment (Levenshtein-like approach)
        const alignment = this.alignSequences(userWords, correctWords);
        
        const highlightedUserParts = [];
        const highlightedCorrectParts = [];
        
        for (let i = 0; i < alignment.length; i++) {
            const { userWord, correctWord, type } = alignment[i];
            
            // Add spaces between words (but not at the start)
            if (i > 0) {
                if (type !== 'insert') highlightedUserParts.push(' ');
                highlightedCorrectParts.push(' ');
            }
            
            if (type === 'match') {
                // Exact match - correct word
                highlightedUserParts.push(userWord);
                highlightedCorrectParts.push(correctWord);
            } else if (type === 'substitute') {
                // Different word at same position
                highlightedUserParts.push(`<span class="word-incorrect">${userWord}</span>`);
                highlightedCorrectParts.push(`<span class="word-expected">${correctWord}</span>`);
            } else if (type === 'delete') {
                // Extra word in user's text (not in correct answer)
                highlightedUserParts.push(`<span class="word-incorrect">${userWord}</span>`);
                // Don't add to correct parts - this word shouldn't exist
            } else if (type === 'insert') {
                // Missing word in user's text (exists in correct answer but user didn't type it)
                highlightedUserParts.push(`<span class="word-missing-placeholder">___</span>`);
                highlightedCorrectParts.push(`<span class="word-expected">${correctWord}</span>`);
            }
        }
        
        return {
            highlightedUser: highlightedUserParts.join(''),
            highlightedCorrect: highlightedCorrectParts.join('')
        };
    }

    alignSequences(userWords, correctWords) {
        const m = userWords.length;
        const n = correctWords.length;
        
        // Create DP table
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        // Initialize base cases
        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        
        // Fill DP table
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (userWords[i - 1] === correctWords[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1]; // Match
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,     // Delete
                        dp[i][j - 1] + 1,     // Insert
                        dp[i - 1][j - 1] + 1  // Substitute
                    );
                }
            }
        }
        
        // Backtrack to find alignment
        const alignment = [];
        let i = m, j = n;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && userWords[i - 1] === correctWords[j - 1]) {
                // Match
                alignment.unshift({
                    userWord: userWords[i - 1],
                    correctWord: correctWords[j - 1],
                    type: 'match'
                });
                i--; j--;
            } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
                // Substitute
                alignment.unshift({
                    userWord: userWords[i - 1],
                    correctWord: correctWords[j - 1],
                    type: 'substitute'
                });
                i--; j--;
            } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
                // Delete (extra word in user's text)
                alignment.unshift({
                    userWord: userWords[i - 1],
                    correctWord: null,
                    type: 'delete'
                });
                i--;
            } else if (j > 0) {
                // Insert (missing word in user's text)
                alignment.unshift({
                    userWord: null,
                    correctWord: correctWords[j - 1],
                    type: 'insert'
                });
                j--;
            }
        }
        
        return alignment;
    }

    stripHTML(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    previousTypingCard() {
        // Auto-check the current answer before moving if there's text
        const currentAnswer = this.typingAnswer.value.trim();
        const isAnswerChecked = this.answerResult && this.answerResult.style.display === 'block';
        
        if (currentAnswer && !isAnswerChecked) {
            // Auto-check the answer before moving
            this.checkAnswer();
        }
        
        if (this.currentTypingIndex > 0) {
            this.currentTypingIndex--;
            this.loadTypingCard();
        }
    }

    nextTypingCard() {
        // Auto-check the current answer before moving if there's text
        const currentAnswer = this.typingAnswer.value.trim();
        const isAnswerChecked = this.answerResult && this.answerResult.style.display === 'block';
        
        if (currentAnswer && !isAnswerChecked) {
            // Auto-check the answer before moving
            this.checkAnswer();
        }
        
        if (this.currentTypingIndex < this.typingTestCards.length - 1) {
            this.currentTypingIndex++;
            this.loadTypingCard();
        } else {
            // Automatically show results when reaching the last card
            this.showTestResults();
        }
    }

    updateTypingProgress() {
        const progress = ((this.currentTypingIndex + 1) / this.typingTestCards.length) * 100;
        this.typingProgressFill.style.width = progress + '%';
    }

    showTestResults() {
        // Auto-check the current answer if there's text and it hasn't been checked
        const currentAnswer = this.typingAnswer.value.trim();
        const isAnswerChecked = this.answerResult && this.answerResult.style.display === 'block';
        
        if (currentAnswer && !isAnswerChecked) {
            // Auto-check the answer before showing results
            this.checkAnswer();
        }
        
        // Calculate percentage
        const totalQuestions = this.typingTestCards.length;
        const percentage = totalQuestions > 0 
            ? Math.round((this.testResults.correctCount / totalQuestions) * 100) 
            : 0;
        
        // Calculate unanswered count
        // Unanswered = total - correct - incorrect
        const unansweredCount = totalQuestions - this.testResults.correctCount - this.testResults.incorrectCount;
        
        // Update modal content
        this.gradePercentage.textContent = percentage + '%';
        this.totalQuestions.textContent = totalQuestions;
        this.correctAnswers.textContent = this.testResults.correctCount;
        this.incorrectAnswers.textContent = this.testResults.incorrectCount;
        if (this.unansweredAnswers) {
            this.unansweredAnswers.textContent = unansweredCount;
        }
        
        // Set performance message based on percentage
        let message = '';
        if (percentage >= 90) {
            message = 'Outstanding! You have mastered this material!';
        } else if (percentage >= 80) {
            message = 'Excellent work! You\'re doing great!';
        } else if (percentage >= 70) {
            message = 'Good job! Keep practicing to improve further.';
        } else if (percentage >= 60) {
            message = 'Not bad! Review the material and try again.';
        } else {
            message = 'Keep practicing! You\'ll get better with more practice.';
        }
        
        this.performanceMessage.querySelector('p').innerHTML = message;
        
        // Update grade circle color based on performance
        const gradeCircle = document.querySelector('.grade-circle');
        if (percentage >= 80) {
            gradeCircle.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)';
        } else if (percentage >= 60) {
            gradeCircle.style.background = 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)';
        } else {
            gradeCircle.style.background = 'linear-gradient(135deg, #C85A6E 0%, #A94759 100%)';
        }
        
        // Populate incorrect answers
        this.populateAnswersReview();
        
        // Show modal
        console.log('About to show modal, element:', this.testResultsModal);
        if (this.testResultsModal) {
            this.testResultsModal.classList.add('active');
            console.log('Modal classList after adding active:', this.testResultsModal.classList);
        } else {
            console.error('testResultsModal element not found!');
            // Try direct access as fallback
            const modal = document.getElementById('testResultsModal');
            if (modal) {
                console.log('Found modal via getElementById, adding active class');
                modal.classList.add('active');
            }
        }
    }

    populateAnswersReview() {
        const answersReviewSection = document.getElementById('answersReviewSection');
        const incorrectAnswersSection = document.getElementById('incorrectAnswersSection');
        const incorrectAnswersList = document.getElementById('incorrectAnswersList');
        
        // Clear previous content
        incorrectAnswersList.innerHTML = '';
        
        // Collect incorrect answers
        const incorrectAnswers = [];
        
        this.typingTestCards.forEach((card, index) => {
            const answer = this.testResults.answers.find(a => a.cardId === card.id);
            
            if (answer && !answer.isCorrect) {
                // Incorrect
                incorrectAnswers.push({
                    card: card,
                    answer: answer,
                    index: index + 1
                });
            }
        });
        
        // Show/hide section based on whether there are incorrect answers
        if (incorrectAnswers.length > 0) {
            answersReviewSection.style.display = 'block';
            incorrectAnswersSection.style.display = 'block';
            
            // Populate incorrect answers
            incorrectAnswers.forEach(item => {
                const answerItem = document.createElement('div');
                answerItem.className = 'review-answer-item';
                
                const question = this.testShowFront ? item.card.front : item.card.back;
                const correctAnswer = this.testShowFront ? item.card.back : item.card.front;
                const userAnswer = item.answer.userAnswer;
                
                answerItem.innerHTML = `
                    <div class="review-answer-question">Question ${item.index}: ${this.escapeHtml(question)}</div>
                    <div class="review-answer-details">
                        <div class="review-answer-row">
                            <span class="review-answer-label">Your Answer:</span>
                            <span class="review-answer-value incorrect">${this.escapeHtml(userAnswer)}</span>
                        </div>
                        <div class="review-answer-row">
                            <span class="review-answer-label">Correct Answer:</span>
                            <span class="review-answer-value correct">${this.escapeHtml(correctAnswer)}</span>
                        </div>
                    </div>
                `;
                
                incorrectAnswersList.appendChild(answerItem);
            });
        } else {
            answersReviewSection.style.display = 'none';
            incorrectAnswersSection.style.display = 'none';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== MULTIPLE CHOICE MODE FUNCTIONS ==========
    
    openMultipleChoiceFolderSelection() {
        // Redirect to shared folder selection
        this.openSharedFolderSelection('multipleChoice');
    }

    closeMultipleChoiceFolderSelection() {
        // Redirect to shared folder selection
        this.closeSharedFolderSelection();
    }

    startMultipleChoiceMode() {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        // Parse folderId and listId from mcSelectedFolderId
        let folderId = this.mcSelectedFolderId;
        let listId = null;
        
        if (folderId !== 'all') {
            // Check if the selected ID is a child folder (list)
            const selectedFolder = this.folders.find(f => f.id === folderId || String(f.id) === String(folderId));
            if (selectedFolder && selectedFolder.parentFolderId) {
                // It's a list - extract parent and list IDs
                listId = folderId;
                folderId = selectedFolder.parentFolderId;
            }
        }
        
        console.log('[startMultipleChoiceMode] Selected folder ID:', folderId, 'Selected list ID:', listId);
        // Use shared deck building function
        this.mcTestCards = this.buildTestDeckFromSelection(folderId, listId);
        console.log('[startMultipleChoiceMode] Multiple choice test cards count:', this.mcTestCards.length);
        
        if (this.mcTestCards.length === 0) {
            const folderName = this.mcSelectedFolderId === 'all' ? 'all folders' : 
                this.folders.find(f => f.id === this.mcSelectedFolderId || String(f.id) === String(this.mcSelectedFolderId))?.name || 'selected folder';
            alert(`No cards available in ${folderName}! Please add some cards first.`);
            this.closeMultipleChoiceFolderSelection();
            return;
        }
        
        // Reset test results
        this.testResults = {
            answers: [],
            correctCount: 0,
            incorrectCount: 0
        };

        this.closeMultipleChoiceFolderSelection();
        this.currentMcIndex = 0;
        this.multipleChoiceModeScreen.classList.add('active');
        this.mcTotalCards.textContent = this.mcTestCards.length;
        this.loadMcCard();
    }

    exitMultipleChoiceMode() {
        this.multipleChoiceModeScreen.classList.remove('active');
        if (this.mcAutoAdvanceTimeout) {
            clearTimeout(this.mcAutoAdvanceTimeout);
            this.mcAutoAdvanceTimeout = null;
        }
    }

    async loadMcCard() {
        const card = this.mcTestCards[this.currentMcIndex];
        
        // Show question (front side)
        const audioEnabled = typeof CONFIG !== 'undefined' && CONFIG.features && CONFIG.features.enableAudioPronunciation;
        const speakerIcon = audioEnabled ? '<button class="speaker-btn-inline" title="Pronounce word" aria-label="Pronounce word" style="background: none; border: none; cursor: pointer; padding: 5px; margin-left: 10px; vertical-align: middle;"><img src="music.png" alt="Pronounce" style="width: 24px; height: 24px;"></button>' : '';
        
        this.mcQuestion.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap;">${card.front}${speakerIcon}</div>`;
        
        // Add speaker button click handler
        if (audioEnabled) {
            const speakerBtn = this.mcQuestion.querySelector('.speaker-btn-inline');
            if (speakerBtn) {
                speakerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const wordToSpeak = card.front.split(/[,\n]/)[0].trim();
                    if (wordToSpeak) {
                        speakText(wordToSpeak);
                    }
                });
            }
        }
        
        // Update progress
        this.mcCardNum.textContent = this.currentMcIndex + 1;
        this.updateMcProgress();
        
        // Update arrow button visibility
        if (this.mcCardArrowLeft) {
            this.mcCardArrowLeft.style.display = this.currentMcIndex > 0 ? 'flex' : 'none';
        }
        if (this.mcCardArrowRight) {
            this.mcCardArrowRight.style.display = this.currentMcIndex < this.mcTestCards.length - 1 ? 'flex' : 'none';
        }
        
        // Generate and display options
        const options = this.generateMcOptions(card);
        this.renderMcOptions(options, card);
        
        // Enable/disable navigation buttons
        this.mcPrevBtn.disabled = this.currentMcIndex === 0;
        this.mcNextBtn.disabled = this.currentMcIndex === this.mcTestCards.length - 1;
        
        // Store current audio ID and show/hide replay button
        this.currentMcAudioId = card.audioId || null;
        if (this.currentMcAudioId) {
            this.mcAudioReplay.style.display = 'flex';
            // Auto-play audio
            await this.playCardAudio(card.audioId);
        } else {
            this.mcAudioReplay.style.display = 'none';
        }
        
        // Reapply font size
        setTimeout(() => this.applyFontSize(), 50);
    }

    generateMcOptions(correctCard) {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        const correctAnswer = correctCard.back;
        
        // Collect all BACK-side answers from current test set
        const allAnswers = this.mcTestCards
            .map(c => c.back)
            .filter(answer => answer !== correctAnswer); // Remove correct answer
        
        // Remove duplicates
        const uniqueAnswers = [...new Set(allAnswers.map(a => this.stripHTML(a).trim()))];
        
        // Determine number of options (2-4)
        const numOptions = Math.min(4, Math.max(2, uniqueAnswers.length + 1));
        const numDistractors = numOptions - 1;
        
        // Randomly select distractors
        const shuffled = uniqueAnswers.sort(() => Math.random() - 0.5);
        const distractors = shuffled.slice(0, numDistractors);
        
        // Combine correct answer with distractors
        const allOptions = [correctAnswer, ...distractors];
        
        // Shuffle all options
        return allOptions.sort(() => Math.random() - 0.5);
    }

    renderMcOptions(options, correctCard) {
        this.multipleChoiceOptions.innerHTML = '';
        
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'mc-option-btn';
            button.textContent = this.stripHTML(option);
            button.dataset.optionIndex = index;
            button.dataset.isCorrect = (option === correctCard.back) ? 'true' : 'false';
            
            button.addEventListener('click', () => {
                this.selectMcAnswer(button, correctCard);
            });
            
            this.multipleChoiceOptions.appendChild(button);
        });
    }

    selectMcAnswer(selectedButton, correctCard) {
        // Disable all buttons
        const allButtons = this.multipleChoiceOptions.querySelectorAll('.mc-option-btn');
        allButtons.forEach(btn => {
            btn.classList.add('mc-option-disabled');
        });
        
        const isCorrect = selectedButton.dataset.isCorrect === 'true';
        
        // Highlight correct/incorrect
        if (isCorrect) {
            selectedButton.classList.add('mc-correct');
        } else {
            selectedButton.classList.add('mc-incorrect');
            // Also highlight the correct answer
            allButtons.forEach(btn => {
                if (btn.dataset.isCorrect === 'true') {
                    btn.classList.add('mc-correct');
                }
            });
        }
        
        // Record answer
        const card = this.mcTestCards[this.currentMcIndex];
        const userAnswer = this.stripHTML(selectedButton.textContent);
        const correctAnswer = this.stripHTML(correctCard.back);
        
        this.testResults.answers.push({
            cardId: card.id,
            questionIndex: this.currentMcIndex,
            isCorrect: isCorrect,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer
        });
        
        if (isCorrect) {
            this.testResults.correctCount++;
        } else {
            this.testResults.incorrectCount++;
        }
        
        // Auto-advance after 1 second
        if (this.mcAutoAdvanceTimeout) {
            clearTimeout(this.mcAutoAdvanceTimeout);
        }
        
        this.mcAutoAdvanceTimeout = setTimeout(() => {
            if (this.currentMcIndex < this.mcTestCards.length - 1) {
                this.currentMcIndex++;
                this.loadMcCard();
            } else {
                // Last question - show results
                this.showMcTestResults();
            }
        }, 1000);
    }

    prevMcCard() {
        if (this.currentMcIndex > 0) {
            if (this.mcAutoAdvanceTimeout) {
                clearTimeout(this.mcAutoAdvanceTimeout);
                this.mcAutoAdvanceTimeout = null;
            }
            this.currentMcIndex--;
            this.loadMcCard();
        }
    }

    nextMcCard() {
        if (this.currentMcIndex < this.mcTestCards.length - 1) {
            if (this.mcAutoAdvanceTimeout) {
                clearTimeout(this.mcAutoAdvanceTimeout);
                this.mcAutoAdvanceTimeout = null;
            }
            this.currentMcIndex++;
            this.loadMcCard();
        } else {
            // Last question - show results
            this.showMcTestResults();
        }
    }

    updateMcProgress() {
        const progress = ((this.currentMcIndex + 1) / this.mcTestCards.length) * 100;
        this.mcProgressFill.style.width = progress + '%';
    }

    async replayMcAudio() {
        if (this.currentMcAudioId) {
            await this.playCardAudio(this.currentMcAudioId);
        }
    }

    finishMcTest() {
        if (this.mcAutoAdvanceTimeout) {
            clearTimeout(this.mcAutoAdvanceTimeout);
            this.mcAutoAdvanceTimeout = null;
        }
        this.showMcTestResults();
    }

    showMcTestResults() {
        // Calculate percentage
        const totalQuestions = this.mcTestCards.length;
        const percentage = totalQuestions > 0 
            ? Math.round((this.testResults.correctCount / totalQuestions) * 100) 
            : 0;
        
        // Calculate unanswered count
        // Unanswered = total - correct - incorrect
        const unansweredCount = totalQuestions - this.testResults.correctCount - this.testResults.incorrectCount;
        
        // Update modal content
        this.gradePercentage.textContent = percentage + '%';
        this.totalQuestions.textContent = totalQuestions;
        this.correctAnswers.textContent = this.testResults.correctCount;
        this.incorrectAnswers.textContent = this.testResults.incorrectCount;
        if (this.unansweredAnswers) {
            this.unansweredAnswers.textContent = unansweredCount;
        }
        
        // Set performance message
        let message = '';
        if (percentage >= 90) {
            message = 'Outstanding! You have mastered this material!';
        } else if (percentage >= 80) {
            message = 'Excellent work! You\'re doing great!';
        } else if (percentage >= 70) {
            message = 'Good job! Keep practicing to improve further.';
        } else if (percentage >= 60) {
            message = 'Not bad! Review the material and try again.';
        } else {
            message = 'Keep practicing! You\'ll get better with more practice.';
        }
        
        this.performanceMessage.querySelector('p').innerHTML = message;
        
        // Update grade circle color
        const gradeCircle = document.querySelector('.grade-circle');
        if (percentage >= 80) {
            gradeCircle.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)';
        } else if (percentage >= 60) {
            gradeCircle.style.background = 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)';
        } else {
            gradeCircle.style.background = 'linear-gradient(135deg, #C85A6E 0%, #A94759 100%)';
        }
        
        // Populate incorrect answers (reuse typing mode function)
        this.populateMcAnswersReview();
        
        // Show modal
        if (this.testResultsModal) {
            this.testResultsModal.classList.add('active');
        }
        
        // Exit multiple choice mode
        this.exitMultipleChoiceMode();
    }

    populateMcAnswersReview() {
        const answersReviewSection = document.getElementById('answersReviewSection');
        const incorrectAnswersSection = document.getElementById('incorrectAnswersSection');
        const incorrectAnswersList = document.getElementById('incorrectAnswersList');
        
        // Clear previous content
        incorrectAnswersList.innerHTML = '';
        
        // Collect incorrect answers
        const incorrectAnswers = [];
        
        this.mcTestCards.forEach((card, index) => {
            const answer = this.testResults.answers.find(a => a.cardId === card.id);
            
            if (answer && !answer.isCorrect) {
                incorrectAnswers.push({
                    card: card,
                    answer: answer,
                    index: index + 1
                });
            }
        });
        
        if (incorrectAnswers.length > 0) {
            answersReviewSection.style.display = 'block';
            incorrectAnswersSection.style.display = 'block';
            
            incorrectAnswers.forEach(item => {
                const answerItem = document.createElement('div');
                answerItem.className = 'review-answer-item';
                const question = this.stripHTML(item.card.front);
                const userAnswer = item.answer.userAnswer;
                const correctAnswer = item.answer.correctAnswer;
                
                answerItem.innerHTML = `
                    <div class="review-answer-question">Question ${item.index}: ${this.escapeHtml(question)}</div>
                    <div class="review-answer-details">
                        <div class="review-answer-row">
                            <span class="review-answer-label">Your Answer:</span>
                            <span class="review-answer-value incorrect">${this.escapeHtml(userAnswer)}</span>
                        </div>
                        <div class="review-answer-row">
                            <span class="review-answer-label">Correct Answer:</span>
                            <span class="review-answer-value correct">${this.escapeHtml(correctAnswer)}</span>
                        </div>
                    </div>
                `;
                incorrectAnswersList.appendChild(answerItem);
            });
        } else {
            answersReviewSection.style.display = 'none';
            incorrectAnswersSection.style.display = 'none';
        }
    }

    closeTestResults() {
        this.testResultsModal.classList.remove('active');
    }

    retakeTest() {
        // Reset test results
        this.testResults = {
            answers: [],
            correctCount: 0,
            incorrectCount: 0
        };
        
        // Close results modal
        this.closeTestResults();
        
        // Reset to first question
        this.currentTypingIndex = 0;
        this.loadTypingCard();
        
        this.showNotification('Test reset! Good luck! 🍀', 'success');
    }

    exitToHome() {
        // Close results modal
        this.closeTestResults();
        
        // Exit typing mode
        this.exitTypingMode();
    }

    reviewTest() {
        // Close results modal
        this.closeTestResults();
        
        // Go to first question
        this.currentTypingIndex = 0;
        this.loadTypingCard();
        
        this.showNotification('Review mode: Check your answers! 📋', 'info');
    }

    async     loadTestCard() {
        const card = this.flipTestCards[this.currentTestIndex];
        const audioEnabled = typeof CONFIG !== 'undefined' && CONFIG.features && CONFIG.features.enableAudioPronunciation;
        const speakerIcon = audioEnabled ? '<button class="speaker-btn-inline" title="Pronounce word" aria-label="Pronounce word" style="background: none; border: none; cursor: pointer; padding: 5px; margin-left: 10px; vertical-align: middle;"><img src="music.png" alt="Pronounce" style="width: 24px; height: 24px;"></button>' : '';
        
        // Wrap front content with speaker button
        this.cardFront.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap;">${card.front}${speakerIcon}</div>`;
        this.cardBack.innerHTML = card.back;
        
        // Add speaker button click handler
        if (audioEnabled) {
            const speakerBtn = this.cardFront.querySelector('.speaker-btn-inline');
            if (speakerBtn) {
                speakerBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const frontText = card.front || '';
                    const wordToSpeak = frontText.split(/[,\n]/)[0].trim();
                    if (wordToSpeak) {
                        speakText(wordToSpeak);
                    }
                });
            }
        }
        // Center single-line content on flashcard
        this.applySingleLineCentering(this.cardFront);
        this.applySingleLineCentering(this.cardBack);
        // Re-apply on resize (debounced)
        if (!this._recenterHandler) {
            let raf = null;
            this._recenterHandler = () => {
                if (raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    this.applySingleLineCentering(this.cardFront);
                    this.applySingleLineCentering(this.cardBack);
                });
            };
            window.addEventListener('resize', this._recenterHandler);
        }
        
        // Reapply font size
        setTimeout(() => this.applyFontSize(), 50);
        
        this.currentCardNum.textContent = this.currentTestIndex + 1;
        this.flashcardInner.classList.remove('flipped');
        this.isFlipped = false;
        this.updateProgress();
        this.updateSideIndicator();
        
        // Update arrow button visibility
        if (this.flipCardArrowLeft) {
            this.flipCardArrowLeft.style.display = this.currentTestIndex > 0 ? 'flex' : 'none';
        }
        if (this.flipCardArrowRight) {
            this.flipCardArrowRight.style.display = this.currentTestIndex < this.flipTestCards.length - 1 ? 'flex' : 'none';
        }
        
        // Add click handlers for hidden content
        this.addHiddenContentClickHandlers();
        
        // Store current audio ID and show/hide replay button
        this.currentFlipAudioId = card.audioId || null;
        if (this.currentFlipAudioId) {
            this.flipAudioReplay.style.display = 'flex';
            // Auto-play audio
            await this.playCardAudio(card.audioId);
        } else {
            this.flipAudioReplay.style.display = 'none';
        }
    }

    async replayFlipAudio() {
        if (this.currentFlipAudioId) {
            await this.playCardAudio(this.currentFlipAudioId);
        }
    }

    flipCard() {
        this.flashcardInner.classList.toggle('flipped');
        this.isFlipped = !this.isFlipped;
        this.updateSideIndicator();
    }

    updateSideIndicator() {
        const sideLabel = document.getElementById('currentSideLabel');
        if (sideLabel) {
            if (this.isFlipped) {
                sideLabel.textContent = 'Back';
                sideLabel.classList.add('back');
            } else {
                sideLabel.textContent = 'Front';
                sideLabel.classList.remove('back');
            }
        }
    }

    nextCard() {
        if (this.currentTestIndex < this.flipTestCards.length - 1) {
            this.currentTestIndex++;
            this.loadTestCard();
        } else {
            alert('You\'ve reached the end! Great job! 🎉');
        }
    }

    previousCard() {
        if (this.currentTestIndex > 0) {
            this.currentTestIndex--;
            this.loadTestCard();
        }
    }

    updateProgress() {
        const progress = ((this.currentTestIndex + 1) / this.flipTestCards.length) * 100;
        this.progressFill.style.width = progress + '%';
    }

    // Add click handlers for hidden content in test mode
    addHiddenContentClickHandlers() {
        const hiddenElements = document.querySelectorAll('.hidden-content');
        hiddenElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (element.classList.contains('revealed')) {
                    // Hide the content
                    element.classList.remove('revealed');
                } else {
                    // Reveal the content
                    element.classList.add('revealed');
                }
            });
        });
    }

    // Folder System Methods
    loadFolders() {
        const userKey = this.currentUser ? `vocaBoxFolders_${this.currentUser.username}` : 'vocaBoxFolders_guest';
        const savedFolders = localStorage.getItem(userKey);
        if (savedFolders) {
            return JSON.parse(savedFolders);
        } else {
            // Create default folder
            const defaultFolders = [{
                id: 'default',
                name: 'Default Folder',
                description: 'Default folder for all cards',
                createdAt: new Date().toISOString()
            }];
            this.saveFolders(defaultFolders);
            return defaultFolders;
        }
    }

    saveFolders(folders) {
        const userKey = this.currentUser ? `vocaBoxFolders_${this.currentUser.username}` : 'vocaBoxFolders_guest';
        localStorage.setItem(userKey, JSON.stringify(folders));
    }

    createFolder(name, description = '', parentFolderId = null) {
        // Only check limits for parent folders (not child lists)
        if (!parentFolderId && !this.canAddFolder()) {
            const limits = this.getSubscriptionLimits();
            this.showUpgradeModal('folders', limits.maxFolders);
            return false;
        }

        const folder = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: name,
            description: description,
            parentFolderId: parentFolderId || null,
            createdAt: new Date().toISOString()
        };
        this.folders.push(folder);
        this.saveFolders(this.folders);
        this.renderFolders();
        this.updateFolderSelectors();
        return true;
    }

    renderFolders() {
        this.folderList.innerHTML = '';
        
        // Only show parent folders (no parentFolderId) and hide legacy child lists named "Prefix - List XX"
        const parentFolders = this.folders.filter(folder => {
            const isLegacyChild = /.+\s-\sList\s\d+$/i.test(folder.name);
            return !folder.parentFolderId && !isLegacyChild;
        });
        parentFolders.forEach(folder => {
            const folderElement = this.createFolderElement(folder);
            this.folderList.appendChild(folderElement);
        });
    }

    createFolderElement(folder) {
        // CRITICAL: Ensure cards is always an array (don't reload, just ensure it's valid)
        this.ensureCardsIsArray();
        
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder-item';
        folderDiv.dataset.folderId = folder.id;
        
        // Count cards: if parent, include all child folders (new + legacy naming)
        let cardCount = 0;
        if (folder.parentFolderId) {
            // Child folder: own cards only
            // Use both strict and string comparison to handle type mismatches
            cardCount = this.cards.filter(card => {
                return card.folderId === folder.id || String(card.folderId) === String(folder.id);
            }).length;
        } else {
            // Parent folder: count cards in parent folder AND all child folders
            const childIds = this.getChildFolderIdsForParent(folder.id);
            console.log('[createFolderElement] Counting cards for parent folder:', folder.name, 'childIds:', Array.from(childIds));
            
            // Create a set that includes both the parent folder ID and all child folder IDs
            const relevantFolderIds = new Set(Array.from(childIds));
            relevantFolderIds.add(folder.id); // Add the parent folder itself
            
            // Convert to strings for comparison to handle type mismatches
            const relevantIdStrings = new Set(Array.from(relevantFolderIds).map(id => String(id)));
            this.cards.forEach(c => {
                const cardFolderIdStr = String(c.folderId);
                if (relevantFolderIds.has(c.folderId) || relevantIdStrings.has(cardFolderIdStr)) {
                    cardCount++;
                    console.log('[createFolderElement] Card matches:', c.id, 'folderId:', c.folderId);
                }
            });
            console.log('[createFolderElement] Total card count for parent folder (including direct cards):', folder.name, ':', cardCount);
        }
        
        // Define folder colors (same as cards)
        const folderColors = [
            '#CD7D88', // 1
            '#BFDCDB', // 2
            '#87ABC5', // 3
            '#C5B5D3', // 4
            '#DE9C73', // 5
            '#5F2312', // 6
            '#DE634D', // 7
            '#E1A102', // 8
            '#3A989E', // 9
            '#B66899'  // 10
        ];
        
        // Get all folders to determine color index - sort consistently to match card colors
        const allFolders = [
            { id: 'default', name: 'Default Folder' },
            ...this.folders.filter(f => f.id !== 'default').sort((a, b) => {
                // Sort by name for consistent ordering (case-insensitive)
                return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            })
        ];
        
        // Find the index of the current folder
        const folderIndex = allFolders.findIndex(f => f.id === folder.id);
        const colorIndex = folderIndex >= 0 ? folderIndex % folderColors.length : 0;
        const folderColor = folderColors[colorIndex];
        
        // Apply color border
        folderDiv.style.borderLeft = `3px solid ${folderColor}`;
        
        folderDiv.innerHTML = `
            <img src="books.png" alt="Folder" class="folder-icon" style="width: 16px; height: 16px;">
            <div class="folder-info">
                <span class="folder-name">${folder.name}</span>
                <span class="folder-count">${cardCount}</span>
            </div>
            <div class="folder-item-actions" style="display: flex; gap: 4px; margin-left: auto;">
                <button class="folder-rename-btn" data-folder-id="${folder.id}" title="Rename folder">
                    <img src="pencil.png" alt="Rename">
                </button>
                <button class="folder-delete-btn" data-folder-id="${folder.id}" title="Delete folder">
                    <img src="trashbin.png" alt="Delete">
                    </button>
            </div>
        `;
        
        // Main click handler for selecting folder
        folderDiv.addEventListener('click', (e) => {
            // Don't select if clicking on action buttons
            if (e.target.closest('.folder-item-actions')) {
                e.stopPropagation();
                return;
            }
            this.selectFolder(folder.id);
        });
        
        // Rename button handler
        const renameBtn = folderDiv.querySelector('.folder-rename-btn');
        if (renameBtn) {
            renameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.renameFolder(folder.id);
            });
        }
        
        // Delete button handler
        const deleteBtn = folderDiv.querySelector('.folder-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteFolderFromSidebar(folder.id);
            });
        }
        
        return folderDiv;
    }

    selectFolder(folderId) {
        console.log(`[selectFolder] Selecting folder: ${folderId}`);
        this.currentFolder = folderId;
        this.currentCardIndex = 0; // Reset to first card when changing folders
        
        // Explicitly update the button FIRST before other updates
        this.updateCurrentFolderInfo();
        
        this.updateListDropdownForHeader();
        this.renderCards();
        this.updateCardCount();
        this.updateFolderSelectors();
        console.log(`[selectFolder] Folder selection complete. Button should now show folder info.`);
        
        // Update active folder visual state
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeFolder = document.querySelector(`[data-folder-id="${folderId}"]`);
        if (activeFolder) {
            activeFolder.classList.add('active');
        }
    }

    // Shared folder/list selection render function
    renderSharedFolderSelection() {
        if (!this.sharedFolderSelectionContainer) return;
        this.sharedFolderSelectionContainer.innerHTML = '';
        
        // Define folder colors (same as in getFolderColorClass)
        const folderColors = [
            '#CD7D88', // 1
            '#BFDCDB', // 2
            '#87ABC5', // 3
            '#C5B5D3', // 4
            '#DE9C73', // 5
            '#5F2312', // 6
            '#DE634D', // 7
            '#E1A102', // 8
            '#3A989E', // 9
            '#B66899'  // 10
        ];
        
        // Helper function to count cards (matching createFolderElement logic)
        const countCardsForFolder = (folder) => {
            let cardCount = 0;
            if (folder.parentFolderId) {
                // Child folder: own cards only
                cardCount = this.cards.filter(card => card.folderId === folder.id).length;
            } else {
                // Parent folder: check if it has child folders
                const childIds = this.getChildFolderIdsForParent(folder.id);
                if (childIds.size > 0) {
                    // Has children: count cards in child folders only, NOT cards directly in parent
                    this.cards.forEach(c => { if (childIds.has(c.folderId)) cardCount++; });
                } else {
                    // No children: count cards directly in this folder
                    cardCount = this.cards.filter(card => card.folderId === folder.id).length;
                }
            }
            return cardCount;
        };
        
        // Get all parent folders (no parentFolderId)
        const parentFolders = [
            { id: 'default', name: 'Default Folder' },
            ...this.folders.filter(f => f.id !== 'default' && !f.parentFolderId && !/.+\s-\sList\s\d+$/i.test(f.name))
        ];
        
        // Add "All Folders" option (with default gray color)
        const allFoldersDiv = document.createElement('div');
        allFoldersDiv.className = 'folder-option-card';
        allFoldersDiv.style.borderLeft = '4px solid #9e9e9e';
        const allCardsCount = this.cards.length;
        allFoldersDiv.innerHTML = `
            <div class="folder-icon">
                <img src="card.png" alt="Card" style="width: 40px; height: 40px;">
            </div>
            <div class="folder-info">
                <div class="folder-name">All Folders</div>
                <div class="folder-description">Practice with cards from all folders (${allCardsCount} card${allCardsCount !== 1 ? 's' : ''})</div>
            </div>
            <button class="btn btn-primary folder-select-btn" ${allCardsCount === 0 ? 'disabled' : ''}>Select</button>
        `;
        allFoldersDiv.querySelector('.folder-select-btn').addEventListener('click', () => {
            if (allCardsCount > 0) {
                this.handleSharedFolderSelection('all', null);
            }
        });
        this.sharedFolderSelectionContainer.appendChild(allFoldersDiv);
        
        // Process parent folders and their children
        parentFolders.forEach(parentFolderData => {
            // Get actual folder object if it exists, or use the data
            const parentFolder = this.folders.find(f => f.id === parentFolderData.id) || parentFolderData;
            
            // Get child folders for this parent
            const childIds = this.getChildFolderIdsForParent(parentFolder.id);
            const childFolders = childIds.size > 0 
                ? this.folders.filter(f => childIds.has(f.id)).sort((a, b) => {
                    // Sort by list number if present
                    const aNum = a.name.match(/List\s+(\d+)/i)?.[1];
                    const bNum = b.name.match(/List\s+(\d+)/i)?.[1];
                    if (aNum && bNum) return parseInt(aNum) - parseInt(bNum);
                    if (aNum) return -1;
                    if (bNum) return 1;
                    return a.name.localeCompare(b.name);
                })
                : [];
            
            // Count cards for parent folder (using same logic as createFolderElement)
            const parentCardCount = countCardsForFolder(parentFolder);
            
            // Get color for parent folder
            const folderIndex = parentFolders.findIndex(f => f.id === parentFolder.id);
            const colorIndex = folderIndex >= 0 ? folderIndex % folderColors.length : 0;
            const parentColor = folderColors[colorIndex];
            
            // Create parent folder card
            const parentDiv = document.createElement('div');
            parentDiv.className = 'folder-option-card';
            if (childFolders.length > 0) {
                parentDiv.classList.add('parent-folder-card');
            }
            parentDiv.style.borderLeft = `4px solid ${parentColor}`;
            
            const parentDescription = childFolders.length > 0 
                ? `${parentCardCount} cards in ${childFolders.length} list${childFolders.length !== 1 ? 's' : ''}`
                : `${parentCardCount} card${parentCardCount !== 1 ? 's' : ''}`;
            
            // Add expand/collapse button if there are children
            const toggleButton = childFolders.length > 0 
                ? `<button class="folder-toggle-btn" title="Toggle lists" style="background: none; border: none; cursor: pointer; padding: 4px 8px; font-size: 1.2rem; color: #5FB3A7; transition: transform 0.3s ease;">
                    <span class="toggle-icon">▼</span>
                </button>`
                : '';
            
            parentDiv.innerHTML = `
                <div class="folder-icon">
                    <img src="card.png" alt="Card" style="width: 40px; height: 40px;">
                </div>
                <div class="folder-info">
                    <div class="folder-name">${parentFolder.name}</div>
                    <div class="folder-description">${parentDescription}</div>
                </div>
                ${toggleButton}
                <button class="btn btn-primary folder-select-btn" ${parentCardCount === 0 ? 'disabled' : ''}>Select</button>
            `;
            
            const parentBtn = parentDiv.querySelector('.folder-select-btn');
            if (parentCardCount > 0) {
                parentBtn.addEventListener('click', () => {
                    this.handleSharedFolderSelection(parentFolder.id, null);
                });
            } else {
                parentBtn.style.opacity = '0.5';
                parentBtn.style.cursor = 'not-allowed';
            }
            
            this.sharedFolderSelectionContainer.appendChild(parentDiv);
            
            // Add child folders if they exist
            if (childFolders.length > 0) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'folder-children-container';
                childrenContainer.style.display = 'block'; // Start expanded
                
                childFolders.forEach(childFolder => {
                    const childCardCount = countCardsForFolder(childFolder);
                    
                    // Use next color in sequence for children (or same parent color with different shade)
                    const childColor = parentColor;
                    
                    const childDiv = document.createElement('div');
                    childDiv.className = 'folder-option-card child-folder-card';
                    childDiv.style.borderLeft = `4px solid ${childColor}`;
                    childDiv.style.opacity = '0.9';
                    
                    childDiv.innerHTML = `
                        <div class="folder-icon" style="margin-left: 20px;">
                            <img src="card.png" alt="Card" style="width: 32px; height: 32px;">
                        </div>
                        <div class="folder-info">
                            <div class="folder-name">${childFolder.name}</div>
                            <div class="folder-description">${childCardCount} card${childCardCount !== 1 ? 's' : ''}</div>
                        </div>
                        <button class="btn btn-primary folder-select-btn" ${childCardCount === 0 ? 'disabled' : ''}>Select</button>
                    `;
                    
                    const childBtn = childDiv.querySelector('.folder-select-btn');
                    if (childCardCount > 0) {
                        childBtn.addEventListener('click', () => {
                            this.handleSharedFolderSelection(parentFolder.id, childFolder.id);
                        });
                    } else {
                        childBtn.style.opacity = '0.5';
                        childBtn.style.cursor = 'not-allowed';
                    }
                    
                    childrenContainer.appendChild(childDiv);
                });
                
                // Add toggle functionality
                const toggleBtn = parentDiv.querySelector('.folder-toggle-btn');
                const toggleIcon = toggleBtn?.querySelector('.toggle-icon');
                
                if (toggleBtn && toggleIcon) {
                    // Store reference to children container on the toggle button for easy access
                    toggleBtn.dataset.childrenId = `children-${parentFolder.id}`;
                    childrenContainer.id = `children-${parentFolder.id}`;
                    
                    toggleBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const isExpanded = !childrenContainer.classList.contains('collapsed');
                        
                        if (isExpanded) {
                            // Collapse
                            childrenContainer.classList.add('collapsed');
                            toggleIcon.textContent = '▶';
                            toggleIcon.style.transform = 'rotate(-90deg)';
                        } else {
                            // Expand
                            childrenContainer.classList.remove('collapsed');
                            toggleIcon.textContent = '▼';
                            toggleIcon.style.transform = 'rotate(0deg)';
                        }
                    });
                }
                
                this.sharedFolderSelectionContainer.appendChild(childrenContainer);
            }
        });
    }

    // Handle folder/list selection from shared modal
    handleSharedFolderSelection(folderId, listId) {
        const mode = this.sharedFolderSelectMode;
        
        if (mode === 'typing') {
            // For typing mode, store selection and go to side selection
            this.typingSelectedFolderId = listId || folderId;
            this.closeSharedFolderSelection();
            this.openTypingSideSelection();
        } else if (mode === 'flip') {
            // For flip mode, store selection and go to side selection
            this.selectedFolderId = listId || folderId;
            this.closeSharedFolderSelection();
            this.openFlipSideSelection();
        } else if (mode === 'multipleChoice') {
            // For multiple choice, store selection and start directly
            this.mcSelectedFolderId = listId || folderId;
            this.closeSharedFolderSelection();
            this.startMultipleChoiceMode();
        }
    }

    // Shared function to build test deck from folder/list selection
    buildTestDeckFromSelection(folderId, listId = null) {
        // CRITICAL: Ensure cards is always an array
        this.ensureCardsIsArray();
        
        console.log('[buildTestDeckFromSelection] Called with folderId:', folderId, 'listId:', listId);
        console.log('[buildTestDeckFromSelection] Total cards available:', this.cards.length);
        
        if (folderId === 'all') {
            console.log('[buildTestDeckFromSelection] Returning all cards:', this.cards.length);
            return this.cards;
        }
        
        if (listId) {
            // Specific list selected - return only cards in that list
            console.log('[buildTestDeckFromSelection] Filtering for specific list:', listId);
            const filtered = this.cards.filter(card => {
                const cardFolderId = card.folderId || 'default';
                // Handle type mismatches by comparing as strings
                const matches = cardFolderId === listId || String(cardFolderId) === String(listId);
                return matches;
            });
            console.log('[buildTestDeckFromSelection] Cards in list:', filtered.length);
            console.log('[buildTestDeckFromSelection] Sample card folderIds:', filtered.slice(0, 5).map(c => c.folderId));
            return filtered;
        } else {
            // Folder selected (not a specific list) - return all cards in folder and its children
            console.log('[buildTestDeckFromSelection] Filtering for folder:', folderId);
            const childIds = this.getChildFolderIdsForParent(folderId);
            console.log('[buildTestDeckFromSelection] Child folder IDs:', Array.from(childIds));
            
            // Create sets for both strict and string comparison to handle type mismatches
            const relevantIds = new Set([folderId, ...Array.from(childIds)]);
            const relevantIdStrings = new Set([String(folderId), ...Array.from(childIds).map(id => String(id))]);
            
            console.log('[buildTestDeckFromSelection] Relevant IDs (strict):', Array.from(relevantIds));
            console.log('[buildTestDeckFromSelection] Relevant IDs (strings):', Array.from(relevantIdStrings));
            
            const filtered = this.cards.filter(card => {
                const cardFolderId = card.folderId || 'default';
                // Check both strict equality and string comparison to handle type mismatches
                const matches = relevantIds.has(cardFolderId) || relevantIdStrings.has(String(cardFolderId));
                return matches;
            });
            
            console.log('[buildTestDeckFromSelection] Cards in folder (including children):', filtered.length);
            console.log('[buildTestDeckFromSelection] Sample card folderIds:', filtered.slice(0, 10).map(c => ({ id: c.id, folderId: c.folderId, isSystemCard: c.isSystemCard })));
            return filtered;
        }
    }

    renderTypingFolderSelection() {
        // Redirect to shared function
        this.renderSharedFolderSelection();
        // Also update the old container for backward compatibility
        if (this.typingFolderSelectionContainer) {
            this.typingFolderSelectionContainer.innerHTML = this.sharedFolderSelectionContainer.innerHTML;
        }
    }

    updateFolderSelectors() {
        // Update add card folder selector (only parent folders)
        this.addCardFolder.innerHTML = '';
        this.folders.filter(folder => !folder.parentFolderId).forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            this.addCardFolder.appendChild(option);
        });
        
        // Update the list dropdown for current folder selection
        this.updateAddCardListSelector();
        
        // Update edit card folder selector
        this.editCardFolder.innerHTML = '';
        this.folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            this.editCardFolder.appendChild(option);
        });
    }

    updateAddCardListSelector() {
        if (!this.addCardList || !this.addCardListGroup || !this.addCardFolder) {
            return;
        }

        const selectedFolderId = this.addCardFolder.value;
        const selectedFolder = this.folders.find(f => f.id === selectedFolderId);
        
        // Clear existing options
        this.addCardList.innerHTML = '<option value="">No List (Save to Folder)</option>';
        
        if (!selectedFolder || selectedFolder.parentFolderId) {
            // Not a parent folder or no folder selected - hide list selector
            this.addCardListGroup.style.display = 'none';
            return;
        }
        
        // Show list selector and button for parent folders
        this.addCardListGroup.style.display = 'block';
        
        // Get child folders/lists for this parent folder
        const childFolders = this.folders.filter(f => f.parentFolderId === selectedFolderId);
        
        // Populate with existing lists
        childFolders.forEach(childFolder => {
            const option = document.createElement('option');
            option.value = childFolder.id;
            option.textContent = childFolder.name;
            this.addCardList.appendChild(option);
        });
    }

    createListForAddCard() {
        // Store that we're creating from add card modal
        this.listCreationContext = 'addCard';
        
        // Open the create list modal
        this.openCreateListModal();
    }

    createFolderForAddCard() {
        // Open the create folder modal
        this.openCreateFolderModal();
    }

    openCreateListModal() {
        // Populate parent folder dropdown with all parent folders
        this.listParentFolder.innerHTML = '<option value="">Select a parent folder</option>';
        const parentFolders = this.folders.filter(f => !f.parentFolderId);
        parentFolders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            this.listParentFolder.appendChild(option);
        });
        
        // Pre-select the currently selected folder in Add Card modal if it's a parent folder
        const currentFolderId = this.addCardFolder ? this.addCardFolder.value : null;
        const currentFolder = this.folders.find(f => f.id === currentFolderId);
        if (currentFolder && !currentFolder.parentFolderId) {
            this.listParentFolder.value = currentFolderId;
        }
        
        // Clear the list name input
        this.listName.value = '';
        
        // Show the modal
        this.createListModal.classList.add('active');
        this.listName.focus();
    }

    closeCreateListModal() {
        this.createListModal.classList.remove('active');
        this.createListForm.reset();
        // Reset context
        this.listCreationContext = null;
    }

    async handleCreateList(e) {
        e.preventDefault();
        
        const selectedFolderId = this._toStr(this.listParentFolder.value);
        const trimmedName = this.listName.value.trim();
        
        if (!selectedFolderId) {
            this.showNotification('Please select a parent folder.', 'error');
            return;
        }
        
        if (!trimmedName) {
            this.showNotification('List name cannot be empty.', 'error');
            return;
        }
        
        const parentFolder = this.folders.find(f => this._toStr(f.id) === selectedFolderId);
        if (!parentFolder || parentFolder.parentFolderId) {
            this.showNotification('Please select a valid parent folder.', 'error');
            return;
        }
        
        // Check if list with this name already exists under this parent
        const existingList = this.folders.find(f => 
            f.name === trimmedName && this._toStr(f.parentFolderId) === selectedFolderId
        );
        
        if (existingList) {
            this.showNotification('A list with this name already exists in this folder.', 'error');
            return;
        }
        
        // Ensure the import modal's folder dropdown is set to the parent folder
        if (this.listCreationContext === 'import' && this.importTargetFolder) {
            this.importTargetFolder.value = selectedFolderId;
        }
        
        // Create the new list (child folder)
        await this.createFolder(trimmedName, 'Child list', selectedFolderId);
        
        // Close the modal
        this.closeCreateListModal();
        
        // Reload folders to ensure we have the newly created list
        this.folders = this.loadFolders();
        
        // Get the newly created list - use normalized string comparison
        let newList = this.folders.find(f => 
            f.name === trimmedName && this._toStr(f.parentFolderId) === selectedFolderId
        );
        if (!newList) {
            // Try finding by name and parentFolderId separately
            newList = this.folders.find(f => 
                f.name === trimmedName && f.parentFolderId
            );
        }
        
        console.log('[handleCreateList] Newly created list:', newList);
        console.log('[handleCreateList] All folders after creation:', this.folders.map(f => ({ id: f.id, name: f.name, parentFolderId: f.parentFolderId })));
        
        // Update the appropriate selector based on context
        if (this.listCreationContext === 'import') {
            // Call onListCreated to refresh and select the new list
            // This will ensure folder is set, refresh dropdown, and select the new list
            if (newList) {
                this.onListCreated(newList);
            }
            
            // Reset context
            this.listCreationContext = null;
        } else {
            // Update Add Card modal list selector
            if (this.addCardFolder && this.addCardFolder.value === selectedFolderId) {
                this.updateAddCardListSelector();
                
                // Select the newly created list
                if (newList && this.addCardList) {
                    this.addCardList.value = newList.id;
                }
            }
        }
        
        this.showNotification(`List "${trimmedName}" created successfully!`, 'success');
    }

    // Helper: Prevent double-binding event listeners
    bindOnce(el, ev, fn) {
        if (!el || el.__vbBound) return;
        el.addEventListener(ev, fn);
        el.__vbBound = true;
    }

    // Helper: Normalize IDs to strings for comparison
    _toStr(x) {
        return x == null ? '' : String(x);
    }

    // Helper: Format list name with index
    formatListName(parentFolderName, index) {
        return `${parentFolderName} - List ${String(index).padStart(2, '0')}`;
    }

    // Helper: Get folder by ID
    getFolderById(folderId) {
        this.folders = this.loadFolders();
        const folderIdStr = this._toStr(folderId);
        return this.folders.find(f => this._toStr(f.id) === folderIdStr);
    }

    // Helper: Get lists for a folder (child folders)
    getListsByFolderId(folderId) {
        this.folders = this.loadFolders();
        const folderIdStr = this._toStr(folderId);
        return this.folders.filter(f => 
            f.parentFolderId && this._toStr(f.parentFolderId) === folderIdStr
        );
    }

    // Helper: Get or create "List 01" for a folder
    async getOrCreateList1(folder) {
        if (!folder || !folder.id) return null;
        
        this.folders = this.loadFolders();
        const lists = this.getListsByFolderId(folder.id);
        
        // Look for "List 01" or "List 1" pattern
        const list1Pattern = /List\s+0?1$/i;
        let found = lists.find(l => list1Pattern.test(l.name));
        
        if (found) {
            console.log('[getOrCreateList1] Found existing List 01:', found.name);
            return found;
        }
        
        // Create "List 01"
        const listName = this.formatListName(folder.name, 1);
        console.log('[getOrCreateList1] Creating new List 01:', listName);
        
        await this.createFolder(listName, 'Child list', folder.id);
        this.folders = this.loadFolders();
        
        const newList = this.folders.find(f => 
            f.name === listName && f.parentFolderId && 
            (f.parentFolderId === folder.id || String(f.parentFolderId) === String(folder.id))
        );
        
        if (!newList) {
            console.error('[getOrCreateList1] Failed to create List 01');
            return null;
        }
        
        console.log('[getOrCreateList1] Created List 01:', newList);
        return newList;
    }

    // Refresh the List selector in import modal
    refreshImportListSection() {
        const folderSel = this.importTargetFolder || document.getElementById('importFolderSelect');
        const listSel = this.importTargetList || document.getElementById('importListSelect');
        const listGroup = this.importListGroup || document.getElementById('importListGroup');
        const createListBtn = this.createListForImportBtn || document.getElementById('createListForImportBtn');
        
        if (!folderSel || !listSel) {
            console.warn('[refreshImportListSection] Elements not found');
            return;
        }
        
        const folderId = this._toStr(folderSel.value);
        listSel.innerHTML = ''; // Clear
        
        if (!folderId || folderId === '') {
            const opt = document.createElement('option');
            opt.value = 'none';
            opt.textContent = 'No List (Save to Folder)';
            listSel.appendChild(opt);
            if (listGroup) listGroup.style.display = 'none';
            if (createListBtn) createListBtn.disabled = true;
            return;
        }
        
        // Show list group for parent folders
        if (listGroup) listGroup.style.display = 'block';
        if (createListBtn) createListBtn.disabled = false;
        
        const folder = this.getFolderById(folderId);
        
        if (!folder || folder.parentFolderId) {
            // Not a parent folder, hide list selector
            if (listGroup) listGroup.style.display = 'none';
            return;
        }
        
        const lists = this.getListsByFolderId(folderId);
        
        // Sort lists by extracting index from name (for "List 01", "List 02", etc.) or by name
        const sortedLists = [...lists].sort((a, b) => {
            const aMatch = a.name.match(/List\s+(\d+)/i);
            const bMatch = b.name.match(/List\s+(\d+)/i);
            if (aMatch && bMatch) {
                return parseInt(aMatch[1]) - parseInt(bMatch[1]);
            }
            return a.name.localeCompare(b.name);
        });
        
        if (!sortedLists.length) {
            // No lists exist yet
            const opt = document.createElement('option');
            opt.value = 'none';
            opt.textContent = 'No List (Save to Folder)';
            listSel.appendChild(opt);
            listSel.value = 'none';
        } else {
            for (const list of sortedLists) {
                const opt = document.createElement('option');
                opt.value = this._toStr(list.id); // Force string id
                // Use list.name directly (lists can have custom names like "11.6")
                opt.textContent = list.name;
                listSel.appendChild(opt);
            }
            
            // If app tracks an active list, keep it in sync
            if (typeof this.getActiveListId === 'function') {
                const active = this._toStr(this.getActiveListId());
                if (active && Array.from(listSel.options).some(opt => this._toStr(opt.value) === active)) {
                    listSel.value = active;
                } else if (sortedLists.length > 0) {
                    listSel.value = this._toStr(sortedLists[0].id);
                }
            } else {
                // Try to preserve current selection if it exists, otherwise select first
                const currentValue = this._toStr(listSel.value);
                if (currentValue && Array.from(listSel.options).some(opt => this._toStr(opt.value) === currentValue)) {
                    listSel.value = currentValue;
                } else if (sortedLists.length > 0) {
                    listSel.value = this._toStr(sortedLists[0].id);
                }
            }
        }
        
        console.log('[refreshImportListSection] Refreshed for folder:', folderId, 'lists:', sortedLists.length);
    }

    // Called after a list is successfully created
    onListCreated(newList) {
        // newList is expected to be { id, name, parentFolderId }
        if (!newList || !newList.id) {
            console.warn('[onListCreated] Invalid list object:', newList);
            return;
        }

        const folderSel = this.importTargetFolder || document.getElementById('importFolderSelect');
        const listSel = this.importTargetList || document.getElementById('importListSelect');

        // Ensure the modal is pointing at the correct parent folder
        if (folderSel && this._toStr(folderSel.value) !== this._toStr(newList.parentFolderId)) {
            folderSel.value = this._toStr(newList.parentFolderId);
        }

        // Rebuild the dropdown for that folder and select the new list
        this.refreshImportListSection();
        
        if (listSel) {
            listSel.value = this._toStr(newList.id);
            // Fire change event so any dependent UI updates
            listSel.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('[onListCreated] Selected new list in dropdown:', newList.name, 'ID:', newList.id);
        }

        // Keep global UI in sync so the main page focuses it after import
        if (typeof this.setActiveFolderId === 'function') {
            this.setActiveFolderId(newList.parentFolderId);
        }
        if (typeof this.setActiveListId === 'function') {
            this.setActiveListId(newList.id);
        }
        if (typeof this.updateListDropdownForHeader === 'function') {
            this.updateListDropdownForHeader();
        }
    }

    getChildFolderIdsForParent(parentFolderId) {
        // Reload folders to ensure we have latest data
        this.folders = this.loadFolders();
        
        // Try to find folder with strict equality first, then try string comparison
        let parentFolder = this.folders.find(f => f.id === parentFolderId);
        if (!parentFolder) {
            // Try string comparison in case of type mismatch
            parentFolder = this.folders.find(f => String(f.id) === String(parentFolderId));
        }
        
        if (!parentFolder || parentFolder.parentFolderId) {
            // Not a parent folder or folder doesn't exist
            console.log('[getChildFolderIdsForParent] Invalid parent folder:', parentFolderId, parentFolder);
            console.log('[getChildFolderIdsForParent] All folders:', this.folders.map(f => ({ id: f.id, name: f.name, parentFolderId: f.parentFolderId })));
            console.log('[getChildFolderIdsForParent] Available folder IDs:', this.folders.map(f => f.id));
            return new Set();
        }
        
        // ONLY include folders that directly belong to this parent
        const legacyPattern = new RegExp(`^${this.escapeRegExp(parentFolder.name)}\\s+-\\s+List\\s+\\d+$`, 'i');
        const allChildFolders = this.folders.filter(f => {
            // New style: has parentFolderId pointing to parent folder
            if (f.parentFolderId === parentFolderId) {
                console.log('[getChildFolderIdsForParent] Found child folder (new style):', f.id, f.name);
                return true;
            }
            // Legacy style: must EXACTLY match the pattern "ParentName - List XX"
            if (legacyPattern.test(f.name)) {
                console.log('[getChildFolderIdsForParent] Found child folder (legacy style):', f.id, f.name);
                return true;
            }
            return false;
        });
        
        console.log('[getChildFolderIdsForParent] All child folders for parent', parentFolderId, ':', allChildFolders.map(f => ({ id: f.id, name: f.name, parentFolderId: f.parentFolderId })));
        
        if (allChildFolders.length === 0) {
            console.log('[getChildFolderIdsForParent] No child folders found for parent:', parentFolderId);
            return new Set();
        }
        
        // For new-style folders (with parentFolderId), no deduplication needed - just return all
        // For legacy folders, we still need deduplication, but new-style folders take priority
        const newStyleFolders = allChildFolders.filter(f => {
            const matches = f.parentFolderId === parentFolderId || 
                          (f.parentFolderId && String(f.parentFolderId) === String(parentFolderId));
            return matches;
        });
        const legacyFolders = allChildFolders.filter(f => !f.parentFolderId);
        
        // If we have new-style folders, use only those (they're the correct ones)
        if (newStyleFolders.length > 0) {
            const childIds = new Set(newStyleFolders.map(f => f.id));
            console.log('[getChildFolderIdsForParent] Returning new-style child folder IDs:', Array.from(childIds));
            return childIds;
        }
        
        // Otherwise, deduplicate legacy folders by list number
        const foldersByListNum = new Map();
        legacyFolders.forEach(f => {
            const listNum = f.name.match(/List\s+(\d+)/i)?.[1];
            if (!listNum) {
                // Include folders that don't match pattern (legacy custom names)
                foldersByListNum.set(f.id, f);
                return;
            }
            const existing = foldersByListNum.get(listNum);
            if (!existing) {
                    foldersByListNum.set(listNum, f);
            }
        });
        
        // Return unique folder IDs (deduplicated) - ONLY child folders, not parent
        const childIds = new Set(Array.from(foldersByListNum.values()).map(f => f.id));
        console.log('[getChildFolderIdsForParent] Returning legacy child folder IDs:', Array.from(childIds));
        return childIds;
    }

    // One-time migration: Move folder-level cards to "List 01"
    async migrateFolderLevelCardsToList1() {
        // Check if migration has already been run
        const migrationKey = 'vocabox_folder_cards_migrated';
        if (localStorage.getItem(migrationKey) === 'true') {
            console.log('[migrateFolderLevelCardsToList1] Migration already completed');
            return;
        }

        console.log('[migrateFolderLevelCardsToList1] Starting migration...');
        this.folders = this.loadFolders();
        
        // CRITICAL: Ensure cards is loaded and is an array
        this.ensureCardsIsArray();
        if (!Array.isArray(this.cards) || this.cards.length === 0) {
            // If cards is not loaded yet, load it
            const loadedCards = await this.loadCards();
            this.cards = Array.isArray(loadedCards) ? loadedCards : [];
        }
        this.ensureCardsIsArray(); // Double-check after loading

        let migratedCount = 0;

        // Get all parent folders
        const parentFolders = this.folders.filter(f => !f.parentFolderId);

        for (const folder of parentFolders) {
            // Find cards directly in this folder (not in any child list)
            this.ensureCardsIsArray(); // Ensure before each filter
            const folderCards = this.cards.filter(card => {
                const cardFolderId = card.folderId;
                return (cardFolderId === folder.id || String(cardFolderId) === String(folder.id));
            });

            // Check if any of these cards are already in a child list
            const lists = this.getListsByFolderId(folder.id);
            const listIds = new Set(lists.map(l => l.id));
            
            const orphanCards = folderCards.filter(card => {
                // Card is in parent folder and not in any child list
                return !listIds.has(card.folderId);
            });

            if (orphanCards.length === 0) continue;

            // Get or create List 01 for this folder
            const list1 = await this.getOrCreateList1(folder);
            if (!list1) {
                console.warn('[migrateFolderLevelCardsToList1] Failed to create List 01 for folder:', folder.name);
                continue;
            }

            // Move cards to List 01
            for (const card of orphanCards) {
                card.folderId = list1.id;
                migratedCount++;
            }

            console.log(`[migrateFolderLevelCardsToList1] Migrated ${orphanCards.length} cards from "${folder.name}" to "${list1.name}"`);
        }

        if (migratedCount > 0) {
            this.saveCards();
            this.saveFolders(this.folders);
            this.renderFolders();
            console.log(`[migrateFolderLevelCardsToList1] Migration complete: ${migratedCount} cards migrated`);
        }

        // Mark migration as complete
        localStorage.setItem(migrationKey, 'true');
    }

    getCardsForCurrentFolder() {
        // CRITICAL: Ensure cards is always an array (don't reload, just ensure it's valid)
        this.ensureCardsIsArray();
        
        console.log('[getCardsForCurrentFolder] currentFolder:', this.currentFolder);
        console.log('[getCardsForCurrentFolder] total cards:', this.cards.length);
        
        // If 'all', return all cards
        if (this.currentFolder === 'all') {
            console.log('[getCardsForCurrentFolder] Returning all cards, count:', this.cards.length);
            console.log('[getCardsForCurrentFolder] All card folderIds:', this.cards.map(c => c.folderId));
            const filtered = this.cards.filter(card => {
                // Only include cards that have a valid folderId
                return card.folderId !== undefined && card.folderId !== null;
            });
            console.log('[getCardsForCurrentFolder] Filtered cards count:', filtered.length);
            return filtered;
        }
        
        // Try to find folder with strict equality first, then try string comparison
        let selectedFolder = this.folders.find(f => f.id === this.currentFolder);
        if (!selectedFolder) {
            // Try string comparison in case of type mismatch
            selectedFolder = this.folders.find(f => String(f.id) === String(this.currentFolder));
        }
        
        console.log('[getCardsForCurrentFolder] selectedFolder:', selectedFolder);
        console.log('[getCardsForCurrentFolder] All folders:', this.folders.map(f => ({ id: f.id, name: f.name, parentFolderId: f.parentFolderId })));
        
        if (!selectedFolder) {
            console.warn('[getCardsForCurrentFolder] No folder found with ID:', this.currentFolder);
            console.warn('[getCardsForCurrentFolder] Available folder IDs:', this.folders.map(f => f.id));
            // Fallback to 'all' if folder doesn't exist
            console.log('[getCardsForCurrentFolder] Falling back to "all" folders');
            this.currentFolder = 'all';
            const filtered = this.cards.filter(card => {
                return card.folderId !== undefined && card.folderId !== null;
            });
            return filtered;
        }
        
        // If parent folder selected, show cards from parent folder AND all child folders
        if (!selectedFolder.parentFolderId) {
            const childFolderIds = this.getChildFolderIdsForParent(this.currentFolder);
            console.log('[getCardsForCurrentFolder] Parent folder - childFolderIds:', Array.from(childFolderIds));
            
            // Create a set that includes both the parent folder ID and all child folder IDs
            const relevantFolderIds = new Set(Array.from(childFolderIds));
            relevantFolderIds.add(this.currentFolder); // Add the parent folder itself
            
            console.log('[getCardsForCurrentFolder] Filtering cards - looking for folderIds (parent + children):', Array.from(relevantFolderIds));
            console.log('[getCardsForCurrentFolder] All card folderIds:', this.cards.map(c => c.folderId));
            // Convert to strings for comparison to handle type mismatches
            const relevantIdStrings = new Set(Array.from(relevantFolderIds).map(id => String(id)));
            const filtered = this.cards.filter(card => {
                const cardFolderIdStr = String(card.folderId);
                const matches = relevantFolderIds.has(card.folderId) || relevantIdStrings.has(cardFolderIdStr);
                if (matches) {
                    console.log('[getCardsForCurrentFolder] Card matches:', card.id, 'folderId:', card.folderId);
                }
                return matches;
            });
            console.log('[getCardsForCurrentFolder] Filtered cards for parent (including direct cards):', filtered.length, 'cards');
            return filtered;
        }
        
        // If child folder selected, show only its cards
        const filtered = this.cards.filter(card => card.folderId === this.currentFolder);
        console.log('[getCardsForCurrentFolder] Child folder - filtered cards:', filtered.length);
        console.log('[getCardsForCurrentFolder] Sample card folderIds:', this.cards.slice(0, 3).map(c => c.folderId));
        return filtered;
    }

    // Folder Modal Methods
    openCreateFolderModal() {
        this.createFolderModal.classList.add('active');
        this.folderName.focus();
    }

    closeCreateFolderModal() {
        this.createFolderModal.classList.remove('active');
        this.createFolderForm.reset();
    }

    handleCreateFolder(e) {
        e.preventDefault();
        const name = this.folderName.value.trim();
        const description = this.folderDescription.value.trim();
        
        if (!name) {
            alert('Please enter a folder name');
            return;
        }
        
        // Check if folder name already exists
        if (this.folders.some(folder => folder.name.toLowerCase() === name.toLowerCase())) {
            alert('A folder with this name already exists');
            return;
        }
        
        this.createFolder(name, description);
        this.closeCreateFolderModal();
        
        // If Add Card modal is open, select the newly created folder
        if (this.addCardModal.classList.contains('active')) {
            const newFolder = this.folders.find(f => f.name === name && !f.parentFolderId);
            if (newFolder && this.addCardFolder) {
                this.addCardFolder.value = newFolder.id;
                // Update the list selector for the newly selected folder
                this.updateAddCardListSelector();
            }
        }
        
        // If Import modal is open, select the newly created folder and refresh list section
        if (this.importWordListModal.classList.contains('active')) {
            const newFolder = this.folders.find(f => f.name === name && !f.parentFolderId);
            if (newFolder && this.importTargetFolder) {
                // Update the import folder selector
                this.updateImportFolderSelector();
                // Select the newly created folder
                this.importTargetFolder.value = newFolder.id;
                // Immediately refresh the list section to show the List button
                this.refreshImportListSection();
            }
        }
        
        this.showNotification(`Folder "${name}" created successfully! 📁`, 'success');
    }

    // Clean up orphaned legacy folders that match the pattern "ParentName - List XX"
    // These are old-style folders that should be replaced by new-style "List XX" folders
    cleanupOrphanedLegacyFolders() {
        const legacyPattern = /^.+?\s-\sList\s+\d+$/i;
        // Find ALL legacy folders matching the pattern (regardless of parentFolderId)
        const legacyFolders = this.folders.filter(f => legacyPattern.test(f.name));
        
        if (legacyFolders.length === 0) return;
        
        // For each parent folder, check if there's a corresponding new-style folder
        // If so, remove the legacy folder (even if it has cards, as cards should be in new folder)
        const foldersToRemove = new Set();
        
        legacyFolders.forEach(legacyFolder => {
            // Extract the list number from legacy folder name (e.g., "IELTS 8000 - List 01" -> "01")
            const listNum = legacyFolder.name.match(/List\s+(\d+)/i)?.[1];
            if (!listNum) return;
            
            // Find the parent folder (could be from parentFolderId or by name prefix)
            let parentFolder = null;
            if (legacyFolder.parentFolderId) {
                parentFolder = this.folders.find(f => f.id === legacyFolder.parentFolderId);
            }
            if (!parentFolder) {
                // Try to extract parent name from legacy folder name
                const parentNameMatch = legacyFolder.name.match(/^(.+?)\s-\sList\s+\d+$/i);
                if (parentNameMatch) {
                    const parentName = parentNameMatch[1];
                    parentFolder = this.folders.find(f => !f.parentFolderId && f.name === parentName);
                }
            }
            
            if (parentFolder) {
                // Check if there's a new-style folder with the same list number under this parent
                const newStyleFolder = this.folders.find(f => 
                    f.parentFolderId === parentFolder.id && 
                    f.name === `List ${String(parseInt(listNum)).padStart(2, '0')}`
                );
                
                // If new-style folder exists, remove legacy folder (new one has the cards)
                if (newStyleFolder) {
                    foldersToRemove.add(legacyFolder.id);
                } else {
                    // If no new-style folder exists, check if legacy folder has cards
                    // If it has no cards, it's safe to remove
                    const hasCards = this.cards.some(c => c.folderId === legacyFolder.id);
                    if (!hasCards) {
                        foldersToRemove.add(legacyFolder.id);
                    }
                }
            } else {
                // Orphaned legacy folder - remove if it has no cards
                const hasCards = this.cards.some(c => c.folderId === legacyFolder.id);
                if (!hasCards) {
                    foldersToRemove.add(legacyFolder.id);
                }
            }
        });
        
        if (foldersToRemove.size > 0) {
            // Remove cards in those folders
            this.cards = this.cards.filter(c => !foldersToRemove.has(c.folderId));
            // Remove the folders
            this.folders = this.folders.filter(f => !foldersToRemove.has(f.id));
            this.saveCards();
            this.saveFolders(this.folders);
            this.renderFolders();
            console.log(`Cleaned up ${foldersToRemove.size} legacy folders.`);
        }
    }

    cleanupOrphanedCards() {
        // Get all valid folder IDs
        const validFolderIds = new Set(this.folders.map(f => f.id));
        
        // Get all parent folder IDs (folders without parentFolderId)
        const parentFolderIds = new Set(
            this.folders
                .filter(f => !f.parentFolderId)
                .map(f => f.id)
        );
        
        // Count all cards before cleanup
        const totalBefore = this.cards.length;
        
        // Find cards with invalid folderIds
        // Also check for cards that might have empty string, null, undefined, or invalid folderIds
        // AND cards that are directly in parent folders (which shouldn't exist)
        const orphanedCards = this.cards.filter(card => {
            // Card must have a folderId and it must match an existing folder
            if (!card.folderId || card.folderId === '' || card.folderId === null || card.folderId === undefined) {
                return true;
            }
            // Check if folderId is a string or number that doesn't match any existing folder
            const folderIdStr = String(card.folderId).trim();
            if (folderIdStr === '' || !validFolderIds.has(folderIdStr)) {
                return true;
            }
            // Check if card is directly in a parent folder (should only be in child folders)
            // For IELTS 8000 type collections, cards should be in child folders, not parent
            if (parentFolderIds.has(folderIdStr)) {
                // Check if this parent folder has child folders
                const parentFolder = this.folders.find(f => f.id === folderIdStr);
                if (parentFolder) {
                    const hasChildren = this.folders.some(f => f.parentFolderId === folderIdStr);
                    if (hasChildren) {
                        // This parent has children, so cards shouldn't be directly in parent
                        return true;
                    }
                }
            }
            return false;
        });
        
        if (orphanedCards.length > 0) {
            // Log details about orphaned cards for debugging
            console.log(`Found ${orphanedCards.length} orphaned cards:`, orphanedCards.map(c => ({
                id: c.id,
                folderId: c.folderId,
                front: c.front?.substring(0, 50)
            })));
            
            // Remove orphaned cards
            const orphanedIds = new Set(orphanedCards.map(c => c.id));
            this.cards = this.cards.filter(c => !orphanedIds.has(c.id));
            
            // Save cleaned cards
            this.saveCards();
            
            const totalAfter = this.cards.length;
            console.log(`Cleaned up ${orphanedCards.length} orphaned cards. Total cards: ${totalBefore} → ${totalAfter}`);
        } else {
            console.log(`No orphaned cards found. Total cards: ${totalBefore}`);
        }
    }

    analyzeAndCleanupOrphanedCards() {
        // Get all valid folder IDs
        const validFolderIds = new Set(this.folders.map(f => f.id));
        
        // Get all folder IDs that should have cards (including child folders)
        const allValidCardFolderIds = new Set();
        this.folders.forEach(folder => {
            allValidCardFolderIds.add(folder.id);
            // If it's a parent folder with children, only child folders should have cards
            // If it's a child folder, it can have cards
            // If it's a parent without children (like Default), it can have cards
        });
        
        // Analyze ALL cards and find orphans
        const orphanedCards = this.cards.filter(card => {
            if (!card.folderId || card.folderId === '' || card.folderId === null || card.folderId === undefined) {
                return true;
            }
            const folderIdStr = String(card.folderId).trim();
            
            // Check if folder exists
            if (!validFolderIds.has(folderIdStr)) {
                return true;
            }
            
            // Check if it's a parent folder with children
            const folder = this.folders.find(f => f.id === folderIdStr);
            if (folder && !folder.parentFolderId) {
                // This is a parent folder - check if it has children
                const hasChildren = this.folders.some(f => f.parentFolderId === folderIdStr);
                if (hasChildren) {
                    // Parent with children - cards shouldn't be here directly
                    return true;
                }
            }
            
            return false;
        });
        
        if (orphanedCards.length > 0) {
            console.log(`[ANALYZE] Found ${orphanedCards.length} orphaned cards to remove:`, 
                orphanedCards.map(c => ({
                    id: c.id,
                    folderId: c.folderId,
                    front: (c.front || '').substring(0, 60),
                    folderExists: validFolderIds.has(String(c.folderId || '').trim())
                }))
            );
            
            // Remove them
            const orphanedIds = new Set(orphanedCards.map(c => c.id));
            const beforeCount = this.cards.length;
            this.cards = this.cards.filter(c => !orphanedIds.has(c.id));
            const afterCount = this.cards.length;
            
            this.saveCards();
            
            console.log(`[ANALYZE] Removed ${orphanedCards.length} orphaned cards. Count: ${beforeCount} → ${afterCount}`);
        } else {
            // Even if no orphans found, let's see the distribution
            const cardDistribution = {};
            this.cards.forEach(card => {
                const fid = String(card.folderId || 'null').trim();
                cardDistribution[fid] = (cardDistribution[fid] || 0) + 1;
            });
            console.log(`[ANALYZE] Card distribution by folderId:`, cardDistribution);
            console.log(`[ANALYZE] Valid folder IDs:`, Array.from(validFolderIds));
        }
    }

    // Delete specific known orphaned cards
    deleteSpecificOrphanedCards() {
        const orphanedCardTexts = [
            "How has China moved so fast? In autonomous driving, as in so many spheres (n. domains) of technology, hyper-competition and strong supply chains enable the \"China speed' foreign firms covet (v. to want sth very much, especially sth that belongs to sb else).",
            "That leads to another lesson: it would be futile to try to stamp out (eliminate / eradicate / get rid of completely ) gig work in the hope that (with the expectation or desire that something will happen) permanent jobs will take its place.",
            "In many parts of Asia, including China, day labourers still huddle (to gather closely together, usually because of cold or fear) on the roadside early in the morning, waiting for employers to pick them from the throng (a crowd of people).",
            "China could make mandatory (a. =compulsory F; required by law ) contributions from employers less onerous (a. F; burdensome, heavy, difficult, or causing a lot of trouble or responsibility), cutting their incentive to choose gig workers over permanent ones."
        ];
        
        return this.deleteCardsByContent(orphanedCardTexts);
    }

    // Delete a single specific card by exact front text
    deleteSingleCardByContent(exactFrontText) {
        if (!exactFrontText || typeof exactFrontText !== 'string') {
            console.log('[DELETE_SINGLE] No card text provided');
            return 0;
        }
        
        const normalizedSearch = this.normalizeTextForMatching(exactFrontText);
        let bestMatch = null;
        let bestSimilarity = 0;
        
        // Find the card with highest similarity (should be very close to 1.0 for exact match)
        this.cards.forEach(card => {
            const cardFront = this.normalizeTextForMatching(card.front || '');
            const similarity = this.calculateTextSimilarity(normalizedSearch, cardFront);
            
            if (similarity > bestSimilarity && similarity >= 0.95) {
                bestSimilarity = similarity;
                bestMatch = card;
            }
        });
        
        if (bestMatch) {
            console.log(`[DELETE_SINGLE] Found card with similarity ${bestSimilarity.toFixed(3)}:`, {
                id: bestMatch.id,
                folderId: bestMatch.folderId,
                front: bestMatch.front?.substring(0, 100)
            });
            
            // Delete the card
            this.cards = this.cards.filter(card => card.id !== bestMatch.id);
            this.saveCards();
            
            // Refresh UI
            if (this.renderCards) {
                this.renderCards();
                this.updateCardCount();
            }
            
            console.log(`[DELETE_SINGLE] Card deleted successfully. Remaining cards: ${this.cards.length}`);
            return 1;
        } else {
            console.log(`[DELETE_SINGLE] No card found matching the exact text (need similarity >= 0.95)`);
            return 0;
        }
    }

    // Function to delete cards by their front text content
    deleteCardsByContent(frontTexts) {
        if (!Array.isArray(frontTexts) || frontTexts.length === 0) {
            console.log('[DELETE] No card texts provided');
            return;
        }
        
        const deletedCards = [];
        const cardsToDelete = new Set();
        
        // Find all matching cards using strict matching (nearly exact match)
        frontTexts.forEach(searchText => {
            const normalizedSearch = this.normalizeTextForMatching(searchText);
            
            const matches = this.cards.filter(card => {
                const cardFront = this.normalizeTextForMatching(card.front || '');
                
                // Use strict similarity matching - require at least 90% similarity
                const similarity = this.calculateTextSimilarity(normalizedSearch, cardFront);
                return similarity >= 0.90;
            });
            
            matches.forEach(card => {
                cardsToDelete.add(card.id);
                deletedCards.push({
                    id: card.id,
                    folderId: card.folderId,
                    front: card.front?.substring(0, 80),
                    similarity: this.calculateTextSimilarity(
                        this.normalizeTextForMatching(searchText),
                        this.normalizeTextForMatching(card.front || '')
                    )
                });
            });
        });
        
        if (cardsToDelete.size > 0) {
            const beforeCount = this.cards.length;
            this.cards = this.cards.filter(card => !cardsToDelete.has(card.id));
            const afterCount = this.cards.length;
            
            this.saveCards();
            
            console.log(`[DELETE] Found and deleted ${cardsToDelete.size} cards:`, deletedCards);
            console.log(`[DELETE] Card count: ${beforeCount} → ${afterCount}`);
            
            // Refresh UI if needed
            if (this.renderCards) {
                this.renderCards();
                this.updateCardCount();
            }
            
            return deletedCards.length;
        } else {
            console.log(`[DELETE] No cards found matching the provided texts`);
            return 0;
        }
    }

    // Normalize text for matching (remove extra whitespace, normalize quotes, etc.)
    normalizeTextForMatching(text) {
        if (!text) return '';
        return text
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ') // Multiple spaces to single space
            .replace(/['"]/g, '"') // Normalize quotes
            .replace(/[^\w\s"().,;:!?-]/g, ''); // Remove special chars except basic punctuation
    }

    // Calculate text similarity (0-1, where 1 is identical)
    calculateTextSimilarity(text1, text2) {
        if (!text1 || !text2) return 0;
        if (text1 === text2) return 1;
        
        // If one is much shorter, check if it's contained in the longer one with high overlap
        const len1 = text1.length;
        const len2 = text2.length;
        
        if (len1 === 0 || len2 === 0) return 0;
        
        // If lengths are very different, similarity is low
        const lengthRatio = Math.min(len1, len2) / Math.max(len1, len2);
        if (lengthRatio < 0.7) return 0; // Too different in length
        
        // Calculate character-level similarity (simple approach)
        // Count matching characters in order
        let matches = 0;
        const minLen = Math.min(len1, len2);
        const maxLen = Math.max(len1, len2);
        
        // Check character overlap
        for (let i = 0; i < minLen; i++) {
            if (text1[i] === text2[i]) {
                matches++;
            }
        }
        
        // Also check if one string contains the other (for longer/shorter cases)
        const containsMatch = text1.includes(text2) || text2.includes(text1);
        if (containsMatch && lengthRatio > 0.85) {
            // If one contains the other and lengths are similar, high similarity
            return 0.95;
        }
        
        // Base similarity on character matches
        const charSimilarity = matches / maxLen;
        
        // Also check word-level similarity
        const words1 = text1.split(/\s+/);
        const words2 = text2.split(/\s+/);
        const commonWords = words1.filter(w => words2.includes(w));
        const wordSimilarity = (commonWords.length * 2) / (words1.length + words2.length);
        
        // Combine both metrics
        return Math.max(charSimilarity, wordSimilarity);
    }

    // Log current card state for debugging
    logCurrentCardState() {
        const ieltsParentFolder = this.folders.find(f => f.name && f.name.toLowerCase().includes('ielts') && !f.parentFolderId);
        
        if (ieltsParentFolder) {
            const childFolderIds = this.getChildFolderIdsForParent(ieltsParentFolder.id);
            const cardsInIELTS = this.cards.filter(c => childFolderIds.has(c.folderId));
            console.log(`[STATE] IELTS 8000 folder analysis:`, {
                parentFolderId: ieltsParentFolder.id,
                parentFolderName: ieltsParentFolder.name,
                childFoldersCount: childFolderIds.size,
                cardsInIELTSFolders: cardsInIELTS.length,
                totalCards: this.cards.length
            });
        }
    }

    // Populate the list-only dropdown in header with child folders
    updateListDropdownForHeader() {
        if (!this.listDropdown) return;
        const container = this.listDropdown;
        // Clear dropdown completely before repopulating
        container.innerHTML = '';
        const currentFolderObj = this.folders.find(f => f.id === this.currentFolder);
        if (!currentFolderObj) {
            container.style.display = 'none';
            return;
        }
        
        // If current folder is a parent, show its child folders
        let childFolders = [];
        if (!currentFolderObj.parentFolderId) {
            // This is a parent folder - ONLY show new-style folders (with parentFolderId)
            // Ignore legacy folders completely - they should have been cleaned up
            childFolders = this.folders
                .filter(f => {
                    // Only include folders with parentFolderId pointing to current folder
                    if (f.parentFolderId !== this.currentFolder) return false;
                    // Only include folders that have cards
                    const hasCards = this.cards.some(c => c.folderId === f.id);
                    return hasCards;
                })
                .sort((a, b) => {
                    // Extract numbers for proper sorting (List 01, List 02, ... List 40)
                    const numA = parseInt(a.name.match(/List\s+(\d+)/i)?.[1] || '0');
                    const numB = parseInt(b.name.match(/List\s+(\d+)/i)?.[1] || '0');
                    return numA - numB;
                });
        } else {
            // This is a child folder - show siblings (same parent)
            // ONLY show new-style folders (with parentFolderId), ignore legacy folders
            const parentId = currentFolderObj.parentFolderId;
            childFolders = this.folders
                .filter(f => {
                    // Only include folders with parentFolderId pointing to same parent
                    if (f.parentFolderId !== parentId) return false;
                    // Only include folders that have cards
                    const hasCards = this.cards.some(c => c.folderId === f.id);
                    return hasCards;
                })
                .sort((a, b) => {
                    const numA = parseInt(a.name.match(/List\s+(\d+)/i)?.[1] || '0');
                    const numB = parseInt(b.name.match(/List\s+(\d+)/i)?.[1] || '0');
                    return numA - numB;
                });
        }

        if (childFolders.length === 0) {
            container.style.display = 'none';
            return;
        }

        // Build options: all child lists
        childFolders.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            if (f.id === this.currentFolder) {
                opt.selected = true;
            }
            container.appendChild(opt);
        });
        
        // Debug: log what we found
        const parentName = currentFolderObj.parentFolderId 
            ? this.folders.find(f => f.id === currentFolderObj.parentFolderId)?.name || 'Unknown'
            : currentFolderObj.name;
        console.log(`[List Dropdown] Found ${childFolders.length} child lists for "${parentName}":`, childFolders.map(f => f.name));
        
        // Make dropdown visible and fully interactive
        container.style.display = 'inline-block';
        container.style.visibility = 'visible';
        container.disabled = false;
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
        container.style.position = 'relative';
        container.style.zIndex = '10';
    }

    escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Rename folder functionality
    renameFolder(folderId) {
        const folder = this.folders.find(f => f.id === folderId);
        if (!folder) return;
        
        // Don't allow renaming default folder
        if (folderId === 'default') {
            this.showNotification('Cannot rename the Default Folder.', 'warning');
            return;
        }
        
        const currentName = folder.name;
        const newName = prompt(`Rename folder "${currentName}":`, currentName);
        
        if (!newName || newName.trim() === '') {
            return; // User cancelled or entered empty name
        }
        
        const trimmedName = newName.trim();
        
        // Check if name already exists
        const nameExists = this.folders.some(f => 
            f.id !== folderId && 
            f.name.toLowerCase() === trimmedName.toLowerCase()
        );
        
        if (nameExists) {
            this.showNotification(`A folder with the name "${trimmedName}" already exists.`, 'error');
            return;
        }
        
        // Update folder name
        folder.name = trimmedName;
        this.saveFolders(this.folders);
        this.renderFolders();
        this.updateFolderSelectors();
        
        // If this folder is currently selected, update list dropdown
        if (this.currentFolder === folderId) {
            this.updateListDropdownForHeader();
        }
        
        this.showNotification(`Folder renamed to "${trimmedName}" successfully! 📝`, 'success');
    }

    // Delete folder functionality from sidebar
    async deleteFolderFromSidebar(folderId) {
        const folder = this.folders.find(f => f.id === folderId);
        if (!folder) return;
        
        // Count cards in this folder and its children (if it's a parent)
        let cardCount = 0;
        let childFolders = [];
        
        if (folder.parentFolderId) {
            // Child folder: count own cards
            cardCount = this.cards.filter(c => c.folderId === folderId || String(c.folderId) === String(folderId)).length;
        } else {
            // Parent folder: count cards in parent folder AND all child folders
            const legacyPattern = new RegExp(`^${this.escapeRegExp(folder.name)}\\s+-\\s+List\\s+\\d+$`, 'i');
            childFolders = this.folders.filter(f => 
                f.parentFolderId === folderId || legacyPattern.test(f.name)
            );
            const childIds = new Set(childFolders.map(f => f.id));
            // Include both parent folder ID and child folder IDs
            const relevantFolderIds = new Set(Array.from(childIds));
            relevantFolderIds.add(folderId); // Add the parent folder itself
            const relevantIdStrings = new Set(Array.from(relevantFolderIds).map(id => String(id)));
            cardCount = this.cards.filter(c => {
                const cardFolderIdStr = String(c.folderId);
                return relevantFolderIds.has(c.folderId) || relevantIdStrings.has(cardFolderIdStr);
            }).length;
        }
        
        // Ask for confirmation using branded modal
        const description = cardCount > 0
            ? `This will delete the folder and ${cardCount} card(s) inside it. This action cannot be undone.`
            : `This action cannot be undone.`;
        
        const ok = await showConfirm({
            title: `Delete "${folder.name}"?`,
            description: description,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        });
        
        if (!ok) {
            return;
        }
        
        // Remove all child folders if parent
        if (!folder.parentFolderId && childFolders.length > 0) {
            const childIds = new Set(childFolders.map(f => f.id));
            const childIdStrings = new Set(Array.from(childIds).map(id => String(id)));
            // Remove cards in child folders (using type-safe comparison)
            this.cards = this.cards.filter(c => {
                const cardFolderIdStr = String(c.folderId);
                return !childIds.has(c.folderId) && !childIdStrings.has(cardFolderIdStr);
            });
            // Remove child folders
            this.folders = this.folders.filter(f => !childIds.has(f.id));
        }
        
        // Remove cards in this folder (using type-safe comparison)
        const folderIdStr = String(folderId);
        this.cards = this.cards.filter(c => {
            const cardFolderIdStr = String(c.folderId);
            return c.folderId !== folderId && cardFolderIdStr !== folderIdStr;
        });
        
        // Remove the folder itself
        this.folders = this.folders.filter(f => f.id !== folderId);
        
        // Save changes
        this.saveCards();
        this.saveFolders(this.folders);
        
        // If deleted folder was selected, switch to 'all' (or another folder if default was deleted)
        if (this.currentFolder === folderId || (folder.parentFolderId === null && childFolders.some(f => f.id === this.currentFolder))) {
            // If we deleted the default folder, switch to 'all', otherwise try to find default or use 'all'
            const fallback = folderId === 'default' ? 'all' : (this.folders.find(f => f.id === 'default')?.id || 'all');
            this.selectFolder(fallback);
        } else {
            this.renderCards();
            this.updateCardCount();
        }
        
        // Refresh UI
        this.renderFolders();
        this.updateFolderSelectors();
        
        showToast({ 
            title: 'Deleted', 
            description: `"${folder.name}" removed.`, 
            icon: '🗑️' 
        });
    }

    // Font Size Control Methods
    loadFontSize() {
        const savedSize = localStorage.getItem('cardFontSize');
        if (savedSize) {
            this.currentFontSize = parseInt(savedSize);
        } else {
            this.currentFontSize = 100; // Default 100%
        }
        this.applyFontSize();
    }

    saveFontSize() {
        localStorage.setItem('cardFontSize', this.currentFontSize.toString());
    }

    applyFontSize() {
        const percentage = this.currentFontSize;
        
        // Update display
        if (this.fontSizeValue) {
            this.fontSizeValue.textContent = `${percentage}%`;
        }
        
        // Apply to all card content areas
        document.documentElement.style.setProperty('--card-font-scale', percentage / 100);
        
        // Apply directly to card content elements
        const cardContents = document.querySelectorAll('.card-content, .flashcard-front p, .flashcard-back p, .question-content');
        cardContents.forEach(content => {
            content.style.fontSize = `calc(1.6rem * ${percentage / 100})`;
        });
    }

    increaseFontSize() {
        if (this.currentFontSize < 200) { // Max 200%
            this.currentFontSize += 10;
            this.applyFontSize();
            this.saveFontSize();
            this.updateAllFontSizeDisplays();
        }
    }

    decreaseFontSize() {
        if (this.currentFontSize > 50) { // Min 50%
            this.currentFontSize -= 10;
            this.applyFontSize();
            this.saveFontSize();
            this.updateAllFontSizeDisplays();
        }
    }

    resetFontSize() {
        this.currentFontSize = 100;
        this.applyFontSize();
        this.saveFontSize();
        this.updateAllFontSizeDisplays();
    }
    
    updateAllFontSizeDisplays() {
        // Update all font size value displays on all cards
        document.querySelectorAll('.font-size-value').forEach(el => {
            el.textContent = `${this.currentFontSize}%`;
        });
    }

    // Auto-import IELTS 8000 on first load (from data/IELTS_8000_exact.txt - 8000 cleaned entries)
    async autoImportIELTS() {
        // Check if IELTS 8000 folder already exists
        const ieltsExists = this.folders.some(f => f.name === 'IELTS 8000' && !f.parentFolderId);
        
        if (ieltsExists) {
            console.log('[autoImportIELTS] IELTS 8000 already exists');
            return;
        }
        
        console.log('[autoImportIELTS] IELTS 8000 not found, loading from data/IELTS_8000_exact.txt...');
        
        // Show loading message
        this.showNotification('📚 Loading IELTS 8000 word collection... Please wait.', 'info');
        
        try {
            // Fetch from data/IELTS_8000_exact.txt
            const text = await this.getEmbeddedIELTSData();
            
            if (!text) {
                throw new Error('Failed to load IELTS 8000 data from data/IELTS_8000_exact.txt');
            }
            
            // Import the data
            await this.importIELTSText(text, 'IELTS 8000');
            
            console.log('[autoImportIELTS] IELTS 8000 imported successfully from data/IELTS_8000_exact.txt');
            
            // Show success notification
            this.showNotification('✅ IELTS 8000 loaded! (8000 words, 40 lists). Check sidebar!', 'success');
            
        } catch (error) {
            console.error('[autoImportIELTS] Error auto-importing IELTS 8000:', error);
            this.showNotification('⚠️ Could not load IELTS 8000. Click "Word Books" → "Reload/Re-import"', 'warning');
        }
    }

    // ==================== Supabase Integration Functions ====================

    // Load cards from Supabase or localStorage
    async loadCardsFromSupabase() {
        if (!this.supabase || !this.currentUser) {
            return null; // Fall back to localStorage
        }

        try {
            const { data, error } = await this.supabase
                .from('cards')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('[Supabase] Error loading cards:', e);
            return null; // Fall back to localStorage
        }
    }

    // Save cards to Supabase
    async saveCardsToSupabase() {
        if (!this.supabase || !this.currentUser) {
            return false; // Fall back to localStorage
        }

        try {
            // Delete existing cards for this user
            await this.supabase
                .from('cards')
                .delete()
                .eq('user_id', this.currentUser.id);

            // Insert all cards
            if (this.cards.length > 0) {
                const cardsToInsert = this.cards.map(card => ({
                    user_id: this.currentUser.id,
                    card_data: card,
                    created_at: card.createdAt || new Date().toISOString()
                }));

                const { error } = await this.supabase
                    .from('cards')
                    .insert(cardsToInsert);

                if (error) throw error;
            }

            return true;
        } catch (e) {
            console.error('[Supabase] Error saving cards:', e);
            return false; // Fall back to localStorage
        }
    }

    // Migrate data from localStorage to Supabase
    async migrateToSupabase() {
        if (!this.supabase || !this.currentUser) {
            throw new Error('Supabase not configured or user not logged in');
        }

        try {
            // Export current localStorage data
            const exportData = {
                cards: this.cards,
                folders: this.folders,
                settings: {
                    customColors: this.customColors,
                    fontSize: this.currentFontSize || 100
                }
            };

            // Save to Supabase
            await this.saveCardsToSupabase();
            await this.saveFoldersToSupabase();

            // Mark migration as complete
            localStorage.setItem('vocaBox_migrated_to_supabase', 'true');
            
            this.showNotification('Data migrated to cloud successfully!', 'success');
            return true;
        } catch (e) {
            console.error('[Migration] Error:', e);
            this.showNotification('Migration failed. Data remains in localStorage.', 'error');
            return false;
        }
    }

    // Save folders to Supabase
    async saveFoldersToSupabase() {
        if (!this.supabase || !this.currentUser) {
            return false;
        }

        try {
            // Delete existing folders
            await this.supabase
                .from('folders')
                .delete()
                .eq('user_id', this.currentUser.id);

            // Insert all folders
            if (this.folders.length > 0) {
                const foldersToInsert = this.folders.map(folder => ({
                    user_id: this.currentUser.id,
                    folder_data: folder,
                    created_at: folder.createdAt || new Date().toISOString()
                }));

                const { error } = await this.supabase
                    .from('folders')
                    .insert(foldersToInsert);

                if (error) throw error;
            }

            return true;
        } catch (e) {
            console.error('[Supabase] Error saving folders:', e);
            return false;
        }
    }

    // ==================== Export/Import Data Functions ====================

    openExportModal() {
        if (!this.exportImportModal) return;
        
        this.exportImportModalTitle.textContent = 'Export Data';
        this.exportSection.style.display = 'block';
        this.importSection.style.display = 'none';
        
        // Update card and folder counts in the UI
        const cardCountLabel = document.getElementById('exportCardsLabel');
        if (cardCountLabel) {
            cardCountLabel.textContent = `Cards (${this.cards.length} cards)`;
        }
        const folderCountLabel = document.getElementById('exportFoldersLabel');
        if (folderCountLabel) {
            folderCountLabel.textContent = `Folders (${this.folders.length} folders)`;
        }
        
        this.exportImportModal.classList.add('active');
    }

    openImportDataModal() {
        if (!this.exportImportModal) return;
        
        this.exportImportModalTitle.textContent = 'Import Data';
        this.exportSection.style.display = 'none';
        this.importSection.style.display = 'block';
        
        // Reset file input
        if (this.importFileInput) {
            this.importFileInput.value = '';
        }
        if (this.selectedDataFileName) {
            this.selectedDataFileName.style.display = 'none';
        }
        if (this.confirmImportDataBtn) {
            this.confirmImportDataBtn.disabled = true;
        }
        if (this.importDataError) {
            this.importDataError.style.display = 'none';
        }
        
        this.exportImportModal.classList.add('active');
    }

    closeExportImportModal() {
        if (this.exportImportModal) {
            this.exportImportModal.classList.remove('active');
        }
    }

    exportData() {
        try {
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                appName: 'VocaBox',
                user: this.currentUser ? this.currentUser.username : 'guest'
            };

            // Export cards if selected
            if (this.exportCards && this.exportCards.checked) {
                exportData.cards = this.cards;
            }

            // Export folders if selected
            if (this.exportFolders && this.exportFolders.checked) {
                exportData.folders = this.folders;
            }

            // Export settings if selected
            if (this.exportSettings && this.exportSettings.checked) {
                exportData.settings = {
                    customColors: this.customColors,
                    fontSize: this.currentFontSize || 100
                };
            }

            // Create JSON blob
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create download link
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const username = this.currentUser ? this.currentUser.username : 'guest';
            a.href = url;
            a.download = `vocabox-export-${username}-${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.closeExportImportModal();
            this.showNotification('Data exported successfully!', 'success');
        } catch (e) {
            console.error('Export error:', e);
            this.showNotification('Error exporting data. Please try again.', 'error');
        }
    }

    handleImportFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            if (this.importDataError) {
                this.importDataError.textContent = 'Please select a valid JSON file.';
                this.importDataError.style.display = 'block';
            }
            return;
        }

        if (this.fileNameDisplay) {
            this.fileNameDisplay.textContent = file.name;
        }
        if (this.selectedDataFileName) {
            this.selectedDataFileName.style.display = 'block';
        }
        if (this.confirmImportDataBtn) {
            this.confirmImportDataBtn.disabled = false;
        }
        if (this.importDataError) {
            this.importDataError.style.display = 'none';
        }
    }

    async importData() {
        const file = this.importFileInput?.files[0];
        if (!file) {
            if (this.importDataError) {
                this.importDataError.textContent = 'Please select a file first.';
                this.importDataError.style.display = 'block';
            }
            return;
        }

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            // Validate import data structure
            if (!importData.appName || importData.appName !== 'VocaBox') {
                throw new Error('Invalid export file. This file was not exported from VocaBox.');
            }

            const importMode = document.querySelector('input[name="importMode"]:checked')?.value || 'replace';

            // Import cards
            if (importData.cards && Array.isArray(importData.cards)) {
                if (importMode === 'replace') {
                    // Replace mode: Check if imported cards would exceed limit (count only user cards)
                    const limits = this.getSubscriptionLimits();
                    if (limits.maxCards !== -1) {
                        // Count user cards in import (excluding system cards)
                        const userCardsInImport = importData.cards.filter(card => !card.isSystemCard).length;
                        if (userCardsInImport > limits.maxCards) {
                            // Truncate to limit, keeping system cards
                            const systemCards = importData.cards.filter(card => card.isSystemCard);
                            const userCards = importData.cards.filter(card => !card.isSystemCard).slice(0, limits.maxCards);
                            this.cards = [...systemCards, ...userCards];
                            this.showNotification(`Imported ${limits.maxCards} user cards (${userCardsInImport - limits.maxCards} cards were skipped due to free tier limit). Upgrade to Premium for unlimited cards!`, 'warning');
                            this.showUpgradeModal('cards', limits.maxCards);
                        } else {
                            this.cards = importData.cards;
                        }
                    } else {
                        this.cards = importData.cards;
                    }
                } else {
                    // Merge mode - add new cards, update existing ones, respecting limits
                    const limits = this.getSubscriptionLimits();
                    const canImportUnlimited = limits.maxCards === -1 || limits.maxCards === Infinity;
                    const existingIds = new Set(this.cards.map(c => c.id));
                    let mergedCount = 0;
                    let skippedCount = 0;
                    
                    importData.cards.forEach(card => {
                        if (!existingIds.has(card.id)) {
                            // Only check limits for user cards (system cards don't count)
                            if (card.isSystemCard || canImportUnlimited || this.canAddCard()) {
                                this.cards.push(card);
                                mergedCount++;
                            } else {
                                skippedCount++;
                            }
                        }
                    });
                    
                    if (skippedCount > 0) {
                        this.showNotification(`Merged ${mergedCount} cards. ${skippedCount} cards were skipped due to free tier limit. Upgrade to Premium for unlimited cards!`, 'warning');
                        this.showUpgradeModal('cards', limits.maxCards);
                    }
                }
                this.saveCards(); // Save synchronously to localStorage, sync to Supabase in background
            }

            // Import folders
            if (importData.folders && Array.isArray(importData.folders)) {
                if (importMode === 'replace') {
                    this.folders = importData.folders;
                } else {
                    // Merge mode
                    const existingIds = new Set(this.folders.map(f => f.id));
                    importData.folders.forEach(folder => {
                        if (!existingIds.has(folder.id)) {
                            this.folders.push(folder);
                        }
                    });
                }
                this.saveFolders(this.folders);
            }

            // Import settings
            if (importData.settings) {
                if (importData.settings.customColors) {
                    this.customColors = { ...this.customColors, ...importData.settings.customColors };
                    this.saveCustomColors();
                    this.applyCustomColors();
                }
                if (importData.settings.fontSize) {
                    this.currentFontSize = importData.settings.fontSize;
                    this.saveFontSize();
                    this.applyFontSize();
                }
            }

            // Refresh UI
            this.renderCards();
            this.renderFolders();
            this.updateCardCount();
            this.updateFolderSelectors();
            this.updateCurrentFolderInfo();

            this.closeExportImportModal();
            this.showNotification('Data imported successfully!', 'success');
        } catch (e) {
            console.error('Import error:', e);
            if (this.importDataError) {
                this.importDataError.textContent = e.message || 'Error importing data. Please check the file format.';
                this.importDataError.style.display = 'block';
            }
        }
    }

    // ==================== Upgrade/Subscription Modal Functions ====================

    showUpgradeModal(limitType = 'cards', currentLimit = 100) {
        if (!this.upgradeModal) return;

        // Update limit message
        const limitText = document.getElementById('upgradeLimitText');
        if (limitText) {
            if (limitType === 'cards') {
                limitText.textContent = `You've reached the free tier limit of ${currentLimit} cards. Upgrade to Premium for unlimited cards and folders!`;
            } else if (limitType === 'folders') {
                limitText.textContent = `You've reached the free tier limit of ${currentLimit} folders. Upgrade to Premium for unlimited cards and folders!`;
            }
        }

        // Update prices from config
        if (typeof CONFIG !== 'undefined' && CONFIG.subscription) {
            const premiumPrice = CONFIG.subscription.tiers.premium?.price;
            const proPrice = CONFIG.subscription.tiers.pro?.price;
            
            if (premiumPrice) {
                const premiumMonthly = document.getElementById('premiumMonthlyPrice');
                const premiumYearly = document.getElementById('premiumYearlyPrice');
                if (premiumMonthly) premiumMonthly.textContent = premiumPrice.monthly.toFixed(2);
                if (premiumYearly) premiumYearly.textContent = premiumPrice.yearly.toFixed(2);
            }
            
            if (proPrice) {
                const proMonthly = document.getElementById('proMonthlyPrice');
                const proYearly = document.getElementById('proYearlyPrice');
                if (proMonthly) proMonthly.textContent = proPrice.monthly.toFixed(2);
                if (proYearly) proYearly.textContent = proPrice.yearly.toFixed(2);
            }
        }

        this.upgradeModal.classList.add('active');
    }

    closeUpgradeModal() {
        if (this.upgradeModal) {
            this.upgradeModal.classList.remove('active');
        }
    }

    openSubscriptionManagement() {
        // For now, just show upgrade modal
        // In Phase 2.2, this will show current subscription and allow cancellation
        this.showUpgradeModal();
    }

    updateSubscriptionBadge() {
        const badge = document.getElementById('subscriptionBadge');
        if (!badge) return;

        const tier = this.getUserSubscriptionTier();
        if (tier === 'whitelist') {
            badge.textContent = 'Special Access';
            badge.style.background = '#9C27B0';
            badge.style.color = 'white';
        } else if (tier === 'free') {
            badge.textContent = 'Free';
            badge.style.background = '#e0e0e0';
            badge.style.color = '#666';
        } else if (tier === 'premium') {
            badge.textContent = '⭐ Premium';
            badge.style.background = '#4CAF50';
            badge.style.color = 'white';
        } else if (tier === 'pro') {
            badge.textContent = '💎 Pro';
            badge.style.background = '#9C27B0';
            badge.style.color = 'white';
        }
    }

    handleUpgrade(tier) {
        // TODO: In Phase 2.2, integrate with Stripe
        // For now, simulate upgrade (for testing)
        this.showNotification(`Upgrade to ${tier} will be available soon with Stripe integration!`, 'info');
        
        // Simulate upgrade for testing (remove in production)
        if (confirm(`For testing: Upgrade to ${tier}? (This will be replaced with Stripe checkout in Phase 2.2)`)) {
            this.saveUserSubscription({
                tier: tier,
                status: 'active',
                expiresAt: null
            });
            this.updateSubscriptionBadge();
            this.closeUpgradeModal();
            this.showNotification(`Successfully upgraded to ${tier}!`, 'success');
            this.renderCards(); // Refresh to show unlimited
            this.renderFolders();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("INIT: DOMContentLoaded fired");
    try {
        console.log("INIT: Creating VocaBox instance...");
        window.vocabox = new VocaBox();
        console.log("INIT: VocaBox instance created successfully");
    } catch (error) {
        console.error("INIT ERROR: Failed to create VocaBox instance", error);
        console.error("INIT ERROR stack:", error.stack);
        // Try to show error to user
        try {
            document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>App Initialization Failed</h1><p>Please refresh the page. If the problem persists, check the browser console for details.</p><p style="color: red;">Error: ' + error.message + '</p></div>';
        } catch (e) {
            console.error("Could not display error message:", e);
        }
    }
});


