// VocaBox - Flashcard App
// Main Application Logic

class VocaBox {
    constructor() {
        this.currentUser = this.loadCurrentUser();
        this.cards = this.loadCards();
        this.currentTestIndex = 0;
        this.isFlipped = false;
        this.currentEditingCardId = null;
        this.currentTypingIndex = 0;
        this.typingTestCards = [];
        this.flipTestCards = [];
        this.customColors = this.loadCustomColors();
        this.pendingDeleteId = null;
        this.audioDB = null;
        
        // Folder system
        this.folders = this.loadFolders();
        this.currentFolder = 'all';
        this.typingSelectedFolderId = 'all'; // Track selected folder for typing mode
        
        // Card navigation
        this.currentCardIndex = 0; // Index of currently displayed card
        
        // Test results tracking
        this.testResults = {
            answers: [], // Array to store {questionIndex, isCorrect, userAnswer, correctAnswer}
            correctCount: 0,
            incorrectCount: 0,
            unansweredCount: 0
        };
        this.currentAudioId = null;
        this.currentPlayingAudio = null; // Track currently playing audio
        this.init();
    }

    async init() {
        this.cacheDOMElements();
        await this.initAudioDB();
        this.attachEventListeners();
        this.updateAuthUI();
        this.renderFolders();
        this.updateFolderSelectors();
        this.renderCards();
        this.updateCardCount();
        this.applyCustomColors();
        
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
    }

    cacheDOMElements() {
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
        this.cardsNavigation = document.getElementById('cardsNavigation');
        this.prevCardViewBtn = document.getElementById('prevCardViewBtn');
        this.nextCardViewBtn = document.getElementById('nextCardViewBtn');
        this.cardPosition = document.getElementById('cardPosition');
        
        // Folder elements
        this.createFolderBtn = document.getElementById('createFolderBtn');
        this.folderList = document.getElementById('folderList');
        this.folderSelect = document.getElementById('folderSelect');
        this.addCardFolder = document.getElementById('addCardFolder');

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
        this.confirmImportBtn = document.getElementById('confirmImportBtn');
        this.wordListTextarea = document.getElementById('wordListTextarea');
        this.importError = document.getElementById('importError');
        this.previewCount = document.getElementById('previewCount');
        this.previewCardsContainer = document.getElementById('previewCardsContainer');
        this.customTermDelimiter = document.getElementById('customTermDelimiter');
        this.customCardDelimiter = document.getElementById('customCardDelimiter');
        
        // File upload elements
        this.vocabularyFileInput = document.getElementById('vocabularyFileInput');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.selectedFileName = document.getElementById('selectedFileName');
        this.importTargetFolder = document.getElementById('importTargetFolder');
        this.createFolderForImportBtn = document.getElementById('createFolderForImportBtn');

        // Collections UI
        this.collectionsBtn = document.getElementById('collectionsBtn');
        this.collectionsModal = document.getElementById('collectionsModal');
        this.closeCollectionsBtn = document.getElementById('closeCollectionsBtn');
        this.importIELTSBtn = document.getElementById('importIELTSBtn');
        this.ieltsPrefixInput = document.getElementById('ieltsPrefixInput');
        this.collectionsError = document.getElementById('collectionsError');

        // Delete confirmation modal elements
        this.deleteConfirmModal = document.getElementById('deleteConfirmModal');
        this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        // Test mode selection elements
        this.testModeSelectModal = document.getElementById('testModeSelectModal');
        this.closeTestSelectBtn = document.getElementById('closeTestSelectBtn');
        this.selectFlipMode = document.getElementById('selectFlipMode');
        this.selectTypingMode = document.getElementById('selectTypingMode');
        
        // Side selection modal elements
        this.flipSideSelectModal = document.getElementById('flipSideSelectModal');
        this.closeFlipSideBtn = document.getElementById('closeFlipSideBtn');
        this.backToFlipModeBtn = document.getElementById('backToFlipModeBtn');
        this.selectFrontFirst = document.getElementById('selectFrontFirst');
        this.selectBackFirst = document.getElementById('selectBackFirst');
        
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
        this.unansweredQuestions = document.getElementById('unansweredQuestions');
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
        // Auth buttons
        this.signInBtn.addEventListener('click', () => this.openSignInModal());
        this.signUpBtn.addEventListener('click', () => this.openSignUpModal());
        this.signOutBtn.addEventListener('click', () => this.signOut());
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
        this.addCardBtn.addEventListener('click', () => this.openAddCardModal());

        // Test mode button - opens selection modal
        this.testModeBtn.addEventListener('click', () => this.openTestModeSelection());

        // Add Test button (removed from UI)
        // this.createTestBtn.addEventListener('click', () => this.openCreateTestModal());

        // Import Word List button
        this.importWordListBtn.addEventListener('click', () => this.openImportModal());

        // Collections button
        this.collectionsBtn.addEventListener('click', () => this.openCollectionsModal());

        // Folder functionality
        this.createFolderBtn.addEventListener('click', () => this.openCreateFolderModal());
        this.closeCreateFolderBtn.addEventListener('click', () => this.closeCreateFolderModal());
        this.cancelCreateFolderBtn.addEventListener('click', () => this.closeCreateFolderModal());
        this.createFolderForm.addEventListener('submit', (e) => this.handleCreateFolder(e));
        this.folderSelect.addEventListener('change', (e) => this.selectFolder(e.target.value));
        
        // Card navigation
        this.prevCardViewBtn.addEventListener('click', () => this.previousCardView());
        this.nextCardViewBtn.addEventListener('click', () => this.nextCardView());

        // Modal close buttons
        this.closeModalBtn.addEventListener('click', () => this.closeAddCardModal());
        this.cancelBtn.addEventListener('click', () => this.closeAddCardModal());
        this.addNextCardBtn.addEventListener('click', () => this.addNextCard());

        // Edit modal close buttons
        this.closeEditModalBtn.addEventListener('click', () => this.closeEditCardModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeEditCardModal());

        // Add Test modal close buttons
        this.closeCreateTestBtn.addEventListener('click', () => this.closeCreateTestModal());
        this.cancelCreateTestBtn.addEventListener('click', () => this.closeCreateTestModal());

        // Import Word List modal close buttons
        this.closeImportModalBtn.addEventListener('click', () => this.closeImportModal());
        this.cancelImportBtn.addEventListener('click', () => this.closeImportModal());
        this.confirmImportBtn.addEventListener('click', () => this.handleImport());
        
        // File upload functionality
        this.selectFileBtn.addEventListener('click', () => this.vocabularyFileInput.click());
        this.vocabularyFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.createFolderForImportBtn.addEventListener('click', () => this.createFolderForImport());
        
        // Delimiter option listeners
        this.wordListTextarea.addEventListener('input', () => this.updatePreview());
        document.querySelectorAll('input[name="termDelimiter"]').forEach(radio => {
            radio.addEventListener('change', () => this.updatePreview());
        });
        document.querySelectorAll('input[name="cardDelimiter"]').forEach(radio => {
            radio.addEventListener('change', () => this.updatePreview());
        });
        this.customTermDelimiter.addEventListener('input', () => this.updatePreview());
        this.customCardDelimiter.addEventListener('input', () => this.updatePreview());

        // Collections modal listeners
        this.closeCollectionsBtn.addEventListener('click', () => this.closeCollectionsModal());
        this.importIELTSBtn.addEventListener('click', () => this.handleImportIELTSCollection());

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
        this.closeTestSelectBtn.addEventListener('click', () => this.closeTestModeSelection());
        this.selectFlipMode.addEventListener('click', () => this.openFlipSideSelection());
        this.selectTypingMode.addEventListener('click', () => this.openTypingFolderSelection());

        // Typing folder selection modal
        this.closeTypingFolderBtn.addEventListener('click', () => this.closeTypingFolderSelection());
        this.backFromTypingFolderBtn.addEventListener('click', () => this.backToTestModeSelection());

        // Side selection modals
        this.closeFlipSideBtn.addEventListener('click', () => this.closeFlipSideSelection());
        this.backToFlipModeBtn.addEventListener('click', () => this.backToTestModeSelection());
        this.selectFrontFirst.addEventListener('click', () => this.startFlipModeWithSide('front'));
        this.selectBackFirst.addEventListener('click', () => this.startFlipModeWithSide('back'));
        
        this.closeTypingSideBtn.addEventListener('click', () => this.closeTypingSideSelection());
        this.backToTypingModeBtn.addEventListener('click', () => this.backToTypingFolderSelection());
        this.selectSeeFrontTypeBack.addEventListener('click', () => this.startTypingModeWithSides('front', 'back'));
        this.selectSeeBackTypeFront.addEventListener('click', () => this.startTypingModeWithSides('back', 'front'));

        // Category selection modal
        this.closeCategorySelectBtn.addEventListener('click', () => this.closeCategorySelection());
        this.backToCategoryBtn.addEventListener('click', () => this.backToTestModeFromCategory());
        this.selectCardsCategory.addEventListener('click', () => this.startFlipMode('card'));
        this.selectTestsCategory.addEventListener('click', () => this.startFlipMode('test'));

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
        this.replayFlipAudioBtn.addEventListener('click', () => this.replayFlipAudio());

        // Typing mode controls
        this.exitTypingBtn.addEventListener('click', () => this.exitTypingMode());
        this.checkAnswerBtn.addEventListener('click', () => this.checkAnswer());
        this.typingPrevBtn.addEventListener('click', () => this.previousTypingCard());
        this.typingNextBtn.addEventListener('click', () => this.nextTypingCard());
        this.replayTypingAudioBtn.addEventListener('click', () => this.replayTypingAudio());

        // Finish Test button
        if (this.finishTestBtn) {
            this.finishTestBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showTestResults();
            });
        }

        // Test Results Modal event listeners
        this.closeResultsBtn.addEventListener('click', () => this.closeTestResults());
        this.retakeTestBtn.addEventListener('click', () => this.retakeTest());
        this.exitToHomeBtn.addEventListener('click', () => this.exitToHome());
        this.reviewTestBtn.addEventListener('click', () => this.reviewTest());
        this.testResultsModal.addEventListener('click', (e) => {
            if (e.target === this.testResultsModal) {
                this.closeTestResults();
            }
        });

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
    }

    // Authentication Methods
    loadCurrentUser() {
        const user = localStorage.getItem('vocaBoxCurrentUser');
        return user ? JSON.parse(user) : null;
    }

    saveCurrentUser(user) {
        if (user) {
            localStorage.setItem('vocaBoxCurrentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('vocaBoxCurrentUser');
        }
    }

    updateAuthUI() {
        if (this.currentUser) {
            this.authButtons.style.display = 'none';
            this.userInfo.style.display = 'flex';
            this.usernameDisplay.textContent = this.currentUser.username;
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

    handleSignIn(e) {
        e.preventDefault();
        const contact = this.signInContact.value.trim();
        const password = this.signInPassword.value;

        if (!contact || !password) {
            this.showError(this.signInError, 'Please fill in all fields');
            return;
        }

        // Validate contact format
        if (!this.validateContact(contact)) {
            this.showError(this.signInError, 'Please enter a valid email or phone number');
            return;
        }

        // Get users from localStorage
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
        this.cards = this.loadCards();
        this.renderCards();
        this.updateCardCount();
    }

    handleSignUp(e) {
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

        // Get users from localStorage
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

    signOut() {
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
    loadCards() {
        const userKey = this.currentUser ? `vocaBoxCards_${this.currentUser.username}` : 'vocaBoxCards_guest';
        const savedCards = localStorage.getItem(userKey);
        if (savedCards) {
            return JSON.parse(savedCards);
        } else {
            // Load sample cards for first-time users
            const sampleCards = this.getSampleCards();
            localStorage.setItem(userKey, JSON.stringify(sampleCards));
            return sampleCards;
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
        const userKey = this.currentUser ? `vocaBoxCards_${this.currentUser.username}` : 'vocaBoxCards_guest';
        localStorage.setItem(userKey, JSON.stringify(this.cards));
    }

    addCard(front, back, category = 'card', audioId = null, folderId = 'default') {
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
    }

    deleteCard(id) {
        this.pendingDeleteId = id;
        this.openDeleteConfirmModal();
    }

    changeCardFolder(cardId, newFolderId) {
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
        
        // Get all folders and sort them consistently
        const allFolders = [
            { id: 'default', name: 'Default Folder' },
            ...this.folders.filter(f => f.id !== 'default')
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
        this.cardsContainer.innerHTML = '';

        // Show cards for current folder
        const cardsToShow = this.getCardsForCurrentFolder();

        // Show/hide empty state
        if (cardsToShow.length === 0) {
            this.cardsEmptyState.classList.remove('hidden');
            this.cardsNavigation.style.display = 'none';
            // Hide decoration cat when no cards
            const cardsDecoration = document.querySelector('.cat-decoration');
            if (cardsDecoration) cardsDecoration.style.display = 'none';
        } else {
            this.cardsEmptyState.classList.add('hidden');
            this.cardsNavigation.style.display = 'flex';
            // Show decoration cat when cards exist
            const cardsDecoration = document.querySelector('.cat-decoration');
            if (cardsDecoration) cardsDecoration.style.display = 'block';
            
            // Reset card index if out of bounds
            if (this.currentCardIndex >= cardsToShow.length) {
                this.currentCardIndex = 0;
            }
            
            // Show only the current card
            const currentCard = cardsToShow[this.currentCardIndex];
            if (currentCard) {
                const cardElement = this.createCardElement(currentCard);
                this.cardsContainer.appendChild(cardElement);
            }
            
            // Update navigation
            this.updateCardNavigation(cardsToShow.length);
        }
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
        const folderClass = this.getFolderColorClass(card.folderId);
        if (folderClass) {
            cardDiv.classList.add(folderClass);
        }
        
        const hasAudio = card.audioId ? true : false;
        
        cardDiv.innerHTML = `
            <div class="card-flip-container">
                <div class="card-flip-inner">
                    <div class="card-face card-front">
                        <div class="card-content">
                            ${card.front}
                        </div>
                    </div>
                    <div class="card-face card-back">
                        <div class="card-content">
                            ${card.back}
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-header">
                <div class="card-folder-info">
                    <div class="folder-dropdown-container">
                        <button class="folder-label folder-dropdown-btn" data-card-id="${card.id}">
                            <img src="writing.png" alt="Folder" style="width: 16px; height: 16px; vertical-align: middle;">
                            <span class="folder-name">${card.folderName || 'Default Folder'}</span>
                            <span class="dropdown-arrow">▼</span>
                        </button>
                        <div class="folder-dropdown-menu" data-card-id="${card.id}">
                            <div class="folder-option" data-folder-id="default">Default Folder</div>
                            ${this.folders.filter(folder => folder.id !== 'default').map(folder => 
                                `<div class="folder-option" data-folder-id="${folder.id}">${folder.name}</div>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                ${hasAudio ? `<button class="play-audio-btn" data-audio-id="${card.audioId}" title="Play audio">🔊 Play</button>` : ''}
                <button class="edit-btn" data-id="${card.id}"><img src="pencil.png" alt="Edit" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 4px;"> Edit</button>
                <button class="delete-btn" data-id="${card.id}"><img src="trashbin.png" alt="Delete" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 4px;"> Delete</button>
            </div>
        `;

        // Add event listeners after innerHTML
        const editBtn = cardDiv.querySelector('.edit-btn');
        const deleteBtn = cardDiv.querySelector('.delete-btn');
        const folderBtn = cardDiv.querySelector('.folder-dropdown-btn');
        const folderOptions = cardDiv.querySelectorAll('.folder-option');
        
        editBtn.addEventListener('click', () => this.openEditCardModal(card.id));
        deleteBtn.addEventListener('click', () => this.deleteCard(card.id));
        
        // Folder dropdown functionality
        folderBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFolderDropdown(card.id);
        });
        
        // Use event delegation for folder options
        folderOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const folderId = option.dataset.folderId;
                this.changeCardFolder(card.id, folderId);
                this.closeAllFolderDropdowns();
            });
        });

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
        
        // Prevent button clicks from triggering flip
        const actionButtons = cardDiv.querySelectorAll('.card-actions button, .card-header button');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

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
        this.cardCount.textContent = this.cards.length;
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
        const folderId = this.addCardFolder.value;

        if (front || back) {
            await this.addCard(front, back, 'card', this.pendingAddAudioId, folderId);
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
            await this.addCard(front, back, 'card', this.pendingAddAudioId);
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
            await this.addCard(front, back, 'test', this.pendingTestAudioId); // Mark as 'test' category with audio
            this.pendingTestAudioId = null;
            this.closeCreateTestModal();
        } else {
            this.showNotification('Please fill in at least one field (front or back).', 'error');
        }
    }

    // Import Word List Methods
    openImportModal() {
        this.importWordListModal.classList.add('active');
        this.resetImportModal();
        this.updateImportFolderSelector();
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
        document.querySelector('input[name="termDelimiter"][value="space"]').checked = true;
        document.querySelector('input[name="cardDelimiter"][value="newline"]').checked = true;
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
            const prefix = (this.ieltsPrefixInput.value || 'IELTS 8000 - List').trim();
            
            // Try to fetch from server first, fallback to embedded data
            let text;
            try {
                text = await this.fetchLocalCollectionText('IELTS 8000.txt');
            } catch (fetchError) {
                console.log('Could not fetch IELTS file, using embedded data');
                text = this.getEmbeddedIELTSData();
            }
            
            const items = this.parseIELTSFormat(text);

            if (items.length === 0) {
                this.showCollectionsError('No items parsed from IELTS collection.');
                return;
            }

            const chunks = this.chunkArray(items, 200);
            let created = 0;
            chunks.forEach((chunk, index) => {
                const listName = `${prefix} ${String(index + 1).padStart(2, '0')}`;
                this.createFolder(listName, 'Prebuilt IELTS list');
                const folderId = this.folders[this.folders.length - 1].id;
                chunk.forEach(row => {
                    this.addCard(row.front, row.back, 'card', null, folderId);
                });
                created += chunk.length;
            });

            this.showNotification(`Imported ${created} words into ${chunks.length} lists.`, 'success');
            this.closeCollectionsModal();
            this.renderFolders();
            this.renderCards();
        } catch (err) {
            this.showCollectionsError('Failed to import IELTS collection: ' + err.message);
        }
    }

    showCollectionsError(message) {
        this.collectionsError.textContent = message;
        this.collectionsError.style.display = 'block';
    }

    async fetchLocalCollectionText(path) {
        const resp = await fetch(path, { cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return await resp.text();
    }

    parseIELTSFormat(text) {
        const lines = text.split(/\r?\n/);
        const rows = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            // Expected like: "3. divide, v. 中文释义"
            const afterNumber = trimmed.replace(/^\s*\d+\.?\s*/, '');
            const firstComma = afterNumber.indexOf(',');
            if (firstComma === -1) continue;
            const word = afterNumber.slice(0, firstComma).trim();
            const rest = afterNumber.slice(firstComma + 1).trim();
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

    getEmbeddedIELTSData() {
        // Sample IELTS data - in production, you'd embed the full 8000 words
        // For now, let's use a subset to demonstrate the functionality
        return `1. apprize, v.通知
2. nut, n. 坚果；螺母，螺帽
3. divide, v. 分，划分，分开；分配；(by)除
4. prosperity, n. 繁荣，兴旺
5. career, n. (个人的)事业；专业，生涯，职业，经历
6. disperse, v. 使散开,使疏开,使分散
7. limestone, n.石灰石
8. site, n. 位置 vt. 设置
9. avenge, v.报复
10. heighten, v. 加高,提高,增大
11. break, vt.打破；损坏；破坏；违反；中止；透露；闯 vi.破(裂)；休息 n.休息时间
12. pilgrimage, n.朝圣
13. abandon, v.放弃；抛弃；放纵
14. ability, n.能力；才能；技能
15. able, adj.能够的；有能力的；能干的
16. about, prep.关于；在...周围 adv.大约；到处
17. above, prep.在...上面；超过 adv.在上面 adj.上面的
18. abroad, adv.在国外；到国外；广泛地
19. absence, n.缺席；缺乏；不在
20. absolute, adj.绝对的；完全的；纯粹的
21. absorb, v.吸收；吸引；使全神贯注
22. abstract, adj.抽象的；理论的 n.摘要；抽象
23. abundant, adj.丰富的；充裕的；大量的
24. abuse, v.滥用；虐待；辱骂 n.滥用；虐待
25. academic, adj.学术的；学院的；理论的
26. accept, v.接受；承认；同意
27. access, n.接近；通道；机会 v.接近；使用
28. accident, n.事故；意外；偶然事件
29. accompany, v.陪伴；伴随；伴奏
30. accomplish, v.完成；实现；达到
31. account, n.账户；解释；叙述 v.解释；认为
32. accurate, adj.准确的；精确的；正确的
33. achieve, v.实现；达到；完成
34. acid, n.酸 adj.酸的；尖刻的
35. acknowledge, v.承认；确认；感谢
36. acquire, v.获得；学到；取得
37. across, prep.穿过；横过；在...对面
38. act, v.行动；表演；起作用 n.行为；法案
39. action, n.行动；动作；作用
40. active, adj.积极的；活跃的；主动的
41. activity, n.活动；行动；活跃
42. actor, n.演员；行动者
43. actual, adj.实际的；真实的；现行的
44. adapt, v.适应；改编；调整
45. add, v.添加；增加；补充
46. addition, n.加法；增加；附加物
47. adequate, adj.足够的；适当的；胜任的
48. adjust, v.调整；适应；校准
49. administration, n.管理；行政；政府
50. admit, v.承认；允许进入；录取
51. adopt, v.采用；收养；接受
52. adult, n.成年人 adj.成年的；成熟的
53. advance, v.前进；提前；预付 n.前进；进步
54. advantage, n.优势；利益；好处
55. adventure, n.冒险；奇遇；投机
56. advertise, v.做广告；宣传；通知
57. advice, n.建议；忠告；意见
58. advise, v.建议；劝告；通知
59. affair, n.事务；事件；风流韵事
60. affect, v.影响；感动；假装
61. afford, v.负担得起；提供；给予
62. afraid, adj.害怕的；担心的；恐怕
63. after, prep.在...之后；跟随 adv.后来 conj.在...之后
64. afternoon, n.下午；午后
65. again, adv.再次；又；重新
66. against, prep.反对；对着；逆着
67. age, n.年龄；时代；老化 v.变老
68. agency, n.代理；机构；作用
69. agent, n.代理人；特工；药剂
70. ago, adv.以前；之前
71. agree, v.同意；一致；适合
72. agreement, n.协议；同意；一致
73. ahead, adv.向前；提前；领先
74. aid, n.帮助；援助；助手 v.帮助
75. aim, v.瞄准；目标；打算 n.目标；目的
76. air, n.空气；天空；外观 v.通风；晾干
77. aircraft, n.飞机；飞行器
78. airport, n.机场；航空站
79. alarm, n.警报；惊恐；闹钟 v.使惊恐
80. album, n.相册；唱片集；集邮册
81. alcohol, n.酒精；酒；乙醇
82. alert, adj.警觉的；机警的 v.警告；使警觉
83. alien, n.外国人；外星人 adj.外国的；陌生的
84. alike, adj.相似的；相同的 adv.同样地
85. alive, adj.活着的；活跃的；存在的
86. all, adj.所有的；全部的 adv.完全地 pron.全部
87. allow, v.允许；准许；承认
88. almost, adv.几乎；差不多；将近
89. alone, adj.独自的；单独的；孤独的
90. along, prep.沿着；顺着 adv.一起；向前
91. already, adv.已经；早已；先前
92. also, adv.也；同样；此外
93. alter, v.改变；修改；变更
94. alternative, n.选择；替代品 adj.替代的；另类的
95. although, conj.虽然；尽管；即使
96. always, adv.总是；永远；一直
97. amazing, adj.令人惊异的；了不起的
98. among, prep.在...中间；在...之中
99. amount, n.数量；总额；价值 v.总计；等于
100. analysis, n.分析；解析；分解
101. ancient, adj.古代的；古老的；年老的
102. and, conj.和；与；而且
103. anger, n.愤怒；怒气 v.使愤怒
104. angle, n.角度；角；观点
105. angry, adj.愤怒的；生气的；狂暴的
106. animal, n.动物；牲畜；兽性的人
107. announce, v.宣布；宣告；通知
108. annual, adj.每年的；年度的；一年一次的
109. another, adj.另一个的；另外的 pron.另一个
110. answer, n.答案；回答；回应 v.回答；回应
111. anxiety, n.焦虑；担心；渴望
112. anxious, adj.焦虑的；渴望的；担心的
113. any, adj.任何的；一些的 pron.任何；一些
114. anyone, pron.任何人；无论谁
115. anything, pron.任何事；任何东西
116. anywhere, adv.任何地方；无论哪里
117. apart, adv.分开；分离；除外
118. apartment, n.公寓；房间；套房
119. apparent, adj.明显的；显然的；表面的
120. appeal, v.呼吁；吸引；上诉 n.呼吁；吸引力
121. appear, v.出现；似乎；显得
122. appearance, n.外观；出现；外表
123. apple, n.苹果；苹果树
124. application, n.应用；申请；申请书
125. apply, v.申请；应用；适用
126. appoint, v.任命；约定；指定
127. appreciate, v.欣赏；感激；理解
128. approach, v.接近；着手处理 n.方法；途径
129. appropriate, adj.适当的；合适的；恰当的
130. approval, n.批准；同意；赞成
131. approve, v.批准；赞成；同意
132. approximately, adv.大约；近似地
133. area, n.地区；面积；领域
134. argue, v.争论；辩论；说服
135. argument, n.争论；论据；理由
136. arise, v.出现；产生；起身
137. arm, n.手臂；武器；分支 v.武装
138. army, n.军队；陆军；大批
139. around, prep.在...周围；大约 adv.在周围；大约
140. arrange, v.安排；整理；排列
141. arrest, v.逮捕；阻止；吸引 n.逮捕
142. arrival, n.到达；到来；到达者
143. arrive, v.到达；到来；达成
144. art, n.艺术；美术；技巧
145. article, n.文章；物品；条款
146. artificial, adj.人工的；人造的；虚假的
147. artist, n.艺术家；画家；艺人
148. as, prep.作为；像...一样 conj.当...时；因为
149. ask, v.问；要求；邀请
150. asleep, adj.睡着的；麻木的
151. aspect, n.方面；外观；方向
152. assess, v.评估；评价；估价
153. assignment, n.任务；作业；分配
154. assist, v.帮助；协助；支持
155. associate, v.联系；交往 n.伙伴；同事
156. association, n.协会；联系；联想
157. assume, v.假设；承担；呈现
158. assumption, n.假设；假定；承担
159. assure, v.保证；使确信；保险
160. atmosphere, n.大气；气氛；环境
161. attach, v.附加；依恋；使依附
162. attack, v.攻击；袭击；抨击 n.攻击
163. attempt, v.尝试；企图 n.尝试；企图
164. attend, v.参加；出席；照料
165. attention, n.注意；关心；注意力
166. attitude, n.态度；姿态；看法
167. attract, v.吸引；引起；诱惑
168. attractive, adj.有吸引力的；迷人的
169. audience, n.观众；听众；读者
170. author, n.作者；作家；创始人
171. authority, n.权威；当局；权力
172. automatic, adj.自动的；无意识的
173. available, adj.可用的；可得到的；有效的
174. average, n.平均；平均数 adj.平均的；普通的
175. avoid, v.避免；避开；防止
176. awake, adj.醒着的；警觉的 v.醒来；唤醒
177. award, n.奖；奖品；判决 v.授予；判给
178. aware, adj.意识到的；知道的；有意识的
179. away, adv.离开；在远处；消失
180. awful, adj.可怕的；极坏的；令人敬畏的
181. baby, n.婴儿；宝贝；幼小动物
182. back, n.背部；后面 adv.回来；向后
183. background, n.背景；出身；经历
184. backward, adj.向后的；落后的 adv.向后
185. bacteria, n.细菌；微生物
186. bad, adj.坏的；严重的；不舒服的
187. bag, n.袋子；包；袋状物
188. balance, n.平衡；余额；天平 v.平衡
189. ball, n.球；舞会；子弹
190. band, n.乐队；带子；一群
191. bank, n.银行；河岸；存储库
192. bar, n.酒吧；条；障碍 v.禁止；阻挡
193. base, n.基础；底部；基地 v.以...为基础
194. basic, adj.基本的；基础的；简单的
195. basis, n.基础；根据；原则
196. battle, n.战斗；斗争；竞争 v.战斗
197. be, v.是；存在；成为
198. beach, n.海滩；沙滩；河滩
199. bear, n.熊；忍受 v.忍受；承担；生育
200. beat, v.打败；敲打；跳动 n.节拍；心跳`;
    }

    getDelimiters() {
        const termDelimiter = document.querySelector('input[name="termDelimiter"]:checked').value;
        const cardDelimiter = document.querySelector('input[name="cardDelimiter"]:checked').value;
        
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
        
        // Split by card delimiter
        const cards = text.split(cardDelim).map(card => card.trim()).filter(card => card);
        const data = [];
        
        for (const card of cards) {
            // Split by term delimiter
            const parts = card.split(termDelim);
            
            if (parts.length >= 2) {
                const front = parts[0].trim();
                const back = parts.slice(1).join(termDelim).trim();
                
                if (front && back) {
                    data.push({
                        front: front,
                        back: back,
                        category: 'imported'
                    });
                }
            }
        }
        return data;
    }

    updatePreview() {
        const text = this.wordListTextarea.value.trim();
        
        if (!text) {
            this.previewCount.textContent = '0';
            this.previewCardsContainer.innerHTML = '<div class="preview-placeholder">Nothing to preview yet.</div>';
            return;
        }
        
        try {
            const parsedData = this.parseSimpleText(text);
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
        const folderName = prompt('Enter folder name for IELTS vocabulary:');
        if (!folderName || !folderName.trim()) return;
        
        const trimmedName = folderName.trim();
        
        // Check if folder name already exists
        if (this.folders.some(folder => folder.name.toLowerCase() === trimmedName.toLowerCase())) {
            alert('A folder with this name already exists');
            return;
        }
        
        this.createFolder(trimmedName, 'IELTS vocabulary folder');
        
        // Update the import folder selector
        this.updateImportFolderSelector();
        
        // Select the newly created folder
        this.importTargetFolder.value = this.folders[this.folders.length - 1].id;
        
        this.showNotification(`Folder "${trimmedName}" created successfully! 📁`, 'success');
    }
    
    updateImportFolderSelector() {
        this.importTargetFolder.innerHTML = '<option value="default">Default Folder</option>';
        this.folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            this.importTargetFolder.appendChild(option);
        });
    }

    async handleImport() {
        const text = this.wordListTextarea.value.trim();
        
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
            
            const targetFolderId = this.importTargetFolder.value;
            let importedCount = 0;
            for (const row of parsedData) {
                this.addCard(row.front, row.back, row.category, null, targetFolderId);
                importedCount++;
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

    // Side Selection Methods
    openFlipSideSelection() {
        this.testModeSelectModal.classList.remove('active');
        this.flipSideSelectModal.classList.add('active');
    }

    closeFlipSideSelection() {
        this.flipSideSelectModal.classList.remove('active');
    }

    // Typing Folder Selection Methods
    openTypingFolderSelection() {
        this.testModeSelectModal.classList.remove('active');
        this.typingFolderSelectModal.classList.add('active');
        this.renderTypingFolderSelection();
    }

    closeTypingFolderSelection() {
        this.typingFolderSelectModal.classList.remove('active');
    }

    backToTypingFolderSelection() {
        this.typingSideSelectModal.classList.remove('active');
        this.typingFolderSelectModal.classList.add('active');
    }

    openTypingSideSelection() {
        this.typingFolderSelectModal.classList.remove('active');
        this.typingSideSelectModal.classList.add('active');
    }

    closeTypingSideSelection() {
        this.typingSideSelectModal.classList.remove('active');
    }

    backToTestModeSelection() {
        this.flipSideSelectModal.classList.remove('active');
        this.typingFolderSelectModal.classList.remove('active');
        this.typingSideSelectModal.classList.remove('active');
        this.testModeSelectModal.classList.add('active');
    }

    startFlipModeWithSide(startingSide) {
        this.closeFlipSideSelection();
        this.startFlipMode('card', startingSide);
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
        // Filter cards based on selected category and folder
        // If a card has no category property, default it to 'card'
        this.flipTestCards = this.cards.filter(card => {
            const cardCategory = card.category || 'card';
            const categoryMatch = cardCategory === category;
            
            // Filter by folder if a specific folder is selected
            if (this.selectedFolderId && this.selectedFolderId !== 'all') {
                const cardFolder = card.folder || 'default';
                return categoryMatch && cardFolder === this.selectedFolderId;
            }
            
            return categoryMatch;
        });
        
        if (this.flipTestCards.length === 0) {
            const categoryName = category === 'card' ? 'Cards' : 'Tests';
            const folderName = this.selectedFolderId === 'all' ? 'all folders' : 
                this.folders.find(f => f.id === this.selectedFolderId)?.name || 'selected folder';
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
        // Filter cards by selected folder
        if (this.typingSelectedFolderId === 'all') {
        this.typingTestCards = this.cards;
        } else {
            this.typingTestCards = this.cards.filter(card => {
                const cardFolderId = card.folderId || 'default';
                return cardFolderId === this.typingSelectedFolderId;
            });
        }
        
        if (this.typingTestCards.length === 0) {
            const folderName = this.typingSelectedFolderId === 'all' ? 'all folders' : 
                this.folders.find(f => f.id === this.typingSelectedFolderId)?.name || 'selected folder';
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
            incorrectCount: 0,
            unansweredCount: 0
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
        this.typingQuestion.innerHTML = this.typingSeeSide === 'front' ? card.front : card.back;
        this.typingAnswer.value = '';
        this.answerResult.style.display = 'none';
        this.typingCardNum.textContent = this.currentTypingIndex + 1;
        this.updateTypingProgress();
        
        // Add click handlers for hidden content
        this.addHiddenContentClickHandlers();
        
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
        const existingIndex = this.testResults.answers.findIndex(a => a.questionIndex === this.currentTypingIndex);
        const answerRecord = {
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
        if (this.currentTypingIndex > 0) {
            this.currentTypingIndex--;
            this.loadTypingCard();
        }
    }

    nextTypingCard() {
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
        // Calculate unanswered questions
        const totalQuestions = this.typingTestCards.length;
        const answeredCount = this.testResults.answers.length;
        this.testResults.unansweredCount = totalQuestions - answeredCount;
        
        // Calculate percentage
        const percentage = answeredCount > 0 
            ? Math.round((this.testResults.correctCount / totalQuestions) * 100) 
            : 0;
        
        // Update modal content
        this.gradePercentage.textContent = percentage + '%';
        this.totalQuestions.textContent = totalQuestions;
        this.correctAnswers.textContent = this.testResults.correctCount;
        this.incorrectAnswers.textContent = this.testResults.incorrectCount;
        this.unansweredQuestions.textContent = this.testResults.unansweredCount;
        
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

    closeTestResults() {
        this.testResultsModal.classList.remove('active');
    }

    retakeTest() {
        // Reset test results
        this.testResults = {
            answers: [],
            correctCount: 0,
            incorrectCount: 0,
            unansweredCount: 0
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
        this.cardFront.innerHTML = card.front;
        this.cardBack.innerHTML = card.back;
        this.currentCardNum.textContent = this.currentTestIndex + 1;
        this.flashcardInner.classList.remove('flipped');
        this.isFlipped = false;
        this.updateProgress();
        this.updateSideIndicator();
        
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

    createFolder(name, description = '') {
        const folder = {
            id: Date.now().toString(),
            name: name,
            description: description,
            createdAt: new Date().toISOString()
        };
        this.folders.push(folder);
        this.saveFolders(this.folders);
        this.renderFolders();
        this.updateFolderSelectors();
    }

    renderFolders() {
        this.folderList.innerHTML = '';
        
        this.folders.forEach(folder => {
            const folderElement = this.createFolderElement(folder);
            this.folderList.appendChild(folderElement);
        });
    }

    createFolderElement(folder) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder-item';
        folderDiv.dataset.folderId = folder.id;
        
        const cardCount = this.cards.filter(card => card.folderId === folder.id).length;
        
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
        
        // Get all folders to determine color index
        const allFolders = [
            { id: 'default', name: 'Default Folder' },
            ...this.folders.filter(f => f.id !== 'default')
        ];
        
        // Find the index of the current folder
        const folderIndex = allFolders.findIndex(f => f.id === folder.id);
        const colorIndex = folderIndex >= 0 ? folderIndex % folderColors.length : 0;
        const folderColor = folderColors[colorIndex];
        
        // Apply color border
        folderDiv.style.borderLeft = `3px solid ${folderColor}`;
        
        folderDiv.innerHTML = `
            <img src="books.png" alt="Folder" class="folder-icon" style="width: 16px; height: 16px;">
            <span class="folder-name">${folder.name}</span>
            <span class="folder-count">${cardCount}</span>
        `;
        
        folderDiv.addEventListener('click', () => this.selectFolder(folder.id));
        
        return folderDiv;
    }

    selectFolder(folderId) {
        this.currentFolder = folderId;
        this.currentCardIndex = 0; // Reset to first card when changing folders
        this.renderCards();
        this.updateFolderSelectors();
        
        // Update active folder visual state
        document.querySelectorAll('.folder-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-folder-id="${folderId}"]`).classList.add('active');
    }

    renderTypingFolderSelection() {
        this.typingFolderSelectionContainer.innerHTML = '';
        
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
        
        // Add "All Folders" option (with default gray color)
        const allFoldersDiv = document.createElement('div');
        allFoldersDiv.className = 'folder-option-card';
        allFoldersDiv.style.borderLeft = '4px solid #9e9e9e';
        allFoldersDiv.innerHTML = `
            <div class="folder-icon">
                <img src="card.png" alt="Card" style="width: 40px; height: 40px;">
            </div>
            <div class="folder-info">
                <div class="folder-name">All Folders</div>
                <div class="folder-description">Practice with cards from all folders</div>
            </div>
            <button class="btn btn-primary folder-select-btn">Select</button>
        `;
        allFoldersDiv.querySelector('.folder-select-btn').addEventListener('click', () => {
            this.typingSelectedFolderId = 'all';
            this.openTypingSideSelection();
        });
        this.typingFolderSelectionContainer.appendChild(allFoldersDiv);
        
        // Add individual folder options with colors
        const allFolders = [
            { id: 'default', name: 'Default Folder' },
            ...this.folders.filter(f => f.id !== 'default')
        ];
        
        this.folders.forEach(folder => {
            const folderDiv = document.createElement('div');
            folderDiv.className = 'folder-option-card';
            
            const cardCount = this.cards.filter(card => (card.folderId || 'default') === folder.id).length;
            
            // Get color for this folder
            const folderIndex = allFolders.findIndex(f => f.id === folder.id);
            const colorIndex = folderIndex >= 0 ? folderIndex % folderColors.length : 0;
            const folderColor = folderColors[colorIndex];
            
            // Apply color strip
            folderDiv.style.borderLeft = `4px solid ${folderColor}`;
            
            folderDiv.innerHTML = `
                <div class="folder-icon">
                    <img src="card.png" alt="Card" style="width: 40px; height: 40px;">
                </div>
                <div class="folder-info">
                    <div class="folder-name">${folder.name}</div>
                    <div class="folder-description">${cardCount} card${cardCount !== 1 ? 's' : ''}</div>
                </div>
                <button class="btn btn-primary folder-select-btn">Select</button>
            `;
            folderDiv.querySelector('.folder-select-btn').addEventListener('click', () => {
                this.typingSelectedFolderId = folder.id;
                this.openTypingSideSelection();
            });
            this.typingFolderSelectionContainer.appendChild(folderDiv);
        });
    }

    updateFolderSelectors() {
        // Update main folder dropdown
        this.folderSelect.innerHTML = '<option value="all">All Folders</option>';
        this.folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            if (folder.id === this.currentFolder) {
                option.selected = true;
            }
            this.folderSelect.appendChild(option);
        });
        
        // Update add card folder selector
        this.addCardFolder.innerHTML = '';
        this.folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            this.addCardFolder.appendChild(option);
        });
        
        // Update edit card folder selector
        this.editCardFolder.innerHTML = '';
        this.folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.id;
            option.textContent = folder.name;
            this.editCardFolder.appendChild(option);
        });
    }

    getCardsForCurrentFolder() {
        if (this.currentFolder === 'all') {
            return this.cards;
        }
        return this.cards.filter(card => card.folderId === this.currentFolder);
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
        this.showNotification(`Folder "${name}" created successfully! 📁`, 'success');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VocaBox();
});


