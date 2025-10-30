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
        this.updateListDropdownForHeader();
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
        this.listDropdown = document.getElementById('listDropdown');
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
        this.importIELTSFromLocalBtn = document.getElementById('importIELTSFromLocalBtn');
        this.ieltsLocalFile = document.getElementById('ieltsLocalFile');

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
        if (this.importIELTSFromLocalBtn && this.ieltsLocalFile) {
            this.importIELTSFromLocalBtn.addEventListener('click', () => this.ieltsLocalFile.click());
            this.ieltsLocalFile.addEventListener('change', (e) => this.handleImportIELTSFromLocal(e));
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

    // Optimized bulk add without save/render; call saveCards/render manually after batch
    addCardSilent(front, back, category = 'card', audioId = null, folderId = 'default') {
        this.cards.push({
            id: Date.now() + Math.random(),
            front: front,
            back: back,
            category: category,
            audioId: audioId || undefined,
            folderId: folderId,
            createdAt: new Date().toISOString()
        });
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
        // Show count for the current selection (folder or list), not global total
        const visibleCount = this.getCardsForCurrentFolder().length;
        this.cardCount.textContent = visibleCount;
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
            
            // One-click apply: always use the built-in dataset
            const text = this.getEmbeddedIELTSData();
            const parentFolderId = await this.importIELTSText(text, prefix);
            // Auto-select parent folder so users can see the dropdown with all lists
            if (parentFolderId) {
                this.selectFolder(parentFolderId);
                this.updateListDropdownForHeader();
            }
        } catch (err) {
            this.showCollectionsError('Failed to import IELTS collection: ' + err.message);
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
            return;
        }
        const prefix = (this.ieltsPrefixInput.value || 'IELTS 8000 - List').trim();
        try {
            const text = await this.readFileAsText(file);
            await this.importIELTSText(text, prefix);
        } catch (err) {
            this.showCollectionsError('Failed to read local file: ' + err.message);
        } finally {
            this.ieltsLocalFile.value = '';
        }
    }

    async fetchLocalCollectionText(path) {
        const resp = await fetch(path, { cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return await resp.text();
    }

    async importIELTSText(text, prefix) {
        const items = this.parseIELTSFormat(text);
        if (items.length === 0) {
            this.showCollectionsError('No items parsed from IELTS collection.');
            return;
        }
        
        // Extract parent name from prefix (e.g., "IELTS 8000 - List" -> "IELTS 8000")
        const parentName = prefix.replace(/\s*-\s*List\s*$/, '').trim() || prefix.split(' - ')[0] || 'IELTS 8000';
        // If parent exists, wipe its child lists and cards to avoid duplication on re-import
        let parentFolder = this.folders.find(f => !f.parentFolderId && f.name === parentName);
        if (parentFolder) {
            const legacyPrefix = `${parentName} - List `;
            const childFoldersExisting = this.folders.filter(f => f.parentFolderId === parentFolder.id || f.name.startsWith(legacyPrefix));
            const childIds = new Set(childFoldersExisting.map(f => f.id));
            // Remove cards in those child folders
            this.cards = this.cards.filter(c => !childIds.has(c.folderId));
            // Remove child folders
            this.folders = this.folders.filter(f => !childIds.has(f.id));
            this.saveCards();
            this.saveFolders(this.folders);
        } else {
            // Create parent if not exists
            this.createFolder(parentName, 'IELTS vocabulary collection', null);
            parentFolder = this.folders[this.folders.length - 1];
        }
        const parentFolderId = parentFolder.id;
        
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
            
            // Bulk add silently to avoid repeated renders/saves
            chunk.forEach(row => {
                this.addCardSilent(row.front, row.back, 'card', null, folder.id);
            });
            created += chunk.length;
        });
        
        // Save folders after creating all child folders
        this.saveFolders(this.folders);
        
        // Single save + render after batch
        this.saveCards();
        this.renderFolders();
        this.renderCards();
        this.updateCardCount();
        this.closeCollectionsModal();
        this.showNotification(`Imported ${created} words into ${chunks.length} lists.`, 'success');
        return parentFolderId;
    }

    // Remove any cards under a given parent folder that are not present in the embedded IELTS dataset,
    // and de-duplicate by exact front+back pair (keep first occurrence)
    cleanIELTSCollection(parentName = 'IELTS 8000') {
        const parent = this.folders.find(f => !f.parentFolderId && f.name === parentName);
        if (!parent) return { removed: 0, kept: 0 };
        const legacyPrefix = `${parent.name} - List `;
        const childFolders = this.folders.filter(f => f.parentFolderId === parent.id || f.name.startsWith(legacyPrefix));
        const childIds = new Set(childFolders.map(f => f.id));
        const allowedRows = this.parseIELTSFormat(this.getEmbeddedIELTSData());
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
        // Full IELTS 8000 vocabulary - built-in dataset (8624 words)
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
11. punctual, a. 准时的,严守时刻的
12. wagon, n. 运货马车，运货车；敞蓬车厢
13. philosophy, n. 哲学，哲理，人生观，价值观，世界观
14. queer, a. 奇怪的,不平常的;可疑的;眩晕的,不舒服的
15. grief, n. 悲伤，悲痛；悲伤的事，悲痛的缘由
16. ascent, n.上升, (地位, 声望等的)提高, 攀登, 上坡路
17. prejudice, n. 偏见,成见;(法律)损害,伤害
18. aristocracy, n.贵族阶层
19. remnant, n. 残余,剩余
20. telegraph, n. 电报机，电报v. 打电报，发电报
21. catching, adj.(接触)传染的, 有魅力的, 迷人的
22. break, vt. 打破；中止；违反vi. 破(裂)n. 休息时间
23. unstable, a.不稳固的；不稳定的
24. contemplate, vt. 仔细考虑;注视;打算;预计
25. certificate, n. 证(明)书，执照
26. curve, n. 曲线;v. 弄弯,成曲线
27. textual, adj.课文的，正文的
28. pan, n. 平底锅，盘子，面板
29. pilgrimage, n.朝圣
30. waterfront, n.水边，滩
31. channel, n. 海峡，水道；信道，波道；路线，途径
32. irrespective, a. 不考虑的,不顾的
33. bamboo, n. 竹
34. prosperous, a. 繁荣的，兴旺的，茂盛的，顺利的
35. ago, ad. (常和一般过去时的动词连用)以前，…前
36. outbreak, n. 爆发
37. slipper, n. 便鞋，拖鞋
38. helpful, a. (to)有帮助的，有益的，有用的
39. rivalry, n.竞争，对抗
40. ditch, n. 排水沟,沟渠 v. 坠入沟中,抛弃
41. quagmire, n.沼泽, 湿地
42. continent, n. 大陆，洲;adj. 有节制的；节制欲望的
43. recital, n.朗诵, 背诵, 叙述, 独奏会, 独唱会
44. tradesman, n.商人；手艺人
45. swerve, v.突然转向。n.转向
46. dusty, adj.沾满灰尘的
47. smoke, n. 烟，烟尘；吸烟，抽烟v. 抽(烟)；冒烟，冒气
48. flare, vi./n. 熊熊燃烧,突然燃烧,火光;v./n. (衣裙等)张开
49. handkerchief, n. 手帕
50. Leninism, n.列宁主义
51. uprising, n.起义, 升起
52. characteristical, adj.特征的
53. superintend, v.主管, 指挥, 管理, 监督
54. learning, n. 知识，学问；学习
55. vex, vt. 使烦恼,使苦恼
56. literacy, n. 识字,读写能力
57. veteran, n. 老手，老兵
58. connect, vt. 连接；与…联系，接通(电话)vi. 连接
59. lunch, n. 午餐，(美)便餐
60. several, a. 几个，若干，数个；各个的，各自的
61. making, n.制造, 发展, 素质
62. brightness, n.明亮，辉煌，聪明
63. waste, v. 浪费a. 无用的；荒芜的n. 浪费；废物
64. crumble, v. 弄碎,灭亡,消失
65. ninth, num.第九；九分之一
66. entirety, n.全部
67. present, a. 出席的，现在的n. 现在，礼物v. 赠送，提出
68. vest, n. 背心，马甲；汗衫，内衣
69. revival, n.复苏，再生
70. pasture, n./v. 牧场,放牧
71. application, n. 申请，请求，申请书；应用，实施，实用性
72. crystal, n. 水晶,水晶饰品,质量最好的玻璃器皿,结晶体
73. fast, a. 快的，迅速的；坚固的ad. 紧紧地；迅速地
74. pick, v. 拾，采，摘；挑选，选择n. 镐，鹤嘴锄
75. distress, n./vt. 悲痛,忧伤;贫苦;危难
76. gratify, v.使满足，使高兴
77. poll, n. 民意测验；(pl.)政治选举v. 获得…选票
78. soda, n. 苏打，汽水
79. robbery, n.抢劫，劫掠，盗取
80. equivalence, n.相等，等值
81. rehearse, v.排练
82. leather, n. 皮革，皮革制品
83. expressly, adj.明确表示的
84. tentacle, n.(动物)触须、触角, (植物)腺毛
85. uncertainty, n.不定，易变
86. glycerin, n.甘油, 丙三醇
87. board, n./v. 长木板;有专门用途的木板;理事会;伙食,登 (车、船 、机等),提供膳食
88. son, n. 儿子；孩子(长者对年青或年幼男子的称呼
89. cartridge, n.弹药筒，子弹；软片
90. rake, n. 耙子，耙机v. 耙；搜索，探索
91. coral, n.珊瑚, 珊瑚虫
92. elapse, vi. (时间)流逝
93. lawful, adj.合法的，法律的
94. grove, n.林子，小树林，园林
95. November, n. 十一月
96. appraise, v.评价
97. oral, a. 口头的
98. partake, vt.分担, 共享。vi.共享, 参与, 带有
99. comprise, vt. 包含,包括
100. soar, vi. 剧增;高飞;高涨;屹立
101. household, n. 家庭，家人a. 家庭(务)的，家常的
102. advertisement, n.广告；公告；登广告
103. hydrogen, n. 氢气
104. beginner, n.初学者，生手
105. trap, n. 陷阱;圈套;双轮轻便马车
106. ultimatum, n.最后通谍
107. cashier, n. 出纳员
108. barometer, n. 气压计,晴雨表
109. billion, num./n. (美)十亿，(英)万亿
110. sword, n. 剑，刀；武力
111. negation, n. 否定,否认
112. metropolitan, a. 首都的，主要都市的，大城市
113. discover, v. 发现，显示
114. distortion, n.弄歪，歪曲；畸变
115. recommend, v. 推荐，介绍；劝告，建议
116. excavate, v.挖掘, 开凿, 挖出, 挖空
117. aimless, adj.无目的的
118. optimum, a. 最适宜的
119. rotate, v. 旋转,轮流
120. undertaking, n.任务，事业；许诺
121. malaise, n.不舒服
122. attentive, a.注意的；有礼貌的
123. outskirts, n. (尤指城市)郊区
124. horn, n. (牛羊等的)角；号，喇叭；角状物；角制品
125. its, pron.它的
126. baggy, adj.袋状的
127. oceanography, n.海洋学
128. dine, v. 吃饭,进餐
129. growth, n. 生长，增长，发展
130. jump, v./n. 跳跃，跳动，跳过；暴涨，猛增
131. verdict, n.[律](陪审团的)裁决, 判决, 判断, 定论, 结论
132. synopsis, n.大纲
133. canvas, n. 粗帆布,油画布
134. suppress, vt. 镇压;禁止发表;抑制(感情等);阻止…的生长
135. lighten, vt.照亮，使明亮
136. cow, n. 母牛，奶牛
137. defendant, n.被告。adj.辩护的, 为自己辩护的
138. solvent, a. 能偿还的,溶解的;n. 溶剂,偿付能力
139. floor, n. 地板，(楼房)的层
140. mask, n. 面具,口罩;vt. 遮蔽,伪装
141. aspire, vi.热望, 立志
142. chronological, adj.按年代顺序排列的
143. hang, v. 悬挂，垂吊；吊死，绞死
144. bushel, n.蒲式耳(容量单位
145. humble, a. 谦卑的,恭顺的;地位低下的;简陋的;vt. 使卑下,贬抑
146. upstairs, ad. 向楼上；在楼上；上楼ad. 楼上的
147. celebrate, vt. 庆祝；颂扬，赞美vi. 庆祝，过节
148. iron, n. 铁，铁制品，烙铁，熨斗v. 熨(衣)，熨平
149. rust, n./v. 锈;生锈;荒废
150. violate, vt
151. crop, n. 作物，庄稼；(谷类等的)一熟收成；一批，大量
152. blindfold, n, 眼罩, 障眼物。vt.将...眼睛蒙起来, 蒙骗。adj.看不
153. ignorant, a. 无知的，愚昧的；不知道的
154. hinder, vt. 阻碍,阻止
155. starch, n.淀粉, [喻] 拘谨, 古板, 生硬
156. solo, n. 独奏;独唱
157. melon, n. 甜瓜
158. explanatory, adj.说明的
159. animate, v.使有活力，激活
160. spontaneous, a. 自发的,无意识的;自然的,天真率直的
161. strategic, a. 战略的,战略方针的
162. amphibian, adj.两栖类的, 水陆两用的。n.两栖动物, 水陆两用飞机, 水陆两用的平底车辆
163. funny, a. 滑稽的，可笑的
164. advantageous, a.有利的，有助的
165. cotton, n. 棉花；棉线，棉纱；棉制品
166. peace, n. 和平；平静，安宁
167. constitute, vt. 组成，构成，形成；设立，建立，任命
168. barge, n.驳船；大型游船
169. quietness, n.平静，安定，安静
170. inverse, a. 相反的，倒转的，反转的n. 相反之物
171. reader, n. 读者；读本，读物；(英国的)大学讲师
172. plot, n. 小块土地;阴谋;情节;vt. 绘制,标绘;密谋,策划
173. drench, vt. 使淋透,使湿透
174. pharmaceutist, n.药师, 药剂师
175. pharmaceutical, n.药物。adj.制药(学)上的
176. hesitant, adj.犹豫的
177. gorge, n.咽喉，峡谷，山口
178. regime, n. 政体,政权,政治制度
179. past-due, adj.过期的
180. recall, vt./n. 召回;回忆
181. needful, adj.必要的
182. scornful, adj.蔑视的，轻视的
183. murder, v./n. 谋杀，凶杀
184. briefing, n.简要情况
185. brag, v.吹嘘，夸口
186. siren, n. 警报声，警报器
187. abide, vi. (by)遵守，坚持；(abode)持续，住，逗留vt. 容忍
188. vocabulary, n. 词汇，词汇量；词汇表
189. unwelcome, adj.不受欢迎的
190. inducement, n.诱导，动机
191. haven, n.港口, 避难所
192. rigorous, a. 严格的，严厉的，严酷的，严密的，严谨的
193. resentful, adj.不满的，怨恨的
194. preoccupy, v.使迷住，专心于
195. jewel, n. 宝石，宝石饰物
196. accessible, adj.可接近的
197. hinterland, n.内地
198. cohesive, a. 粘合性的，有结合力的
199. misconceive, v.误解
200. analogy, n. 类似，相似，类比，类推
201. appreciably, adv.相当大地
202. divorce, v./n. 离婚，分离
203. sermon, n.布道，讲道，说教
204. piggyback, adj.骑在背肩上的。adv.在背上, 在肩上
205. barely, ad. 赤裸裸地，无遮蔽地；仅仅，勉强，几乎没有
206. accessory, n. 同谋者;附件
207. resemblance, n. 相似，相似性[点，物
208. unwarranted, adj.无根据的
209. citizenship, n.公民权
210. flutter, v./n. 振翼;颤动,(心脏)不规则跳动
211. approval, n. 批准;赞同,认可
212. noun, n. 名词
213. next, a. 紧接的，其次的；贴近的ad. 其次；居后
214. bathe, v./n. 浸到水中,游泳
215. angel, n. 天使，安琪儿
216. scorch, vt./vi. 烧焦,烤焦,枯萎
217. via, prep. 径,由
218. nautical, adj.船员的, 船舶的, 海上的, 航海的, 海军的
219. yearn, vi. 想念,渴望
220. truant, n.逃避者。adj.逃避
221. frog, n. 蛙
222. brain, n. (大)脑，骨髓；(pl.)脑力，智能
223. commitment, n.责任
224. sectional, adj.可组合的
225. adhere, vi. 粘着;坚持;忠于
226. amount, vi./n. 等于,总数,数量
227. aural, a. 听觉的，听力的
228. marvel, n.奇迹；惊奇vt.惊奇
229. accrue, v.产生，发生
230. ballet, n. 芭蕾舞,芭蕾舞演员
231. maths, n.(英)数学
232. assistant, a. 帮助的，辅助的n. 助手，助教；辅助物
233. dumping, n.倾销
234. package, n. 包装，包裹，箱，包装费，标准部件，成套设备
235. alignment, n.队列；结盟，联合
236. converse, v.谈话，对话，交往
237. loll, v.懒洋洋地倚靠
238. incorrect, a.不正确的，错误的
239. system, n. 系统，体系；制度；方法，方式，步聚
240. idiot, n. 白痴
241. plentiful, a. 富裕的，丰富的
242. hereby, adv.以此
243. fringe, n. 边缘；(窗帘)缘饰；额前垂发vt. 饰…的边
244. hairpin, n.发卡
245. vein, n. 血管；静脉；叶脉；纹理；情绪vt. 使成脉络
246. willingly, adv.乐意地，自愿地
247. construe, v.翻译，解释
248. exert, vt. 发挥,行使,尽力
249. victorious, a.胜利的，得胜的
250. weather, n. 天气，气象
251. painstaking, n.苦干, 辛苦。adj.辛苦的, 辛勤的, 艰苦的
252. walk, v. 走，步行，散步；走遍n. 走，步行，散步
253. nickel, n. 镍,美国五分镍币
254. acknowledgment, n.承认，鸣谢，回执
255. controversy, n. 争论，辩论，争吵
256. probe, n./v. 医学探针;新闻调查;探测
257. adorn, v.装饰，佩带
258. not, ad. 不，不是，不会；没有
259. courteous, adj.有礼貌的
260. preach, vt./vi. 传教;讲道;劝诫;鼓吹
261. military, a. 军事的，军用的，军队的
262. shame, n. 羞耻，耻辱；可耻的人(或事物)v. 使羞愧
263. African, a.非洲的 n.非洲人
264. platform, n. 月台,站台,讲台,(政党的)政纲,党纲
265. deficiency, n. 缺乏,不足;缺陷
266. foul, a. 恶臭的;邪恶的;暴风雨的;n. (体育)犯规;v. 弄脏,玷 污;(使)缠结,犯规
267. against, prep. 对着，逆；反对；违反；紧靠着；对比
268. flaunt, n.招展, 招摇, 炫耀, 飘扬。v.挥动, 夸耀, 炫耀, 飘扬
269. gang, n. 一组,一队,(罪犯等)一帮,一群
270. registered, adj.登记的，注册的
271. retire, v. 退休，引退；退却，撤退；就寝
272. teaching, n.教学，讲授；教导
273. poliomyelitis, n.小儿麻痹症, 急性骨髓灰白质炎
274. colonel, n. (陆军)上校
275. dance, n. 舞(蹈)；舞曲，舞会v. 跳舞；跳动
276. microphone, n. 话筒，扩音器
277. drunkard, n.醉鬼
278. curiosity, n. 好奇心；古董，古玩
279. ceramic, adj.陶器的。n.陶瓷制品
280. human, a. 人的，人类的n. 人
281. contend, v.斗争, 竞争, 主张
282. fellowship, n. 交情,团体,奖学金
283. job, n. 工作，职位；零活，一件工作；任务，职责
284. consider, v. 考虑，细想；体谅，顾及；认为，把…看作
285. superb, a. 壮丽的,头等的
286. room, n. 房间，室，空间，地方；余地
287. handsome, a. 漂亮的,大方的
288. twenty, num. 二十pron./a. 二十(个，只
289. prefix, n.前缀
290. cocaine, n.古柯碱,可卡因
291. bottom-line, n.末行数字，结果
292. exasperate, v. 激怒,使恼火
293. impressive, a. 给人深刻印象的,惊人的
294. synthesis, n. 综合,合成法,合成物
295. jazz, n. 爵士乐
296. mainland, n. 大陆，本土
297. brewery, n.酿酒厂
298. penetration, n.穿入；渗透，侵入
299. contractual, adj.合同的，契约的
300. pioneering, n.先驱的
301. tease, vt. 取笑,嘲笑;戏弄
302. Mrs, n.(缩)夫人，太太
303. devastating, adj.破坏性的, 全然的
304. motion, n. 运动,动态;手势,眼色,姿势;提议;动议
305. stroll, n./v. 漫步；散步；游荡
306. cost, n.成本，费用v.花费
307. reference, n. 证明;出处;参照
308. dusk, n. 薄暮，黄昏
309. stool, n. 凳子；(pl.)大便
310. accede, v.同意
311. ambition, n. 雄心,抱负
312. lesson, n. (功)课；[pl
313. deprive, vt. 剥夺,使丧失
314. some, a. 几个；一些；有些；某(人或物)pron. 一些
315. auction, n./vt. 拍卖
316. thanks, n.感谢 int.谢谢
317. cracker, n.苏打饼干，克力架
318. locomotive, a. 运动的,移动的 n. 火车头
319. agreeable, a. 令人愉快的;欣然同意的
320. optimistic, a. 乐观主义的
321. mislead, v. 把…带错路，使误入岐途
322. meteoric, adj.流星的, 疾速的, 大气的, 辉煌而短暂的
323. Islam, n.伊斯兰教，回教
324. overpayment, n.多付的款项
325. outrage, n. 暴行，侮辱，愤怒v. 凌辱，引起…义愤，强奸
326. then, ad. 当时，在那时；然后，于是；那么，因而
327. friendly, a. 友好的，友谊的
328. house, n. 房屋；商业机构；[H
329. razor, n. 剃刀
330. communicate, v. 传达，传送；交流；通讯，通话
331. vaccination, n.接种
332. starting, n.出发，开始
333. prevail, vi. 流行,盛行
334. reportage, n.报告文学
335. colonialism, n.殖民主义
336. impractical, v.不可行的
337. assistance, n. 协作；援助；帮助
338. hanger, n.衣架
339. reinforcement, n.加强，援兵
340. bookshelf, n.书架
341. disentangle, vi.解脱, 解开纠结, 松开, 解决(纠纷)。vt.解开, 松开
342. tragedy, n. 悲剧；惨事，灾难
343. empty, a. 空的；空洞的v. 倒空，使成为空的
344. matrimony, n.结婚
345. reality, n. 现实，实际；真实
346. specify, v. 指定，详细说明
347. nomination, n.提名，任命
348. metro, n.伦敦地下铁道, 地下铁道
349. neither, a. 两者都不pron. 两者都不ad. 也不
350. exquisite, a. 优美的,精巧的
351. sclerosis, n.[医]硬化症, 硬化, 硬结
352. knowledgeable, adj.博学的
353. cherry, n. 樱桃(树
354. trademark, n. 商标；特征vt. 注册的…商标
355. banana, n. 香蕉
356. goddess, n.女神；绝世美女
357. astronomy, n. 天文学
358. loose, a. (宽)松的；不精确的；自由的，散漫的
359. health, n. 健康，健康状况；卫生
360. cigar, n. 雪茄烟
361. yarn, n.纱, 纱线, 故事, 奇谈
362. modish, adj.流行的, 时髦的
363. calm, a. (天气，海洋等)静的n. 平静v. (使)平静
364. summarize, v. 概括，总结
365. introductory, adj.介绍的，入门的
366. stewardess, n.空中小姐，女乘务员
367. merciful, a.仁慈的，宽大的
368. sovereignty, n.主权
369. telefax, n.传真v.发传真
370. food, n. 食物，粮食，养料
371. hop, v./n. 单足跳,弹跳
372. adverse, a. 不利的;逆的;(天气)恶劣的
373. percussion, 打击乐器
374. tonnage, n.吨位，吨数
375. confine, vt. 限制;禁闭
376. certify, v. (发给证书)证明;证实
377. composition, n. 作品，作文，乐曲；作曲；结构，组成，成分
378. hence, ad. 从此地,从此时,因此
379. orderly, a. 有秩序的,整齐的,有条不紊的
380. invade, vt. 侵略,侵犯,蜂拥而至
381. plasma, n.[解]血浆, 乳浆,[物]等离子体,等离子区
382. emigrate, vi. 移居国外
383. vehement, adj.激烈的, 猛烈的, (情感)热烈的
384. rich, a. 富的，有钱的；富饶的；(in)充足的，丰富的
385. lonesome, adj.寂寞的
386. encyclopaedia, n.百科全书
387. whichever, pron./a. 无论哪个，无论哪些
388. coat, n. 上衣，外套；表皮；层，覆盖物v. 涂(盖)上
389. componential, adj.成分的
390. manipulate, vt. 操纵,控制;(熟练地)操作,使用
391. drowse, n.困，瞌睡。vi.打瞌睡。vt.使瞌睡
392. miser, n.守财奴，吝啬鬼
393. furious, a. 狂怒的
394. competitiveness, n.竞争能力
395. impede, v.阻止
396. canvass, v.游说
397. near, a. 近的，接近的；亲近的prep. 靠近ad. 接近
398. justification, n.辩护，正当理由
399. face, n. 脸，面貌；表情；正面v. 面对着；朝，面向
400. bloc, n.为某种共同目的而采取一致行动的政治组织, 集团
401. biologist, n.生物学家
402. radial, a.光线的；放射的
403. wordy, adj.冗长的，罗嗦的
404. continuance, n.连续
405. slay, v.屠杀
406. manual, a. 手工的,用手的;n. 手册;便览
407. communication, n. 通讯,交往,交流,传达的消息,交通
408. restock, v.重新进货,再储存
409. subtraction, n.减法，减去
410. innocuous, adj.无害的, 无毒的, 无伤大雅的, 不得罪人的
411. tremor, n.震动, 颤动。vi.震颤, 战栗
412. clearance, n. 清除,清理,净空;许可
413. mention, v./n. 提及，说起
414. longing, n.渴望a.显示渴望的
415. optics, n.光学
416. asterisk, n.星号
417. papercut, n.剪纸，刻纸
418. conversant, adj.精通的，有交情的
419. sudden, a. 出乎意料的，突然的
420. universal, a. 普遍的,全体的,全球的
421. cultivate, vt. 耕作,养植,栽培;培养,陶冶,发展
422. dense, a. 浓密的,密集的,愚笨的
423. slavery, n.奴隶制度；苦役
424. protective, a.保护的，防护的
425. again, ad. 再次，另一次；重新；除此，再，更，还
426. loneliness, n.孤独，寂寞
427. gloom, n.黑暗，忧郁
428. insure, vt. 保险，给…保险；保证
429. pit, n. 坑;凹部;修理站
430. Australia, n.澳大利亚
431. negligence, n.疏忽，过失
432. curb, n./vt. 勒马的皮带;控制,约束
433. cultural, adj.文化的
434. idol, n.偶像，被崇拜的人
435. instructive, adj.指示的，教育的
436. susceptible, adj.易受影响的, 易感动的, 容许...的。n.(因缺乏免疫力 而)易得病的人
437. boarding school, n.寄宿学校
438. emerge, vi. 出现,浮现,暴露
439. hundredth, num.第一面，百分之一
440. despatch, v.n.派遣
441. explosion, n. 爆炸，爆发
442. shove, vt. 乱推；乱塞vi. 用力推，挤n. 猛推
443. Frenchman, n.法国人
444. listener, n.听者，听众之一
445. deception, n.欺诈
446. blur, v.涂污, 污损(名誉等), 把(界线,视线等)弄得模糊不清
447. compartment, n.间隔间, 车厢
448. bomb, n. 炸弹v. 投弹于，轰炸
449. burglar, n. (入室行窃的)盗贼
450. strive, vi. 斗争,努力,奋斗
451. darken, v.变黑，转暗
452. grammatical, a.语法上的
453. afraid, adj. 害怕的，恐惧的；犯愁的，不乐意的
454. fervent, a. 热情的,热烈的
455. irritation, n.刺激，恼怒
456. clarity, n.清楚, 透明
457. maniac, adj.发狂的, 癫狂的, 疯狂的。n.[医]燥狂(症)者, 疯子, 一种高速电子数字计
458. ball-pointpen, n.圆珠笔
459. hose, n. 输水软管;长统袜;vt. 浇(园子),用水管冲洗(汽车等
460. incomplete, a.不完全的，未完成的
461. typist, n. 打字员
462. potluck, n.家常便饭
463. with, prep. 跟…一起；用；具有；关于；因；随着
464. fever, n. 发热，狂热
465. mumps, n.腮腺炎
466. bubble, n. 气泡,泡沫
467. China, n. 瓷器
468. sulphur, n.硫磺
469. exhilarate, vt.使高兴, 使愉快
470. post, v. 贴出；公告；投寄n. (支)柱；邮政，邮寄；职位
471. morality, n. 道德,美德;伦理体系
472. evenly, ad.一致地，平静地
473. bowling, n. 保龄球运动
474. devastate, vt.毁坏
475. evident, a. 明显的，明白的
476. friend, n. 朋友
477. indirectly, adj.间接地
478. warfare, n. 战争(状态)；斗争；冲突
479. marked, adj.有标记的，标明的
480. payable, adj.支付给的
481. enemy, n. 敌人，仇敌，反对者；敌人，敌军，敌国
482. adjudicate, v.判决, 宣判, 裁定
483. objective, a. [哲
484. sew, v. 缝，缝纫
485. esteem, n./vt. 尊重,珍重
486. westward, a.向西的 ad.向西
487. maintenance, n. 维修，保养，维持，保持，生活费用
488. chase, v./n. 追逐,追赶;雕镂
489. accounting, n.会计学
490. wring, vt.拧，挤，扭，榨
491. mistaken, adj.搞错了的，误解的
492. confuse, vt. 使困惑;混淆
493. innumerable, a. 数不清的
494. null, adj.无效力的, 无效的, 无价值的, 等于零的。n.零, 空
495. everlasting, a. 永久的,永恒的
496. fluency, n.流利，流畅
497. forecast, vt./n. 预报,预测
498. melody, n. 旋律，曲调；悦耳的音乐
499. sigh, v./n. 叹气
500. cellular, adj.细胞的
501. mechanically, ad.机械地
502. trolley, n. 手推车；(英)无轨电车，(美)有轨电车
503. precinct, n.区域, 围地, 范围, 界限, 选区
504. positively, ad.确定的，断然
505. polymer, n.聚合物，多聚物
506. cramp, n.抽筋, 腹部绞痛, 月经痛。adj.狭窄的, 难解的。vt.使 抽筋, 以铁箍扣紧
507. Dutch, n.荷兰人, 荷兰语。adj.荷兰的, <俚> 德国的, 条顿民族
508. disreputable, adj.声名狼藉的, 破烂不堪的
509. drift, n. 漂流,漂流物,大概意思,趋势;v. 漂流,流浪
510. politician, n. 政治家，政客
511. balcony, n. 阳台,剧院楼厅
512. antique, a./n. 古代的,古玩,古物
513. monument, n. 纪念碑，纪念馆，遗迹，不朽的业绩
514. hospitality, n. 好客,殷勤
515. elated, adj.兴高采烈的, 得意洋洋
516. typewriter, n. 打字机
517. bitterness, n.苦味，辛酸，苦难
518. carrot, n. 胡萝卜
519. bilingual, adj.能说两种语言的
520. manhole, n.(锅炉, 下水道供人出入检修用的)人孔, 检修孔
521. foolish, a. 愚笨的，愚蠢的
522. solvency, n.偿付能力
523. infirmary, n.医院, 医务室<美>养老院, 救济院
524. importance, n. 重要，重要性
525. countenance, n.容貌，支持
526. connection, n. 联系，连接；亲戚，社会关系
527. oppression, n.压迫
528. arms, n.武器
529. beard, n.胡须
530. pregnancy, n.怀孕
531. baron, n.男爵；贵族；巨商
532. risky, adj.有风险的，冒险的
533. rip, v./n. 撕裂,撕开;扯破
534. champion, n. 冠军;拥护;vt. 支持,拥护;保卫
535. unlike, a. 不同的，不相似的prep. 不象，和…不同
536. enormous, a. 庞大的,巨大的
537. accordingly, ad. 相应地，照着办，按照；于是，因此
538. nuance, n.细微差别
539. foretell, v.预告，预言
540. mold, n.模子, 铸型。vt.浇铸, 塑造
541. shortage, n. 不足，缺少
542. brilliant, a. 光辉的,英明的
543. ovation, n.热烈欢迎, 大喝采, 大受欢迎, 欢呼
544. specimen, n. 标本,样品,样张;试样
545. soy, n.酱油；大豆，黄豆
546. gaol, n.监狱
547. road, n. 路，道路，途径
548. dumb, a. 哑的,暂不说话的,愚笨的
549. crucial, adj.至关紧要的
550. reliant, adj.信赖的, 依靠的, 信赖自己的
551. hopeful, a. 给人希望的，抱有希望的
552. invader, n.入侵者
553. drag, v. 拖，拖曳
554. packaging, n.包装
555. mien, n.风度
556. spotlight, n.聚光灯
557. genocide, n.有计划的灭种和屠杀
558. overcast, adj.多云的
559. dilute, vt. 使变淡,稀释;a. 稀释的
560. fragile, a. 易碎的，脆的，易损坏的；虚弱的，脆弱的
561. fabric, n. 织物;构造,结构
562. smuggling, n.走私
563. English, n.英语 a.英国人的
564. laden, adj.装满的, 负载的, 苦恼的。vbl.lade的过去分词
565. exhaustion, n.用尽，详述
566. virtue, n. 德行，美德；贞操；优点；功效，效力
567. applicant, n. 申请人,请求者
568. situation, n. 形势，处境，状况；位置，场所；职位，职务
569. industrial, a. 工业的，产业的
570. park, n. 公园，停车场，运动场v. 停放(汽车等)，寄放
571. highlight, n.加亮区, 精彩场面, 最显著(重要)部分。vt.加亮, 使显 著, 以强光照射, 突出
572. tight, a. 紧的；紧身的，装紧的；密封的ad. 紧紧地
573. A.M, 缩)上午
574. stubborn, a. 顽固的;难对付的
575. indifference, n.冷淡，不关心
576. macabre, adj.恐怖的, 令人毛骨悚然的, 以死亡为主题的
577. injustice, n.不公正
578. frustrate, vt. 使灰心;挫败,阻挠
579. backward, a. 向后的，倒行的；迟钝的ad. 向后，朝反方向
580. obliterate, adj.删去，抹掉
581. utility, n. 有用,实用;公用事业(煤气,水电
582. carrier, n. 运货人;带菌者;运输军队的交通工具
583. resident, n. 居民，常住者a. 居住的
584. cubism, n.立体主义
585. aggressive, a. 侵略的;有进取心的
586. infant, n. 婴儿
587. terrace, n. 斜坡地,梯田;看台,大阶梯
588. bike, n.自行车 vi.骑自行车
589. anyone, pron. (用于疑问句，否定式)任何人
590. ploy, n.策略, 趣味, 工作
591. vacation, n. 假期
592. plenary, adj.完全的,绝对的 n.全体会议,全会
593. negotiation, n.谈判
594. cardinal, a. 主要的,基本的;n. 深红色;基数
595. anyway, ad. 不管怎么说，无论如何；不论以何种方式
596. permission, n. 允许，同意
597. jail, n. 监狱
598. postcard, n. 明信片
599. keen, a. 锋利的,尖锐的,强烈的;敏锐的;渴望的
600. patriotic, a. 爱国的
601. take-off, n.起飞
602. waken, v. 醒，弄醒，唤醒
603. invert, adj.转化的。vt.使颠倒, 使转化。n.颠倒的事物
604. comet, n.彗星
605. confirmation, n.证实，确定；确认
606. perspective, n. 透视,透视画法;视角,观点
607. bite, v./n. 咬,叮,刺,紧握,鱼上钩
608. surprise, v. 使诧异，使惊异；奇袭n. 诧异，惊异；奇袭
609. fluctuate, vi. (物价)涨落,起落,波动
610. control, n.控制，支配v. 控制，支配
611. groove, n.槽vt.开槽于
612. repair, n. 修理，修补v. 补救，纠正；修理
613. waterfall, n. 瀑布
614. skyrocket, v.猛涨
615. terribly, adv.可怕地，极
616. scenery, n. 风景
617. expiry, n.逾期
618. upgrade, n.升级, 上升, 上坡。adv.往上。vt.使升级, 提升, 改良
619. diction, n.措辞
620. respective, a. 各自的，各个的
621. fetter, n.[常用复]脚镣, 羁绊, 束缚。vt.束缚, 加脚镣
622. cool, a. 凉的；冷静的n. 凉快ad. 冷静地v. 使变凉
623. deafen, vt.使聋；使隔音
624. decree, n./v. 法令,判决
625. jam, v. 压紧,夹住;发生故障;塞进;干扰;n. 阻塞物;窘境
626. snow, n. 雪，下雪vi. 下雪；如雪一般地落下
627. hey, int.嗨
628. fatal, a. 致命的;灾难性的;命中注定的
629. lower, a. 较低的，下级的，下游的v. 降下，放低
630. diaphragm, n.[解] 横隔膜, 控光装置, 照相机镜头上的光圈, (电话
631. merry, a. 欢乐的，愉快的
632. offence, n.犯罪，犯规；冒犯
633. lapse, n. 小错,记错;(时间)流逝
634. grit, n.粗砂。v.研磨, 在...上铺砂砾
635. erection, n.竖立，建立
636. vanquish, vt.征服, 击败, 克服
637. prediction, n.预言，预告；预报
638. exceed, vt. 比…大,超出
639. conveyance, n.运送，传达
640. flannel, n.法兰绒；法兰绒衣服
641. police, n. 警察，警察机关a. 警察的v. 管辖
642. sky, n. 天空；[pl
643. precarious, adj.不稳定的
644. furniture, n. 家具
645. straighten, vt.把…弄直vi.挺起来
646. expire, vi. 满期,到期;逝世,死
647. seed, n. 种子v. 播种；结实，结籽
648. droop, v.下垂
649. wipe, v./n. 擦，揩，抹
650. conceivable, adj.可能的, 想得到的, 可想像的
651. commonsense, a.有常识的
652. diligent, a. 勤奋的
653. calamity, n.灾难, 不幸事件
654. render, vt. 提供,报答;表演,演奏;翻译
655. thank, vt. 感谢int.谢谢n.感谢(意
656. someone, pron. 某人
657. occur, vi. 发生;想起,想到;存在
658. sore, a. 疼痛的;恼火的;极度的,剧烈的
659. blade, n. 刀刃，刀片；桨叶；草叶，叶片
660. provincial, adj.省级的，省的
661. obnoxious, adj.不愉快的, 讨厌的
662. attentively, adv.关心地
663. hotelling, n.旅馆业
664. historic, a. 有历史意义的
665. gem, n.宝石
666. deformation, n.损坏；变形；畸形
667. quantify, vt.确定数量。v.量化
668. designer, n.设计者
669. secretary, n. 秘书，书记；部长，大臣
670. halt, n./v. (途中)暂停,终止;vi. 犹豫,踌躇
671. multifarious, adj.种种的, 各式各样的
672. sixty, num.六十，六十个
673. content, n./a./vt. 满意(的),使满意(足) n. 内容,目录
674. paragraph, n. 段，节；小新闻，短评
675. bust, n.半身像, 胸像, (妇女的)胸部
676. contrary, a.相反的，矛盾的n. 反对，矛盾；相反
677. sufficiently, ad.足够地，充分地
678. dramatize, v.使戏剧化
679. electrical, a. 电的,电气科学的
680. England, n.英格兰；英国
681. economically, ad.节约地，在经济上
682. arbitrary, a. 任性的,专断的
683. cease, v. 停止
684. disable, vt. 使无能力,使伤残
685. whisker, n.髯，连鬓胡子
686. cosset, n.亲手饲养的宠物, 宠儿。vt.宠爱, 珍爱, 溺爱
687. irregular, a.不规则的；不整齐的
688. fuel, n. 燃料vt. 给…加燃料
689. nation, n. 民族，国家
690. hollow, a. 空的，中空的；空洞的，空虚的v. 挖空，凿空
691. registration, n.登记
692. inefficiency, n.无效力
693. banner, n. 旗
694. imperial, adj.皇帝的
695. tactic, n.策略, 战略。adj.按顺序的, 排列的
696. seminar, n. (大学的)研究班，研讨会
697. extinct, a. 灭绝的;(火山)不再活跃的;(风俗)废弃的
698. salesman, n. 售货员，推销员
699. confirm, vt. 证实;确认;批准
700. versatile, a. 多才多艺的;多功能的
701. honor, n. 尊敬，敬意；荣誉，光荣v. 尊敬
702. shell, n./v. 壳,剥壳
703. assertion, n.断言
704. scrupulous, adj.小心谨慎的, 细心的
705. wool, n. 羊毛，毛线，毛织品
706. division, n. 分，分割；部门，科，处；除法；分界线
707. brown, n./a. 褐色(的)，棕色(的
708. unanimous, a. 一致同意的,全体一致的
709. revolution, n. 革命；旋转，转数
710. considerable, a. 相当大的;重要的
711. evaluation, n.估价，评价
712. appealing, adj.有吸引力的
713. cuckoo, n.杜鹃，布谷鸟
714. dainty, adj.优雅，考究
715. blunt, a. 钝的;生硬的;直率的;vt. 使钝,把…弄迟钝
716. agitation, n. 摇动;焦虑
717. disclose, vt. 透露,泄露
718. strap, n. 带;皮带;vt. 用带束住;捆扎
719. mud, n. 泥，泥浆v. 弄脏，使沾污泥
720. strand, n.(绳)股，缕
721. diet, n./vi. 饮食,规定的饮食,忌食
722. loyal, a. 忠诚的
723. bless, vt. 求上帝赐福于,祝福,使神圣
724. invaluable, a. 无价的,无法估价的
725. kindle, v. 点燃,引起,激发
726. warrant, n. 正当理由；许可证，委任状v. 保证，担保
727. holding, n.支持，控股
728. grandparent, n.(外)祖父(母
729. displacement, n.移置；免职；置换
730. refinement, n.精炼,改进,改善,优雅高贵的举止
731. reappraisal, n.重新估计, 重新评价
732. depreciation, n.折旧，贬值
733. fodder, n.饲料
734. chairman, n. 主席，议长，会长，董事长
735. reminiscent, adj.使想起的,像...的
736. antonymous, adj.反义的
737. subtitle, n.副题(书本中的), 说明对白的字幕
738. handling, n.处理，管理
739. previous, a. 先前的
740. inherent, a. 固有的
741. height, n. 高，高度；(常pl. )高地，高处
742. fastidious, adj.难取悦的, 挑剔的, 苛求的, (微生物等)需要复杂营养
743. alga, n.藻类, 海藻
744. aerodynamics, n.空气动力学, 气体力学
745. colloquial, adj.口语的, 通俗的
746. circus, n. 马戏表演,广场
747. placard, n.布告。v.张贴
748. distribution, n.分发，分配；分布
749. painful, a. 疼痛的，使痛苦的，费力[心
750. comedian, n.喜剧演员
751. dissatisfaction, n.不满，不平
752. question, n. 问题；询问v. 询问；怀疑，对…表示疑问
753. ceremonial, adj.仪式的
754. reactor, n.反应器；反应堆
755. bright, a. 明亮的，辉煌的；聪明的；欢快的，美好的
756. explicit, a. 清楚的,明确的;毫不含蓄的
757. deputy, n. 代表,代理人
758. button, n. 纽扣，按钮(开关)v. 扣紧；扣上纽扣
759. prevent, v. (from)预防，防止，阻止，制止，妨碍
760. kingdom, n. 王国，领域
761. profane, adj.亵渎的。v.亵渎
762. nursery, n. 托儿所,保育室;苗圃
763. flat, a. 平坦的，扁平的，平淡的n. 一套房间；平面
764. diameter, n. 直径
765. shore, n. 海滨，湖滨
766. reason, n. 原因，理性，理智v. 推理，说服，辩论，讨论
767. soon, ad. 不久，即刻；快，早
768. prevailing, adj.占上风的
769. physicist, n. 物理学家
770. ecosystem, n.生态系统
771. brink, n. 边缘(通常指处于某种糟糕的局势中
772. kilo, n.(缩)公斤，公里
773. vacuum, n. 真空
774. misfortune, n. 不幸,灾祸
775. somewhat, ad. 有点儿
776. triumph, n. 凯旋,成功
777. rampant, adj.猖獗的, 蔓生的, 猛烈的, 狂暴的, 跛拱的
778. friction, n. 摩擦力;摩擦;不和,倾轧
779. familiar, a. 熟悉的,通晓的,亲密的,常见的
780. persecute, vt. (尤指因宗教或政治信仰不同)迫害;烦扰
781. huddle, v.拥挤, 卷缩, 草率从事, 挤作一团。n.杂乱的一堆, 拥挤
782. disloyalty, adj.不忠
783. intangible, adj.无形的
784. dam, n./vt. 水坝,筑坝,抑制,阻拦
785. plump, vt.丰满的；鼓起的
786. compose, v. 组成,构成,创作,排字,使安静
787. count, v. 数，计算；算入；看作，认为n. 计数，总数
788. grand, a. 最重大的,豪华的;傲慢的;美妙的;全部的
789. scrape, v./n. 刮,擦
790. feel, v. 触；认为vi. 摸上去有…感觉；摸索；觉得
791. concede, vt. (不情愿地)承认,承认…为真(或正确); 承认失败;让 于;vi. 让步,认输
792. legal, a. 法律的
793. glimmer, v.闪烁。n.闪光
794. calcium, n.[化]钙(元素符号Ca
795. napkin, n. 餐巾，餐巾纸，<英>尿布
796. rectification, n.纠正,电流整流
797. heading, n. 标题
798. query, v. &n.询问
799. goose, n. 鹅，雌鹅，鹅肉
800. solidify, v.(使)凝固, (使)团结, 巩固
801. mercy, n. 怜悯,宽恕
802. poison, n. 毒物，毒药v. 放毒，毒害，污染
803. text, n. 正文，文本；原文；教科书
804. ware, n.商品，货物；物品
805. forthcoming, a. 即将出现的;现有的;乐于提供帮助的
806. whereby, ad. 凭什么,靠那个,借以
807. fact, n. 事实，实际
808. abrogate, v.取消，废除
809. ant, n. 蚁；蚂蚁
810. approximately, ad.近似地，大约
811. feudal, a. 封建的；封地的；领地的
812. pave, vt. 铺(路等
813. stale, a. 食品不新鲜的;陈旧的,过度劳累而表现不佳的;陈腐的
814. dot, n. 小圆点,小点 vt. 加上小点,散布于,点缀
815. amend, v. 改进,修正
816. terror, n. 恐怖；可怕的人(事
817. trainee, n.受训练者
818. alarm, n. 警报;惊慌;vt. 使忧虑
819. stirring, adj.动人的,萌动的
820. bowl, n. 碗(状物)，钵
821. globalize, v.使全球化
822. technology, n. 科学技术；工业技术；应用科学
823. zeal, n. 热心,热情
824. culture, n.文化，养殖
825. execution, n.实行，执行；处死刑
826. hoe, vt.&vi.锄地
827. grandmother, n. 祖母，外祖母
828. peculiar, a. 奇怪的,古怪的;特有的,独具的,独特的
829. thrive, vi. 繁荣,兴旺
830. plea, n. (法律)抗辩;恳求;请求,托词,口实
831. inconsistency, n.不一致
832. consideration, n. 需要考虑的事，理由；考虑，思考；体谅，照顾
833. mirage, n.海市蜃楼, 雾气, 幻想, 妄想
834. hostile, a. 敌方的;敌对的,不友好的
835. orphan, n. 孤儿
836. reimbursement, n.偿还，还款
837. increasing, adj.不断增长的
838. invigilate, vi.看守, 监考
839. luggage, n. 行李，皮箱
840. assassination, n. 暗杀
841. marvellous, adj.奇异的，绝妙的
842. coarse, a. 粗的,粗糙的;粗俗的
843. noble, a. 高尚的；贵族的，高贵的n. 贵族
844. flicker, vi./n. 闪烁,摇曳,闪现
845. confession, n.供认，自由
846. paralysis, n.瘫痪, 麻痹
847. piston, n. 活塞
848. ramble, vi. 漫步,闲逛;漫谈;蔓延
849. alcoholism, n.嗜酒者，酒鬼
850. lucky, a. 幸运的，侥幸的
851. lethal, adj.致命的。n.致死因子
852. incentive, n. 刺激；动力；鼓励；诱因；动机
853. banker, n.银行家
854. lighthouse, n.灯塔
855. fascination, n.入迷
856. continue, v. 继续，连续，延伸
857. fold, v. 折叠；合拢；抱住n. 褶，褶痕；羊栏；信徒
858. end, n. 末端，端，梢；目标，目的v. 终止，结束
859. bean, n. 豆；菜豆，蚕豆
860. intense, a. 强烈的，剧烈的；热烈的，热情的
861. default, vi./n. 拖欠,违约;不出庭
862. warm, a. 温暖的，热心的，热情的v. (使)变暖
863. fork, n. 叉，耙；叉形物；餐叉
864. improvement, n. 改进，进步，增进；改进措施
865. bias, n./vt. 偏见;嗜好;偏倚
866. essence, n. 本质，实质
867. rave, v.咆哮
868. commune, n.公社
869. contemplation, n.苦思冥想
870. courtyard, n. 院子，庭院，天井
871. border, n. 边,边沿;花园中的花坛;v. 接界,接壤
872. hitherto, ad. 到目前为止，迄今
873. lexicography, n.词典编纂
874. alight, vi.落下。adj.点着的, 发亮的
875. parachute, n. 降落伞
876. label, n. 标签v. 把…称为；用标签于；用标签标明
877. excessive, a. 过多的；过分的；额外
878. minute, n. 分钟，片刻；(pl.)会议记录a. 微小的
879. dwarf, n. 矮子;矮小的动植物;vt. 使…矮小,使…相形见绌
880. discriminate, v. 区别,区分;歧视
881. widow, n. 寡妇
882. heritage, n.遗产, 继承权, 传统
883. headlong, a.&ad.头向前的(地
884. suffix, n.后缀
885. eighth, num.第八 n.八分之一
886. tertiary, adj.第三的, 第三位的, 第三世纪的。n.[画]第三色, 第三 修道会会员, [地]第三纪
887. apologize, v. (to，for)道歉，认错
888. carp, n.鲤鱼。vi.吹毛求疵
889. carriage, n. (四轮)马车；(火车)客车厢
890. correspondence, n. 通信，信件；(with)符合；(to)相当于，对应
891. pay, v. 付款，付出代价，给予注意n. 工资，薪金
892. mystery, n. 神秘，神秘的事物；神秘小说，侦探小说
893. leave, v. 离开；留下，忘带；让，听任；交付n. 许可；假期
894. expose, vt. 使暴露,揭发,使曝光
895. amputate, vt.切除(手臂,腿等
896. wharf, n.码头，停泊所
897. pliable, adj.易曲折的, 柔软的, 圆滑的, 柔韧的
898. dime, n.(美元)一角
899. bead, n.有孔小珠；露珠
900. concerned, adj.有关的
901. identical, a. (to. with)同一的，同样的
902. fetch, v. (去)取,拿来;(货物)售的(价钱
903. lightly, ad.轻轻地，轻松地
904. nerve, n. 神经；勇敢，胆量
905. repeat, v. 重复，重说，重做n. 重复
906. inapt, adj.不确切的
907. glance, v. (at，over)扫视n. 匆匆看，一瞥，一眼
908. authoritative, adj.权威的, 有权威的, 命令的
909. ghost, n. 鬼魂，幽灵
910. camp, n. 野营，营地；帐篷，阵营v. 设营，宿营
911. ongoing, adj.正在进行的
912. correspond, vi. 符合;通信;相当于
913. Easter, n. 复活节
914. platypus, n.[动]鸭嘴兽
915. systematic, a. 有系统的,系统的;有计划有步骤的
916. marble, n. 大理石,(游戏用的)玻璃弹子
917. inauguration, n.开幕、就职典礼
918. cement, n. 水泥,结合剂 vt. 黏结,胶合
919. lecture, n./v. 演讲，讲课
920. resemble, vt. 像;类似
921. lion, n. 狮子
922. industrialize, v. (使)工业化
923. moustache, n. (嘴上边的)胡子
924. heel, n. 脚后跟，踵，鞋跟
925. soluble, adj.可溶的, 可溶解的
926. trophy, n.战利品, 奖品。vt.用战利品装饰, 授予...奖品
927. screwdriver, n.螺丝刀，改锥
928. preposition, n. 介词
929. warranty, n. 书面担保书,保证书
930. fallacy, n.谬误, 谬论
931. gunpowder, n.黑色火药；有烟火药
932. audition, n.听, 听力, 试听
933. irony, n. 反话,冷嘲,讽刺性的事件、情况等
934. compulsory, a. 义务的;强制的
935. ailment, n.疾病
936. counselor, n.顾问, 法律顾问
937. percentage, n. 百分数，百分率，百分比
938. fifteen, num. 十五pron./a. 十五(个，只
939. elementary, a. 基本的,初级的
940. impartial, a.公正的，无偏见的
941. idle, a. 懒散的,无所事事的;空闲的;无用的,无效的
942. cafeteria, n. 自助食堂,自助餐馆
943. drawing, n. 绘图，图样
944. hardness, n.坚硬，硬度
945. enrol, vt.登记, 入学。vi.参军, 注册
946. childish, a.孩子的；幼稚的
947. hairdress, n.美发
948. mercury, n. 水银，汞
949. authority, n. 权力;威信;当局;权威
950. attitude, n. 态度，看法(to, toward, about)；姿势
951. consistency, n.一致(性
952. analyze, vt. 分析，分解
953. analysis, n. 分析；分解
954. rig, n.索具装备, 钻探设备, 钻探平台, 钻塔。v.装上索具, 配
955. sullen, a.绷着脸不高兴的
956. afford, vt. 付得起;冒险;供给
957. Australian, a.澳大利亚的
958. underneath, prep./ad. 在…下面,在…底下
959. restrictive, n.限制的
960. casual, a. 偶然的,碰巧的,随便的,临时的
961. neutral, a. 中立的；中性的，中和的
962. supply, v. (with，to)供给，供应，补足n. 供应，供应量
963. mitten, n.连指手套；露指手套
964. monologue, n.独白, 独脚戏
965. ally, n. 同盟者，同盟国vt. 使结盟；与…有关联
966. immoral, adj.不道德的
967. frame, n. 框架；体格；骨架；组织；机构v. 设计；制定
968. deadly, a. 致命的,殊死的;ad. 死一般地;非常
969. dagger, n.匕首
970. photostatic, adj.静电复印的
971. crazy, a. 疯狂的，古怪的，蠢的；(about)狂热的
972. flick, n.(用鞭)快速的轻打, 轻打声, 弹开。v.轻弹, 轻轻拂去, 忽然摇动, (翅)拍动, (旗)飘扬
973. buffet, n. (火车内)餐室,冷餐桌
974. numerous, a. 许许多多的
975. pretty, ad. 相当，很a. 漂亮的，俊俏的，标致的
976. meteorology, n.气象学, 气象状态
977. whatever, pron. 无论什么a. 无论什么样的
978. pie, n. 馅饼
979. hope, n. 希望，期望；希望的人或事v. 希望，期望
980. finding, n. 发现，发现物；(常pl. )调查/研究结果
981. gaudy, adj.华而不实的
982. flute, n.长笛，笛子
983. utterance, n.说话
984. annoyance, n.烦恼，麻烦事
985. sidewalk, n.人行道
986. outfit, n.用具, 配备, 机构, 全套装配, 。vt.配备, 装备。vi.得
987. blond, n.白肤金发碧眼的人
988. capacity, n. 容量,容积;理解力;地位;资格
989. filthy, adj.污秽的
990. reverse, n./v./a. 相反(的);颠倒(的
991. phonetics, n.语音学
992. size, n. 大小，尺寸，规模；尺码
993. harmony, n. 和谐,融洽,一致
994. subsidize, v.资助, 津贴
995. drink, v. (drank，drunk)喝，饮n. 饮料；喝酒
996. teller, n.出纳
997. reproach, vt./n. 责备,指责
998. grammar, n. 语法，语法书
999. await, vt. 等候，期待；(事情等)降临于
1000. age, n. 年龄；时代；老年；长时间v. (使)变老
1001. mantle, n.斗蓬, 覆盖物, 壁炉架。v.披风, 覆盖
1002. criminal, a. 犯罪的,刑事上的 n. 罪犯
1003. climax, n. 顶点,小说等的高潮 v. 达到高潮
1004. liberal, a. 慷慨的,大方的,胸怀宽大的;n. 自由主义者
1005. divine, a. 神的;极好的;v. 占卜
1006. spectrum, n. 光谱,系列
1007. dart, n. 标,镖;vt. 投掷;vi. 急冲
1008. hi, int. 嗨！喂
1009. realize, v. 认识到，体会到；实现
1010. oblige, vt. 迫使;施恩于,帮…的忙;使感激
1011. enhance, vt. 提高(强度、力量、数量等),增加(进
1012. sheepish, adj.胆怯的
1013. dove, n. 鸽子
1014. overweight, n.超重
1015. induction, n.就职；归纳推理
1016. noted, a.著名的，知名的
1017. formation, n. 形成；构成；组织；构造；编制；塑造
1018. visual, a. 看的，看得见的；视觉的
1019. strait, n. 海峡;困难,窘迫
1020. regulate, vt. 控制,管理;调整,调节
1021. tick, n. (钟表)滴答声,一刹那 v. 用勾作为记号
1022. technique, n. 技术,技能,行家手法
1023. weapon, n. 武器，兵器
1024. severely, ad.严厉地，严格地
1025. hectic, adj.脸上发红, 发热的, 兴奋的, 狂热的, 肺病的。n.脸
1026. vegetable, n. 蔬菜，植物a. 植物的，蔬菜的
1027. valley, n. (山)谷；流域
1028. adventure, n. 冒险，冒险活动，奇遇vt. 大胆进行
1029. temperament, n.气质, 性情, 易激动, 急躁
1030. February, n. 二月
1031. inventor, n.发明者；发明家
1032. effectiveness, n.有效
1033. tire, v. (使)疲倦，(使)厌倦n. (=tyre)轮胎，车胎
1034. feature, n./vt. 脸一部分,面貌,特征,特写,故事片;以…为特色
1035. metric, a. 米制的，公制的
1036. post-office, n.邮局
1037. girl, n. 少女，姑娘，女孩；女职员
1038. threshold, n. 门槛;开始;开端,入门
1039. reputation, n. 名誉,名声
1040. reduction, n. 减小，减少，缩小
1041. turnover, n. 营业额,营业收入;人员调整,人员更替率
1042. loud, a. 大声的，响亮的；吵闹的，喧嚣的
1043. cordial, a. 热诚的,衷心的
1044. disuse, v. &n.废止
1045. thereof, ad.它的，其；由此
1046. wind, n. 风；气息v. 转动；缠绕；上发条，；蜿蜒而行
1047. amaze, vt. 使惊奇
1048. mass media, n.传媒工具，新闻界
1049. persistent, adj.持久稳固的
1050. anthem, n.圣歌, 赞美诗
1051. relief, n. 减轻;救济
1052. verb, n. 动词
1053. commonly, ad.普通地，一般地
1054. screech, v. &n.尖叫(声
1055. incinerator, n.焚化装置, 焚化炉, 焚尸炉
1056. she, pron. (主格)她
1057. tinge, n.淡色, 色调, 些微气味, 气息, 风味。vt.微染, 使带气
1058. evict, v.驱逐, 逐出(租户), 收回(租屋、租地等
1059. else, ad. 其它，另外，别的；[与or连用
1060. helpless, a.无助的；无能的
1061. pace, n. (一)步;步速,速度,节奏 vi. 踱步
1062. throng, n. 人群,群众;vt. 群集,拥挤
1063. clamor, n.喧闹, 叫嚷, 大声的要求。v.喧嚷, 大声的要求
1064. excess, n. 超越,超过;暴行;a. 额外的,附加的
1065. maiden, n.(文学)少女,未嫁女子; a. 未婚女子的,初次的,处女的
1066. ashore, ad. 上岸；在岸上，向岸上
1067. thirteen, num./a. 十三pron. 十三(个，只
1068. parasite, n. 寄生虫,寄生植物,靠他人为生的人
1069. destination, n. 目的地
1070. hateful, a.可恨的，可恶的
1071. canoe, n. 独木舟，小游艇
1072. marvelous, adj.引起惊异的, 不可思议的, 非凡的
1073. father, n. 父亲；创始人，发明者；(Father)神父
1074. skull, n. 头盖骨，颅骨
1075. proxy, n.代理人
1076. linen, n. 亚麻布,衬衣裤
1077. notorious, a. 臭名昭著的,声名狼藉的
1078. audience, n. 听众,观众,读者
1079. feasible, a. 可行的,可信的
1080. deplete, vt. 耗尽,用尽
1081. startle, v. 惊吓，使吃惊
1082. pole, n. 极;杆
1083. retell, vt.再讲，重述，复述
1084. scare, n. 惊恐，恐慌v. 惊吓，受惊
1085. German, a.德国的 n.德国人
1086. adore, vt. 崇拜;非常喜爱
1087. thickness, n.厚(度)；密(度
1088. pretentious, a. 自负的,自命不凡的
1089. perfectly, ad.很，完全
1090. thrill, n./v. 激动;震颤
1091. inalienable, adj.(指权利等)不能让与的, 不能剥夺的
1092. capitulate, vi.有条件投降, 认输, 屈服, 让步, 停止抵抗
1093. gun, n. 枪，炮，手枪
1094. paralyse, vt. 使麻痹;使瘫痪
1095. pneumatic, a.空气的；气动的
1096. plume, n.羽毛，羽饰
1097. unkind, a.不仁慈的，不和善的
1098. tail, n. 尾巴；尾部；跟踪者vt. 尾随，跟踪
1099. applause, n. 鼓掌；喝彩；夸奖，赞扬
1100. attractive, adj.吸引人的, 有魅力的
1101. monthly, a. 每月的ad. 每月一次，按月n. 月刊
1102. signify, vt. 表示;意味;有重要性
1103. Egyptian, a.埃及的n.埃及人
1104. beware, v. 当心，谨防
1105. commercial, a. 贸易的,商业的 n. 电视电台广告
1106. recurrence, n.再发生
1107. requisite, a.需要的n.必需品
1108. better, a. 较好的ad. 更好(地)v. 改良n. 较佳者
1109. deviation, n.背离，偏离；偏差数
1110. guard, v./n. 保卫，守卫，提防n. 哨兵，警卫，看守
1111. epoch, n. 新纪元,新时代
1112. absurdity, n.荒唐(事
1113. freshen, vt.使显得新鲜
1114. dung, n.粪
1115. nobody, pron. 谁也不，无人n. 小人物
1116. wise, a. 有智慧的，聪明的
1117. survivor, n.幸存者
1118. radar, n. 雷达
1119. recover, v. 重新找到,复原,痊愈
1120. cling, vi. 抱紧;坚守
1121. considerate, a. 考虑周到的，体谅的
1122. sly, a. 狡猾的，偷偷摸摸的
1123. dive, v./n. 潜水，跳水，俯冲
1124. precedence, n. 在前,优先
1125. hazard, n. 危险，冒险，危害v. 冒险，拼命
1126. resume, vt. 重新开始;继续;重新占用
1127. timidity, n.胆怯
1128. cosmetics, n.化妆品
1129. booking, adj.定货
1130. cardboard, n.硬纸板
1131. acre, n. 英亩；田地；地产
1132. remedy, n. 补救办法,纠正办法;药品,治疗法 vt. 补救,纠正;治疗
1133. granddaughter, n.孙女，外孙女
1134. sofa, n. 长沙发，沙发
1135. blouse, n. 女衬衣，短上衣，宽阔的罩衫
1136. unnecessary, a.不必要的，多余的
1137. regional, adj.地区的，区域的
1138. stumble, vi. 绊跌,绊倒;结结巴巴说话
1139. voter, n.投票人，选举人
1140. pending, adj.未决的，紧迫的
1141. extend, v. 伸出,延长;给予;扩大
1142. couple, n. (一)对，双；夫妇v. 连接，结合
1143. lab, n.实验室，研究室
1144. freeze, v. 使结冰，使凝固
1145. salution, n.致敬,敬礼
1146. snobbish, a.势利的，谄上欺下的
1147. feat, n. 功绩，伟业，技艺
1148. hospital, n. 医院
1149. GNP, n.(缩)国民总收入
1150. err, v.犯错误
1151. terminate, vt./vi. 终止,结束
1152. quiet, a. 安静的，平静的n. 安静v. 使安静，平静
1153. generator, n. 发电机，发生器
1154. rubric, n.[印]红字, 红色印刷, 题目
1155. burgeon, n.嫩芽。v.萌芽
1156. elaboration, n.详尽阐述
1157. off-hand, offhand) adv.立即, 当即, 事先没有准备的。adj.临时 的, 即时的, 无礼的, 不拘礼节的
1158. postal, a.邮政的，邮局的
1159. commemorate, vt. 纪念
1160. promissory, adj.约定的
1161. mine, pron. (I的物主代词)我的(东西)n. 矿v. 采矿
1162. alphabet, n. 字母表；初步，入门
1163. drip, v. 滴下，漏水n. 滴，水滴，点滴
1164. junction, n. 交叉点,接合点
1165. mythical, adj.神话的, 虚构的
1166. provision, n. 准备;供应;条款
1167. reject, v. 拒绝，抵制，丢弃，排斥，退掉n. 落选者
1168. literal, a.文字(上)的；字面的
1169. poor, a. 贫困的；可怜的；贫乏的；贫瘠的；低劣的
1170. processing, n. &adj.加工(的
1171. landscape, n. 风景,景色;风景画
1172. sunburn, v.晒黑
1173. nightgown, n.睡衣
1174. firmness, n.坚固，坚定，稳固
1175. cutting, a. 锋利的,尖刻的n. 开凿出来的公路,铁路;剪报
1176. disrupt, v.使中断, 使分裂, 使瓦解, 使陷于混乱, 破坏
1177. hush, n.沉默int.嘘
1178. said, adj.上述的，该
1179. expressway, n.高速公路
1180. terrify, v. 使害怕，使惊恐
1181. renovation, n.革新
1182. plantation, n. 种植园
1183. insolent, n.侮慢无礼的人。adj.傲慢的, 无礼的, 侮慢的
1184. footstep, n. 脚步(声)，足迹
1185. transit, n. 运输,搬运
1186. graceful, a. 优美的，文雅的，大方的
1187. eternal, a. 永久的,不朽的;不停的
1188. feudalism, n.封建主义
1189. dislike, n./v. 不喜欢，厌恶
1190. goat, n. 山羊
1191. delirium, n.(暂时的)精神狂乱, 精神错乱, 说谵语状态, 狂语, 精神
1192. refined, adj.精炼的，精的,举止优雅的
1193. technological, adj.技术的，工艺的
1194. Saturn, n.农神；土星
1195. advantage, n. 优点，长处，有利条件；利益，好处
1196. lexicographer, n.词典编纂者
1197. let, v. 让，允许，听任；设，假设；出租，租给
1198. northern, a. 北方的，北部的
1199. fighter, n.斗争者；战斗机
1200. moral, a. 道德(上)的，精神上的n. 寓意，教育意义
1201. madden, v.发狂
1202. pantry, n.食品柜，餐具室
1203. kindergarten, n. 幼儿园
1204. cleverness, n.聪明，机灵
1205. petition, n. 祈求,请求;请愿,请求书v. (向…)请愿,正式请求
1206. embarrassment, n.窘迫，尴尬
1207. maker, n.制造者，制造商
1208. carbon, n. 碳
1209. salvage, n.抢救财货, 获救的财货, 救难的奖金, 海上救助, 抢救, 打捞。vt.海上救助, 抢救, 打捞, 营救
1210. parameter, n. 参数，参量
1211. pen, n. 钢笔，圆珠笔，作家，围栏vt. 写，关入栏中
1212. touchy, adj.暴躁的, 难以处理的, 易起火的
1213. remission, n.免除
1214. paraphernalia, n.随身用具
1215. vindicate, vt.维护, 辩护, 表白
1216. purchase, v. 买，购买n. 购买的物品
1217. imply, v. 意指，含…意思，暗示
1218. clumsy, a. 笨拙的,愚笨的
1219. physical, a. 物质的；肉体的，身体的；自然科学的，物理的
1220. grant, vt. 同意给予;同意或承认某事属实;n. 拨款,补助款
1221. pat, v./n. 轻拍，轻打，抚摸
1222. occasionally, ad.偶然；非经常地
1223. nomad, n.游牧部落的人, 流浪者, 游牧民。adj.游牧的
1224. hold-up, n.停顿，耽误
1225. those, pron./a.那些；那些人(东西
1226. entertain, v. 招待，款待；使娱乐；使欢乐；容纳，接受
1227. abound, vi.多, 大量存在, 富于, 充满
1228. pollutant, n.污染物质
1229. skirt, n. 裙子；边缘，郊区
1230. monarch, n. 帝王，君主，最高统治者
1231. ascribe, vt. 把…归因于;把…归属于
1232. tray, n. 盘，碟，托盘
1233. factory, n. 工厂
1234. socialism, n. 社会主义
1235. caution, n./vt. 小心;告诫,警告
1236. embarrassing, adj.令人尴尬的
1237. exclusive, a. 独占的；排他的；孤高的；唯一的；高级的
1238. preside, v. (at，over)主持
1239. statistics, n. 统计,统计数字,统计学
1240. porch, n. 门廊,走廊
1241. gaze, v./n. 凝视，注视
1242. kangaroo, n.带鼠
1243. ample, a. 充足的;宽敞的
1244. celery, n.芹菜
1245. carousel, n.喧闹的酒会
1246. nail, n. 指甲，爪；钉v. 将…钉牢，钉住
1247. awaken, adj.醒着的
1248. air, n. 空气；(复数)神气vt. (使)通风；晾干
1249. guardian, n. 保护人,监护人
1250. cheap, a. 便宜的；低劣的，不值钱的
1251. soccer, n. 足球
1252. dodge, v. 躲闪,躲开;搪塞;逃避
1253. rebellion, n. 叛乱，反抗，起义
1254. escalator, n.电动扶梯
1255. key, n. 钥匙；答案；关键；键a. 主要的，关键的
1256. subscribe, vt./vi. 捐款,捐助;订阅;同意,赞成
1257. bread-earner, n.挣钱养家的人
1258. condemn, vt. 谴责;判刑;迫使;宣告(建筑)不宜使用
1259. oyster, n.牡蛎；沉默寡言的人
1260. molest, vt.骚乱, 困扰, 调戏
1261. ideology, n.意识形态
1262. sophistication, n.世故
1263. odometer, n.<美>(汽车等的)里程表
1264. background, n. 背景，经历；幕后
1265. enormously, adv.非常地, 巨大地
1266. pianist, n.钢琴家
1267. contest, n. 争夺,竞争;比赛;v. 争论,争议;斗争
1268. redundant, adj.多余的
1269. creature, n. 人，动物；生物
1270. coldness, n.寒冷，冷淡
1271. lottery, n. 彩票;抽彩给奖法
1272. patio, n.天井, 院子
1273. magnate, n.大资本家, 巨头, 富豪, 要人, ...大王
1274. sincere, a. 真挚的;诚恳的
1275. underline, vt. 划线于…之下;强调
1276. coil, v. 盘绕,缠绕;n. 一卷,一圈
1277. hamper, vt. 阻碍,妨碍,牵制
1278. thunder, n. 雷,雷声,轰隆声
1279. computer, n. 计算机，电脑；计算者
1280. prospective, adj.预期的
1281. proposition, n. 主张，建议；陈述，命题
1282. fence, n. 篱笆；围栏；剑术v. 用篱笆瓦围住；击剑
1283. fortnight, n. 两星期
1284. legitimate, a. 合法的,合理的
1285. almond, n.[植]杏树, 杏仁, 杏仁壮物
1286. best, a. 最好的(good和well的最高级)ad. 最好地；最
1287. craze, n.狂热
1288. oxygen, n. 氧，氧气
1289. cartilage, n.[解剖]软骨
1290. degradation, n.降级；退化；衰变
1291. trunk, n. 树干,(人)躯干,大衣箱
1292. madness, n.疯狂，疯病
1293. royalty, n. 皇家，皇族
1294. loth, loath) adj.憎恶的, 勉强的
1295. plunge, v./n. 投入,插入;跳水
1296. enact, vt.制定法律, 颁布, 扮演
1297. reception, n. 招待会,接收,接待处
1298. subway, n. 地铁；地下行人隧道
1299. catalog, n. 目录(册)v. 编目(录
1300. complex, a. 复杂的;n. 复合体;变态心理
1301. ridicule, vi.&n.嘲弄，挖苦
1302. youngster, n. 小伙子，年轻人；少年，儿童
1303. united, adj.联合的
1304. childhood, n. 幼年，童年
1305. jingle, vt.&vi.(使)丁当响
1306. guest, n. 客人，宾客，旅客
1307. lament, n.悲伤, 哀悼, 恸哭, 挽诗, 悼词。vt.哀悼。vi.悔恨, 悲
1308. lump, n. 团,块,肿块;vt. 合在一起,结块
1309. neurosis, n.神经症, 神经衰弱症
1310. layman, n.外行
1311. music, n. 音乐，乐曲，乐谱
1312. historian, n. 历史学家
1313. segment, n. 部分,切片;段,节;v. 分割
1314. ride, v./n. 骑，乘
1315. volunteer, n./v. 自愿(者，兵)；自愿(提供
1316. flagstone, n.石板
1317. average, n. 平均，平均数a. 平均的；普通的v. 平均
1318. fuss, n. 大惊,小怪;v. 忙乱,使烦躁
1319. bibliography, n.(有关一个题目或一个人的)书目, 参考书目
1320. spouse, n.配偶(指夫或妻
1321. teach, vt. 教，讲授；教导(训)vi. 讲课，当教师
1322. torture, vt./n. 拷打,折磨,使受剧烈痛苦
1323. pertain, vi. 附属;有关
1324. hurt, n. 伤痛，伤害v. 刺痛，伤害；伤…的感情
1325. heiress, n.女继承人
1326. hive, n.蜂房, 蜂箱, 闹市。v.(使)入蜂箱, 群居
1327. crate, n.一箱，篓，筐
1328. waving, adj.波浪状的
1329. hour, n. 小时，钟点；时刻；课时，工作时间
1330. judicial, adj.司法的, 法院的, 公正的, 明断的
1331. boring, adj.讨厌的
1332. residual, a.剩余的；残数的
1333. propeller, n.螺旋桨，推进器
1334. possibility, n. 可能，可能性；可能的事，希望
1335. livestock, n. 家畜,牲畜
1336. tutor, n. 导师；家庭教师v. 辅导；当导师；当家庭教师
1337. dazzling, adj.令人目眩的
1338. brim, n. 边缘，帽沿
1339. alternative, n. 二选一；供选择的东西；取舍a. 二选一的
1340. incense, n.香，熏香；香气
1341. goad, n.(赶牲口用的)刺棒, 激励物, 刺激物。vt.用刺棒驱赶, 驱策, 激励, 刺激, 唆使, 煽动
1342. best-selling, adj.畅销的
1343. teem, v.大量出现
1344. alienate, v.疏远，转让，挪用
1345. filter, n. 滤器,滤光器;v. 滤过,透过
1346. airline, n. (飞机)航线a. (飞机)航线的
1347. upbringing, n.抚育, 教养
1348. profuse, adj.极其丰富的
1349. administration, n. 经营，管理；行政，行政机关，管理部门
1350. wrench, n./vt. 猛扭,猛拉
1351. business, n. 商业，生意；事务，业务，职责
1352. motorway, n.汽车道，快车路
1353. chain, n. 链(条)；(pl.)镣铐；一连串v. 用链条拴住
1354. surely, a.确实；稳当地
1355. raincoat, n.雨衣
1356. suspension, n.吊, 悬浮, 悬浮液, 暂停, 中止, 悬而未决, 延迟
1357. furrow, n.犁沟
1358. contradiction, n. 反驳，否认；矛盾，不一致
1359. observance, n. (法律习俗等的)遵守;奉行;礼仪,仪式
1360. foster, vt. 养育；收养；怀抱；鼓励a. 收养的n. 养育者
1361. prominent, a. 突起的，凸出的；突出的，杰出的
1362. cheeky, adj.胖乎乎的
1363. satisfactorily, ad.圆满地
1364. regulation, n. 规则，规章；调节，校准；调整
1365. chaos, n. 混乱,纷乱
1366. transact, v.交易
1367. judge, n. 法官；裁判员；鉴定人vt. 审判；评论，裁判
1368. structural, a. 结构的,构造的
1369. fraction, n. 碎片,片断;分数
1370. entrant, n.进入者, 新到者, 新工作者, 新会员, 大学新生, 参加竞
1371. snore, vi.打鼾，打呼噜
1372. attraction, n.吸引；吸引力；引力
1373. malpractice, n.玩忽职守
1374. point, n. 尖；点；条款；分数，得分；论点v. (at，to)指
1375. embankment, n.堤防, 筑堤
1376. impatience, n.不耐烦
1377. attributable, adj.归于的
1378. appraisal, n.评价, 估价(尤指估价财产,以便征税), 鉴定
1379. corps, n.军团, 兵队, 团, 兵种, 技术兵种, 特殊兵种, (德国大 学的)学生联合会
1380. Brazilian, adj. &n.巴西的(人
1381. slightly, ad.稍微，有点
1382. uphold, vt. 支持;赞成;确认
1383. velocity, n. 速度，速率
1384. afterward, ad.后来，以后
1385. vortex, n.旋涡, 旋风, 涡流, (动乱, 争论等的)中心
1386. layout, n. 布置,设计
1387. occasional, a. 偶然的，非经常的，特殊场合的；临时的
1388. roundabout, a. 迂回的，转弯抹角的n. 环状交叉路口
1389. participation, n.参加，参与
1390. announcer, n.宣告者；播音员
1391. trust, vt. 信任；盼望；委托n. (in)信任，依赖；委托
1392. truce, n.休战, 休战协定, 休止
1393. memorandum, n.备忘录, 便笺, 便函, 买卖契约书
1394. characterize, v. 表示…的特性；描述…特性
1395. pamper, v.纵容
1396. agricultural, adj.农业的
1397. kidnap, vt. 诱拐,绑架
1398. shapeless, adj.不定形的
1399. rage, n./vi. 狂怒
1400. France, n.法国，法兰西
1401. anticlockwise, adj.adv.逆时针的(地
1402. elephant, n. (动物)象
1403. rebate, n.回扣，折扣,退税
1404. shift, n. 位置转移,性格转变;轮班;vt. 转变,移动
1405. album, n. 相片册,集邮册
1406. reliable, a. 可靠的,可信赖的
1407. consul, n.领事
1408. magnificent, a. 宏伟的,壮丽的
1409. lesser, adj.较小的, 更少的, 次要的
1410. peer, n. 同等;同辈;vi. 仔细看,费力地看
1411. spokesman, n. 发言人
1412. distract, v. 分散；使分心；打扰；使心情烦乱
1413. baffle, vt. 阻碍,使困惑;n. 挡板
1414. mitigate, v.减轻
1415. knit, v. 编织;紧密结合
1416. soldier, n. 士兵，军人
1417. vivid, a. 鲜艳的;活泼的,有生气的;清晰的
1418. malice, n. 恶意,怨恨
1419. microwave, n.微波
1420. useful, a. 有用的，实用的；有益的，有帮助的
1421. civilization, n. 文明，文化
1422. portfolio, n.部长职务
1423. restriction, n.限制，限定，约束
1424. alleviate, vt.使(痛苦等)易于忍受, 减轻
1425. incur, vt. 招致,遭受
1426. peel, v./n. 剥皮;皮
1427. detach, vt. 使分开,拆卸;派遣
1428. resort, vi./n. 求助
1429. orbit, n. 天体轨道;势力范围;vt. 沿轨道运行
1430. handout, n.施舍物，救济品
1431. pint, n. 品脱
1432. industrious, a.勤劳的，勤奋的
1433. support, n./vt. 支撑；支持；赡养；维持n. 支持者；支柱
1434. unite, vi. 联合，团结；统一，合并vt. 使联合
1435. precaution, n. 预防
1436. infer, v. 推论，推断
1437. impose, v. 征(税);把…强加于;利用
1438. misrepresent, vt.误传, 不如实地叙述(或说明)。vi.说假话
1439. collaboration, n. 协作,合作;勾结
1440. hold, v. 拿着；保有；托住；举行；继续n. 握住；船舱
1441. volt, n. 伏特
1442. virtually, ad. 实际上,事实上
1443. enquire, v. 询问,打听
1444. sunset, n. 日落，傍晚；晚霞
1445. ballroom, n.舞厅
1446. short-weight, n.短装，短重
1447. hierarchy, n.层次。层级
1448. nicety, n.美好, 准确, 精密, 纤细
1449. money, n. 货币，钱
1450. clown, n.(马戏的)小丑，丑角
1451. prairie, n.大草原，牧场
1452. semblance, n.外表, 伪装
1453. suicide, n. 自杀
1454. eradication, n.根除
1455. fortify, vt.设防于, 增强(体力,结构等)使坚强, 增加, (酒)的酒精 含量。vi.筑防御工事
1456. burdensome, adj.沉重的
1457. object, n. 物体；客体，对象；目标；宾语v. (to)反对
1458. freely, ad.自由地；直率地
1459. aforesaid, adj.上述的
1460. delightful, adj.令人高兴的
1461. depict, vt. 描绘,描写
1462. interference, n. (in)干涉，干预；(with)妨碍，打扰
1463. cuisine, n.厨房烹调法, 烹饪, 烹调风格
1464. boldness, n.胆略
1465. usual, a. 通常的，平常的
1466. oval, n./a. 卵形(的),椭圆形(的
1467. expedition, n. 远征,探险(队),考察(队
1468. liable, a. 有…倾向的;可能遭受…的;有责任的,有义务的
1469. countryside, n. 乡下，农村
1470. ambitious, a. 有抱负的，雄心勃勃的；有野心的
1471. rescind, adj.退还，取消,撤销
1472. disadvantageous, adj.不利的
1473. stay, vi. 逗留；保持vt. 停止，延缓n. 逗留，停留
1474. parish, n.教区
1475. smoking, n.抽烟
1476. simulate, vt. 假装;模仿;模拟
1477. fortuity, n.偶然事件
1478. viewpoint, n. 观点
1479. wasp, n.黄蜂，蚂蜂
1480. feud, n.纠纷，封地
1481. third, num. 第三(个)，三分之一(的
1482. chemical, a. 化学的n. (pl.)化学制品，化学药品
1483. damp, a./n./v. 潮湿(的),湿气,使潮湿
1484. expectation, n. 预期，期望，指望
1485. Jesus, n.耶稣
1486. flour, n. 面粉
1487. clash, v./n. 金属碰撞声;互碰;时间冲突;意见抵触
1488. pyjamas, n.(宽大的)睡衣裤
1489. least, a. 最小的；最少的ad. 最小；最少
1490. diffuse, v.散播, 传播, 漫射, 扩散, (使)慢慢混合。adj.散开的
1491. modernize, v.使现代化
1492. formality, n.礼节，正式
1493. upholster, vt.装饰, 装潢
1494. such, a. 这样的；上述的ad. 那么pron. 这样的人/事物
1495. strong, a. 强壮的，强大的；强烈的，浓的
1496. preparation, n. 准备，预备；制剂，制备品
1497. biographer, n.传记记者
1498. first-rate, a.第一流的，优秀的
1499. conference, n. (正式)会议；讨论，商谈
1500. consignment, n.委托，货物
1501. plus, prep./n. 加,加号 a. 正的
1502. petrol, n. 汽油
1503. custom, n. 习俗,惯例;光顾
1504. living, a. 活的，有生命的，天然的，逼真的n. 生活，生计
1505. ancestor, n. 祖先
1506. sue, vt.控告, 向...请求, 请愿。vi.提出诉讼, 提出请求
1507. conjunction, n. 连词;联合;连接
1508. heroic, a. 英雄的，英勇的，崇高的
1509. methodology, n.方法(论
1510. commend, vt. 称赞;推荐;委托保管
1511. rooster, n.公鸡；狂妄自负的人
1512. secretariat, n.秘书处
1513. pounce, v.突袭。n.突袭
1514. intent, a. (目光)不能移的,集中的,专心的;坚决的 n. 意图,意向
1515. slogan, n. 标语,口号
1516. coffin, n.棺材，柩
1517. eventful, adj.多事的
1518. bona fide, adj.真诚的，无欺的
1519. respond, v. 回答，响应，作出反应
1520. onset, n. 进攻;开始,发作
1521. tenancy, n.租佃, 租赁
1522. forward, ad. (also: forwards)向前a. 向前的v. 转交
1523. microcosm, n.微观世界
1524. tempo, n.(音乐)速度、拍子, 发展速度
1525. predecessor, n. 前任
1526. sorry, a. 对不起，抱歉的；难过，悔恨的；使人伤心
1527. comfort, n. 舒适，安逸；安慰，慰问v. 安慰，使舒适
1528. willingness, n.乐意，自愿
1529. regretful, adj.遗憾的
1530. disregard, vt./n. 不理,漠视
1531. telecommunication, n.电讯, 长途通讯, 无线电通讯, 电信学
1532. gorilla, n.大猩猩；暴徒，打手
1533. sway, v./n. 摇摆;统治,支配
1534. badminton, n. 羽毛球
1535. filling, n.充填物，馅
1536. chisel, n.凿子。v.砍凿
1537. husband, n. 丈夫
1538. antagonist, n.对手，敌手
1539. metallurgy, n.冶金学，冶金术
1540. questionnaire, n. 问题单,调查表,征求意见表
1541. humanitarian, a.博爱的n.慈善家
1542. dawn, n.黎明，开端
1543. require, v. 需要；(of)要求，命令
1544. reconcile, vt. 使和解;使复交;调解,调停
1545. crust, n. 面包,饼皮,硬外皮,外壳
1546. boast, n./v. 自夸;自豪地拥有
1547. jobless, adj.失业的
1548. overthrow, vt. 推翻;使终止,摒弃
1549. prelude, n. 序言,序幕
1550. instrumental, a. 仪器的；器械的；乐器的；起作用的；有帮助的
1551. chair, n. 椅子；(会议的)主席vt. 当…的主席，主持
1552. kerosene, n.煤油
1553. carry, v. 运送，搬运；传送，传播；领，带
1554. tow, vt. (用绳、链等)拖(车、船等)n. 拖，牵引
1555. preset, vt.预先装置
1556. august, n. 八月
1557. volcano, n. 火山
1558. inexpensive, a.花费不多的，廉价的
1559. despair, n./vi. 绝望,丧失信心
1560. theatre, n.戏院；戏剧；教室
1561. discipline, n./vt. 训练,纪律;戒律,惩罚;学科
1562. fallible, adj.易错的, 可能犯错的
1563. pass, v. 经/通/穿/度过；传递n. 通行证；考试及格
1564. burrow, n.洞穴。v.挖地洞
1565. resilience, n.弹回, 有弹力, 恢复力, 顺应力, 轻快, 达观, 愉快的心
1566. campaign, n. 战役,运动 vi. 参加运动
1567. southeast, n./a. 东南(的)，东南部(的
1568. retention, 保持力
1569. commotion, n.骚动, 暴乱
1570. pharmacy, n.药房, 药剂学, 配药业, 制药业, 一批备用药品
1571. deadline, n. 最后期限
1572. lavish, adj.非常大方的, 过分丰富的, 浪费的。vt.浪费, 滥用
1573. sulphide, n[化].硫化物
1574. file, n./vt. 锉,锉刀;文件夹;归档;纵列;成纵队前进
1575. embed, vt.使插入, 使嵌入, 深留, 嵌入, [医]包埋
1576. fool, n. 傻子，笨蛋vt. 欺骗，愚弄vi. 干蠢事
1577. inward, ad. 向内，在内a. 向内的，在内的，里面的
1578. ray, n. 光线，射线
1579. thus, ad. 如此；像这样；于是；因此
1580. favorite, n. 最喜欢的人或物a. 喜爱的
1581. diplomacy, n.外交
1582. prevention, n.预防，阻止，妨碍
1583. narrow, a. 狭窄的，狭的，狭隘的
1584. tablet, n. 碑,书板;药片
1585. conspiracy, n. 阴谋,同谋
1586. discourse, n. 论文；演说；谈话；话语vi. 讲述，著述
1587. swift, a. 快的,迅速的,敏捷的
1588. shorten, vt.弄短，缩小，减少
1589. wretched, a. 不幸的,可怜的;令人难受的
1590. warrior, n.勇士，战士
1591. December, n. 十二月
1592. duplicate, a. 完全一样的,复制的;n. 复制品,副本;vt. 复写,复制
1593. sponsorship, n.发起，主办
1594. hen, n. 母鸡
1595. initiate, vt. 开始;使初步了解;介绍某人为(会员等
1596. tactful, adj.机智的，老练的
1597. profile, n. 侧面;轮廓
1598. cough, v./n. 咳嗽
1599. tenable, adj.可维持的
1600. regarding, prep. 关于，有关
1601. spectator, n. 观众,旁观者
1602. chronology, n.年代学, 年表
1603. diplomat, n.外交人员
1604. scum, n.浮渣, 浮垢, 糟粕, 泡沫, 糖渣, 铁渣。vt.将浮渣去除 掉。vi.产生泡沫, 被浮渣覆盖
1605. note-taking, n.笔记，笔录
1606. tile, n. 瓦片，瓷砖vt. 铺瓦于，贴砖于
1607. aerosol, n.浮质(气体中的悬浮微粒,如烟,雾等), [化]气溶胶, 气雾
1608. awkwardness, n.笨拙
1609. impulse, n. 冲动;脉冲;推动,驱使
1610. uncertain, a.无常的；不确定的
1611. atomic, a.原子的；原子能的
1612. thereby, ad. 借以,从而
1613. refresh, v. (使)精神振作，(使)精力恢复
1614. baroness, n.男爵夫人，女男爵
1615. transformation, n.变化；改造；转变
1616. expense, n. 花费，消费，消耗
1617. daze, v.耀眼，使迷乱
1618. dispatch, v./n. (=despatch)派遣,发送,迅速办理,急件
1619. display, vt./n. 展览,陈列
1620. start, v. 开始；动身；吃惊；开办，开动n. 开端；惊起
1621. herein, adv.在此
1622. deter, v.阻止
1623. eleventh, num.第十一(个
1624. meticulous, a. 谨小慎微的;过细的
1625. redistribute, vt.重新分配, 再区分, 重新分布
1626. grown-up, a. 成长的，成熟的，成人的n. 成年人
1627. compliment, n. 敬意,赞扬;问候;vt. 恭维;称赞
1628. thigh, n. 大腿,股
1629. stitch, n. 缝纫;缝线;(肋部)突然剧痛
1630. toad, n.蟾蜍，癞蛤蟆
1631. anywhere, ad. 无论哪里；(用于否定、疑问等)任何地方
1632. pragmatic, adj.国事的, 团体事务的, 实际的, 注重实效的
1633. raw, a. 生的;未加工的
1634. tennis, n. 网球
1635. annoy, vt. 使烦恼,使生气
1636. happen, v. (偶然)发生；碰巧，恰好
1637. Spain, n.西班牙
1638. detract, v.降低
1639. solar, a. 太阳的，日光的
1640. harangue, n.尤指指责性的, 长篇大论, 夸张的话。vt.向...夸大地讲 话, (作)长篇、大声、常带斥责的讲话
1641. trainer, n.教练
1642. rhetoric, adj.花言巧语的
1643. misuse, v.误用, 错用, 滥用, 虐待。n.误用, 错用, 滥用, 误用之
1644. cloudy, a. 多云的，阴(天)的；混浊的，模糊的
1645. affirm, v. 断定,肯定
1646. shelter, n. 掩蔽,遮蔽;避难所,隐蔽处
1647. shower, n. 阵雨,淋浴
1648. prepared, adj.准备好的，愿意的,期望的
1649. casualty, n. 伤亡人员
1650. vulnerability, n.易损性
1651. pawn, v.典当,抵押,以...担保 n.小卒,被人利用的人
1652. pursuit, n. 追赶,追求;从事,消遣
1653. landlord, n. 房东，地主
1654. shamble, vi.蹒跚地走, 摇摇晃晃地走。n.蹒跚, 摇晃的脚步, 拖沓
1655. scarlet, n.猩红色a.猩红的
1656. fatuous, adj.愚昧的, 昏庸的, 发呆的, 愚笨的, 自满的
1657. resource, n. 资源,机智
1658. defiant, adj.无礼的，挑战的
1659. carpet, n. 地毯
1660. boot, n. 靴；(汽车后部的)行李箱；[the
1661. epoch-making, adj.划时代的
1662. shutter, n. 百叶窗,照相机快门
1663. allowance, n. 津贴
1664. dirt, n. 污物，污垢
1665. diagram, n. 图解
1666. wisdom, n. 智慧,才智,明智的思想言论
1667. county, n. (英国)郡，(美国)县
1668. shelve, vt.置于架子上, 缓议, 搁置, 解雇。vi.倾斜
1669. Christ, n. 基督，救世主，耶稣
1670. ex, prep.在交货
1671. locker, n.上锁的人, 有锁的橱柜, 锁扣装置, 有锁的存物柜
1672. traveler, n.旅行者
1673. surname, n. 姓
1674. taxation, n. 税制,税项
1675. disorder, n./vt. 混乱,骚动,(身心)失调
1676. gum, n. 树胶；口香糖
1677. low, a. 低，矮；低级的，下层的，卑贱的；低声的
1678. allergy, n.反感，过敏
1679. intersperse, vt.散布, 点缀
1680. quick, a. 快的；灵敏的，伶俐的；敏锐的ad. 快，迅速地
1681. rapidly, ad.迅速地
1682. periodic, n.周期的；一定时期的
1683. prostrate, adj.降伏的, 沮丧的, 衰竭的, 俯卧的。vt.弄倒, 使屈服
1684. downpour, n.倾盆大雨
1685. meditate, vt. 考虑,沉思;冥想
1686. swell, vt./vi. 使膨胀,使增强,使壮大,使隆起
1687. harmonious, a.和谐的，协调的
1688. inaccurate, a.不精密的，不准确的
1689. conclusive, adj.结束的，结论性的
1690. unthinkable, adj.不能想象的, 想象不到的, 不可思议的, 过分的
1691. itself, pron. (it的反身代词)它自己，它本身
1692. dungeon, n.地牢
1693. vicious, a. 恶意的,恶毒的;危险的,会造成伤害的
1694. identity, n. 身份；本体；特征；同一(性)；一致；国籍；等式
1695. quench, vt. 止渴;扑灭火焰
1696. July, n. 七月
1697. attain, v. 获得;达到
1698. probability, n. 可能性，或然性，概率
1699. fox, n. 狐狸
1700. penury, n.贫困, 贫穷
1701. mist, n. 薄雾;朦胧
1702. peg, n.桩v.(汇率)钉住
1703. superstitious, adj.迷信的
1704. desolate, a. 荒芜的,无人居住的,孤寂的; vt. 使荒芜,使荒凉
1705. disappoint, vt. 失望；(希望等)破灭，挫败(计划等
1706. slowdown, n.放慢，迟缓
1707. deplore, v.表示悲痛
1708. basin, n. 盆，脸盆；内海，盆地
1709. shiver, vi./n. 颤抖,哆嗦
1710. freak, n.怪诞的思想、行动或事件, 畸形人, 畸形的动物或植物, 反复无常。adj.奇异的, 反常的
1711. craziness, n.疯狂
1712. fantasy, n.幻想, 白日梦
1713. recapture, n.取回, 夺回, 政府对公司超额收益或利润的征收。vt.拿 回, 夺回, 再体验, 政府征收再经历, 再体验
1714. tonic, adj.激励的, 滋补的。n.滋补剂, 滋补品
1715. company, n. 公司；陪伴；宾客；连(队)，(一)群，队，伙
1716. breathe, v. 呼吸，吸入
1717. gauge, n. 标准尺寸,(铁道)轨矩;(雨量)器;(电线)直径;vt. 测量; 估计;评价(人物
1718. frequently, ad.时常，常常
1719. milestone, n.里程碑
1720. logistics, n.后勤学, 后勤
1721. airport, n. 机场，航空站，航空港
1722. inhabitant, n. 居民，住户
1723. overload, vt.使超载
1724. disturbance, n. 动乱，骚乱，干扰
1725. richness, n.富饶，富有
1726. delete, vt. 删除(文字),擦去(字迹
1727. differ, v. (from)与…不同；(with)与…意见不同
1728. pedestrian, n. 步行者a. 徒步的，呆板的，通俗的
1729. position, n. 位置；职位；姿势，姿态；见解，立场，形势
1730. catalyst, n. 催化剂;造成变化的人或事
1731. accent, n. 口音，腔调；重音(符号)vt. 重读
1732. vernacular, adj.本国的
1733. comprehension, n. 理解(力)，领悟；包含，包含力
1734. vaccinate, vt.给…种牛痘
1735. installment, n. 分期付款；(连载的)一期
1736. turning, n.旋转；变向；转弯处
1737. motivation, n.动机
1738. intellectual, a. 智力的,理智的,有理解力的; n. 知识分子
1739. pyrite, n.[矿]黄铁矿
1740. stagnation, n.停滞
1741. forget, v. 忘记，遗忘
1742. contemptuous, adj.轻视的
1743. duty-free, adj.免税的
1744. like, v. 喜欢prep. 象；比如a. 相象的n. 象…一样
1745. assemble, v. 聚集;装配
1746. snout, n.猪嘴
1747. dependence, n.依靠，依赖
1748. exclusivity, n.独家经营权
1749. pirate, n./v. 海盗，盗版(者
1750. cushion, n. 垫子,坐垫,垫状物 vt. 装垫子,使减少震动,缓冲
1751. compensate, v. 赔偿,补偿
1752. trek, vi.牛拉车, 艰苦跋涉。vt.（牛）拉（货车）, 搬, 运。n. 牛拉车旅行, 艰苦跋涉
1753. treatise, n.论文, 论述
1754. lung, n. 肺
1755. chart, n. 海图,图表
1756. alone, a. 单独的，孤独的ad. 单独地，独自地；仅仅
1757. prophecy, n.预言, 预言能力
1758. he, pron. 他；(不论性别的)一个人
1759. unlimited, a.无限的；不定的
1760. redeem, vt. 买回,赎回;补偿,补救
1761. tape-recording, n.录音
1762. fun, n. 玩笑，娱乐；有趣的人(或事物
1763. decipher, vt.译解(密码等), 解释。n.密电译文
1764. cattle, n. 牛；牲口，家畜
1765. wake, v. 醒来，唤醒；使觉醒，激发，引起
1766. degrade, vt. 贬低;恶化;分解,降解
1767. plumb, n. 铅锤,测锤;vt. 探测,查明
1768. build, vt. 建造，建筑；建设，建立vi. 增大，增强
1769. axis, n. (pl. axes)轴,轴心
1770. statesman, n. 政治家,政客
1771. symptom, n. (疾病的)症状；(不好事情的)征兆，表征
1772. pink, n. 粉红色a. 粉红色的
1773. virile, adj.男性的, 男的, 有男子气概的, 精力充沛的
1774. exterior, a./n. 外部的,外来的,外表
1775. operator, n. 操作人员，(电话)接线员
1776. whisky, n.威士忌酒
1777. headmaster, n. 校长
1778. hurrah, int.好哇，万岁，乌拉
1779. species, n. 生物的种;种类
1780. angry, a. 生气的，愤怒的；(天气)风雨交加的
1781. recitation, n.朗诵
1782. imperialism, n.帝国主义
1783. inject, vt. 注射;注入
1784. oneself, pron.自己；亲自，本人
1785. disguise, vt./n. 假扮;隐蔽;掩饰
1786. tomb, n. 坟，冢
1787. overrun, n.泛滥成灾, 超出限度。vt.蹂躏, 超过, 泛滥。vi.泛滥
1788. hustle, v.奔忙
1789. simplicity, n. 简单，简易；朴素；直率，单纯
1790. across, prep. 横过，越过；在的对面ad. 横过，穿过
1791. manure, n.肥料。v.施肥于
1792. works, n.工厂,作品,善行
1793. staff, n. 木棍,杆,工作人员
1794. southward, adj. &adv.向南
1795. drama, n. 剧本，戏剧；戏剧性事件或场面
1796. remuneration, n.酬劳,赔偿,酬金
1797. ground, n. 地，地面，土地；场地，场所；理由，根据
1798. procure, vt. (努力)取得;获得
1799. skill, n. 技能，技巧，手艺；熟练
1800. skeleton, n. 骨骼,(建筑物、计划的)骨架,纲要
1801. supervisor, n.监考人，监查
1802. irrigate, vt. 灌溉，修水利vi. 进行灌溉
1803. send, v. (sent，sent)1. 打发；派遣；2. 送；寄出
1804. financing, n.金融业，财政学
1805. burial, n. 葬,埋藏
1806. hilarious, adj.欢闹的
1807. asymmetric, adj.不均匀的, 不对称的
1808. philosophical, adj.哲学上的
1809. century, n. 世纪，(一)百年
1810. sister, n. 姐，妹；护士长；修女，女教士
1811. fine, a. 晴朗的，美好的，细致的v./n. 罚金，罚款
1812. physics, n. 物理(学
1813. model, n. 样式，型；模范；模型，原型；模特v. 模仿
1814. imperative, a. 紧急的,必要的;强制的,[语
1815. antiquated, adj.陈旧的
1816. Sunday, n. 星期日
1817. basket, n. 筐，篮，篓
1818. adornment, n.装饰(品
1819. undertake, vt. 承担;同意,答应
1820. exceptional, a. 优越的,杰出的;特殊的,例外的
1821. fish, n. 鱼；鱼肉v. 捕鱼；钓鱼
1822. spear, n. 矛，枪
1823. retrospect, n.回顾
1824. reclaim, vt. 要回;回收;开垦(荒地
1825. independent, a. (of)独立的，自主的
1826. indoor, a. 室内的，户内的
1827. Portuguese, n.葡萄牙人；葡萄牙语
1828. liver, n. 肝，肝脏
1829. directly, ad. 直接地，径直地；马上，立即
1830. witty, a.机智的；风趣的
1831. advent, n.(尤指不寻常的人或事)出现, 到来
1832. resolutely, adj.坚决地，果断地
1833. successful, a. 圆满的；顺利的；成功的
1834. resist, v. 抵抗，反抗；抗，忍得住，抵制
1835. dental, adj.牙齿的
1836. resilient, adj.弹回的, 有回弹力的
1837. thread, n. 线，细丝；线索，思路；螺纹v. 穿线，穿过
1838. lavatory, n. 厕所，盥洗室
1839. vogue, n. 流行物,时髦
1840. secluded, adj.隐退的, 隐蔽的
1841. amplify, vt. 放大(声音);增强;详述
1842. fate, n. 命运
1843. prospectus, n.内容说明书, 样张
1844. given, adj.赠予的, 沉溺的, 特定的, 假设的。vbl.give的过去分
1845. wink, v. (使)眨眼；眨眼示意n. 眨眼；小睡，打盹
1846. aisle, n. 通道
1847. fidelity, n.忠实, 诚实, 忠诚, 保真度, (收音机, 录音设备等的)逼 真度, 保真度, 重现精度
1848. hail, n./v. (下)冰雹;(冰雹般)一阵,落下
1849. clockwise, ad. 顺时针方向地
1850. Italy, n.意大利
1851. ampere, n.安培
1852. vice, n. 罪恶;不道德行为
1853. worse, a./ad. 更坏，更差(的/地
1854. relentless, adj.无情的
1855. perspire, v.出汗, 流汗, 分泌, 渗出
1856. oak, n. 橡树，橡木a. 橡木的
1857. potent, a. 有力的,有效的
1858. Christmas, n．圣诞节
1859. majesty, n. 雄伟，壮丽，庄严，威严；最高权威，王权
1860. boom, v./n. 发出隆隆声;vi./n. (商业等的)景气,繁荣
1861. wet, a. 湿的，潮湿的；有雨的，多雨的v. 弄湿，沾湿
1862. peach, n. 桃，桃树
1863. adverbial, adj.副词的
1864. solution, n. 解答，解决办法；溶解，溶液
1865. villain, n.坏蛋
1866. occident, n.西方,欧美
1867. hot, a. (炎)热的；辣的；急躁的；激动的；热衷的
1868. seek, v. (after，for)寻找，探索；试图，企图
1869. gratis, adj.免费的
1870. graphic, adj.绘画似的, 图解的
1871. thinker, n.思想家
1872. disburse, v.支付
1873. ward, n. 病房；行政区；监护；被监护人vt. 挡住
1874. sin, n. 罪，罪恶v. 犯罪
1875. cross, n. 十字(架)；苦难a. 交叉的；发怒的v. 穿过
1876. glassware, n.玻璃制品
1877. element, n. 元素；要素；成分；元件；自然环境
1878. pleasure, n. 愉快，快乐；乐事，乐趣
1879. register, n./v. 登记，注册v. (仪表等)指示，(邮件)挂号
1880. colorless, adj.无色的
1881. homely, a.家庭的；家常的
1882. worry, v. 烦恼；(about)对…感到烦恼n. 烦恼，焦虑
1883. ambivalent, adj.矛盾的, 好恶相克的
1884. noxious, adj.有害的
1885. domain, n. 领域,领土,范围
1886. wrong, a. 错的ad. 错误地，不正确地n. 错误v. 委屈
1887. calculation, n.计算，计算结果
1888. shout, v. 大声叫，喊，呼出n. 呼喊，叫
1889. meddle, v.管闲事
1890. suppression, n.镇压，压制
1891. shrink, vt./vi. 收缩;退缩,畏缩
1892. puncture, n.小孔。v.刺破
1893. orientate, v.向东, 朝向
1894. grateful, a. (to，for)感激的；感谢的
1895. portray, v. 描写，描述；画(人物、景象等
1896. needless, a.不需要的
1897. rash, a. 轻率的，鲁莽的n. 皮疹
1898. analogous, adj.类似的, 相似的, 可比拟的
1899. integral, a. 构成整体所必需的,完整的
1900. unaccommodating, adj.不肯通融的
1901. negate, v.否定
1902. weave, vt./vi. 织,编织;编排;迂回
1903. percent, n. 百分之…的
1904. disagreement, n.不一致；争论
1905. seclude, v.隔离
1906. brush, n. 刷(子)，毛刷；画笔v. 刷，擦，掸，拂；掠过
1907. category, n. 种类,类目
1908. dig, v. 挖，掘
1909. appoint, vt. 任命，委派；指定，约定(时间、地点等
1910. urbane, adj.彬彬有礼的, 文雅的
1911. chance, n. 机会；可能性；偶然性，运气v. 碰巧，偶然发生
1912. dress, n. 服装，童装，女装v. 穿衣，打扮
1913. rapture, n.狂喜，欢天喜地
1914. lax, adj.松的, 松懈的, 不严格的, 腹泻的, 松驰的。n.泻肚
1915. protracted, adj.延长了的
1916. contestant, n.参赛人
1917. predominance, n.优越，杰出
1918. insight, n. 洞悉,洞察,见识
1919. completion, n.完成，结束，完满
1920. landing, n.上岸，登陆，着陆
1921. independently, adv.独立地
1922. beverage, n. 饮料(汽水、茶、酒等
1923. urge, vt. 催促；怂恿；强调n. 强烈欲望，迫切要求
1924. wholesaler, n.批发商
1925. feeling, n. 感情；心情；知觉；同情
1926. relay, vt. 转播;传递 n. 替班;转播;接力赛跑
1927. diagnose, vt. 诊断
1928. uniformly, ad.相同地；一贯
1929. magnanimous, adj.宽宏大量的, 有雅量的
1930. anyhow, ad. 不论用何种方法,无论如何
1931. rest, n. 休息；剩余部分v. 休息；睡；放，靠，搁
1932. Malaysia, n.马来西亚
1933. service, n. 服务；公共设施；维修保养；行政部门v. 维修
1934. monopolize, v.垄断，独占
1935. blossom, n. 花(簇)；花期；青春vi. 开花；展开；繁荣
1936. disposable, adj.可任意使用的
1937. displeasure, n.不快
1938. busy, a. 忙，忙碌的；热闹的，繁忙的；(电话)占线
1939. backlog, n.未交付的订货
1940. rejoice, vt./vi. 欣喜,高兴
1941. editor, n. 编辑，编者
1942. prudent, a. 谨慎的，智慧的，稳健的，节俭的
1943. ounce, n. 盎司，英两
1944. originate, vt./vi. 发生,发起;发明
1945. reluctance, n.不愿，勉强
1946. certification, n.证明
1947. loath, adj.不情愿的, 勉强的
1948. compute, v. 计算,估计
1949. porridge, n.粥，麦片粥
1950. precious, a. 宝贵的,珍贵的
1951. regretfully, adv.遗憾地
1952. tantalize, vt.逗弄, 使干着急
1953. therewith, adv.对此
1954. jury, n. 陪审团
1955. community, n. 同一地区的全体居民，社会，社区；共同体
1956. collaborate, vi. 协作，合作；(与敌人)勾结
1957. adverb, n. 副词a. 副词的
1958. robust, a. 强健的
1959. tap, n. 龙头;轻拍,轻敲;v. 轻拍,轻敲
1960. fiddle, n.提琴
1961. flabby, adj.优柔寡断的性格(或人), 软弱的, 没气力的, 不稳的, (肌肉等)不结实的, 松弛的
1962. bundle, n./v. 捆,包,匆忙地放进
1963. cancel, v. 删去,取消
1964. lively, a. 活泼的，活跃的；栩栩如生的，真实的
1965. warmly, adv.热烈地，热情地
1966. grandfather, n.祖父；外祖父
1967. weakness, n.虚弱，软弱；弱点
1968. slack, a. 松(弛)的;萧条的;懈怠的;n. (绳索等)松弛部分; [pl
1969. consulate, n.领事馆
1970. giggle, v./n. 咯咯地笑,傻笑
1971. soften, vt.使软化vi.变软弱
1972. manifold, n.复印本, 多种。adj.多种形式的, 有许多部分的, 多方面 的。vt.复写, 繁殖, 增多
1973. adjacent, a. 邻接的,邻近的
1974. gorgeous, a. 令人十分愉快的,极好的;华丽的,灿烂的,绚丽的
1975. furthermore, ad. 而且，此外
1976. consecutive, a. 连续的,连贯的
1977. armchair, n.手扶椅
1978. enjoyment, n.享受，乐趣
1979. dwelling, n. 住宅，寓所
1980. mercenary, adj.唯利是图的
1981. slag, n.矿渣, 炉渣, 火山岩渣。v.起溶渣, 成溶渣
1982. stipulate, v. 规定,约定
1983. hepatitis, n.[医]肝炎
1984. volatile, adj.飞行的, 挥发性的, 可变的, 不稳定的, 轻快的, 爆炸 性的。n.[现罕]有翅的动物, 挥发物
1985. asylum, n.庇护, 收容所, 救济院, 精神病院
1986. orthodox, adj.正统的, 传统的, 习惯的, 保守的, 东正教的
1987. mouse, n. 鼠，耗子
1988. cheating, n.欺骗行为
1989. ham, n. 火腿
1990. moisture, n. 潮湿，湿气，湿度
1991. usually, ad. 通常，平常
1992. globe, n. 球体，地球仪；地球，世界
1993. outright, a. 断然的;彻底地;立即,当场
1994. united kingdom, n.英国，联合王国
1995. plastic, n. (常pl. )塑料，塑料制品a. 可塑的，塑性的
1996. detection, n.察觉，发觉；侦察
1997. discrepancy, n. 不一致,差异,不符
1998. hereditary, adj.世袭的, 遗传的
1999. inertia, n. 不活动，惰性；惯性
2000. degenerate, adj.退化的。v.退化
2001. excrement, n.排泄物, 大便
2002. walnut, n.胡桃，核桃树
2003. generalization, n.一般化；概括，综合
2004. miniature, n. 缩小的模型，缩图a. 微型的，缩小的
2005. permanent, a. 永久的,持久的
2006. middleman, n.中人，中间人
2007. arouse, vt. 激发,引起;唤醒
2008. bookkeeper, n.簿记员
2009. headquarters, n. 司令部，指挥部；总部，总局
2010. plunder, vt./vi. 抢劫,掠夺
2011. receive, v. 收到，接到；遭受，受到；接待，接见
2012. inveterate, adj.根深的, 成癖的
2013. seniority, n.资历
2014. pipe, n. 管子，导管；烟斗；笛
2015. ambiguous, a. 引起歧义的，模棱两可的，含糊不清的
2016. tariff, n. 关税，税率；(旅馆，饭店等)价目表，收费表
2017. chick, n.小鸡
2018. extraction, n.抽出；提取法；摘要
2019. gulp, v.吞下
2020. frustration, n.挫折，灰心
2021. especially, ad. 特别，尤其，格外；专门地，主要地
2022. shipwreck, n.船舶失事
2023. tragic, a. 悲剧的，悲惨的
2024. partition, n.分开，分割；融墙
2025. ensure, v. 确保，保证；使安全
2026. car, n. 汽车，车辆，车；(火车)车厢
2027. misappropriate, v.盗用
2028. buck, n.<美口> 元, 雄鹿, 公羊, 公兔。v.(马等)突然一跃(将骑
2029. discreet, a. 谨慎的,思虑两全的
2030. setting, n. 镶嵌;环境,背景;(日月)沉落
2031. Christian, a./n. 基督教的,基督教徒
2032. ocean, n. 海洋
2033. check-out, n.结帐，离店时限
2034. wire, n. 金属线，电线；电报，电信v. 发电报(给
2035. return, v./n. 返回，回来；归还，送还；回答
2036. cosy, adj.舒适的, 安逸的
2037. tension, n. 紧张局势;情绪紧张;不安状态
2038. nameless, adj.无名的
2039. capital, n. 首都,大写字母,资本 a. 可处死刑的
2040. realistic, a. 现实(主义)的
2041. installation, n. 安装，设置；装置，设备
2042. shuttle, n. 梭,滑梭;vt. 使穿梭般往返移动
2043. infinite, a. 无限的，无穷的n. 无限
2044. wolf, n. 狼
2045. distraction, n.分心
2046. mop, n.墩布，洗碗刷
2047. aboriginal, adj.土著的, 原来的。n.土著居民
2048. twilight, n. 曙光,黎明,黄昏
2049. income, n. 收入，收益，所得
2050. telescope, n. 望远镜v. 缩短，压缩
2051. identify, vt. 认出;认为…与…一致
2052. secondhand, adj.二手的，间接的
2053. attach, v. 系上,附上;依恋;认为
2054. adversity, n.逆境，不幸
2055. coherence, n.凝聚性
2056. paste, n. 糊，浆糊v. 粘，贴
2057. absurd, a. 荒谬的,可笑的
2058. facet, n.(多面体的)面, (宝石等的)刻面, 小平面, 方面, 琢面。 vt.在...上刻画
2059. uncap, v.打开
2060. wedge, n. 楔子;楔形物;vt. 挤进;把…楔住
2061. jog, v./n. 轻推,轻撞;缓步前进,慢跑
2062. dogged, adj.顽固的, 顽强的
2063. engaged, adj.占用的，从事的
2064. odd, a. 奇数的,单独的,零头的,临时的,古怪的,奇怪的
2065. fury, n.狂怒，暴怒；猛烈
2066. blockage, n.封锁
2067. lipstick, n.唇膏，口红
2068. conservative, a. 守旧的,保守的 n. 保守主义,保守党人
2069. worthy, a. (of)值得…的，配得上…的；有价值的
2070. memo, n. 备忘录
2071. verification, n.检验
2072. extravagance, n.奢侈，浪费
2073. materialize, v.使具体化，物质化
2074. pickpocket, n.扒手，小偷
2075. prestige, n. 威信,声望;(由于成功、财富等而产生)显赫
2076. cup, n. 杯子；奖杯，优胜杯；(一)杯，一杯的容量
2077. atmospheric, a.大气的；大气层的
2078. stationer, n.文具商, 文具店
2079. organic, a. 器官的；有机的；有机体的
2080. fireman, n. 消防队员
2081. drudgery, n.苦差事, 苦工
2082. oblong, n./a. 长方形(的
2083. whaling, n.捕鲸(业
2084. defraud, vt.欺骗
2085. itch, v. &n.痒，热望
2086. countermand, v.撤回，取消
2087. dormant, adj.睡眠状态的, 静止的, 隐匿的
2088. remember, v. 记住；(to)转达问候，代…致意，代…问好
2089. odyssey, n. -seys 长期的冒险旅行
2090. morning, n. 早晨，上午
2091. laborious, adj.(指工作)艰苦的, 费力的, (指人)勤劳的
2092. assess, vt. 评价;估值
2093. specialty, n. 特性，性质；专业/长；特产
2094. emigrant, n.移居国外的人
2095. comment, n./vi. 评论;批评;注释
2096. idealism, n.唯心主义；理想主义
2097. distinctly, ad.显然，清楚地
2098. book, n. 书，书籍vt. 订(票，座位，房间等)，预定
2099. postmortem, adj.死后的, 死后发生的。n.尸体检查, 验尸
2100. formerly, ad.以前，从前
2101. chronic, adj.慢性的, 延续很长的
2102. illusive, adj.幻觉的
2103. neighboring, adj.邻近的，相邻的
2104. singer, n.歌唱家，歌手
2105. burn, v. 燃烧，烧着；烧毁；灼伤n. 烧伤，灼伤
2106. disprove, v.反驳, 驳斥, 证明...为误
2107. extinction, n.绝灭，熄灭
2108. arduous, a. 艰巨的,艰苦的
2109. antonym, n.反义词
2110. outlandish, adj.古怪的,奇异的
2111. milk, n. 牛奶；(植物流出的)白色乳液v. 挤奶
2112. west, n./a. 西，西方(的)，西部(的)ad. 向西
2113. sweetheart, n.心肝，宝贝
2114. defray, v.支付
2115. remainder, n. 剩余物，剩下的；余数，余项
2116. vouch, v.担保
2117. diamond, n. 金钢石，钻石；菱形
2118. civic, adj.市的, 市民的, 公民的
2119. shipping, n.船运，装运
2120. correctly, ad.正确地，恰当地
2121. remarkable, a. 不平常的;出色的
2122. sightseeing, n. 观光;游览
2123. horizontal, a. 地平线的；水平的
2124. torpedo, n.鱼雷，水雷
2125. thermometer, n. 温度计
2126. stew, vt.炖vi.炖着n.炖肉
2127. pin, n. 大头针;vt. 用别针别住;钉住,使不能行动
2128. sober, a. 未醉的;严肃的;素淡的;v. (up)(使)醒酒;(使)清醒
2129. workmanship, n.工艺，手艺
2130. transistor, n. 晶体管
2131. indirect, a.间接的；不坦率的
2132. phone, n. (telephone)电话，电话机，耳机v. 打电话
2133. frugal, a. 俭朴的,花钱少的
2134. regularity, n.规则性；整齐
2135. o-clock, adv.点钟
2136. patriotism, n. 爱国主义,民族主义
2137. spit, vt./vi. 吐(唾沫
2138. movie, n. 电影，电影院
2139. obtain, v. 获得，得到
2140. identification, n. 识别，鉴别；证件；认同
2141. pulp, n.(水果的)果肉, 纸浆。vt.使化成纸浆, 除去...果肉
2142. cif, n.(缩)到岸价（=Cost, Insurance & Freight
2143. medal, n. 奖章,纪念章
2144. hiss, n.嘶嘶声vi.嘶嘶作声
2145. dialog, n.对话，对白
2146. hydroelectric, adj.水电的
2147. possess, v. 占有，拥有
2148. computation, n.计算
2149. embrace, v./n. 拥抱;利用;包含
2150. opt, vi.选择
2151. deer, n. 鹿
2152. limited, a. 有限的，被限制的
2153. Monday, n. 星期一
2154. hundred, num. 百，一百；[pl
2155. haste, n. 匆忙，急速；草率v. 赶快；匆忙
2156. pry, v.探查
2157. splint, n.藤条, 薄木条, 薄金属片, (外科用的)夹板。v.用夹板来
2158. boxer, n.拳击运动员
2159. gymnastics, n.体操
2160. kernel, n. 果核,果仁,核心
2161. influential, a. 有影响的；有权势的
2162. ask, vt. 问，询问；请求，要求；邀请，约请
2163. further, ad./a. 更远，更往前；进一步v. 促进，增进
2164. generic, adj.[生物]属的, 类的, 一般的, 普通的, 非特殊的
2165. threat, n. 恐吓，威胁；坏兆头，危险迹象
2166. carton, n. 纸盒,纸板箱,塑料箱
2167. cognitive, adj.认知的, 认识的, 有感知的
2168. disarray, v.混乱
2169. mighty, a.强大的；巨大的
2170. conformity, n.遵照，一致
2171. yard, n. 院,场地,码
2172. mother-in-law, n.岳母，婆婆
2173. aunt, n. 姨母，姑母，伯母，婶母，舅母，阿姨
2174. lazy, a. 懒惰的，懒散的
2175. persuasive, n.说服者, 劝诱。adj.善说服的
2176. literary, a. 文学上的，文学的；精通文学的，从事写作的
2177. opal, n.蛋白石
2178. embryo, n.胚胎, 胎儿, 胚芽。adj.胚胎的, 初期的
2179. cog, n.[机]嵌齿, 小船。vt.上齿轮, 欺骗
2180. propellent, adj.推进的
2181. joy, n. 欢乐，喜悦；乐事，乐趣
2182. hallmark, n.标志
2183. aim, n. 目的；瞄准vi. (at)目的在于vt. 把…瞄准
2184. narrator, n.叙述者
2185. microbe, n.微生物, 细菌
2186. operational, a. 操作的，运转的，起作用的，经营的
2187. shrug, n./v. 耸肩
2188. tranquility, n.宁静
2189. dinner, n. 正餐，宴会
2190. tackle, vt./vi. 处理,对付;抓住
2191. gracious, a. 亲切的,和善的;优美的,奢华的
2192. practitioner, n.从业者, 开业者
2193. sincerely, adv.真诚地
2194. repute, n.声誉v.看作，评价
2195. posture, n.(身体的)姿势, 体态, 状态, 情况, 心境, 态度。v.令取 某种姿势, 摆姿势, 作出姿态
2196. volley, n. &v.齐射
2197. wood, n. 木材，木头，木料；(pl.)森林，林地
2198. deed, n. 行为，行动；功绩，事迹；证书；契据
2199. emergency, n. 紧急情况,突发事件
2200. undergraduate, n. 大学生，大学肆业生
2201. worst, a./ad. 最坏(的)，最差(的
2202. mingle, v. (使)混合
2203. proportional, a.比例的；相称的
2204. syndrome, n.综合病症
2205. murmur, n./v. 低沉连续的声音;诉怨
2206. jewelry, n. (总称)珠宝
2207. consume, vt. 消耗；吃完，喝光；(with)使着迷；烧毁
2208. convenient, a. (to)便利的，方便的
2209. bazaar, n.集市，廉价商店
2210. refer, v. 参考，查询；提到，引用，涉及；提交，上呈
2211. claw, n. 爪，脚爪
2212. din, n.喧嚣。v.絮絮不休地说, 喧闹
2213. earnings, n.工资，收入；收益
2214. depend, v. (on)取决于，依靠，信赖，相信
2215. communicative, adj.毫无隐讳交谈的, 畅谈的, 爱说话的
2216. venerate, v.崇敬
2217. think, v. 想，思索；认为，以为；想要；料想，预料
2218. write, v. 写，书写，写字；写作；写信(给)，函告
2219. meteorologist, n.气象学者
2220. drown, v. 淹死;(高声音)遮掩(低声音
2221. possibly, ad. 可能地，也许；无论如何
2222. counter-offer, n.还价，还盘
2223. eye, n. 眼(睛)；视力；眼力；监督vt. 看，审视
2224. nice, a. 美好的，令人愉快的；友好的，亲切的
2225. disaster, n. 灾难，大祸；彻底的失败
2226. van, n. 有篷汽车；有篷货运车厢
2227. perish, vt./vi. 死亡,使痛苦;(橡胶、皮革等)失去弹性,老化
2228. dissertation, n.(学位)论文, 专题, 论述, 学术演讲
2229. nucleus, n. 原子核,核心
2230. naturally, ad.自然地；天然地
2231. jealous, a. 妒忌的,妒羡的
2232. endurance, n. 忍耐力,忍耐
2233. destiny, n. 命运；天数，天命
2234. beat, n./v. 敲打,搅拌,胜,心跳
2235. green, a. 绿色的；生的；未成熟的n. 绿色；蔬菜；植物
2236. deadlock, n.死锁, 僵局
2237. liquid, n. 液体a. 液体的，液态的
2238. jeopardise, v.使受危险, 危及
2239. solitary, a. 独居的,孤独的,惟一的;荒凉的
2240. purse, n. 钱包
2241. suspicion, n. 怀疑，猜疑；一点儿，少量
2242. miscarry, v.未运到(目的地
2243. extravagant, a. 奢侈的;过分的;放肆的
2244. normalization, n. 正常化，标准化
2245. barrel, n. 圆桶,一桶的量,枪管 vt. 把...装桶
2246. during, prep. 在…期间
2247. recession, n. 后退,撤回;(工商业)衰退,(价格)暴跌
2248. apartment, n.房间，套间；[美
2249. unsuitable, a.不合适的，不适宜的
2250. yield, vt./vi. 生产;生长;让步;投降;屈服;n. 产量
2251. perfection, n. 尽善尽美，完美
2252. squirt, v.喷出
2253. howl, n./v. 嚎叫,怒吼
2254. standstill, n.停顿
2255. struggle, n./v. 斗争，奋斗，努力
2256. fragrance, n. 香味,香气
2257. skirmish, n.小冲突,小规模战斗
2258. republican, a. 共和的
2259. slowly, ad.慢慢地
2260. preference, n. (for，to)偏爱，喜爱；优惠；优先选择
2261. challenge, n./v. 挑战,提出异议
2262. dust, n. 灰尘，尘土v. 拂，掸
2263. consequence, n. 结果，后果，影响；重要性
2264. Russian, a.俄罗斯的 n.俄国人
2265. breakthrough, n. 军事突破;重大发明(发现
2266. disgustful, adj.令人生厌的
2267. bud, n./vi 芽,萌芽
2268. artificial, a. 人工的;矫揉造作的
2269. clam, n.蛤
2270. nurse, n. 护士，保姆v. 护理，看护
2271. thin, a. 薄的，细的；稀薄的，淡的；瘦的v. 变薄；变稀
2272. console, vt. 安慰,慰问;n. 控制台,仪表板;落地柜
2273. drill, n. 钻,钻头,操练,练习 v. 钻孔,操练
2274. renew, v. (使)更新，恢复，重新开始，继续
2275. supersonic, a. 超音速的，超声波的n. 超声波，超声频
2276. author, n. 作者，作家，著作人；创始人，发起人
2277. defective, adj.有缺点的
2278. sampling, n.抽样
2279. whale, n. 鲸；庞然大物
2280. frighten, v. 使惊恐
2281. seemingly, ad. 外观上，表面上
2282. lake, n. 湖泊，湖水
2283. Marxism, n.马克思主义
2284. blunder, v. 瞎闯,犯愚蠢的错误;n. 因疏忽所犯的错误
2285. most, a. 最多的；大多数的ad. 最；极其n. 大多数
2286. unlikely, a. 未必的,不大可能的
2287. indication, n. 指出，指示；表明，暗示
2288. much, a. 多的，大量的ad. 十分，非常；到极大程度
2289. metal, n. 金属，金属制品
2290. sour, a. 酸的
2291. abstract, a. 抽象的;n. (书籍、演说等的)摘要
2292. avalanche, n.雪崩。v.雪崩
2293. coinage, n.造币; 创造; 货币制度;创造新词
2294. elect, v. 选举，推选；选择，作出选择
2295. wage, n. 周薪 vt. 从事(战争等
2296. disease, n. 疾病
2297. concession, n. 让步，妥协；特许(权
2298. intervene, vi. 插入,干涉;插话(时间)介于
2299. Switzerland, n.瑞士
2300. buyer, n.购买者
2301. implication, n. 含意，暗示，暗指；牵连
2302. utterly, adv.完全地, 绝对地, 彻底地
2303. technician, n. 技术人员
2304. obliging, adj.亲切的, 有礼貌的, 愿意帮人忙的
2305. invoice, vt. 开发票;n. 发票,装货清单
2306. army, n. 军队，陆军，军；大群，大批
2307. classification, n. 分类，分级
2308. ramify, v.(使)分枝, (使)分叉, (使)成网状
2309. variance, n.分歧，不一致
2310. guess, v./n. 猜测，推测；以为；猜想
2311. exceedingly, ad. 极端地，非常
2312. overtake, vt. 超过,赶上;突然降临
2313. inhabit, vt. 居住于
2314. shriek, vi.尖声喊叫 n.尖叫声
2315. leak, n. 漏洞,泄漏
2316. mechanism, n. 机械装置;办法,途径;机制,机理
2317. welcome, int. 欢迎a. 受欢迎的vt./n. 欢迎；迎接
2318. crave, v.渴望，恳求
2319. overwhelm, vt. (感情上)使受不了,使不知所措; 征服,制服
2320. jeer, n.嘲笑, 讥讽, 戏弄。v.嘲弄, 戏弄
2321. homestay, n.(在国外的访问者)在当地居民家居住的时期
2322. endless, a.无止境的
2323. policeman, n. 警察
2324. nutrition, n.营养, 营养学
2325. cervix, n.[解]颈部, 子宫颈
2326. sane, adj.健全的
2327. deem, vt. 认为,视为
2328. province, n. 省；领域，范围，本分
2329. domestic, a. 家的,家庭的;本国的;n. 佣人
2330. deaf, a. 聋的,不愿听的
2331. lobby, n. 门廊,门厅;院外活动集团;v. 对(议员等)游说活动
2332. boarding card, n.乘车证, 乘客证
2333. oscillation, n.摆动，振动
2334. ingenuous, adj.坦白的, 自然的, 直率的
2335. bit, n. 一点,一些；小块,少量；片刻;[计
2336. lamp, n. 灯
2337. Antarctic, a./n. 南极的,南极
2338. heating, n.加热，供暖
2339. developing, adj.发展中的
2340. skyscraper, n. 摩天大楼
2341. variable, a. 变化的,可变的;n. 可变物,变量
2342. studious, adj.勤学的, 认真的, 慎重的, 热心的
2343. traverse, vt. 横越,穿过
2344. starfish, n.海星
2345. maturity, n.成熟，到期
2346. antecedent, a./n. 先行的;祖先
2347. temporal, adj.时间的, 当时的, 暂时的, 现世的, 世俗的, [解]颞的 。n.世间万物, 教会财产
2348. mathematical, a. 数学的；数学上的
2349. inlet, n. 水湾，小湾；进口，入口
2350. flesh, n. 肉,肉体,果肉
2351. static, a. 静止的,固定的;n. 静电干扰
2352. variant, adj.不同的，不一致的
2353. philosopher, n. 哲学家，哲人
2354. bush, n. 灌木(丛
2355. sift, vt.筛，过滤vi.通过
2356. approximation, n.近似值
2357. offspring, n. 子孙后代,动物的幼仔
2358. adaptation, n.适应
2359. repent, vi./vt. 悔悟,后悔
2360. arable, adj.可耕的, 适于耕种的
2361. teenager, n. 十几岁的青少年
2362. large, a. 大的，广大的，大规模的
2363. beetle, n.甲虫；近视眼的人
2364. lately, ad. 最近，不久前
2365. cutlery, n.刀具，餐刀
2366. aloud, adv. 出声地，大声地
2367. copyright, n.版权, 著作权
2368. eminent, a. 著名的,卓越的
2369. volcanic, adj.火山的, 象火山的, 猛烈的, 易突然发作的, 爆发的
2370. implicit, adj.暗示的, 盲从的, 含蓄的, 固有的, 不怀疑的, 绝对的
2371. blame, vt. 责备,找…的差错 n. 责任
2372. sign, n. 记号,标志,征兆,v. 签名
2373. fanatic, a./n. 狂热的,狂热者
2374. resignation, n.放弃，辞职，反抗
2375. salmon, n.鲑，大马哈鱼
2376. breadth, n. 宽度，幅
2377. hear, v. 听见；审讯；(from)收到…的信/电话；听说
2378. idea, n. 想法，念头；概念，观念；意见，主意
2379. appetite, n. 食欲
2380. carpentry, n.木工工作
2381. letter, n. 信，函件；字母，文字
2382. superstructure, n.(建筑物, 铁路等的)上部构造, 上层建筑
2383. herbivorous, adj.食草的
2384. dub, vt.[电影]配音, 轻点, 授予称号, 打击。n.鼓声, 笨蛋
2385. catastrophe, n. 大灾难；(悲剧)结局
2386. surface, n. 表面；外表a. 表面的，肤浅的
2387. difference, n. 差别，差异，分歧
2388. desirable, a. 值得弄到手的,吸引人的
2389. delusive, adj.令人产生错觉的
2390. modified, adj.改良的，改进的
2391. manipulation, n.操纵，操作
2392. lily, n.百合，百合花，睡莲
2393. toss, v./n. 扔,掷;摇摆
2394. southern, a. 南方的，南部的
2395. always, ad. 总是，无例外地；永远，始终
2396. digestion, n.消化
2397. electron, n. 电子
2398. obligate, vt.使负义务。adj.有责任的
2399. hind, adj.后面的，后部的
2400. extent, n. 广度，宽度，长度；程度，限度
2401. demanding, adj.对人要求严格的
2402. consist, vi. 组成,存在
2403. preservation, n.保存，储藏；保持
2404. salute, vi. 行礼,致敬,问候;vt. 向…致意,向…敬礼; 赞扬,颂
2405. multiplication, n.增加；繁殖；乘法
2406. predict, v. 预言，预测，预告
2407. aid, n. 援助，救护；助手，辅助物vi. 援助，救援
2408. pistol, n. 手枪
2409. minimum, n. 最小量,最低限度
2410. abundant, a. 大量(充足)的；(in)丰富(富裕)的
2411. microfilm, n.[摄]缩影胶片。v.缩微拍摄
2412. king, n. 君主，国王
2413. reach, v. 抵达；(out)伸手，够到n. 能达到的范围
2414. motto, n. 座右铭,箴言
2415. call, vt. 叫，喊；打电话vi. 叫；访问n. 叫；号召
2416. mat, n. 席子，垫子
2417. wallaby, n.[动]小袋鼠, <复><口>澳洲土人
2418. persuade, v. 说服，劝说；(of)使相信
2419. verse, n. 韵文，诗；诗节，诗句
2420. commit, vt. 犯(罪),干(坏事);使(自己)承担义务,作出保证,承诺
2421. herculean, adj.力大无比的, 巨大的
2422. pinnacle, n.小尖塔, 山顶, 顶点。vt.造小尖塔, 把...放在极高处
2423. elemental, a.基本的；自然力的
2424. summit, n. 顶点,高峰;峰会(最高级会谈
2425. difficult, a. 困难的，艰难的
2426. affect, vt. 影响
2427. suite, n. 套间；一套家具；套，组，系列
2428. artery, n.动脉, 要道
2429. sorrowful, a.使人伤心的；悲伤的
2430. disgraceful, adj.耻辱的，受辱的
2431. emit, vt. 散发,发射
2432. notary, n.公证人
2433. laborer, n.劳工，劳动者
2434. exhaust, n. 排气;v. (使)疲倦;用尽;弄空;详述
2435. malleable, adj.有延展性的, 可锻的
2436. ease, v./n. 减轻,放松,小心移置;舒适
2437. greatly, ad.大大地，非常
2438. craftsmanship, n.手艺
2439. speculation, n.推测，投机
2440. sweat, n. 汗v. (使)出汗
2441. grandson, n.孙子，外孙子
2442. happily, adv.幸运地
2443. item, n. 条款,项目,一条(新闻
2444. warn, vt. 警告vi. 发出警告
2445. devour, vt. 狼吞虎咽地吃;挥霍,耗尽
2446. arrogantly, adv.傲慢地
2447. superstition, n. 迷信;迷信行为
2448. tack, n.平头打vt.钉住
2449. easily, ad.容易地；舒适的
2450. exoneration, n.免罪，免除
2451. miserable, a. 悲惨的;使人难受的
2452. averagely, adv.平均
2453. faction, n.派别，宗派，小集团
2454. hardship, n. 艰难，困苦
2455. enclose, vt. 把…围起来;把…封入信封
2456. mangrove, n.[植]红树林
2457. earphone, n.耳机
2458. opium, n.鸦片；麻醉剂
2459. liability, n. 责任，义务；(pl.)债务
2460. depletion, n.损耗
2461. elevate, vt. 提升…的职位;提高,改善;使情绪高昂,使兴高采烈;举
2462. eighty, num./a. 八十pron. 八十(个，只
2463. hard, a. 坚硬的；结实的；困难的；难忍的；严厉的
2464. alive, a. 活着的；存在的；活跃的；(to)敏感的
2465. deflection, n.偏斜，歪斜；偏差
2466. bus, n. 公共汽车，总线，信息通路
2467. financier, n.金融家
2468. ply, v.使用,固定往来,持续大量供应 n.(夹板的)层片
2469. cooperation, n.合作，协作
2470. alchemy, n.炼金术, 魔力
2471. belief, n. 信任，相信，信念；信仰，信条
2472. alienation, n.异化
2473. happening, n.事件
2474. damage, v./n. 损害，毁坏n. (pl.)损害赔偿费
2475. copper, n. 铜；铜币，铜制器
2476. previously, ad.先前，预先
2477. betrayal, n.背叛，暴露
2478. benzene, n.[化]苯
2479. overcoat, n. 外衣，大衣
2480. daring, adj.大胆的，勇敢的
2481. recur, v. (尤指不好的事)一再发生；重现
2482. mincer, n.粉碎机
2483. chapter, n. 章；回，篇
2484. sneeze, vi. 打喷嚏，发喷嚏声n. 喷嚏
2485. youthful, a.年轻的，青年的
2486. stadium, n. 露天运动场
2487. prosecution, n.起诉,诉讼,原告,实施,从事,进行
2488. pork, n. 猪肉
2489. flow, v. 流，流动n. 流量，流速
2490. comb, n. 梳子v. 梳(理
2491. propagate, vt./vi. 繁殖,增殖,传播,宣传
2492. freezer, n.冷冻箱
2493. tale, n. 故事，传说
2494. ammonia, n.[化]氨, 氨水
2495. summon, vt. 召唤,传唤;鼓起,聚集
2496. owe, vt./vi 欠债,感激,由于
2497. awkward, a. 难使用的;笨拙的;尴尬的
2498. reverence, n.尊敬，崇敬
2499. forerunner, n.先驱(者), 传令官, 预兆
2500. value, n. 价格；价值；实用性v. 评价，估价；尊重
2501. district, n. 地区，行政区；美国各州的众议院选区
2502. radical, a. 根本的,基本的;政治激进的
2503. poke, v./n. 拨;戳
2504. willing, a. 愿意的，乐意的，心甘情愿的
2505. neat, a. 整洁的;雅致的;灵巧的;纯的;不掺水的
2506. eradicate, v.根除
2507. leafy, adj.叶状的, 多叶的, 阔叶的, 树叶茂盛的
2508. astronomical, adj.天文学的
2509. possessive, adj.所有(格)的
2510. immediate, a. 立即的，即时的；直接的，最接近的
2511. wording, n. 措辞
2512. scalpel, n.解剖刀
2513. navigable, a. (江河、海洋)可航行的,可通航的;(船)适航的
2514. beam, n. 梁;光束;飞机导航无线电射束; v. 发光,发热;微笑;定 向发出(无线电信号
2515. translucent, adj.半透明的, 透明的
2516. junior, n. 较年幼者;a. 较年幼的,等级较低的
2517. cassette, n. 磁带盒,照相软片盒
2518. moss, n. 苔，藓，地衣
2519. booklet, n.小册子
2520. shot, n. 开枪，射击；投篮；弹丸，炮弹，子弹
2521. leg, n. 腿，腿部；支柱；(旅程的)一段，一站
2522. murderer, n.杀人犯，凶手
2523. canteen, n. 食堂,小卖部,餐具箱,水壶
2524. hate, v. 恨，憎恨；不愿，不喜欢n. 恨，憎恶
2525. snag, n.障碍。v.阻碍
2526. forefinger, n.食指
2527. rival, n. 竞争者,对手
2528. zipcode, n.邮政编码
2529. acceptance, n. 接受，接收，验收，接纳；承认，认可
2530. past, a. 过去的ad. 过n. 过去，昔日prep. (经)过
2531. observation, n. 观察，观测，监视；(pl.)观察资料；观察力
2532. exertion, n.尽力，竭力
2533. rank, n. 军衔，社会阶层；排v. 分等级，把…分类
2534. play, v. 玩，做游戏；参加比赛n. 游戏；玩耍；剧本
2535. analogue, n. 类似物；相似体；模拟
2536. fragment, n. 碎片,片断;vi. 裂成碎片
2537. inspector, n.检查员；巡官
2538. summary, a. 概括的;即时的;n. 摘要,概要
2539. include, v. 包括，包含，计入
2540. injection, n.注射，注入；充满
2541. warden, n.典狱官, 看守人, 学监, 区长, (供煮食的)一种冬梨
2542. importation, n.进口
2543. malnutrition, n.营养失调, 营养不良
2544. pertinence, n.有关性,相关性,针对性
2545. destine, vt.命定，注定；预定
2546. pompous, adj.华而不实的
2547. keyhole, n.钥匙孔
2548. reward, n./v. 奖赏
2549. remind, vt. 提醒
2550. attract, vt. 引起的注意(或兴趣等)，吸引；引起；激起
2551. franchise, n.特许权
2552. slang, n.俚语；行话，黑话
2553. preceding, a. 在前的,在先的
2554. exhausted, adj.精疲力竭的
2555. similarity, n.类似，相似；类似点
2556. errand, n. 差使,差事
2557. judgement, n.意见；审判；判断
2558. treaty, n. 条约，协议，协商
2559. heavy, a. 重的，重型的；沉重的，大量的，猛烈的
2560. finite, a. 有限的,限定的
2561. contempt, n. 轻蔑,不尊敬,轻视
2562. amidst, prep.在...当中
2563. coordination, n.协调，配合
2564. lest, conj. 惟恐，免得
2565. change, n. 改变，变化；零钱v. 更换，调换，交换；改变
2566. supermarket, n. 超级市场
2567. fortunate, a. 幸运的，侥幸的
2568. seventy, num.七十，七十个
2569. customs, n.海关
2570. tortoise, n.龟，乌龟
2571. optional, a. 可以任选的，随意的，非强制的
2572. architect, n. 建筑师,设计师
2573. adjustment, n.调整
2574. tin, n. 罐头；锡a. 锡制的vt. 镀锡于
2575. viable, adj.能养活的, 能生育的, 可行的
2576. move, v. 移动，迁移；活动；感动n. 移动，活动，行动
2577. peak, n. 山顶，最高点；峰，山峰a. 高峰的，最高的
2578. significant, a. 有意义的；重大的，重要的
2579. apparent, a. 明显的;表面上的
2580. clarify, v. 澄清,使液体清洁
2581. television, n. 电视；电视机
2582. optimal, adj.最佳的
2583. transmission, n. 传递,播送电视节目,汽车传动系统
2584. available, a. 可获得的,可用的
2585. perceptible, adj.可察觉的, 显而易见的, 感觉得到的
2586. meek, a. 温顺的,谦逊的
2587. sexual, adj.性的，性感的
2588. normally, ad.通常，正常地
2589. flock, n. (鸟兽)群,一群人,群集
2590. sentence, n. 句子；判决，宣判v. 宣判，判决
2591. handle, n. 柄，把手，拉手v. 处理，对待，操纵；触，抚养
2592. accompaniment, n.伴侣，伴奏
2593. paranoia, n.[心]妄想狂, 偏执狂
2594. literate, n.有文化的
2595. truthful, adj.诚实的，真正的
2596. lobster, n.龙虾
2597. foreigner, n. 外国人
2598. aerial, a. 空气的,空中的 n. (无线电)天线
2599. trumpet, n. 喇叭,喇叭声
2600. ungainly, adj.难看的, 不象样的, 笨拙的。adv.笨拙地, 难看地, 不
2601. yeast, n.酵母
2602. sender, n.寄信人
2603. relinquish, vt. 放弃;撤回
2604. counsel, n. 忠告,劝告;评议;律师;vt. 忠告,劝告
2605. prolific, adj.多产的, 丰富的, 大量繁殖的
2606. delinquent, adj.拖欠的
2607. handbag, n.手袋，手提包
2608. constant, a. 经常的;不变的;坚定的
2609. condolence, n.哀悼, 吊唁
2610. subscription, n.预约，用户，订阅费
2611. waterproof, a. 防水的，耐水的
2612. appear, vi. 出现；出场；问世；仿佛；出版，发表
2613. precipitate, n.沉淀物。vt.猛抛, 使陷入, 促成, 使沉淀。vi.猛地落下 。adj.突如其来的, 陡然下降(或下落)的, 贸然轻率的
2614. necklace, n. 项链，项圈
2615. counterpart, n. 对应的物或人
2616. swirl, n.漩涡, 涡状形。vt.使成漩涡。vi.打漩, 盘绕, 头晕。 vi.<口>挥击, 大口喝酒
2617. eyebrow, n. 眉毛
2618. disapproval, n.不批准
2619. repetition, n. 重复
2620. c/o, v.(缩)请转交
2621. employer, n. 雇主
2622. semester, n.学期
2623. fission, n.裂开；分裂生殖
2624. short, a. 短的，矮的；(of)缺乏，不足n. (pl.)短裤
2625. humid, a. 湿的，湿气重的
2626. predisposition, n.易患病的体质
2627. preacher, n.鼓吹者，宣教士
2628. postman, n. 邮递员
2629. customer, n. 顾客，主顾
2630. involve, vt. 包含;使卷入;牵涉
2631. inadequate, a.不充足的，不适当的
2632. picture, n. 画，图片；影片；美景v. 画，描述，想象
2633. clarification, n.澄清
2634. substantiate, vt. 证实,证明
2635. behavior, n. 行为，举止；(机器等)运转情况
2636. computerization, n.计算机化
2637. oasis, n.(沙漠中)绿洲,舒适的地方
2638. ascend, vi. 渐渐上升，升高vt. 攀登，登上
2639. deficit, n. 空额,赤字
2640. parking, n.停放车辆
2641. aggregation, n.总计，集合
2642. instinct, n. 本能
2643. butt, n.大酒桶，桶
2644. inspection, n. 检查,审视,检阅
2645. without, prep. 无，没有n. 外面，外部
2646. cute, adj.可爱的, 聪明的, 伶俐的, 装腔作势的
2647. highland, n. 高地，高原
2648. glamour, n.[亦作glamor] 魔力, 魅力。v.迷惑
2649. pea, n. 豌豆
2650. poker, n.扑克,拨火铁棒,直挺挺的,僵硬的
2651. demolish, vt. 拆毁;废除;驳倒
2652. respectfully, adv.恭敬地
2653. occupy, vt. 占,占用,占领;使忙碌,使从事
2654. strongly, ad.强壮地，强烈地
2655. pony, n.小马
2656. mutation, n.变化, 转变, 元音变化, (生物物种的)突变
2657. hull, n.外壳，豆荚；薄膜
2658. alien, n./a. 外侨;外国的;不相容的
2659. illuminate, vt. 照亮,用灯装饰;阐明
2660. vision, n. 视力，视觉；远见；洞察力；幻想，幻影；想象力
2661. combustion, n.燃烧
2662. deceive, vt. 欺骗,诓骗
2663. pervade, v.遍及
2664. glow, vi. 发出光和热;脸发红发热;n. 光辉
2665. penny, n. 便士，美分
2666. altogether, ad. 完全，总之，全部地；总共；总而言之
2667. late, a. 迟的，晚的，晚期的；已故的ad. 迟，晚
2668. missionary, a. 教会的，传教(士)的n. 传教士
2669. shoe, n. 鞋
2670. fusion, n.熔化, 熔解, 熔合, 熔接
2671. dozen, n. 一打，十二个
2672. ulcer, n.溃疡
2673. spectacular, a. 壮观的
2674. northeast, n. 东北a. 东北方的ad. 向东北，在东北
2675. acceleration, n.加速；加速度
2676. ingenuity, n.机灵；设计新颖
2677. revision, n.修改，修订,复习,温习
2678. jacket, n. 短上衣，茄克衫
2679. trespass, n.过失, 罪过, 侵入。v.侵入
2680. lenient, adj.宽大的, 仁慈的, 慈悲为怀的
2681. differently, adv.不同地
2682. humiliate, vt. 羞辱,使丢脸
2683. obsess, vt.迷住, 使困扰
2684. vocation, n. 职业；召唤；天命；天职；才能
2685. roll, n./v. 卷,滚动,隆隆声
2686. captive, n./a. 俘虏,迷恋者;被俘虏的,被拴住的
2687. zoology, n. 动物学
2688. flexibility, n.柔韧，灵活性
2689. favor, n. 好感；喜爱；关切v. 赞成，支持，偏爱
2690. negotiable, a. 可谈判的,可商议的;可兑换现金的;可通行的(道路、河
2691. her, pron.她；[she的所有格
2692. consolidate, v. 巩固,加强;把…合为一体
2693. sarcastic, a. 讽刺的
2694. main, a. 主要的，总的n. 总管道；干线
2695. robot, n. 机器人，自动机械
2696. attribute, vt. 归因于;n. 属性;象征;标志
2697. pound, n. 磅；英镑v. (连续)猛击，(猛烈)敲打，捣碎
2698. ordeal, n.严酷的考验, 痛苦的经验, 折磨
2699. moonlight, n.月光
2700. stationary, a. 固定的,定置的;不变动的, 不移动的
2701. likelihood, n. 可能性
2702. conscientiously, adv.认真地
2703. weekend, n. 周末
2704. frightening, adj.令人害怕的
2705. dealer, n. 商人
2706. copy, n. 抄本，摹本；(一)本vt. 抄写；考试中抄袭
2707. designation, n.指定，委派
2708. lighter, n.打火机，引燃器
2709. brood, n. 同窝幼鸟;一个家庭的孩子;vi. 孵幼雏;沉思
2710. indebtedness, n.感激
2711. infinity, n.大量，大宗；无穷大
2712. tiresome, a. 使人厌倦的，讨厌的
2713. mend, v. 修理，缝补；改正，改进
2714. indifferent, a. 不感兴趣的,不关心的,质量不高的
2715. disadvantage, n.不利，不利地位
2716. cavern, n.酒馆
2717. imminent, a. 迫近的,紧迫的
2718. multifunction, n.多功能的
2719. deterioration, n.退化
2720. severe, a. 严厉的,严重的,剧烈的
2721. ingot, n.[冶]锭铁, 工业纯铁
2722. try, v. 尝试，试图；试验，试用；审讯n. 尝试
2723. Germany, n.德意志，德国
2724. exotic, adj.异国情调的, 外来的, 奇异的
2725. eager, a. (for)渴望的，热切的
2726. box, n. 盒，箱；包厢v. 把…装箱；拳击，打耳光
2727. adjoin, vt. 贴近,与…毗连
2728. circuit, n. 周游,电路,协会
2729. saline, adj.盐的, 苦涩的, 由碱金属(或含镁之盐类)组成的。n.盐 湖, 盐田, 装盐所
2730. historical, a. 历史的；有关历史的
2731. upkeep, n.维持, 维修费
2732. due, a. 正当的,预定应到的,由于 n. 应得之物,俱乐部会费
2733. sneer, vi.&n.冷笑；嘲笑
2734. eyelid, n.眼睑
2735. partially, ad.部分地
2736. paramount, adj.极为重要的
2737. get-together, n.集会，聚会
2738. doubtful, a. 怀疑的,有疑问的
2739. debit, n.借方
2740. stimulation, n.刺激
2741. expenditure, n. 花费；(时间，金钱等的)支出，消耗
2742. terrestrial, adj.陆地
2743. sewer, n.下水道, 缝具, 缝纫者
2744. inexorable, adj.无情的
2745. sluggish, adj.行动迟缓的
2746. housework, n. 家务，家事(不可数
2747. Denmark, n.丹麦
2748. candidate, n. 候选人,应试人
2749. haunt, vt. 常去;(鬼,魂)常出没于;(思想)萦绕;n. 常去的地方
2750. pity, v. (觉得)可怜，惋惜n. 憾事，怜悯
2751. sniff, vi. 嗅…味道；抽鼻涕；对嗤之以鼻，蔑视
2752. supplier, n.供应商
2753. wine, n. 葡萄酒，果酒
2754. tolerable, a. 可忍受的,可容许的,尚好的
2755. subdivide, vt.把…再分
2756. modification, n.缓和；修改；修饰
2757. tip, n. 尖端；末端；小费n./v. 轻击；倾斜；给小费
2758. intensive, a. 加强的，集中的，深入细致的，精耕细作的
2759. poisonous, a. 有毒的，恶意的，恶毒的，道德败坏的
2760. coeducation, n.男女同校
2761. panacea, n.万能药
2762. marshal, n.元帅；陆军元帅
2763. bachelor, n. 单身汉, 学士
2764. elimination, n.消灭，排除，消除
2765. enjoyable, adj.愉快的
2766. wither, vt./vi. 使枯萎,使凋谢;使人感觉羞惭或迷惑
2767. sometimes, ad. 不时，有时，间或
2768. downfall, n.衰败, 垮台, 大雨, 落下
2769. infest, v.大批滋生
2770. tranquilizer, n.镇定剂, 使镇定的人或物
2771. filament, n.细丝, 灯丝
2772. futures, n.期货
2773. stern, a. 严厉的,严格的;n. 船尾
2774. cutter, n.用于切割的器械
2775. critic, n. 批评家，评论家
2776. clasp, n./v. 扣子;紧握;拥抱
2777. anchor, n./v. 锚,危难时可依靠的人或物,用锚泊船
2778. obscure, a. 不出名的,不重要的;费解的;模糊不清的; vt. 使变模
2779. comparatively, adv.比较地
2780. beloved, a./n. 被热爱的(人
2781. massacre, n./vt. 大屠杀,残杀
2782. likewise, ad. 同样地,也
2783. outlay, n.费用，支出
2784. thought, n. 思想，思考，思维；意图，打算；想法
2785. tape-recorder, n.录音机
2786. residue, n.残余, 渣滓, 滤渣, 残数, 剩余物
2787. wail, n.悲叹, 哀号, 痛快。vi.悲叹, 哀号, 嚎啕。vt.悲痛(某
2788. queen, n. 女王，皇后，王后
2789. decompose, v. 分解;腐败,腐烂
2790. eruption, n.喷发，爆发
2791. ending, n. 结尾，结局
2792. profess, v.表白
2793. reap, vt./vi. 收割,收获;获得,得到
2794. modify, vt. 修改;修饰
2795. accelerate, v. 加速,变快
2796. fleet, n. 舰队，船队
2797. tyre, n. 轮胎
2798. torment, n. 剧烈痛苦;折磨,烦扰;v. 折磨;纠缠
2799. refusal, n. 拒绝
2800. tenacious, adj.顽强的
2801. lens, n. 透镜,(眼睛)水晶体
2802. very, ad. 很，非常；完全a. 正是的；真正，真实的
2803. cosmopolitan, a. 全世界的,世界主义的
2804. misery, n. 痛苦，悲惨，不幸
2805. enforce, vt. 强迫服从;实施;加强
2806. assert, vt. 维护;宣称
2807. bucket, n. 水桶,一桶之量
2808. mildew, n.霉, 霉菌, (植物的)霉病。vi.发霉, 生霉。vt.使发霉
2809. theme, n. 题目,主题
2810. confer, v. 协商;授予
2811. congressman, n.国会议员
2812. sex, n. 性别，性
2813. loom, vi. 隐隐呈现,赫然耸现;n. 织机,织造(术
2814. tropic, n. 回归线
2815. finger, n. 手指；指状物；指针
2816. subsidy, n.补助金, 津贴
2817. liberate, vt. 解放，释放
2818. adept, adj.熟练的, 拿手的。n.老手, 擅长者
2819. indebted, adj.感激的，感恩的
2820. granary, n.谷仓
2821. hydraulic, a.水力的；水力学的
2822. perplex, vt. 困惑,迷惑
2823. ridiculous, a. 可笑的,荒谬的
2824. apologetic, adj.道歉的, 认错的, 辩护的
2825. experiment, n. 实验；试验v. (on)进行实验；做试验
2826. calorie, n. 卡(热量单位
2827. pebble, n. 卵石
2828. renowned, adj.有名的, 有声誉的
2829. view, n. 视野；风景；观察；见解；照片vt. 观察；认为
2830. tyrannical, adj.残暴的
2831. dismay, n./vt. (使)灰心丧气;惊愕
2832. airmail, n.航空邮件
2833. thoughtful, a. 深思的;关心的,周到的
2834. texture, n.(织品的)质地, (木材, 岩石等的)纹理, (皮肤)肌理, (文艺作品)结构
2835. prophesy, n.预言
2836. accord, vi. 相一致;相符合; vt. 授予,赠与; n. 一致,符合;(尤指 国与国之间的)谅解
2837. astronaut, n. 太空人，太空旅行者
2838. interact, vi.互相作用,互相影响
2839. universally, ad.普遍地，一般地
2840. unless, conj. 除非prep. 除…外
2841. agreed, adj.商定的
2842. hinge, n. 铰链,合页,关键;v. 给…安铰链;随…而定
2843. vacancy, n.空缺，空位
2844. deficient, a.缺乏的；欠缺的
2845. stow, v.装载，理舱
2846. simply, ad. 简单地；完全，简直；仅仅，只不过；朴素地
2847. cluster, n. 一串,一簇;vi. 群集;丛生
2848. stabilize, v.稳定
2849. sneak, vi. 偷偷地走，溜vt. 偷偷地做(或拿、吃
2850. credit, n.信誉，信用v.相信
2851. land, n. 陆地，土地，国家v. (使)靠岸(登陆，降落
2852. aroma, n.芳香, 香气, 香味
2853. exalt, v.抬高，发扬
2854. session, n. 一段时间;开庭,开庭期;学期
2855. constraint, n.强迫，结束；强制力
2856. puppy, n.小狗；幼小的动物
2857. consequently, ad. 结果，因此，所以
2858. spy, n. 间谍v. 当间谍，刺探；察觉，发现
2859. olive, n.橄榄，橄榄树
2860. suitcase, n. 衣箱
2861. round, a. 圆的prep. 围绕ad. 在周围v. 绕行n. (一)回合
2862. astonish, vt. 使惊讶，使吃惊
2863. pastry, n.面粉糕饼, 馅饼皮
2864. boycott, vt./n. 联合抵制
2865. boxing-day, n.节礼日
2866. shock, n./vt. (使)震惊
2867. caravan, n.车队，大蓬车
2868. mansion, n. 大厦,官邸
2869. candid, adj.坦白的，直率的
2870. pretext, n.借口, 托辞。v.借口
2871. bait, n. 饵,诱惑物;v. 装饵;辱骂;欺侮
2872. plough, n./v. 犁,犁形器具;犁地
2873. repudiate, n.拒绝接收，拒付
2874. muscular, a. 肌肉的;肌肉发达的;强有力的
2875. eminently, adv 不寻常地
2876. lie, vi. 躺，平放；处于；位于v. 说谎n. 谎话
2877. flora, n.[罗神]花神
2878. odds, n.可能的机会, 成败的可能性, 优势, 不均, 不平等, 几
2879. quarterly, a./n. 季度的,季刊
2880. hurry, vi. 匆忙vt. 催促；急运(派)n. 急(匆)忙
2881. intersection, n.[数]交集, 十字路口, 交叉点
2882. forever, adv. 永远；总是
2883. triple, n. 三倍数a. 三倍的；三部分构成的v. 使成三倍
2884. certainty, n. 必然的事,必然,确实,肯定
2885. rapid, a. 快，急速的n. (pl.)急流，湍滩
2886. tame, a. 驯服了的;(人)顺从的,听话的
2887. horror, n. 恐怖，战栗
2888. wheat, n. 小麦
2889. submerge, vt. 放于水下;使沉没
2890. schooling, n.学校教育
2891. way, n. 道路，路程；方法/式，手段；习惯；状态
2892. linger, vi. 逗留,徘徊;动作迟缓;苟延残喘
2893. novelist, n.小说家
2894. off-duty, adj.不当班的
2895. morale, n.士气，斗志
2896. meticulously, adv.胆小地
2897. filth, n. 污秽,淫猥
2898. flush, n. 脸红v. 发红；奔流a. 洋溢的；富裕的；齐平的
2899. unprecedented, adj.前所未有的
2900. legend, n. 传说，传奇
2901. interface, n. 接合部位，分界面v. (使)互相联系
2902. lurk, n.潜伏, 埋伏。vi.潜藏, 潜伏, 埋伏
2903. alpine, adj.高山的, 阿尔卑斯山的
2904. finicky, adj.过分注意的, 过分讲究的, 过分周到的
2905. decent, a. 正当的,合适的;得体的;尚可的
2906. calculator, n.计算机, 计算器
2907. camera, n. 照相机，摄影机
2908. fourteen, num. 十四，十四个
2909. lose, v. 丢失，迷路，输掉，亏本，失败，走慢，使沉湎于
2910. loss, n. 丧失，遗失；损失，损耗，亏损；失败
2911. notoriety, n.恶名, 丑名, 声名狼藉, 远扬的名声
2912. cell, n. 细胞；小房间；蜂房；电池
2913. replacement, n. 取代，替换，替换物，代替物
2914. articulate, adj.有关节的, 发音清晰的。vt.用关节连接, 接合, 清晰
2915. anatomy, n.剖析, 解剖学
2916. palatable, adj.美味的
2917. tidy, a. 整洁的,有条理的
2918. detest, vt.厌恶, 憎恨
2919. dictate, v. 听写;口授;命令,支配
2920. potato, n. 马铃薯，土豆
2921. ornament, n. 装饰;装饰物
2922. aminoacid, 氨
2923. dispute, v./n. 争论,争执,质疑
2924. follow, v. 跟随，接着；领会；沿着…前进，遵循；结果是
2925. reflection, n. 映像，倒影；反省，沉思
2926. obstruction, n. 妨碍，障碍物
2927. economy, n. 节约；经济
2928. pointless, adj.无意义的
2929. hillside, n.(小山)山腰，山坡
2930. fluff, n.软毛, 柔毛, 绒毛, 错误, 无价值的东西。vi.起毛, 变 松, 出错。vt.使起毛, 抖松, 念错(台词
2931. trousers, n. 裤子
2932. pivot, n.枢轴, 支点, (讨论的)中心点, 重点。adj.枢轴的。vi. 在枢轴上转动。vt.装枢轴于
2933. imperialist, n.帝国主义者
2934. removal, n. 移动，迁居；除去
2935. intrigue, n.阴谋, 诡计。vi.密谋, 私通。vt.激起...的兴趣, 用诡
2936. hello, int. 英(美)喂，你好(用来打招呼或引起注意
2937. heap, n./vt. 堆,一堆,堆积;许多,大量;装载
2938. mechanics, n.力学；技术性细节
2939. preoperative, adj.外科手术前的
2940. up, ad. 向上，…起来；…完；起床prep. 向上
2941. overlapping, adj.相互重叠的
2942. climactic, adj.顶点的, 渐层法的, 高潮的
2943. mammal, n.哺乳动物
2944. Venus, n.维纳斯；美人；色情
2945. vinegar, n. 醋
2946. turn, v./n. (使)转动；(使)旋转；(使)转变n. 机会
2947. section, n. 部分,零件;剖面,横断面,阶层
2948. organizational, adj.组织的
2949. grasshopper, n.蚱蜢，蝗虫，蚂蚱
2950. affiliate, v. 使隶属于;使加入
2951. latent, a. 潜伏的,潜在的
2952. etiquette, n.礼节
2953. prosecutor, n.检察官
2954. trader, n.商人；商船
2955. bitterly, ad.苦苦地；悲痛地
2956. lot, n. 许多，大量；签，抽签；命运；场地
2957. impression, n. 印象，感想；盖印，压痕
2958. fascist, n.法西斯分子
2959. accumulation, n.积累
2960. idyll, n.田园诗, 牧歌
2961. bulky, adj.庞大的，笨重的
2962. tacit, adj.默许的
2963. concerted, a. 商定的,一致的
2964. tetrad, n.四个, 四个一组, [生]四分染色体
2965. par, n.(跟)原价相等 a.常态的,平均的,平价的,意料之中的
2966. supersede, vt. 代替
2967. oust, vt.剥夺, 取代, 驱逐
2968. ear, n. 耳，耳朵；听力，听觉；穗
2969. impost, n.进口税，关税
2970. milkman, n.送奶人
2971. moreover, ad. 加之,而且
2972. tense, n. 时态v. 拉紧，(使)紧张a. 绷紧的，紧张的
2973. baby-sit, v.(替人)看护小孩
2974. drug, n. 药物；麻醉品；毒品；滞销货v. 下麻药；吸毒
2975. lull, n.暂停, 麻痹。vt.使平静, 哄骗, 使安静。vi.变平静
2976. captain, n. 首领，队长；船长；上尉v. 做…的首领，指挥
2977. pollute, v. 弄脏，污染
2978. unconscious, a. 不醒人事的;没有意识的
2979. utter, v. 说，发出(声音)a. 彻底的，完全的
2980. motorcycle, n.摩托车
2981. director, n. 指导者，主任，导演
2982. snowy, a.雪的，下雪的
2983. cram, v.填满
2984. warmth, n. 暖和，温暖；热心，热情
2985. reluctant, a. 不愿的,勉强的
2986. worldwide, a. 全世界的，世界范围的ad. 遍及全世界
2987. uniform, n. 制服，军服a. 相同的，一律的
2988. formulation, n.明确的表达
2989. plank, n.厚木板, 支架, (政党的)政纲条款。vt.铺板, 立刻付款
2990. join, v. 参加，加入；联合，连接；和…在一起
2991. prohibit, vt. 禁止
2992. spacecraft, n. 宇宙飞船
2993. deceased, adj.已死的
2994. ketchup, n.调味蕃茄酱
2995. burden, n. 担子，重担，负担vt. 给予负担或麻烦
2996. experimental, a. 实验(性)的，试验(性)的
2997. suspicious, a. 可疑的;怀疑的
2998. film, n. 电影；胶片；薄膜，薄层vt. 把…拍成电影
2999. knot, n. 绳结;结合;树节;海里;小群人;v. 打结
3000. farther, ad. 更远地，再往前地a. 更远的
3001. social, a. 社会的；交际的
3002. apply, v. 要求,申请
3003. assimilate, v.吸收
3004. pneumonia, n. 肺炎
3005. violent, a. 猛烈的;凶暴的;由暴力引起的;强烈的,厉害的
3006. taxi, n. 出租汽车v.(使)滑行
3007. halve, vt.对分；平摊
3008. outward, a. 外面的，公开的，向外的ad. 向外，在外n. 外表
3009. insider, n.知情者
3010. embassy, n. 大使馆
3011. temperature, n. 温度，体温；热度，发烧
3012. encroach, vi.(逐步或暗中)侵占, 蚕食, 超出通常(或正常)界线
3013. diversion, n. 转向，转移；牵制；解闷；娱乐
3014. hesitation, n.犹豫，踌躇
3015. necessarily, ad.必然，必定
3016. congestion, n. 拥挤,混杂
3017. boarding, n.伙食
3018. numb, adj.麻木的。v.失去知觉
3019. capable, a. 有本领的，有能力的；(of)可以…的，能…的
3020. hide, v. 隐藏，躲藏；隐瞒n. 皮革，兽皮
3021. convict, n.罪犯
3022. strife, n. 争吵；冲突，斗争；竞争
3023. mourning, n.哀痛
3024. perfect, a. 完善的；完全的；(语法)完成的v. 使完美
3025. assume, vt. 假定;承担;使用
3026. astronomer, n.天文学家
3027. suggestion, n. 建议，意见；细微的迹象；暗示，联想
3028. email, n.电子邮件
3029. disciplinary, adj.纪律的，学科的
3030. infantry, n.步兵
3031. cannon, n. 大炮 vi. 开炮
3032. approach, v. 接近;着手处理;n. 接近;方法;途径
3033. museum, n. 博物馆，展览馆
3034. discussion, n.讨论，谈论；论述
3035. nod, v. 点(头)，点头招呼n. 点头招呼；打盹，瞌睡
3036. costume, n.装束, 服装
3037. persistence, n.坚持；持续，存留
3038. therapy, n.治疗
3039. tag, n. 标签；鞋带；垂饰vt. 加标签于；附加vi. 紧随
3040. peroxide, n.[化]过氧化物, 过氧化氢。v.以过氧化氢漂白
3041. seat, n. 座位，底座；所在地，场所v. 使坐下
3042. daytime, n. 白天，日间
3043. mild, a. 温和的，轻微的，味淡的，不含有害物质的的
3044. halibut, n.大比目鱼
3045. affair, n.事务；事情(件)；(个人的)事
3046. mast, n.桅杆；杆vt.扯帆
3047. earthquake, n. 地震
3048. refund, n. 归还;归还额;vt. 归还
3049. put, vt. 放，搁，置；表达；使处于…状态，记下
3050. bribe, n./vt. 贿赂,行贿
3051. endeavor, v./n. 努力，尽力，力图
3052. obligation, n. 义务，责任
3053. perpendicular, a. 垂直的,成直角的;直立的; n. 垂直线
3054. bankruptcy, n.破产
3055. drugstore, n.零食店
3056. dent, n.牙，槽，凹陷
3057. grease, n. 动物脂肪,油脂状物;vt. 涂油脂于
3058. unhappy, a.不幸福的，不快乐的
3059. caption, n. 报纸文章的标题,照片说明
3060. heart, n. 心(脏)；内心，感情；热忱；中心，要点
3061. ashtray, n.烟灰缸
3062. upside-down, a.颠倒的，乱七八糟的
3063. lover, n. 爱好者；(pl.)情侣
3064. color-blind, adj.色盲的
3065. lumber, n. 木材，木料
3066. commission, n. 委员会;佣金;军事任职;考察团; vt. 委任,任命,委托
3067. tickle, vt.挠，胳肢；逗乐
3068. wane, vi.变小, 亏缺, 衰落, 退潮, 消逝, 呈下弦。n.月亏, 月 亏期, 衰退, 衰退期
3069. naughty, a. 顽皮的，淘气的
3070. plagiarize, v.剽窃, 抄袭
3071. denominate, v.为命名
3072. wag, vt.摇，摇摆，摆动
3073. obscene, adj.淫秽的, 猥亵的
3074. fit, a. (病的)发作，痉挛v./a. n. 合适，试穿，安装
3075. indoors, ad.在室内，在屋里
3076. bother, v./n. 麻烦,打扰
3077. bureaucracy, n. 官僚
3078. uncover, v. 揭开，揭露
3079. impossibility, n.不可能性
3080. know, vt. 知道，了解；认识；识别vi. 知道，了解
3081. turbot, n.大比目鱼, 大菱鲆
3082. pimple, n.[医]丘疹, 面泡, 疙瘩
3083. favour, n.亲切, 宠爱
3084. sugar, n. 糖，食糖vt. 加糖于
3085. doubtless, ad.无疑地；很可能
3086. corporate, a. 社团的;公司的;共同的
3087. arrive, vi. 到达；(时间、事件)到来，发生；达到
3088. downward, a. 向下的ad. (also: downwards)向下，往下
3089. enumerate, v.列举
3090. prophet, n. 预言家；先知；提倡者
3091. embroider, v.绣
3092. inflammable, adj.不易燃的
3093. charcoal, n.炭，木炭；生物炭
3094. journalist, n. 新闻工作者,记者
3095. dissatisfy, vi.使不满，使不平
3096. swan, n. 天鹅vi. 闲荡，游荡
3097. lamb, n. 小羊,羊羔肉
3098. hound, n. 猎狗;卑鄙的人 vt. 用猎狗追,追逐
3099. dependent, a. 依靠的，依赖的，从属的；随…而定的
3100. curtain, n. 窗帘，门帘；幕(布)；结束vt遮掩
3101. select, v. 选择，挑选a. 精选的，选择的
3102. comparison, n. 比较，对比，比喻，比拟
3103. limp, a. 柔软的,软弱的;vt./n. 跛行,蹒跚
3104. league, n. 同盟，联盟；联合会，社团
3105. suffering, n.苦难
3106. flight, n. 飞翔，飞行；航班；航程；逃跑；楼梯的一段
3107. raucous, adj.沙哑的
3108. deduction, n.推断，减少
3109. bronze, n./v. 青铜,青铜色,青铜器
3110. twinkle, vi. 闪烁,闪耀;闪闪发光
3111. lime, n.石灰
3112. insane, a. 疯狂的,愚蠢的
3113. legible, adj.清晰的, 易读的
3114. apiece, adv.每个, 每人, 各
3115. issue, v. 分发,出版,发行;n. 出版,发行,问题
3116. entrust, v.委托
3117. illiterate, n./a. 文盲(的
3118. transship, v.转运，转船
3119. nourish, vt. 养育;怀有(希望
3120. voice, n. 声音；嗓音；发音能力；意见，发言权；语态
3121. the, art. 这(那)个；这(那)些(指特定的人或物
3122. underwear, n.衫衣，内衣，贴身衣
3123. confront, vt. 使面对,面临
3124. pine, vi. 消瘦,衰弱;n. 松树
3125. restrain, vt. 阻止,控制;抑制,遏制
3126. forgery, n.锻炉，锻造厂
3127. unaffordable, adj.买不起的
3128. fiance, n.<法>未婚夫
3129. rejection, n.拒绝
3130. miracle, n. 奇迹
3131. delude, vt.迷惑, 蛊惑
3132. pertinent, a. 贴切的,中肯的;相关的
3133. subliminal, adj.下意识的, 潜在意识的
3134. recorder, n. 记录员；录音机
3135. chemistry, n. 化学
3136. faithfully, adv.忠诚地
3137. wonder, n. 惊奇，惊异；奇迹，奇事v. (at)诧异；想知道
3138. brainstorm, n.灵机一动。v.集体讨论
3139. fortunately, ad.幸运地，幸亏
3140. outlook, n. 景色，风光；观点，见解；展望，前景
3141. four, num. 四pron./a. 四(个，只
3142. journal, n. 定期刊物，杂志，日报；日志，日记
3143. basement, n. 底层,地下室
3144. astonishment, n.惊奇，惊讶
3145. snap, v. 啪地移动；(使)突然断开，断开(成两截
3146. tumour, n.[医]瘤, 肿瘤, 肿块
3147. fixed, adj.固定的，已确定的
3148. dimension, n. 尺寸,尺度,大小
3149. impress, v. (on)印，盖印；留下印象，引人注目
3150. provocation, n.刺激，煽动
3151. satisfactory, a. 令人满意的，圆满的，良好的，符合要求的
3152. holocaust, n.大毁灭, 大屠杀
3153. so-called, a. (贬)所谓的，号称的
3154. however, ad. 然而，可是，不过，无论如何conj. 无论
3155. muster, n.集合, 阅, 样品, 清单, 一群。v.集合, 召集, 征召, 鼓 起(勇气等), 集聚
3156. provoke, vt. 激怒;引起
3157. appreciate, vt. 为…表示感激，感谢；欣赏，赏识，评价
3158. outlet, n. (河流等)出口,出路;[喻
3159. disagree, vi.有分歧；不一致
3160. particular, a. 特殊的，苛求的，个别的n. 详情，细节，特色
3161. summer, n. 夏天，夏季a. 夏季的
3162. explode, v. (使)爆炸,爆发
3163. heartfelt, adj.衷心的
3164. farewell, int./n./a. 再见;临别的,告别的
3165. there, ad. 在那儿；往那儿；[作引导词表示"存在
3166. discord, n.不一致, 意见不合, 嘈杂声, [音乐] 不和谐。v.不和
3167. educate, v. 教育，培养，训练
3168. plateau, n. 高原;(上升后的)稳定水平(或时期、状态
3169. attendance, n. 出席；出席人数；护理，照料
3170. inventory, n.详细目录, 存货, 财产清册, 总量
3171. congested, adj.拥挤的
3172. unwilling, a.不愿意的
3173. figure, n. 体形；轮廓；数字；图形v. 描绘；计算；推测
3174. deluge, n.洪水, 豪雨。v.使泛滥, 淹, 浸, 压倒
3175. distort, vt. 扭曲,使变形;歪曲,曲解
3176. straw, n. 稻草，麦杆；吸管
3177. deft, adj.敏捷熟练的, 灵巧的
3178. participant, n. 参加者，参与者a. 有份的，参与的
3179. tanker, n. 油船
3180. encircle, v.环绕，包围
3181. anxiously, adv.焦急地，急切地
3182. panther, n.豹，黑豹；美洲狮
3183. cent, n. (货币单位)分,分币
3184. bee, n. 蜂，蜜蜂；忙碌的人
3185. overrule, vt.驳回, 否决, 支配, 制服
3186. devaluation, n.贬值
3187. performance, n. 演出,表演;履行,执行;工作情况,表现;(机器等)工作性
3188. rotation, n.旋转，转动；循环
3189. hub, n.毂, 木片, 中心。n.网络集线器, 网络中心
3190. magician, n.魔法师；变戏法的人
3191. handbook, n. 手册,便览
3192. please, v. 请；使愉快，使满意；喜欢，愿意
3193. final, a. 最终的，决定性的n. 结局；决赛；期末考试
3194. occupant, n.占有者, 居住者
3195. thrust, n. 猛推;冲锋,突击;推力
3196. commute, v.交换, 抵偿, 减刑, <电工>整流
3197. acrobat, n. 特技演员，杂技演员
3198. uncalled-for, adj.不必要的, 多余的, 无理的
3199. ticket, n. 票，入场券；票签；(交通违章)罚款传票
3200. conquer, vt. 征服,攻克
3201. nostril, n.鼻孔
3202. appearance, n. 出现，露面；外表；(在会议等)作短暂露面
3203. dry, a. 干(旱)的；干渴的；枯燥vt. 使干燥，晒干
3204. conceive, v. 想出(主意);怀孕
3205. sculpture, n./v. 雕塑,雕刻
3206. empower, v.授权与, 使能够
3207. sound, n. 声音v. 发声，响a. 健全的，完好的；正当的
3208. mechanical, a. 机械的，由机构制成的；机械似的，呆板的
3209. pinch, vt. 捏,拧,掐,夹痛,紧压;n. 压力,重压;微量
3210. shade, n. 荫，阴影；遮光物，罩v. 遮蔽，遮光
3211. radiation, n.放射，发射；辐射能
3212. pleasant, a. 令人愉快的vt. 使高兴vi. 满意；喜欢
3213. paraphrase, v.解释。n.解释
3214. allegiance, n.忠贞, 效忠
3215. pumpkin, n.南瓜，南瓜藤
3216. tie, n. 领带；联系，关系，纽带；束缚v. 扎，系，捆
3217. bouquet, n.花束
3218. privilege, n. 特权;优惠
3219. Oceania, n.大洋洲
3220. tall, a. (身材)高的，高大的；夸大的，离谱的
3221. mishandle, v.装卸不慎
3222. disgrace, n. 失宠，耻辱v. 使失宠；玷辱，使蒙羞
3223. supposing, conj.假使
3224. bespectacled, adj.带眼镜的
3225. accrued, adj.增值的，应计的
3226. musical, a. 音乐的；有音乐才能的n. 音乐片
3227. submission, n.屈服, 降服, 服从, 谦恭, 投降
3228. theatrical, adj.戏剧的
3229. intimidate, v.胁迫
3230. semiconductor, n. 半导体
3231. brake, n./v. 刹车
3232. speech, n. 演说，讲话；言语，语言
3233. mushroom, n. 蘑菇; vi. 迅速发展
3234. liking, n.兴趣，嗜好
3235. precede, v. 领先(于)，在(…之前)；优先，先于
3236. young, a. 年轻的，幼小的；没经验的n. 青年人
3237. blanket, n. 毯子(可数)；厚厚一层(可数)vt. 铺上一层
3238. war, n. 战争(状态)；冲突vi. 作战
3239. twist, vt. 捻,搓;扭转;盘旋;n. 搓,扭拧;怪癖
3240. bottom, n. 底(部)；基础，根基；海底，湖底，河床
3241. misunderstand, v. 误解，误会
3242. vertical, a. 垂直的 n. 垂直线
3243. roughly, ad.粗糙地，粗略地
3244. attention, n. 注意，注意力；立正；特别照顾；照料
3245. popcorn, n.爆米花
3246. signal, n./v. (发)信号
3247. veil, n. 面纱，遮蔽物v. 用面纱掩盖，掩饰
3248. entity, n.实体
3249. stain, n./v. 染料,着色剂,污点,沾污处
3250. exuberant, adj.繁茂的, 丰富的, 非凡的, (语言等)华而不实的
3251. overhead, a. 在头顶上的；架空的ad. 在头顶上n.(pl) 经常费用; 生 产和贸易的费用
3252. invalid, a. 无效的,作废的;无根据的 n. 病人,病弱者;a. 病弱的
3253. allergic, adj.过敏的，变态的
3254. attribution, n.属于
3255. truth, n. 真实，真相；真实性；真理
3256. being, n. 生物，生命，存在
3257. neutralize, v.压制。5nju:trElaIz
3258. bat, n. 球拍，球棒，短棒；蝙蝠
3259. almost, adv. 几乎，差不多
3260. mountain, n. 山
3261. physique, n.(男子的)体格, 体形
3262. pillar, n. 柱,栋梁
3263. clench, v.咬紧，握紧，决定
3264. presence, n. 出席,到场;风采,风度
3265. bestow, vt.把…赠与
3266. turtle, n.海龟，玳瑁；甲鱼肉
3267. porter, n. 守门人，门房，行李搬运工，服务员
3268. lash, n.鞭子, 鞭打, 睫毛, 责骂, 讽刺。vt.鞭打, 摆动, 扎捆, 冲击, 煽动, 讽刺。vi.猛击, 急速甩动
3269. chasm, n.深坑, 裂口
3270. fob, 缩)离岸价
3271. colonial, a. 殖民地的,关于殖民的;n. 殖民地居民
3272. must, aux./v. 必须；很可能；一定要n. 必须做的事
3273. dough, n.面团
3274. wealthy, a. 富有的，丰裕的，充分的n. 富人，有钱人
3275. patrol, vt./vi. 巡逻,巡查
3276. regard, v. (as)把…看作为；考虑n. (pl.)敬重，问候
3277. indigenous, adj.本土的
3278. faith, n. 信任,信仰
3279. kill, vt. 杀死，消灭；破坏，毁灭；消磨(时间
3280. distend, v.(使)扩大, (使)扩张
3281. ox, n. 牛，公牛
3282. they, 商店。(一般人经常用复数they来指一家商店
3283. gaily, adv.华丽地, 欢乐地
3284. president, n. 总统，校长，会长，主席
3285. denote, vt. 是…的符号,指示,表示
3286. characteristic, a./n. 特有的,表示特征的;特性
3287. snack, n. 小吃,快餐
3288. source, n. 源，源泉；来源，出处
3289. herbal, adj.草药的
3290. never, ad. 永不，从不，决不；从来没有；不，没有
3291. outsider, n.局外人
3292. carnivore, n.食肉动物。n.(动物或植物)食肉类,食肉动物,食虫植物
3293. underwriter, n.保险商，承购人
3294. enrich, vt. 使丰富,充实;使富有
3295. establishment, n. 建立，设立，建立的机构(或组织
3296. resultant, a. 作为结果而发生的；合成的
3297. raise, v. 举起，提升；增加；饲养；引起；竖起；提出
3298. seizure, n.强占，没收,发作,赃物
3299. pressure, n. 压，压力，压迫，强制，紧迫，困苦，困难
3300. migratory, adj.迁移的, 流浪的
3301. aptitude, n.才智，天资
3302. incident, n. 事件，事变
3303. cohesion, n.凝聚力，团结
3304. funnel, n.漏斗, 烟窗
3305. gratitude, n. 感激,感恩
3306. workaholic, n.工作第一的人, 专心工作的人
3307. tobacco, n. 烟草，烟叶
3308. ice, n. 冰；冰冻甜食vt. 冰冻，使成冰
3309. spoonful, adj.一匙的量
3310. tibia, n.[解] 胫骨, [昆]胫节, 从前的一种笛
3311. follower, n.契据的附面；从动件
3312. poster, n.海报, 招贴, (布告, 标语, 海报等的)张贴者
3313. deliverance, n.救助
3314. first, a./ad. 第一；最初；首次n. 开始pron. 第一名
3315. starvation, n.饥饿
3316. expiration, n.期满
3317. panoramic, adj.全景的
3318. eucalyptus, n.[植]桉树
3319. incompatible, a.不相容的
3320. emission, n.散发；传播；发出物
3321. mania, n.[医]颠狂, 狂躁, 癖好, 狂热
3322. user, n.用户，使用者
3323. taboo, n.(宗教)禁忌、避讳, 禁止接近, 禁止使用。adj.禁忌的, 忌讳的。vt.禁忌, 避讳, 禁制, 禁止
3324. pocket, n. 衣袋a. 袖珍的，小型的v. 把…装入袋内
3325. archaeologist, n.考古学家
3326. autobiography, n.自传
3327. chant, n.圣歌
3328. slight, a. 轻微的,不足道的;纤细的,瘦弱的;vt./n. 轻视,藐视
3329. basketball, n. 篮球，篮球运动
3330. Sweden, n.瑞典
3331. refreshing, adj.提神的, 凉爽的, 使人喜欢的
3332. fellow, n. 人，家伙；伙伴，同事a. 同样的，同事的
3333. illness, n. 病，疾病
3334. genetic, adj.遗传的, 起源的
3335. cheat, v. 欺骗；作弊n. 骗子；欺诈，欺骗行为
3336. irresistible, adj.不可抗拒的
3337. acclaim, n.喝彩, 欢呼v.欢呼, 称赞
3338. illegible, adj.字迹不清的
3339. passport, n. 护照,保障,手段
3340. concur, v.同地发生
3341. leaf, n. 叶子；(书刊的)一页，一张；金属薄片
3342. subtle, a. 微妙的,难于捉摸的;诡秘的,狡诈的;隐约的
3343. toll, n. (道路、桥梁等的)通行税;损坏,死伤人数;钟声;v. (缓 慢而有规律地)鸣(钟), 敲(钟
3344. library, n. 图书馆；藏书室；藏书，丛书，文库
3345. instant, a. 立即的；紧迫的；(食品)速溶的n. 瞬间，时刻
3346. significance, n. 意义，含义；重要性，重要的
3347. railway, n.铁路，铁道
3348. dubious, a. 半信半疑的
3349. path, n. 小路，小径；路线，轨道
3350. big, a. 大的；重要的；宽宏大量的；大受欢迎的
3351. fifth, num.第五 n.五分之一
3352. jellyfish, n.水母
3353. outlaw, n. 被剥夺公民权者;vt. 禁止
3354. thrift, a. 节约，节俭
3355. septic, adj.腐败的, 败血病的, 脓毒性的。n.腐烂物
3356. conqueror, n.征服者，胜利者
3357. amplification, n.放大
3358. contain, v. 包含，容纳；容忍，抑制；可被…除尽
3359. regeneration, n.再生, 重建
3360. tyranny, n.暴政，专制；残暴
3361. landlady, n. 女房东，女地主
3362. quota, n. 配额,限额(进口及移民人数
3363. tiptoe, v.用脚尖走
3364. cheese, n. 干酪，乳酪
3365. new, a. 新(近)的；新来的；不熟悉的；没经验的
3366. repertoire, n.(准备好演出的)节目, 保留剧目, (计算机的)指令表, 指 令系统, <美>(某个人的)全部技能
3367. plaintive, adj.悲哀的, 哀伤的
3368. pellet, n.小球
3369. declaration, n. 宣言，宣布，声明
3370. protectionism, n.贸易保护主义
3371. sort, v. 分类 n. 种类
3372. permeate, vt.弥漫, 渗透, 透过, 充满。vi.透入
3373. recent, a. 新近的，近来的
3374. dwindle, v.缩小
3375. preserve, vt. 保护,保存
3376. i.e, that is)adv.那就是，即
3377. perverse, adj.不正当的
3378. alphabetical, adj.依字母顺序的, 字母的
3379. draw, v. 拉；画；汲取；引出；(to)挨近n. 平局；拖曳
3380. functional, adj.功能的
3381. gasp, n./v. 喘气,气喘吁吁地说
3382. nostalgia, n.思家病, 乡愁, 向往过去, 怀旧之情
3383. permanence, n.永久，持久
3384. character, n. 性格，品质，特性；人物，角色；字符，(汉)字
3385. financial, a. 财政的，金融的
3386. tare, n.皮重
3387. anthropology, n.人类学
3388. weary, a. 疲倦的,困乏的;令人厌倦的
3389. negotiate, v. 商订；谈判，洽谈，交涉
3390. souvenir, n. 纪念品
3391. building, n. 建筑(物)，房屋，大楼
3392. finance, n./vt. 财政,金融,资金
3393. defect, n. 欠缺,缺点;vi. 背叛,逃跑,开小差
3394. quest, n./v. 寻找,追求
3395. prescribe, v. 吩咐使用;开(药
3396. chunk, n.大块, 矮胖的人或物
3397. divergence, n.分歧
3398. existing, adj.现存的，已有的
3399. inclined, adj.倾向于的
3400. representation, n.描写；陈述；代表
3401. second, a. 第二；次等的，二等的n. 秒v. 赞成，附和v. (临时)调
3402. turbulent, a. 狂暴的,骚乱的;汹涌的
3403. detriment, n.损害
3404. risk, v. 冒…的危险n. 冒险；风险
3405. redound, v.增加，促进
3406. ostentation, n.卖弄, 夸耀, 摆阔, 风头主义
3407. buy, vt. 买，买得；向…行贿，收买vi. 购买东西
3408. diplomatic, a. 外交的,外交手腕的
3409. ship, n. 船舶，舰艇v. 装运，航运，运送；发货
3410. ventilate, vt. 使通风;公开讨论
3411. ruthless, a. 残忍的,无情的
3412. complain, v. (about，of)抱怨；申诉
3413. ostensible, adj.可公开得, (指理由等)表面的, 虚假的
3414. reign, vi./n. (君主)统治,存在,现存
3415. torch, n. 手电筒,火把
3416. fort, n. 堡垒,要塞
3417. propulsion, n.推进, 推进力
3418. correct, a. 正确的，恰当的，端正的v. 改正，纠正，矫正
3419. rabbit, n. 兔子
3420. clothe, v. (给…)穿衣，供给…衣服
3421. sock, n. (pl.)短袜
3422. permissible, adj.可允许的
3423. episode, n. 一系列事件中的一个事件
3424. Fahrenheit, n. 华氏温度计
3425. airplane, n. (美)飞机
3426. argue, v. 不同意,辩论
3427. farmhand, n.农工，农场工人
3428. detective, n. 侦探
3429. strew, vt.散播, 点缀, 撒满
3430. concurrent, adj.同时发生的
3431. sinful, adj.有罪的，罪恶的
3432. estimation, n.估算，估计
3433. thousand, num./n./a. 一千；[pl
3434. sluice, n.水闸, 泄水。v.开闸放水, 流出, 冲洗, 奔泻
3435. fresh, a. 新鲜的，无经验的
3436. yawn, vi. 打呵欠,张开
3437. pickle, n.腌制食品，泡菜
3438. permissive, adj.允许的，许可的
3439. fluorescent, adj.荧光的, 莹光的
3440. air-conditioning, n. 空调，空调系统。空调机
3441. macroeconomics, n.宏观经济学
3442. brother-in-law, n.姻兄(弟
3443. spelling, n. 拼法，拼写法
3444. temptation, n. 引诱,诱惑
3445. rag, n. 抹布，破布，碎布
3446. splash, v./n. 溅水,泼水;显示,鼓吹
3447. toothpaste, n.牙膏
3448. ballot, n.选举票, 投票, 票数。vi.投票
3449. manifesto, n.宣言
3450. popularize, v.普及，宣传
3451. insignificant, a.无意义的；低微的
3452. generosity, n.慷慨，宽宏大量
3453. typical, a. 典型的
3454. movement, n. 运动，活动；移动，迁移
3455. engage, v. 雇用;从事;订婚;吸引;啮合
3456. hardware, n. 金属日用器皿,(计算机)硬件
3457. martial, adj.战争的, 军事的, 尚武的, 威武的
3458. electrician, n. 电学家，电工
3459. cast, n./v. 投,掷,抛;铸造;扮演角色
3460. recompense, v. &n.回报，赔偿
3461. fling, v./n. 掷,抛;猛烈地移动;投入
3462. forfeit, n.(因犯罪.过失.违约等而)丧失的东西, 没收物, 罚款。 vt.没收, 丧失。adj.丧失了的
3463. sorrow, n. 悲衰，悲痛
3464. ore, n. 矿石
3465. opener, n.开罐器，起子
3466. knight, n.骑士，武士；爵士
3467. idiosyncrasy, n.特质, 特性
3468. maximize, v.增加到最大程度
3469. inattention, n.疏忽
3470. reptile, n. 爬行动物;爬虫
3471. rally, v./n. 集合
3472. squeal, v.长声尖叫, 告密, 抱怨, 激烈抗议。n.长而尖的声音
3473. mixture, n. 混合；混合物，混合剂
3474. competent, a. 有能力的，能胜任的；足够的
3475. serve, v. 服务，尽责；招待，侍候；符合，适用
3476. pedal, n./v. 脚蹬,踏板;踩踏板
3477. twice, ad. 两次，两倍
3478. shoulder, n. 肩，肩部v. 肩负，承担
3479. anonymous, adj.匿名的
3480. lark, n.云雀，百灵鸟
3481. shipowner, n.船主
3482. salability, n.适销性
3483. structure, n. 结构，构造；建筑物v. 构造，建造
3484. ferry, n./v. 渡口,渡船,摆渡
3485. roam, vt./vi. 漫步,漫游
3486. transition, n. 转变，变迁，过渡(时期
3487. laughter, n. 笑，笑声
3488. famine, n. 饥荒
3489. share, v. (with)分配，共用；分担n. 一份，份额；股份
3490. discuss, vt. 讨论，商议
3491. flee, v. 逃走；逃避
3492. settlement, n. 解决，决定，调停；居留区，住宅区
3493. valuable, a. 贵重的，有价值的n. (pl.)贵重物品，财宝
3494. southwest, n./a. 西南(的)，西南部(的
3495. microscope, n. 显微镜
3496. snowbound, adj.被雪困住的。为雪所阻的
3497. criterion, n.(批评判断的)标准, 准据, 规范
3498. pig, n. 猪，猪肉；猪一般的人(指肮脏，贪吃的人
3499. suffer, v. (from)受痛苦，患病；受损失；遭受；忍受
3500. fuse, n. 导火线,信管,引信,保险丝;v. 熔,熔化,烧断电路
3501. descent, n. 下降，降下；斜坡；血统，家世
3502. furor, n.激怒, 狂热, (诗情的)激情
3503. staphylococcus, n.[微生物] 葡萄状球菌
3504. joint, n. 接合处，接头；关节a. 联合的，共同的，连接的
3505. guesthouse, n.宾馆
3506. wash, n. 洗；洗的衣物vt. 冲刷，洗；冲出vi. 洗澡
3507. enchant, vt.迷住；用魔法迷惑
3508. fade, v. (使)褪色;逐渐消失
3509. monopoly, n. 垄断,专卖权
3510. sonnet, n.十四行诗
3511. recognition, n. 认出，辨认；承认
3512. riot, n. 暴乱;骚动;放纵
3513. answer, vt. 回答，答复，答案v. 回答，答复，响应
3514. novel, a. 新奇的;n. 小说
3515. accustom, vt.使习惯
3516. quarry, n.采石场, (知识、消息等的)来源。vt.挖出, 苦心找出
3517. doctrine, n. 教条,教义
3518. carbohydrate, n.[化]碳水化合物, 醣类
3519. video, n. 电视，视频；录像a. 电视的，视频的；录像的
3520. imprison, vt.关押，监禁；限制
3521. sphere, n. 球,球面;天体;(兴趣,活动,势力等的)范围
3522. blue, a. 蓝色的；青灰色的；沮丧的，阴郁的n. 蓝色
3523. haughty, a.傲慢的，轻蔑的
3524. terminable, adj.可终止的
3525. condemnation, n.谴责，判决
3526. Europe, n.欧洲
3527. materialism, n.唯物主义
3528. him, pron.他(he的宾格形式
3529. square, a. 正方形的,直角的,公平的 n. 正方形,广场,平方
3530. gambler, n.赌徒
3531. exclaim, v. 呼叫,惊叫
3532. affordable, adj.买得起的
3533. loudspeaker, n. 扬声器，扩音器
3534. shepherd, n. 牧羊人;vi. 带领,照看
3535. separate, a. (from)分离的，分开的v. (from)分离，分开
3536. polish, vt./vi 磨光,擦光;润饰,使优美;n. 擦光剂;优美,完善
3537. ache, vi. 痛；哀怜n. (指连续)疼痛、酸痛
3538. lubrication, n.润滑
3539. pacific, a.和平的 n.太平洋
3540. trite, adj.陈腐的
3541. peril, n. (严重的)危险;危险的事物
3542. henceforth, ad. (=henceforward)今后
3543. moment, n. 片刻，瞬间，时刻
3544. endow, vt. 捐款,资助;赋予天赋
3545. supposition, n.假定, 想象, 推测, 推想
3546. essayist, n.散文作家
3547. greenhouse, n. 温室
3548. span, n. 一段时间;跨距,跨度;vt. 持续,贯穿,包括;横跨,跨越
3549. pester, vt.使烦恼, 纠缠
3550. ironical, adj.反讽的，讽刺的
3551. sterling, a. 金银标准成分的;货真价实的,纯正的
3552. qualified, adj.有资格的
3553. ill, a. 有病的；坏的；恶意的ad. 坏地；不利地
3554. hell, n. 地狱,阴间,苦境
3555. inscribe, v.记下
3556. performer, n.执行者，表演者
3557. recollect, v. 回忆，想起，记起，忆起，记得
3558. drunk, a. 醉酒的；(喻)陶醉的n. 酗酒者，醉汉
3559. hypothesis, n. (逻辑)前提;假说
3560. multitude, n. 大批,大群,众多
3561. facsimile, n.摹写, 传真
3562. hut, n. 小屋，棚屋
3563. vegetarian, n.素食者, 食草动物。adj.素食的
3564. burner, n.灯头，煤气头
3565. energy, n. 活力，精力；能，能量
3566. grudge, vt. 吝惜,不愿给;n. 恶意,怨恨,忌妒
3567. Atlantic, a.大西洋的 n.大西洋
3568. centigrade, n./a. 摄氏温度计(的)；百分度(的
3569. foresee, vt. 预见,预知
3570. Rome, n.罗马
3571. terminal, a. 晚期的,末期的;学期的;末端的,终点的 n. 终点站;航空
3572. computerize, v.使计算机化
3573. gullible, adj.易受骗的
3574. toward, prep.向，对于，将近,接近 a.即将到来的,进行中的
3575. dark, a. 黑暗的，深(色)的；隐秘的n. 无光，黑暗
3576. artistic, a. 艺术(家)的，美术(家)的；善于艺术创作的
3577. granular, adj.由小粒而成的, 粒状的
3578. I, pron.(主格)我
3579. worthless, a.无价值的，无用的
3580. luxury, n. 奢侈,奢侈品
3581. airway, n.航线
3582. improve, v. 改善，改进，增进；好转，进步
3583. jerk, vt.猛地一拉vi.急拉
3584. notable, a. 值得注意的,著名的;可觉察的;n. 名人,要人
3585. continuous, a. 连续的，持续的
3586. jeans, n. 牛仔裤
3587. inland, a. 内地的,内陆的;ad. 在内地,向内地
3588. sing, v. 唱，演唱；鸡叫
3589. transgress, vt.违反, 犯罪, 侵犯。vi.越界, 违法
3590. novice, n.新手, 初学者
3591. extinguish, vt. 熄灭,扑灭;根除,消灭
3592. enclosure, n. 围住，圈起，封入，附件
3593. dishonorable, adj.不名誉的
3594. discrimination, n.辨别；识别力；歧视
3595. reiterate, v.重申 a.反复的
3596. plant, n. 植物，作物；工厂；装置v. 栽种，播种，栽培
3597. hijack, vt. 劫持,劫机,拦路抢劫
3598. dangle, v.摇摆
3599. slow, a. 慢的，不活跃的v. (down)(使)放慢，减速
3600. elderly, adj.过了中年的, 稍老的
3601. conquest, n. 征服，征服地，掠取物
3602. transferable, adj.可转让的
3603. fleece, n.羊毛
3604. linguist, n.语言学者
3605. sideways, ad./a. 向旁边(的)，侧身，横着(的)，斜着(的
3606. time, n. 时间，时刻；次，回；时代，时期；倍，乘
3607. though, ad. 可是，然而，不过conj. 尽管，虽然
3608. polite, a. 有礼貌的，客气的；有教养的，文雅的
3609. form, n. 形状，形式；表格v. 组成，构成；形成
3610. utmost, a. 最远的,最大的,极度的
3611. coincide, vi. 恰好相合,同时发生;意见一致;位置重合,重叠
3612. fund, n. 资金，基金；存款，现款；(知识等的)累积
3613. crane, n. 起重机，鹤
3614. monumental, adj.纪念碑式的
3615. persuasion, n. 说服，说服力
3616. cite, vt. 引用,举例,传讯
3617. amiable, a. 和蔼可亲的，友善的，亲切的
3618. armour, n. 盔甲,装甲部队
3619. importer, n.进口商
3620. optical, a. 光(学)的;眼的,视力的;视觉的
3621. flap, n./v. 拍打,挥动;垂下物;袋盖;慌乱
3622. smart, a. 漂亮的；聪明的；巧妙的v. 剧痛，刺疼
3623. hand, n. 手，人手，雇员；专门业人员；指针v. 支持, 搀扶, 交
3624. vomit, n.呕吐, 呕吐物, 催吐剂。vi.呕吐, 大量喷出。vt.吐出
3625. ribbon, n. 缎带,丝带,带状物
3626. angular, adj.角状的
3627. soul, n. 灵魂，心灵；精神，精力；人
3628. throat, n. 咽喉,嗓子
3629. corporation, n. 市镇自治机关；法人；公司，企业
3630. triumphant, a.得胜的；得意洋洋的
3631. limitation, n. 限制，局限性
3632. mortal, a. 必有一死的;致命的;极端的,极大的;n. 致命性,死亡数
3633. simplify, vt. 简化
3634. peasant, n. (不用于英国或美国)小农；佃农；农民
3635. zipper, n.拉链,装拉链的包
3636. psychiatry, n.精神病学, 精神病治疗法
3637. undergo, vt. 经历,遭受
3638. decided, adj.明确的，果断的
3639. respect, n./v. 尊敬，尊重n. 敬意，问候，关系，方面
3640. target, n. 目标，对象，靶子
3641. psychology, n. 心理学
3642. invalidate, v.使无效
3643. stapler, n.钉书机
3644. powder, n. 粉末，药粉；火药，炸药
3645. gardener, n.园丁，花匠
3646. eddy, n.旋转, 漩涡。v.(使)起漩涡
3647. secondary, a. 第二的,中级的,次要的
3648. Mexico, n.墨西哥
3649. depreciate, v.降价，贬值，折旧
3650. contact, n. 接触;联络;会晤的人;(电)接点;vt. 接触
3651. homeless, adj.无家可归的
3652. redundancy, n.冗余
3653. cosmos, n.宇宙；秩序，和谐
3654. harvest, n. 收获，收成；成果，后果v. 收获，收割
3655. strictly, ad.严格地，严谨地
3656. release, vt./n. 释放;发表
3657. woollen, a.羊毛制的，毛线的
3658. hedge, n./v. (围)树篱,障碍;躲闪;推诿
3659. alcoholic, adj.含酒精的
3660. journey, n. 旅行，旅程v. 旅行
3661. airliner, n.定期航班
3662. delectable, adj.使人愉快的
3663. feeble, a. 虚弱的,无力的
3664. nun, n.修女，尼姑
3665. implement, n. 工具,器具;vt. 贯彻,履行
3666. championship, n.锦标(赛
3667. hectare, n.公顷（等于1万平方米
3668. best-seller, n.畅销书(货
3669. dimensional, adj.尺寸的
3670. bookcase, 书橱
3671. miss, n. 小姐v. 思念，未击中，错过，漏掉，逃脱
3672. taste, v. 品尝；(of)有…味道；体验n. 滋味；味觉
3673. facilitate, vt. 使便利
3674. artist, n. 艺术家，美术家；(某方面的)能手
3675. passion, n. 激情
3676. lend, vt. 借给，贷(款
3677. scant, adj.缺乏的,不足的,将近的,欠缺的。v.限制,节省,减少
3678. north, n. 北，北方a. 北方的，北部ad. 向北方，在北方
3679. agriculture, n. 农业，农艺，农耕
3680. capillary, n.毛细管。adj.毛状的, 毛细作用的
3681. egg, n. 蛋，卵，卵形物
3682. gramophone, n.留声机
3683. reexport, v.再出口
3684. loan, n. 借出物,贷款,借出;v. 借
3685. Swedish, adj. &n.瑞典人(的
3686. purpose, n. 目的，意图；用途，效果
3687. conscience, n. 良心;犯罪感
3688. fortitude, n.坚毅
3689. literally, ad. 照字义地,逐字地
3690. broadcast, v./n. 广播(节目
3691. merge, vt./vi. (企业)兼并,合并
3692. hitchhike, vi. 免费搭乘他人便车
3693. pants, n. 裤子
3694. advice, n. 劝告，忠告，(医生等的)意见
3695. potion, n.一服, 一剂
3696. undulate, v.波动, 起伏, 成波浪形。adj.波浪形的, 起伏的
3697. red, a. 红的，红色的n. 红色；红色颜料
3698. assembly, n. 集合；会议；装配；(美)洲议会的众议院
3699. fraud, n.欺骗, 欺诈行为, 诡计, 骗子, 假货
3700. quicken, vt.加快 vi.加快
3701. invariably, ad. 不变地,永恒地
3702. factual, adj.事实的, 实际的
3703. bunk, n.(轮船, 火车等)铺位
3704. shun, v.躲避，躲开
3705. ordinarily, ad.通常，大概
3706. above-mentioned, adj.上述的
3707. teacup, n.茶杯
3708. constitutive, adj.宪法的，章程的
3709. rehearsal, n. 排练，排演，演习，预演，试演
3710. effective, a. 有效的，生效的；被实施的；给人深刻印象
3711. handful, n. 一把；少数；一小撮
3712. separately, ad.分离地
3713. dessert, n. 正餐后的水果或甜食
3714. proprietor, n.所有者，业主
3715. sparkle, vi. 闪光,闪耀
3716. venture, n. 风险投资,(商业等的)风险项目 vi. 冒险, 大胆行事 vt. 敢于,大胆表示;拿…冒险,冒…的险
3717. ragged, adj.粗糙的
3718. detergent, n.清洁剂, 去垢剂
3719. cape, n. 海角,岬
3720. spatial, a. 空间的,关于空间的
3721. uneven, adj.不平坦的, 不平均的, 不均匀的, 奇数的
3722. revive, v. 苏醒,复活;复兴,再流行
3723. axial, a.轴的；轴向的
3724. indent, v.(书写)缩行
3725. righteous, a. 正直的;正当的,公正的
3726. horizon, n. 地平线;(常pl. )眼界,见识
3727. harmful, a.有害的
3728. lasting, adj.持久的，持续的
3729. flaw, n. 瑕疵,缺点
3730. kilometer, n. 公里，千米(略作km
3731. union, n. 联合，团结；联盟，联邦；协会，社团；和谐
3732. amplifier, n. 放大器，扩大器
3733. changeable, adj.变化的
3734. dispose, v. 处理,处置,除去;使愿意
3735. idiomatic, adj.习语的，惯用的
3736. convinced, adj.信服的
3737. monitor, n. 班长,监视器 v. 监听,监视
3738. sweeten, vt.使变甜vi.变甜
3739. elastic, a. 弹性的,有伸缩性的;n. 橡皮圈
3740. cafe, n. 咖啡馆,酒吧,餐馆
3741. responsibility, n. 责任，责任心；职责，任务
3742. prefer, v. (to)更喜欢，宁愿
3743. mileage, n.里程
3744. pursuant, a.追踪的,依照的
3745. term, n. 期,学期,条件
3746. cane, n. 茎,手杖,甘蔗
3747. step, n. 步；台阶，梯级；步骤，措施v. 踏，走，举步
3748. flatter, vt. 阿谀,使高兴;(肖像等)胜过(真人真物
3749. if, conj. (用于连接宾语从句)是否；是不是
3750. discretion, n.慎重
3751. naive, a. 天真的;幼稚的,轻信的
3752. yellow, a. 黄的，黄色的n. 黄色
3753. shark, n. 鲨鱼
3754. layer, n. 层
3755. administer, vt. 掌管,料理…的事务;实施;给予,派给,投(药
3756. administrative, adj.行政管理的
3757. transcript, n.抄本
3758. renewal, n.更新，续订
3759. demonstration, n.示范，表演，示威
3760. greeting, n. 问候，致敬
3761. obtainable, adj.可得到的
3762. serenity, n.安详,宁静,平静,沉着
3763. forensic, adj.法院的, 适于法庭的, 公开辩论的。n.辩论术
3764. cork, n. 软木 a. 软木制的 vt. 塞住,抑制
3765. inaccessible, a.达不到的，难接近的
3766. overextend, v.使承担过多的义务
3767. ferocious, a. 凶猛的,凶残的
3768. erect, vt. 建立,使竖立;a. 直立的,竖直的
3769. quirk, n.急转, 遁词, 怪癖
3770. Mr, n.(缩)先生
3771. kick, n./v. 踢
3772. chest, n. 胸腔，胸膛；箱，柜
3773. ominous, a. 不祥的,不吉利的
3774. rosy, adj.玫瑰红的，幻想的,乐观的,愉快美好的
3775. mailbox, n.信箱
3776. constantly, adv.经常地
3777. wonderful, a. 惊人的，奇妙的；极好的
3778. precisely, adv.精确地,恰好,正是,确实
3779. reckless, a. 鲁莽的
3780. specific, a. 明确的，具体的；特定的，特有的
3781. recreation, n. 娱乐，消遣
3782. enjoy, vt. 享受…的乐趣；欣赏；喜爱
3783. mill, n. 磨粉机，磨坊；作坊，工厂
3784. lantern, n. 灯，灯笼
3785. portion, n. 一部分,一份,一客
3786. umbrella, n. 伞
3787. dining-room, n.餐厅
3788. pardon, n. 原谅，宽恕；请再说一遍v. 原谅，饶恕，赦免
3789. plague, n. 瘟疫;麻烦,祸患
3790. incidentally, ad. 偶然地,顺便地
3791. tender, a. 脆弱的,娇嫩的;温柔的;vt. 提供,投标
3792. mariner, n.海员，水手
3793. ration, n.定量,配给量,正常量,合理的量 vt.限量供应
3794. horsepower, n.马力
3795. pesticide, n.杀虫剂
3796. auxiliary, a. 辅助的,协助的
3797. menu, n. 菜单
3798. pregnant, a. 怀孕的,意义深远的
3799. plummet, n.铅锤, 重荷。vi.垂直落下
3800. prominence, n.显着，突出
3801. bridle, n.笼子；束缚vt.抑制
3802. renaissance, n.文艺复兴(时期)；新生，复兴
3803. swing, vt./vi. 摆动,摇动;旋转,转向
3804. long-term, adj.长期的
3805. assumption, n. 假定，设想；采取；承担；推测；假装
3806. stimulate, v. 刺激，使兴奋；激励，鼓舞
3807. scarce, a. 缺乏的，不足的；稀少的，罕见的
3808. darkness, n.黑暗
3809. adjective, n. 形容词a. 形容词的，用作形容词的
3810. complicated, a. 结构复杂的;困难的
3811. window, n. 窗，窗口
3812. telephone, n. 电话，电话机v. 打电话
3813. cheer, n./v. 振奋,高兴,欢呼
3814. wreathe, v.环绕盘旋
3815. inorganic, a.无生物的；无机的
3816. nineteen, num./a. 十九pron. 十九(个，只
3817. engulf, v.吞没
3818. greed, n.贪心，贪婪
3819. indicative, a. 指示的,表示的
3820. shave, v./n. 剃,刮
3821. underground, n. 地铁a. 地下的；秘密的ad. 在地下
3822. romance, n. 传奇，爱情故事
3823. bulk, n. 容量;体积;大块
3824. controversial, a. 引起争论的
3825. flavour, n.滋味, 香味
3826. export, v. 出口,输出;n. 出口,出口企业,出口品
3827. cliff, n. 悬崖；峭壁
3828. kindness, n. 仁慈，亲切；好意；友好行为
3829. grumble, vi./n. 埋怨,发牢骚,咕哝
3830. stride, v./n. 大踏步走
3831. shrewd, a. 敏锐的,精明的;准确的
3832. violation, n.违犯；侵犯，妨碍
3833. verbal, a. 言语的,字句的;口头的
3834. infinitive, adj.不定式的
3835. arctic, a./n. 北极的,北极
3836. reticent, adj.沉默寡言的
3837. consolation, n.(被)安慰, 起安慰作用的人或事物
3838. envy, n./vt. 妒忌,妒忌的对象;羡慕
3839. mackintosh, n. (英国英语)雨衣;苹果计算机的 一种型号
3840. footing, n.立足点，立场
3841. endeavour, n.<英>尽力,竭力
3842. foregoing, adj.先行的，上述的
3843. contaminate, v.污染
3844. pierce, vt.刺穿, 刺破, 穿透, 突破, 深深感动
3845. courtesy, n. 礼貌,谦恭
3846. superior, a. 优良的，卓越的；上级的n. 上级；长者；高手
3847. fortress, n.堡垒，要塞
3848. reef, n.礁，礁石，暗礁
3849. triangular, a.三角的；三者间的
3850. militia, n.民兵(组织
3851. stroke, n. 击;划;一笔;中风;击
3852. appreciation, n.欣赏；鉴别；感激
3853. unjust, a.非正义的；不公平的
3854. disappointed, adj.失望的，扫兴的
3855. pathos, n.痛苦, 感伤, 悲怅, 哀婉
3856. punish, v. 惩罚，处罚
3857. choir, n.唱诗班, 唱诗班的席位
3858. chairwoman, n.女主席，女董事长
3859. teacher, n. 教师(员)，老(导)师
3860. chemist, n. 化学家；药剂师
3861. pail, n. 桶，提桶一桶的量
3862. writing, n. 写，写作；著作，作品
3863. oscillate, v.振荡
3864. foggy, adj.有雾的，雾蒙蒙的
3865. earth, n. 地球；陆地；泥土，土壤；尘世，人间
3866. sensational, adj.轰动的
3867. hasten, vt.催促 vi.赶紧
3868. find, v. (found，found)找到；发现；发觉；感到
3869. catholic, n. 天主教教徒
3870. welfare, n. 幸福,福利,社会保障
3871. b/l, n.(缩)提单
3872. inhibit, 抑制, 约束, [化][医]抑制
3873. mistress, n. 女主人；主妇；情妇，情人
3874. showroom, n.展室，陈列室
3875. somebody, pron. 某人，有人n. 重要人物
3876. indemnify, v.赔偿，保护
3877. their, pron.他(她、它)们的
3878. geometry, n. 几何学
3879. custodian, n.管理人
3880. fumble, v.摸索
3881. guarantee, n./vt. 保证,担保,保证人,担保物
3882. imperfect, adj.不完善的
3883. inspect, vt. 检查，调查，视察
3884. bravery, n.勇敢
3885. eliminate, vt. 排除,清楚;消灭;淘汰(常指在比赛中打 败团队或个人, 使他们不在参加
3886. restore, vt. 恢复,使回复;修复,整修;归还，交还
3887. foot, n. 脚，足；英尺；底部
3888. withdraw, vt./vi. 收回,取回;撤回;撤退
3889. competitive, a. 竞争的；好竞争的；(价格等的)有竞争力的
3890. unbearable, a.难堪的，忍受不了的
3891. seaside, n. 海滨，海边
3892. blend, v./n. 混合,把…混成一体,混合物
3893. pervert, v.反常
3894. pineapple, n.凤梨，波萝
3895. sit, vi. 坐，坐下；位于；栖息；孵卵vt. 使就坐
3896. free, a. 自由的；免费的；免税的；空闲的vt. 释放
3897. mimic, adj.模仿的, 假装的, [生]拟态的。n.效颦者, 模仿者, 小 丑, 仿制品。vt.模仿, 摹拟
3898. lag, vi. 走得慢,落后;n. 相隔时间
3899. suitable, a. (for)合适的，适宜的
3900. glimpse, n./vt. 一瞥,匆匆一看
3901. nearby, a. 附近的ad. 在附近prep. 在…附近
3902. sausage, n. 香肠，腊肠
3903. yes, ad. 是[用于肯定句前
3904. potter, n.陶工, 制陶工人
3905. extremely, ad.极端，极其，非常
3906. water, n. 水vt. 浇灌；给…饮水vi. 流泪，加水
3907. nullify, vt. 使无效,废弃,取消
3908. headache, n. 头痛
3909. subject, n. 主题；学科a. 隶属的；易遭…的(to)v. 使隶属
3910. unlucky, a.不幸的；不吉的
3911. allude, vi.暗指, 影射, 间接提到
3912. FALSE, a. 谬误的，虚伪的，伪造的，假的
3913. corridor, n. 走廊，通路
3914. stump, n.树桩，残茬,参与部分,残肢 v.僵硬地走,使为难
3915. abolish, vt. 废除
3916. yourself, pron. 你自己；你亲自
3917. jet, n. 喷气发动机，喷气式飞机；喷口v. 喷出，喷射
3918. curriculum, n.课程
3919. proficient, a.熟练的，精通的
3920. corrode, v. 腐蚀,侵蚀
3921. toddle, vi.东倒西歪地走, 蹒跚学步, 散步vt.蹒跚(或信步)走路。 n.东倒西歪的走路, 刚学走步的小孩
3922. herald, ad.传令官；通报者
3923. gush, v.涌出
3924. winter, n. 冬季，冬天
3925. completely, ad.十分，完全地
3926. weigh, v. 称…重量，称；重达；考虑，权衡
3927. academy, n. (高等)专科院校；学术社团，协会，研究院
3928. exhort, v.劝诫, 忠告
3929. fatty, adj.脂肪的, 含脂肪的, 脂肪状的, [医]脂肪过多。n.胖子
3930. idleness, n.懒惰；赋闲无事
3931. greet, v. 致敬，敬意，迎接；扑(鼻)，入(耳)，触(目
3932. conceptive, adj.有想像力的; 构想的
3933. alongside, ad./prep. 在旁,靠近
3934. prototype, n. 原型
3935. physically, ad.物质上；体格上
3936. until, conj./prep. 直到…为止，在…以前；直到
3937. negative, a. 否定的，消极的，阴性的n. 负数；(摄影)底片
3938. interim, adj.中间的, 临时的, 间歇的。n.中间时期, 过渡时期, 暂
3939. relish, n. 美味，味道，调味品，食欲，乐趣v. 喜欢，品味
3940. actuality, n.实际
3941. brief, a. 简短的，简洁的v. 简短介绍，简要汇报
3942. coefficient, n.协同因素；系数，率
3943. modern, a. 现代的，近代的，新式的
3944. expulsion, n.逐出, 开除
3945. oversight, n.监视，疏忽
3946. comparative, a. 比较的，相当的
3947. frequent, a. 时常发生的，频繁的v. 常到, 时常出入于, 常去
3948. shortly, ad. 立刻，不久；不耐烦地，简慢地
3949. engineer, n. 工程师
3950. fluctuation, n.波动；脉动；踌躇
3951. wreck, n. 破坏,船舶失事;失事船只
3952. bacterium, n. (pl. bacteria)细菌
3953. fir, n.裘皮
3954. tighten, vt./vi. (使)变紧,(使)绷紧,扣紧
3955. feedback, n. 反馈
3956. skate, v. 溜冰，滑冰n. 冰鞋
3957. equator, n. 赤道
3958. smell, n. 气味；嗅觉v. 嗅，闻到；散发(…的)气味
3959. shield, n. 盾,保护者,保护物;v. 保护,庇护
3960. unreasonable, a.不讲道理的；过度的
3961. counsellor, n.顾问
3962. democratic, a. 民主的
3963. module, n. 组件,模块,模件;(航天器的)舱
3964. estuary, n.河口, 江口
3965. soft, a. 软的；温柔的；细嫩的，光滑的；不含酒精的
3966. lack, n./v. 缺乏，不足
3967. authorize, v.授权，批准
3968. maim, vt.使残废, 使不能工作
3969. democracy, n. 民主政体,民主,民主社会
3970. quiver, vt./vi. 颤动,抖动
3971. stack, n. 堆;大量;书库
3972. fluid, a. 流动的,不固定的 n. 流体
3973. envision, vt.想象, 预想
3974. loop, n. 环状物,绳圈,环;v. 绕成圈
3975. rob, v. (of)抢劫，盗取；非法剥夺
3976. knowledge, n. 知识，学识；知道，了解
3977. patent, a. 明显的,获得专利的;n. 专利,专利 权,专利品;vt. 取得
3978. flatten, vt.把…弄平；击倒
3979. obese, adj.肥胖的, 肥大的
3980. readily, ad. 乐意地,欣然地;容易地
3981. conventional, a. 惯例的，常规的
3982. riddle, n. 谜，谜语；筛子
3983. derivation, n.引出；起源；衍生
3984. tan, n./a. (皮肤因日晒而成)棕褐色(的)vt. 晒黑
3985. stress, n. 压力,重压 vt. 着重,强调重点,重视
3986. bruise, n./v. 青肿,受伤,伤痕
3987. abundance, n. 丰富
3988. religion, n. 宗教，信仰
3989. irritate, vt. 激怒,使烦躁;使感到不适
3990. alarming, adj.警告的
3991. waitress, n. 女侍者，女服务员
3992. outcast, adj.被逐的, 被排斥的, 被遗弃的。n.被驱逐者, 流浪者
3993. manila, n.马尼拉(菲律宾首都
3994. treble, adj.三倍的, 三重的, 三层的, 最高音部的。v.成三倍, 使 增加两倍, 增为三倍
3995. complicate, v. 使…复杂；使…难懂；使(疾病等)恶化
3996. tigress, n.母虎
3997. mile, n. 英里，哩，海里
3998. hedgehog, n.刺猬
3999. heed, v. &n.注意，留心
4000. congress, n. 代表会议,(C-)(美国等)议会
4001. comedy, n. 喜剧；喜剧性事件
4002. upon, prep. 在…上；在…旁[=on
4003. hospitable, adj.好客的
4004. grill, n.烤架, 铁格子, 烤肉。v.烧, 烤, 严加盘问
4005. consumption, n. 消费(量);消耗,挥霍
4006. easy-going, adj.逍遥自在的
4007. temperate, adj.有节制的, 适度的, 戒酒的, (气候)温和的
4008. vow, n. 誓约,许愿
4009. asthma, n.[医]哮喘
4010. phony, adj.假冒的。n.假冒者
4011. radium, n.镭
4012. efficient, a. 能胜任的,效率高的
4013. sewage, n.下水道, 污水。v.用污水灌溉, 装下水道于
4014. innovate, v.革新，变革，创始
4015. baby-sitter, n.看护小孩的人
4016. civilian, n.平民, 公务员, 文官。adj.民间的, 民用的
4017. peruse, v.仔细阅读，审查
4018. clause, n. 条款;从句
4019. nitrate, n.[化]硝酸盐, 硝酸钾
4020. cater, vi. 供应伙食;为…提供服务,满足…的要求
4021. luxurious, a.爱好奢侈的，豪华的
4022. equitable, adj.公平的, 公正的, 平衡法的
4023. bird, n. 鸟，雀；女人；嘘声
4024. equip, v. (with)装备，配备；训练
4025. compliance, n. 遵守,依从
4026. Langkap, 冷甲(马来西亚霹雳洲内一地方名
4027. wooden, a. 木制的；呆笨的
4028. stupid, a. 愚蠢的，迟钝的
4029. cabinet, n. 柜橱,内阁
4030. gravel, n. 沙砾,碎石
4031. delinquency, n. 过失,为非作歹,失职
4032. proverb, n.谚语，格言，箴言
4033. common, a. 普通的；共同的；一般的n. 公有地
4034. infinitesimal, adj.无穷小的, 极小的, 无限小的。n.极小量, 极微量, 无
4035. dependable, adj.可依赖的
4036. ineffective, adj.效率低的
4037. acute, a. 厉害的;敏锐的;(疾病等)急性的
4038. drowsy, adj.昏昏欲睡的, 催眠的, (街、市等)沉寂的
4039. color, n. 颜色；颜料；肤色v. 给…着色
4040. trait, n.显著的特点, 特性
4041. also, ad. 而且(也)，此外(还)；同样地
4042. downstairs, ad. 在楼下，往楼下
4043. urban, a. 城市的，市内的
4044. local, a. 地方的，当地的；局部的
4045. bread, n. 面包
4046. graduate, n. 大学毕业生，研究生a. 毕了业的v. 大学毕业
4047. balloon, n. 气球，飞船a. 气球状的v. 乘坐气球；膨胀
4048. boy, n. 男孩子，儿子；男性服务员
4049. complete, a. 完全的，圆满的v. 完成，结束，使完满
4050. autonomy, n. 自治,自治权
4051. budget, n./vi. 预算
4052. wing, n. 翅，翅膀；翼，机翼；派别vt. 装以翼
4053. bout, n.一回, 一场, 回合, 较量。vt.来回耕
4054. guilty, a. (of)有罪的，内疚的
4055. scarcely, ad. 仅仅,几乎不
4056. jaw, n. 颌，颚
4057. know-how, n.专项技术，诀窍
4058. Japan, n.日本，日本国
4059. shrub, n. 灌木,灌木丛
4060. drastic, a. 严厉的,极端的;激烈的,迅猛的
4061. moped, n.机动脚踏两用车
4062. team, n. 小队，小组v. 协同工作
4063. trail, n. 痕迹,足迹,小径;v. 拖,拉,蔓延
4064. ugly, a. 丑陋的,险恶的
4065. amateur, n./a. 业余爱好者(的
4066. bunch, n./v. 束,串
4067. ten, num. 十pron./a. 十(个，只
4068. infringement, n.侵权
4069. badge, n. 徽章,标记
4070. abridge, vt. (书等)删节
4071. insofar, adv.在范围内
4072. sceptical, adj.怀疑论的, 怀疑的
4073. lad, n. 男孩，小伙子
4074. jug, n. (有柄，小口，可盛水等的)大壶，罐，盂
4075. offset, vt. 抵消,补偿
4076. minister, vi. 照顾,给予帮助
4077. dear, a. 昂贵的；亲爱的；珍贵的int. 呵！哎呀
4078. undoubtedly, ad. 无疑地,必是地
4079. acquaintance, n. 认识，相识，了解；相识的人，熟人
4080. windmill, n.风车
4081. daughter, n. 女儿
4082. simple, a. 简单的；单纯的，直率的；迟钝的，头脑简单的
4083. stimulus, n.刺激物, 促进因素, 刺激, 刺激
4084. marine, a. 海的,海运的;n. 船舶;海运业
4085. lure, v.引诱
4086. scrutiny, n. 细察;调查
4087. laugh, v. 笑；(on)讥笑n. 笑，笑声
4088. bonded, adj.保税的
4089. dollar, n. (美国，加拿大等国货币单位)美元，加元
4090. crumb, n.面包屑
4091. black, a. 黑(色)的；黑暗的n. 黑(色)；黑暗；黑人
4092. lemon, n. 柠檬
4093. corresponding, a. 符合的，相应的，对应的
4094. enter, vt. 进入；参加，加入；写入vi. 进去，进来
4095. inherit, v. 继承,经遗传而得(特性等
4096. counter, n. 柜台;v. 反对,反击
4097. expression, n. 表达；表情；声调；腔调；榨出；措词；式；符号
4098. plausible, adj.似是而非的
4099. surmise, v. &n.猜想，推测
4100. refute, v. 反驳，驳斥
4101. sportsmanship, n.体育精神
4102. alter, v. 改变,更改
4103. correlation, n.相互关系；对射
4104. speed, n. 速度，快v. 迅速，前进，急行；加速，使加速
4105. audio-visual, adj.利用视觉和听觉, 视听教学的
4106. unpaid, a.未付的；不支薪水的
4107. intimation, n.亲密，熟悉
4108. thicken, vt.使变厚(或粗、密
4109. fermentation, n.发酵
4110. premier, n. 首相，总理
4111. firearm, n.火器, 枪炮
4112. follow-up, n. &adj.后续(的
4113. ruinous, a. 毁灭性的,破坏性的
4114. subsequence, n.后果
4115. dissipate, v. 消散,消失;浪费,挥霍
4116. number, n. 数，数字，数量，号码，一群v. 共计，编号
4117. irrevocable, adj.不可撤消的
4118. restrict, v. 限制，约束
4119. scarf, n. 围巾，头巾，领巾，领带
4120. afflict, vt.使痛苦, 折磨
4121. exorbitant, adj.过度的, 过高的, 昂贵的
4122. ready, a. (for)准备好的，现成的；甘心的
4123. heroine, n. 女英雄；女主角
4124. watch, v. 观看；看守；(for)窥伺，等待n. 看管；表
4125. early, a. 早的，早期的，及早的ad. 早，在初期
4126. capita, n.人
4127. sunrise, n. 日出，拂晓；朝霞
4128. specially, ad.专门地，特别地
4129. sob, v./n. 哭泣，呜咽
4130. carelessness, n.粗心
4131. engagement, n. 约会，约定；婚约，订婚
4132. long, a. 长的，长时间的，长期的ad. 长久，长期地
4133. confrontation, n.面对，对峙
4134. frantic, adj.狂乱的, 疯狂的
4135. binding, n.装订
4136. sunflower, n.葵花
4137. withdrawal, n.撤退，取款
4138. great, a. 伟大的；重要的；大量的；很好的；美好的
4139. twig, n.细枝
4140. gape, v.打呵欠。n.呵欠
4141. father-in-law, n.岳父；公公
4142. fishery, n.渔业
4143. down, ad. 下；由大到小prep. 沿着…而下a. 向下的
4144. bribery, v.贿赂
4145. chatter, vi.&n.喋喋不休
4146. intransigent, adj.非妥协性的。n.不妥协的人
4147. bravely, adv.勇敢地
4148. special, a. 特殊的，专门的；附加的，额外的
4149. mint, n. 薄荷,造币厂
4150. sprawl, n.四肢伸开的躺卧姿势, 蔓生。v.四肢伸开地坐(或卧), 爬 行, 蔓生, 蔓延
4151. squash, vt.压碎n.鲜果汁
4152. lost, adj.失去的
4153. dread, n./v. 畏惧,恐惧
4154. external, a. 外面的,外部的
4155. stormy, a.有暴风雨的；激烈的
4156. passenger, n. 乘客，旅客
4157. pad, n. 垫子;拍纸簿;vt. 步行,走路
4158. photograph, n. 照片
4159. glutinous, adj.粘性的
4160. psychological, a.心理的，心理学的
4161. mentality, n. 智力,心理状态
4162. prerogative, n.特权
4163. rail, n. 栏杆;横杆;vi. 责骂
4164. vainly, adv.徒劳地
4165. comprehensive, a. 内容广泛的，总括性的，综合的
4166. stencil, n.复写纸，蜡纸
4167. wear, v. 穿着，戴着；磨损，用旧n. 穿，戴；磨损
4168. saucer, n. 茶托，碟子
4169. sponsor, n./v. 发起(人),主办(人
4170. poultry, n. 家禽,家禽肉
4171. lukewarm, adj.冷淡的
4172. hereof, adv.在本文件中
4173. unity, n. 团结；统一，一致，整体
4174. alert, a. 机警的，警觉的；机灵的vt. 使…警觉
4175. saddle, n. 马鞍,鞍座,鞍状山脊
4176. supposedly, adv.想像上, 按照推测
4177. might, n. 力量,强权,势力
4178. melodious, adj.音调优美的
4179. humidity, n. 湿度,空气湿度
4180. celebration, n.庆祝仪式
4181. mostly, ad. 几乎全部地；主要地，大部分，基本上
4182. darling, n. 心爱的人，亲爱的
4183. pill, n. 药丸
4184. shoemaker, n.鞋匠
4185. rent, v. 租，租赁n. 租金
4186. exasperation, n.愤慨，加剧
4187. poem, n. 诗
4188. romanticism, n.浪漫主义
4189. municipal, a. 市的;市政的
4190. modernization, n. 现代化
4191. inmate, n.同住者, 同室者(特指在医院、监狱), 居民
4192. amendment, n.修改(通知书
4193. bloom, n. 花;兴旺时期;vi. 开花;在青春时期
4194. nought, n. 无,零
4195. pear, n. 梨子，梨树
4196. huge, a. 巨大的，庞大的
4197. subordinate, a. 下级的,次要的;从属的;n. 部下, 下级职员;vt. 把…列 为下级,使在次要地位
4198. splendid, a. 壮丽的,辉煌的
4199. nearly, ad. 差不多，几乎
4200. arboreal, adj.树的, 乔木的, 树栖的
4201. biology, n. 生物学
4202. disturb, vt. 打扰,扰乱
4203. success, n. 成就，成功；成功的事物，有成就的人
4204. quietly, adv.安静地，静静地
4205. condition, n. 条件，状况，环境vt. 决定；支配；训练
4206. clue, n. 线索
4207. pilferage, v.偷窃
4208. craftsman, n.手艺人
4209. surrender, v./n. 投降,自首;放弃;屈服
4210. oxidize, v.(使)氧化
4211. launch, v. 使(船)下水,发射(火箭);开始,开办;n. (船)下水,汽艇
4212. mood, n. 心情，情绪；语气
4213. propagation, n.繁殖；传播；蔓延
4214. ruling, adj.统治的
4215. cripple, n. 残疾人,跛子 vt. 使跛,使残疾
4216. narrate, v.叙述
4217. monotony, n.单调，枯燥
4218. erode, vt.侵蚀, 腐蚀, 使变化。vi.受腐蚀, 逐渐消蚀掉
4219. decimal, a. 十进法的,小数的
4220. streamline, a. 流线型的vt. 使成流线型；使合理化
4221. broaden, vt.&vi.放宽，变阔
4222. smooth, a. 光滑的,平稳的 v. 使光滑,使平稳
4223. chic, n.别致的款式(尤指妇女的服饰)。adj.别致的
4224. eastward, a.&ad.向东的，向东
4225. sleeve, n. 袖子
4226. visible, a. 可见的
4227. overwhelming, a. 势不可挡的，压倒的
4228. incredible, a. 不可相信的，惊人的，不可思议的
4229. birthday, n. 生日；(成方)纪念日
4230. tide, n. 潮汐;(舆论,公众情绪)潮流趋势
4231. edible, adj.可食用的
4232. sitting-room, n.起居室
4233. sensible, a. 明智的;可感觉的
4234. mixer, n.混合者，搅拌器
4235. fright, n. 恐怖
4236. foe, n.敌人，宿敌
4237. equation, n. (数学)等式，方程式；(with)相等；均衡
4238. danger, n. 危险；威胁；危险事物
4239. discreetly, adv.慎重地
4240. ahead, ad. 在前面(头)；向(朝)前；提前
4241. blot, n. 墨水渍;污点;缺点;vi. 涂污;(用吸水纸)吸干墨水;遮暗
4242. vine, n.葡萄树
4243. textile, n. 纺织品a. 纺织的
4244. elaborate, a. 精心计划的;复杂的,详尽的;vt. 做详细说明
4245. peripheral, a.周界的；末梢的
4246. Englishman, n.英国男子
4247. friendship, n. 友谊，友好
4248. atmosphere, n. 大气(层)；空气；气氛，环境；大气压
4249. hover, vi. (鸟)盘旋,翱翔,(人)逗留在附近徘徊
4250. narcotic, n.麻醉药, 致幻毒品, 镇静剂。adj.麻醉的, 催眠的
4251. courage, n. 勇气，胆量
4252. narrative, adj.叙述性的。n.叙述
4253. anything, pron. 任何东西(事物)；无论什么东西(事物
4254. gangster, n.匪徒，歹徒，暴徒
4255. contrive, v.发明, 设计, 图谋
4256. quay, n.码头
4257. hijacker, n.拦路抢劫者
4258. palace, n. 宫，宫殿
4259. anticipation, n. 预期,预料
4260. vegetation, n.[植]植被, (总称)植物、草木, (植物的)生长、呆板单调
4261. suddenly, ad.突然地
4262. inactive, adj.无行动的, 不活动的, 停止的, 怠惰的。adj.非活动的
4263. pour, vt./vi. (液体)灌,注,倒;流入,流出
4264. hideous, adj.骇人听闻的
4265. noon, n. 中午，正午
4266. hoist, vt. 升起,扯起,向上推;n. 起重机
4267. companion, n. 同伴，共事者；伴侣
4268. bearish, adj.熊市的
4269. shred, n.碎片, 破布, 少量剩余, 最少量。v.撕碎, 切碎
4270. pedlar, n.(挨户兜售的)小贩
4271. zealous, a.热心的，热情的
4272. momentary, a.瞬息间的，片刻的
4273. fear, n. 害怕，恐惧；危险vt. 畏惧，害怕，担心
4274. infernal, adj.阴间的, 恶魔的
4275. vote, n. 投票，表决；选票，选票数v. 投票，表决
4276. dean, n. (大学)院长,系主任,教务长
4277. tune, n. 曲调,旋律,协调,调动
4278. discern, vt. 看出,察觉出;辨出,认出
4279. silk, n. 丝，绸
4280. ephemeral, adj.朝生暮死的, 短暂的, 短命的
4281. indefinite, a.不明确的；不定的
4282. dome, n. 圆屋顶
4283. conserve, vt.保存, 保藏
4284. tend, v. 趋向，往往是；照料，看护
4285. perennial, adj.四季不断的, 终年的, 长期的, 永久的, (植物)多年生
4286. mister, n.先生
4287. patience, n. 耐心，忍耐
4288. abet, vt.教唆, 煽动, 帮助, 支持
4289. forsake, vt.遗弃，抛弃，摒绝
4290. agitate, v. 摇动(液体)；使焦虑不安；困扰；鼓动
4291. midst, n. 中间，当中
4292. complaint, n. 抱怨，诉苦，怨言，控告；疾病
4293. flank, n./vi. 胁,侧翼;包抄…的侧翼
4294. elicit, vt.得出, 引出, 抽出, 引起
4295. minority, n. 少数;少数民族;未成年
4296. overjoy, n.使大喜
4297. adoption, n.收养；采纳，采取
4298. fare, n. 车费,船费
4299. rate, n. 速率；等级；价格，费用v. 估价；评级，评价
4300. negligent, adj.粗心大意的
4301. pointed, a. 尖锐的;率直的
4302. united nations, n.联合国
4303. abruptly, adv.突然地
4304. holiday, n. 假日，节日，假期，休假
4305. extract, vt. 拔出,榨取;摘录;n. 抽出物,选录
4306. drawer, n. 抽屉
4307. kit, n. (士兵,旅游者)所有装备,成套用具;vt. 发给装备
4308. correspondent, n. 记者，通讯员；通信者
4309. snake, n. 蛇
4310. critical, a. 危急的,批评的,苛求的,关键的
4311. portable, a. 轻便的，手提(式)的，可移动的
4312. illogical, adj.不合逻辑的, 不合理的
4313. overdose, n.配药量过多。vt.配药过量, 使服药过量
4314. fully, adv.完全，彻底
4315. alluvial, adj.冲积的, 淤积的
4316. aspect, n. 样子，外表，面貌，(问题等的)方面
4317. combat, n./v. 战斗,搏斗
4318. hostel, n.廉价旅馆
4319. shy, a. 怕羞的，腼腆的；胆怯的vi. 惊退，畏缩
4320. bullish, adj.行情看涨的
4321. trim, a. 整洁的,整齐的
4322. somehow, ad. 以某种方式，用某种方法；不知怎么地
4323. live, v. 活,生活 a. 有生命的,实况的
4324. off, ad. 离开；在远处；脱开prep. 从，从…离开
4325. forbid, v. 禁止，不许
4326. liar, n.说谎的人
4327. steak, n. 肉片,鱼片,牛排
4328. negro, n. 黑人a. 黑人的
4329. experience, n./vt. 经验；经历；体验；阅历
4330. nitrogen, n. 氮
4331. justify, vt. 证明…是正当的或有理的,为…辩护
4332. flash, n./v. 闪光,闪现;简讯;浮华
4333. grim, a. 严酷的;讨厌的;严厉的
4334. ice-bound, adj.冰封的
4335. shovel, n. 铁锨,铲;vt. 铲起
4336. vague, a. 不明确的，含糊的，暧昧的
4337. assassinator, n.暗杀者
4338. deliberation, n.慎重，故意
4339. chill, n./a./v. 寒冷,扫兴的,(使)感冒
4340. noticeable, a. 显而易见的，值得注意的，重要的
4341. numerate, vt.数, 计算, 读(数
4342. inclusive, a. 包括的,包含的
4343. forth, ad. 向前；向外，往外
4344. reactionary, adj.反动的,极端保守的
4345. dip, n./v. 蘸湿;斜坡;短时间游泳
4346. exploitation, n.开发，利用
4347. soothe, v.安慰，使镇定
4348. ancient, a. 古代的，古老的，古式的
4349. longevity, n.长寿
4350. seaman, n.海员，水手；水兵
4351. sabotage, n.(不满的职工或敌特等的)阴谋破坏, 怠工, 破坏。vi.从 事破坏活动。vt.对...采取破坏行动, 妨害, 破坏
4352. dole, n.施舍品, 悲哀, 失业救济金。vt.发放救济
4353. fluent, a. 说话流利的,(演说等)流畅的
4354. zero, n. 零，零度num. 零
4355. seashore, n.海滨
4356. bump, v./n. 撞击;颠簸地行驶;凹凸不平;ad. 猛烈地
4357. commissioner, n.委员, 专员
4358. electronic, a. 电子的
4359. thief, n. 贼；小偷
4360. reside, vi.居住，驻扎；属于
4361. visa, n. (护照等的)签证；维萨信用卡vt. 签证
4362. seismic, adj.[地]地震的
4363. aspirin, n. 阿斯匹林
4364. agonize, v.使痛苦
4365. untold, adj.未说过的,未透露的,数不清的
4366. hereafter, adv.此后
4367. sandy, n.沙的，含沙的
4368. kneel, v. 跪，下跪
4369. largely, ad. 主要地，基本上；大量地，大规模地
4370. crowd, n. 人群；一群，一伙v. 聚集，群集；挤满，拥挤
4371. grey, a.灰色的 n.灰色
4372. juvenile, a. 青少年的,幼稚的 n. 青少年
4373. sunshine, n. 日光，日照；晴天
4374. phrase, n. 短语，词语，习语
4375. orchestra, n. 管弦乐队
4376. ladder, n. 梯子，阶梯
4377. phonetic, adj.语音的, 语音学的, 表示语音的
4378. paradox, n.似非而是的论点, 自相矛盾的话
4379. future, n. 将来，未来；前途，前景a. 将来的，未来的
4380. bough, n.树枝
4381. scatter, v. 打散;撒,散布
4382. shimmer, n.微光
4383. corner, n.角落，拐角
4384. plankton, n.浮游生物
4385. entire, a. 完全的，全部的，完整的
4386. weight, n. 重量；负荷，重担；重要性，分量；砝码，秤砣
4387. substantial, a. 可观的,大量的;牢固的,结实的;实质的,真实的
4388. shabby, a. 破旧的;衣衫褴褛的;卑鄙的,不公平的
4389. sparrow, n.麻雀
4390. ashamed, a. 羞愧的,害臊的
4391. outset, n. 开端,开始
4392. pastime, n. 消遣,娱乐
4393. irregularity, n.不规则；不整齐
4394. license, n. 许可证，执照v. 准许，认可
4395. streak, n.纹理，条纹 vt.裸奔,飞驰
4396. mode, n. 方法;样式
4397. cock, n. 公鸡，雄鸡；龙头，开关
4398. fry, v. 油煎,油炒
4399. vulnerable, a. 易受伤的,脆弱的;易受攻击的,难防御的
4400. genial, adj.亲切的
4401. ferryboat, n.渡船
4402. wreath, n. 花环，花圈
4403. have, v. 有，具有；体会，经受；从事；使；吃，喝
4404. possible, a. 可能的，做得到的；合理的；可允许的
4405. caterpillar, n.毛虫
4406. result, n. 结果，成绩v. 结果，致使，导致，由…而造成
4407. revert, v.回复到，重议
4408. shine, v. 照耀，发光；擦亮n. 光泽，光
4409. industrialized, adj.工业化的
4410. panel, n./vt. 镶板,控制板;座谈小组;镶饰
4411. booming, adj.兴旺的，繁荣的
4412. region, n. 地区，地带，行政区，(科学等)领域
4413. fog, n. 雾气，雾v. 以雾笼罩，被雾笼罩
4414. Asia, n.亚洲
4415. privileged, adj.有特权的,幸运的,保密的,秘密的
4416. exclusion, n.排除
4417. back, a. 后面的ad. 向后v. 倒退；支持n. 背；后面
4418. reservoir, n. 水库，蓄水池
4419. oxide, n. 氧化物
4420. tally, v.吻合，符合
4421. integration, n.结合，整体
4422. choke, v. 闷塞,压抑,闷死
4423. remittance, n. 汇款(海外),汇款额
4424. vary, vt. 改变，变化；使多样化
4425. halfway, adv.半途
4426. surcharge, n. 额外费用,过高的要价
4427. Portugal, n.葡萄牙
4428. Latin, a. 拉丁的，拉丁文的n. 拉丁语
4429. remove, v. 移动，脱掉，调动，免职
4430. sell, v. 卖，出售
4431. magistrate, n. 地方法官
4432. sophisticated, adj. [人
4433. deathly, adj.致死的
4434. photographer, n.摄影师
4435. garlic, n. 蒜，大蒜粉
4436. actress, n. 女演员
4437. heavily, ad.重重地；大量地
4438. spacious, a. 广阔的,宽敞的
4439. sheriff, n.郡长；警察局长
4440. equity, n.公平, 公正, 公平的事物, 资产净值, [律]平衡法
4441. blank, a. (纸)没有写字的;(表格)空白的;失色的;n. 空白;空虚
4442. perseverance, n.坚持
4443. rod, n. 杆，棒
4444. recruitment, n.招募
4445. emphasis, n. 强调，重点
4446. undermentioned, adj.下述的
4447. cruel, a. 残忍的，残酷的
4448. condense, v. 冷凝,凝结;精简,浓缩
4449. roman, n.古罗马人 a.罗马的
4450. damn, int. 该死vt. 遣责；使失败a. 十足的ad. 极
4451. clatter, n.得得声，卡嗒声
4452. Jupiter, n.丘庇特；木星
4453. imitate, vt. 模仿,仿效;仿制,仿造
4454. colonist, n.移民；殖民地居民
4455. bound, vt./n. 跳跃前进,跳跃; a. [bind 的过去分词
4456. canal, n. 运河,河渠,动植物体内的管道
4457. dictation, n. 听写，口述；命令
4458. federation, n. 联邦,同盟,联盟
4459. specialist, n. 专家
4460. familiarity, n.熟悉，相似
4461. worker, n. 工人，工作者，工作人员
4462. hard-working, adj.勤劳的
4463. blood, n. 血液，血；血统，血亲；血气
4464. overlook, vt. 俯视;忽略;宽恕
4465. case, n. 箱，盒，容器；情况，事实；病例；案件
4466. partnership, n.伙伴关系，合伙
4467. savage, a. 未开化的;凶猛的
4468. turkey, n. 火鸡(肉
4469. belly, n. 腹部,腹腔
4470. rehabilitate, v.使(身体)康复, 使复职, 使恢复名誉, 使复原
4471. referee, n.(足球等)裁判员
4472. elliptical, a.椭圆的；省略的
4473. blonde, adj.色白的, 碧眼的。n.金发碧眼的女人
4474. coed, n.男女合校大学中的女生。adj.男女同学的,男女兼收的,对
4475. watchful, a.注意的，警惕的
4476. timid, a. 胆怯的，怯懦的
4477. boat, n. 小船，艇
4478. puzzle, n. 难题;谜;v. 迷惑
4479. circumference, n. 圆周,圆周长度
4480. bold, a. 大胆的,无耻的,醒目的
4481. partisan, n.游击队
4482. symmetry, n. 对称(性)；匀称，整齐
4483. pitch, n. 球场;声音的高低度;程度;沥青 vt./vi. 投掷;搭帐,扎
4484. sustenance, n.食物, 生计, (受)支持
4485. nourishment, n. 食物
4486. pendulum, n.钟摆, 摇锤
4487. bidding, n.投标
4488. ice-cream, n. 冰淇淋
4489. exacerbate, vt.恶化, 增剧, 激怒, 使加剧, 使烦恼
4490. furnish, vt. 用家具装备房子;供应
4491. supervise, vt./vi. 监督,管理,指导
4492. ghastly, adj.苍白的, 死人般的, 可怕的, 惊人的。adv.可怖地, 惨
4493. icy, a.冰冷的；冷冰冰的
4494. forge, n. 锻工车间,铁匠店;vt. 锻造,经锻炼而形成;伪造
4495. arc, n.弧，弓形物；弧光
4496. pleased, adj.高兴的，乐意的
4497. diversity, n.多样化
4498. popular, a. 流行的，通俗的，大众的；广受欢迎的
4499. guitar, n. 吉他vi. 弹吉他
4500. panic, n. 惊慌,恐慌;vi. 受惊,惊慌
4501. arena, n. 竞技场,比赛场所
4502. certainly, ad. 一定，必定，无疑；当然，行
4503. confident, a. 确信的,有把握的
4504. apprentice, n./vt. 学徒;使当学徒
4505. metaphor, n.[修辞]隐喻, 暗喻, 比喻说话
4506. gutter, n.沟，边沟；檐槽
4507. cage, n. 鸟笼
4508. magnetic, a. 磁的，有磁性的；有吸引力的
4509. guy, n. 家伙，人
4510. founder, n.创办人，奠基人
4511. index, n. 索引v. 附以索引
4512. censor, n./vt. 审查,审查员;删改
4513. scaly, adj.鱼鳞状的
4514. slumber, n.睡眠；沉睡状态
4515. seventeen, num.十七，十七个
4516. incidence, n.落下的方式, 影响范围, [物理]入射
4517. buoyant, adj.有浮力的, 轻快的
4518. overall, a. 包括一切的,全部的;n. 罩衫,工装裤
4519. foreman, n.领班
4520. tissue, n. 生理组织;薄纸,棉纸;织物;一套,一连串
4521. hunter, n.猎人，搜索者
4522. elite, n.<法>[集合名词]精华, 精锐, 中坚分子
4523. intensify, vt.加强。vi.强化
4524. palpitate, v.跳动
4525. giver, v.给予，付出n.让步
4526. ravage, vt./vi./n. 毁坏,蹂躏;抢劫,掠夺
4527. striking, a. 引人注目的,显著的
4528. flimsy, adj.易坏的, 脆弱的, 浅薄的, 没有价值的, 不足信的, (人)浮夸的。n.薄纸, 描图用薄纸, 薄纸稿纸
4529. usage, n. 使用，用法；习惯，习俗；惯用法
4530. software, n. 软件
4531. postpone, vt. 推迟,延缓
4532. centennial, n.百年纪念。adj.一百年的
4533. archaeology, n.考古学
4534. concept, n.概念，观念，设想
4535. full, a. (of)满的，充满的a./ad. 完全，充分
4536. reform, v. 改革，改造，改良n. 改革，改造，改良
4537. worthwhile, a. 值得(花时间、精力)的;合算的
4538. golf, n. 高尔夫球
4539. currently, ad.普遍地；当前
4540. festival, n./a. 节日(的),表演会期(的
4541. regularly, ad.有规律地
4542. limb, n. 肢,臂,翼,大树枝
4543. clip, n. 回形针;夹子;剪;修剪;猛打;vt. 剪短;猛击,痛打
4544. millionaire, n. 百万富翁
4545. harden, v. (使)变硬
4546. residence, n. 居住,住处,住宅
4547. amusement, n.娱乐，消遣，乐趣
4548. lace, n. 鞋带,花边
4549. presumably, ad. 假定地;也许
4550. niece, n. 侄女，甥女
4551. groundless, adj.无根据的
4552. nominee, n.被提名的人, 被任命者
4553. subdue, vt. 使屈服、征服,克制;使柔和,使安静
4554. beggar, n.乞丐，穷人
4555. monster, n. 畸形的动植物,怪物;恶人
4556. supper, n. 晚餐
4557. root, n. 根，根部；根本，根源v. (使)生根，(使)扎根
4558. silt, n.淤泥, 残渣, 煤粉, 泥沙。v.(使)淤塞, 充塞
4559. monk, n.和尚，僧侣，修道士
4560. debris, n.碎片, 残骸
4561. smuggler, n.走私者
4562. monstrous, a.可怕的；极大的
4563. fight, v./n. 打(仗)，搏斗，斗争，战斗
4564. evaporation, n.蒸发，升华
4565. underlying, a. 含蓄的,潜在的;在下面的
4566. price-list, n.价格表
4567. corruption, n.腐败，腐化
4568. flood, n. 洪水，水灾v. 淹没，发大水，泛滥
4569. contracted, adj.合同所规定的
4570. intercontinental, adj.大陆间的, 洲际的
4571. limit, n. 界限，限度，范围v. (to)限制，限定
4572. expedient, a. 有用的,有利的;n. 紧急的办法,权宜之计
4573. improvise, v.临时准备
4574. Britain, n.不列颠，英国
4575. his, pron.他的(所有物
4576. obedient, a. 服从的,顺从的
4577. visitor, n. 访问者，客人，来宾，参观者
4578. analytical, adj.分析的，解析的
4579. capitalist, adj.资本主义的
4580. socket, n.窝, 穴, 孔, 插座, 牙糟。v.给...配插座
4581. pack, v. 捆扎，打包；塞满，挤满n. 包裹，背包，一群/副
4582. sense, n. 感官；感觉；判断力；意义v. 觉得，意识到
4583. rewarding, adj.有收获的
4584. dearth, n.缺乏
4585. conceit, n.自负，自高自大
4586. national, a. 民族的，国家的，国立的
4587. marketable, adj.有销路的
4588. learner, n.学习者，学生
4589. favorably, adv.有利地，顺利地
4590. pane, n.窗格玻璃
4591. addict, vt.使沉溺, 使上瘾。n.入迷的人, 有瘾的人
4592. No, n.(缩)号，号码
4593. graze, v. (牲畜)吃草,放牧;擦过;n. 擦,擦伤
4594. refuge, n. 避难处，藏身处
4595. hasty, a. 急速的,匆促的
4596. painter, n. 漆工，画家
4597. conviction, n. 深信，确信；定罪，判罪
4598. glorify, vt.赞美(上帝)；颂扬
4599. imitation, n. 模仿，仿效；仿制；仿造品
4600. parent, n. 父母，母亲；(pl.)双亲；父母
4601. rim, n. 边;边缘,轮辋
4602. transfuse, vt.注入, 灌输, [医]输血
4603. mount, vt. 登上;发起,组织;安放,安装;vi. 增长,加剧; n. [M
4604. bewilder, vt. 迷惑,为难
4605. senator, n. 参议员
4606. yacht, n. 小帆船,快艇,帆船
4607. thick, a. 厚的，粗的，稠的，浓的ad. 厚，浓，密
4608. stevedore, n.码头工人
4609. nowadays, ad. 现今，现在
4610. rock-bottom, n.adj.(价格)最低(的),底层的
4611. well, ad. 好，令人满意地；很int. 哎呀，好啦，嗯
4612. notch, n.槽口, 凹口。vt.刻凹痕, 用刻痕计算, 开槽, 切口, 得 分。n.<美语>山间小路, 刻痕, 峡谷
4613. cruelty, n.残酷；残酷行为
4614. disposed, adj.有倾向的
4615. provisional, a. 临时的,暂时性的
4616. abreast, adv.并肩，并列
4617. soup, n. 汤
4618. worship, n. 礼拜，礼拜仪式；崇拜v. 崇拜，敬仰；做礼拜
4619. proforma, adj.形式的,预计的
4620. instruct, v. 教，教授；命令，指示
4621. crown, n. 王冠,王权,顶部 vt. 为…加冕,褒奖,顶上有,圆满完成
4622. permanently, ad.永久地，持久地
4623. wax, n. 蜡，蜂蜡v. 打蜡
4624. conversation, n. 会话，谈话
4625. ejection, n.喷射
4626. university, n. (综合)大学
4627. wholesale, n. 批发
4628. consonant, n.辅音,辅音字母,子音;adj. 一致的,调和的,辅音的
4629. heave, v. 用力举起;说出;掷扔;n. 举,拉,扔
4630. snatch, vt. 夺,夺走;一下子拉,一把抓住;抓住机会做;vi. (at)一
4631. precision, n. 精确，精确度
4632. voyage, n. 航海；航行；旅行
4633. glisten, v.闪光
4634. two, num. 二，两个n. 两个(人或物
4635. shoot, v. 发射；掠过，疾驰而过n. 嫩枝，苗，射击
4636. glory, n. 光荣，荣誉
4637. good-looking, adj.好看的
4638. reed, n. 芦苇，苇丛；芦笛，牧笛
4639. Italian, a.意大利的n.意大利人
4640. smack, n.滋味v.劈啪地响
4641. troublesome, a. 令人烦恼的，讨厌的
4642. inability, n.无能
4643. force, n. 力量，力；势力；(pl.)(总称)军队v. 强迫
4644. earn, v. 赚得，挣得，获得
4645. carol, n.颂歌
4646. segregate, v.隔离
4647. barn, n. 谷仓
4648. learned, a. 博学的，有学问的
4649. foodstuff, n.食品
4650. revise, v. 修订;改正
4651. themselves, pron. 他(她、它)们自己；他(她、它)们亲自
4652. spaceship, n. 宇宙飞船
4653. jeopardize, v.危及
4654. sweep, n. 扫,扫除;连绵区域;激流;vt. 扫除;掠过;连绵,延伸
4655. vain, a. 徒劳的,无效果的;自负的;不尊敬的
4656. erratic, adj.无确定路线, 不稳定的, 奇怪的。n.古怪的人, 漂泊无
4657. vice versa, adv.反之亦然
4658. chalk, n. 粉笔，白垩
4659. swim, vi. 游泳；游；漂浮；眩晕；充溢vt. 游过n. 游泳
4660. dormitory, n. 宿舍
4661. population, n. 人口，(全体)居民
4662. faultless, a.无过失的；无缺点的
4663. originality, n.独创性
4664. backwardness, n.落后(状态
4665. raft, n.筏, 救生艇, 橡皮船, 大量。vi.乘筏。vt.筏运, 制成筏
4666. refreshment, n. (pl.)点心，饮料；精力恢复，爽快
4667. cumbersome, adj.讨厌的, 麻烦的, 笨重的
4668. deceitful, adj.欺骗性的
4669. bring, v. 拿来，带来；产生，引起；使处于某种状态
4670. prefabricate, v.预制
4671. voucher, n. 收据,凭单
4672. unusable, adj.无法使用的
4673. incision, n.切割, 切开, 切口
4674. perpetual, a. 永久的,永恒的
4675. farming, n.农业，种植业
4676. paper, n. 纸；纸制品；报纸；(pl)文件；试卷；论文
4677. thorough, a. 彻底的,详尽的
4678. misguided, adj.被误导的
4679. spiral, a. 螺旋形的
4680. o.k, adj. &n.(缩)对，行
4681. complexion, n.面色, 肤色, 情况, 局面
4682. united states, n.美国，合众国
4683. sentiment, n. 情操,思想感情;情绪
4684. recourse, n.求助对象,追索权,依靠,依赖
4685. quarter, n. 四分之一；季；一刻钟；(pl.)方向；(pl.)住处
4686. audit, n.审计, 稽核, 查帐。vt.稽核, 旁听。vi.查账
4687. series, n. 连续,系列
4688. thrifty, a.节俭的；兴旺的
4689. porpoise, n.[动]海豚, 小鲸
4690. hip, n. 臀部，髋；屋脊
4691. log, n. 原木,圆木;v. 把…记入航行日志
4692. eloquent, a. 雄辩的
4693. wrath, n.暴怒，狂怒，愤慨
4694. industrialization, n.工业化
4695. dredge, n.挖泥机, 挖泥船, 捞网。v.挖掘, 疏浚, 捞取, 撒在食物
4696. mysterious, a. 神秘的，可疑的，难理解的
4697. optimism, n. 乐观,乐观主义
4698. daily, a. 每日的ad. 每日，天天n. 日报
4699. block, n. 大块木料,街区,事物的聚集,障碍物 vt. 阻碍,破坏
4700. hug, vt./n. 紧抱,拥抱
4701. prerequisite, n.先决条件。adj.首要必备的
4702. pinpoint, n.精确。adj.极微小的。v.查明
4703. succeed, vi. 成功；继承，接替vt. 接替；继…之后
4704. lawn, n. 草地,草坪
4705. platinum, n.白金
4706. unsatisfactory, a.不能令人满意的
4707. cereal, n. 谷类粮食
4708. adventurous, adj.冒险的
4709. cupboard, n. 碗橱
4710. stray, vi.迷路a.迷路的
4711. seaport, n.海港，港市
4712. aids, n.(缩)艾滋病
4713. unavoidable, adj.不可避免的
4714. quit, vt. 离开;辞职
4715. rock, n. 岩石，石块v. 摇，摇动
4716. magnify, vt. 放大,扩大;夸大,夸张
4717. sickle, n.镰刀
4718. congratulation, n. (on)祝贺，(pl.)祝贺词
4719. exterminate, v.消除
4720. lump sum, n.总数
4721. presentation, n. 赠送;提出;显示;描述
4722. bodyguard, n.保镖
4723. diarrhea, n.痢疾,腹泻
4724. lift, v. 升起，举起，消散n. 电梯，上升，免费搭车
4725. editorial, n. 社论a. 社论的；编辑上的
4726. arrear, n.欠款
4727. crab, n. 螃蟹，蟹肉
4728. cellulose, n.纤维素
4729. burst, v. 爆裂，炸破；突然发生n. 突然破裂，爆发
4730. selfish, adj. 自私的，利己的
4731. parrot, n.鹦鹉
4732. brute, n.禽兽，畜生
4733. dangerous, a. 危险的，不安全的
4734. farmhouse, n.农舍
4735. exclusively, ad.专门地
4736. lengthen, vt.使延长vi.变长
4737. anticipate, vt. 预料；期望；预先考虑；抢先；提前使用
4738. timber, n. 木材，木料
4739. elsewhere, ad. 在别处,向别处
4740. presume, v. 假定，假设，认为，揣测，滥用，擅自行动
4741. suppose, v. 料想，猜想；假定conj. 假使…结果会怎样
4742. distinguish, v. 区别,识别;使显赫
4743. treasurer, n.司库，财务主管
4744. creative, a. 有创造力的，创造性的
4745. commuter, n.通勤者, 经常往返者
4746. polar, a. 两极的，极地的，南辕北辙的n. 极线，极面
4747. categorize, v.加以类别, 分类
4748. per, prep. 每；经，由
4749. coastal, adj.沿海的
4750. fragrant, a. 香的；芬芳的
4751. masculinity, n.男性, 阳性, 雄性
4752. dealing, n.交往，生意
4753. asleep, a. 睡觉，睡着(用作表语
4754. furnace, n. 炉子,熔炉
4755. printout, n.[计]打印输出
4756. navel, n.脐，中心
4757. revenue, n. (国家的)年收入,税收
4758. bossy, adj.好发号施令的
4759. legion, n.古罗马军团(约有3000至6000步兵,辅以数百名骑兵), <书
4760. dependant, n.受赡养者；侍从
4761. menace, n. 威胁,威吓;具有危险性的人(或物);vt. 威胁,威吓
4762. activate, vt. 使活动;触发
4763. obviously, ad.明显地，显然地
4764. idealize, v.使理想化
4765. documentary, a. 文献的n. 记录片
4766. elevator, n. 电梯，升降机
4767. apple, n. 苹果，苹果树
4768. anniversary, n. 周年纪念
4769. affix, vt.使附于, 粘贴。n.[语]词缀
4770. buzzword, 强意词 buzzing
4771. narration, n.叙述；故事；叙述法
4772. watertight, a.不漏水的，防水的
4773. loosen, v. 解开，放松
4774. certain, a. 某，某一，某些；(of)一定的，确信的，可靠的
4775. continental, a.大陆的，大陆性的
4776. million, num./n. 百万，百万个
4777. allot, v.分配，配给
4778. implied, adj.暗含的，暗示的
4779. mechanic, n. 技工，机修工
4780. chiefly, adv.多半，首要地
4781. cab, n. 出租车，出租马车；驾驶室vi. 乘出租马车
4782. signature, n. 签名
4783. appreciable, a. 可(察觉到)的,明显的;v. 值得重视的
4784. blessing, n.祝福
4785. terrain, n.地形
4786. pension, n./vt. 养老金,退休金;给予养老金
4787. east, n. 东，东方，东部a. 东方的，东部的
4788. unworkable, adj.行不通的
4789. upper, a. 上面的；上部的，较高的
4790. commander, n.司令官，指挥员
4791. employ, n./v. 雇用；用，使用
4792. coax, v.哄, 耐心使
4793. lame, a. 跛的,瘸的;不能说服人的;vt. 使跛
4794. right, a. 右的，正确的n. 右，权利ad. 在右边，正确地
4795. suspect, vt. 疑有,觉得,猜想;觉得可疑;n. 嫌疑犯,可疑分子;a. 可
4796. crater, n.弹坑
4797. inwards, adv.向内的
4798. hum, v./n. 嗡嗡叫,嘈杂声
4799. pudding, n.布丁
4800. forestry, n.林业
4801. challenging, adj.具有挑战性的
4802. tell, vt. 告诉，讲述；告诫；吩咐，命令；辨/区别
4803. swallow, vt. 吞,咽;轻信,轻易接受;承受,使不流露
4804. exportation, n.出口
4805. clinical, adj.临床的, 病房用的
4806. sizable, adj.相当大的
4807. logic, n. 逻辑,逻辑学,条理性
4808. rusty, a.生锈的；变迟钝的
4809. vital, a. 生命的;必需的;极其重要的
4810. worth, n. 价值a. 值…的，价值…的，值得…的
4811. load, v. 装(货)，装载n. 装载(量)，负荷(量)；(一)担
4812. tempt, v. 诱惑，引诱；吸引，使感兴趣
4813. leading, a. 领导的，指导的；第一位的；最主要的
4814. pant, vt./vi. 气喘,喘息;气喘吁吁地说
4815. nasal, adj.鼻的, 鼻音的, 护鼻的。n.鼻音, 鼻音字
4816. reproduction, n.再生(产)；繁殖
4817. presumption, n.假定
4818. potential, a. 可能的,潜在的;n. 潜能;潜力
4819. racial, a. 种的，种族的
4820. outweigh, v.在重量(或价值等)上超过
4821. reconnaissance, n.探索，勘查
4822. breeze, n. 微风
4823. subsidiary, a. 辅助的,补充的;次要的,附属的; n. 子公司,附属机构
4824. wounded, adj.受伤的n.伤员
4825. problematic, adj.有问题的,有困难,有疑问,阴暗的
4826. bridge, n. 桥；桥牌；鼻梁vt. 架桥；渡过
4827. succinct, adj.简洁的, 紧身的, 压缩在小范围内的
4828. motivate, vt. 促动,激发
4829. rescue, vt./n. 援救;营救
4830. systematically, ad.系统地，有规则地
4831. planetarium, n.行星仪, 天文馆
4832. tumult, n.骚动，暴动，吵闹
4833. evaporate, v. 使蒸发,使脱水,消失
4834. digest, n. 摘要,文摘 v. 消化,领会,融会贯通
4835. fortune, n. 运气；命运；财产；财富
4836. fell, v. 击倒；打倒(疾病等)；砍伐a. 凶猛的；可怕的
4837. boost, vt./n. 增加;吹捧;提高;升
4838. meantime, n. 其间，其时ad. 同时，当时
4839. smoker, n.抽烟者
4840. hypnosis, n.催眠状态, 催眠
4841. compare, v. 比较,对照;喻为
4842. rain, n. 雨；雨天；下雨vi. 下雨vt. 使大量落下
4843. ballooning, n.热气球飞行运动
4844. pattern, n. 模式，式样；图案，图样v. 仿制，模仿
4845. economics, n. 经济学，经济情况
4846. deduct, vt. 扣除,减去
4847. double, n. 两倍adj. 两倍的，双重的vt. 使加倍vi. 加倍
4848. avert, v.转移
4849. bob, v.上下或来回的动, 剪短(头发)。n.振动, 短发, 振子锤
4850. mandate, n.(书面)命令, 训令, 要求, (前国际联盟的)委任托管权
4851. convert, vt. 转变;兑换;使改变信仰
4852. camel, n. 骆驼
4853. muse, vi.沉思，默想，冥想
4854. relevant, a. 有关的,切题的,中肯的
4855. treasure, n. 财宝，财富；珍品v. 珍爱，珍惜
4856. habit, n. 习惯，习性，脾性
4857. pool, n. 水池，游泳池；合资经营v. 合伙经营，联营
4858. secrecy, n.秘密(状态
4859. pedestal, n.基架, 底座, 基础。vt.加座, 搁在台上, 支持
4860. premium, n.保险费;额外费用
4861. intrinsic, adj.(指价值、性质)固有的, 内在的, 本质的
4862. timetable, n.时间表，时刻表
4863. ratio, n. 比率
4864. fig, n.无花果
4865. influenza, n.流行性感冒
4866. thrash, vt.痛打，鞭打vi.打
4867. whirlwind, n.旋风
4868. iodine, n.碘, 碘酒。5aIEdi:n
4869. chapel, n.小礼拜堂, 礼拜
4870. dilapidated, adj.毁坏的, 要塌似的, 荒废的
4871. spectacle, n. (pl.)眼镜；场面，景象；奇观，壮观
4872. rope, n. 绳，索
4873. infringe, v. 违反,触犯,侵害
4874. rotary, a. 旋转的
4875. relapse, n.复发, 回复原状。vi.故态复萌, 旧病复发
4876. variety, n. 种种，多种多样；种类，品种
4877. outspoken, adj.坦率直言的
4878. oatmeal, n.(燕)麦片, (燕)麦粥
4879. supervision, n.监督
4880. incredulous, adj.表示怀疑的
4881. shilling, n. 先令
4882. availability, n.有效(性)；可得性
4883. survey, vt./n. 环视,眺望,测量,勘定,检查,调查,概述
4884. adjustable, a.可调整的，可校准的
4885. inquire, v. 询问，打听；调查；查问
4886. bilateral, adj.有两面的, 双边的
4887. sportsman, n. 爱好运动的人；运动员
4888. restraint, n. 抑制，制止
4889. speculator, n.投机商
4890. practically, ad. 几乎，实际上，简直
4891. quart, n. 夸脱
4892. knee, n. 膝，膝盖
4893. frost, n. 严寒,霜;v. 结霜;使(玻璃)具有光泽的表面;在(糕饼上
4894. plumber, n. (装修水管的)管子工
4895. favorable, a. 赞许的，有利的，讨人喜欢的
4896. check, n. 支票，空白支票；总收入vt. 检查；核对；制止
4897. testimony, n. 证据，证词；表明，说明
4898. rupture, v.破裂, 裂开, 断绝(关系等), 割裂。n.破裂, 决裂, 敌
4899. switch, n. 开关；转换；鞭子v. 转变，转换；抽打
4900. synthetic, a. 人工合成的
4901. encyclopedia, n.百科全书
4902. rug, n. (小)地毯；围毯
4903. inference, n. 推论，推理，推断；结论
4904. knob, n. 圆形把手,旋钮,圆形突出物
4905. reasonably, adv.合理地，适当地
4906. sprint, v.疾跑。美国著名的通讯公司
4907. abnormal, a. 变态的,反常的
4908. globalization, n.全球化
4909. hormone, n.荷尔蒙, 激素
4910. fundamental, a. 基础的;十分重要的;n. 基本原则
4911. margin, n. (页边)空白;边缘;(时间,金钱)多余
4912. after, prep. 在…以后；在…后面adv. 以后，后来
4913. digital, a. 数字的,计数的
4914. orientation, n. 方向，方位，定位，倾向性，向东方
4915. masterpiece, n. 杰作，名著
4916. stall, n. 分隔栏;售货摊;前排座位,畜栏,厩
4917. columnist, n.专栏作家
4918. terrible, a. 很糟的；可怕的，骇人的；极度的，厉害的
4919. dew, n. 露水
4920. pluck, vt.采，摘；拉下 n.拉
4921. squirrel, n. 松鼠
4922. twelve, num. 十二pron./a. 十二(个，只
4923. hat, n. 帽子(一般指有边的帽子
4924. commerce, n. 商业，贸易；交际，交往
4925. area, n. 面积；地区，地域；领域，范围
4926. perception, n.感觉；概念；理解力
4927. greatness, n.伟大，大
4928. commodity, n. 日用品,商品
4929. idiom, n. 习语；成语方言；(艺术等的)风格，特色
4930. instable, adj.不稳定的
4931. migrate, vi. 迁移;移居
4932. fat, a. 多脂肪的，肥胖的；丰厚的n. 脂肪，肥肉
4933. intrude, vi. 闯入，侵入vt. 把(思想等)强加于人；强挤入
4934. flyover, n(阅兵时)飞机编队低空飞行,<英>[交]跨线桥
4935. rebuke, vt.指责，非难，斥责
4936. wavelength, n.波长
4937. bone, n. 骨(骼
4938. tilt, vt./vi. (使)倾斜;n. 倾斜,斜坡
4939. rational, a. 有推理能力的,合理的
4940. ecology, n. 生态学
4941. keyboard, n. 键盘vt. 用键盘输入(信息
4942. home, ad. 回家，在家n. 家；家乡a. 家庭的；家乡的
4943. adhesive, n.粘合剂
4944. harm, n./v. 伤害，损害，危害
4945. transaction, n. 办理,处理,执行;事务,事项,交易;议事录,会议简报
4946. owner, n. 物主，所有者
4947. marginal, a. 记在页边的，旁注的；(意识)边缘的
4948. brilliance, n.辉煌，光彩
4949. subordination, n.服从,附属,主从关系
4950. precedent, n. 先例
4951. centenary, n.一百年。adj.一百年的
4952. chat, v./n. 闲谈，聊天
4953. fix, v. (使)固定；修理；安装；决定；注视n. 困境
4954. eyeglass, n.眼镜
4955. rainbow, n. 虹
4956. committee, n. 委员会
4957. sleep, v. (slept，slept)睡n. 睡眠
4958. wrist, n. 腕，腕关节
4959. ultimately, ad.最终，最后
4960. respiration, n.呼吸, 呼吸作用
4961. implant, v.灌输
4962. canon, n.规范，准则
4963. regiment, n.团，军团；一大群
4964. calibrate, v.校准
4965. prudence, n.谨慎
4966. competitor, n.竞争者，敌手
4967. prism, n.棱柱(体)；棱镜
4968. cemetery, n. 公墓,墓地
4969. blaze, n. 火焰,光辉;爆发;v. 熊熊燃烧;闪耀;(感情)激发
4970. tub, n. 木盆，澡盆
4971. super, a. 极好的，超级的
4972. autonomous, adj.自治的
4973. art, n. 艺术，美术；技术，技艺；文科，人文科学
4974. Ireland, n.爱尔兰
4975. foreign, a. 外国的，(to)无关的；外来的；异质的
4976. falter, vt.支吾地说, 结巴地讲出。vi.支吾, 蹒跚踉跄, 摇摆, (声音)颤抖。n.颤抖, 支吾, 踌躇
4977. compression, n.压缩，压紧，浓缩
4978. flask, n. 细颈瓶,扁形酒瓶
4979. comfortable, a. 舒适的，舒服的；感到舒适的，安逸的
4980. increasingly, ad. 不断增加地，日益
4981. minor, a. 较小的，较小的n. 兼修学科v. (in)兼修
4982. argument, n. 争论(吵)，辩论；理由；论证
4983. minicomputer, n.微型计算机
4984. layday, n.装卸日期
4985. yet, ad. 还，尚，仍然；已经conj. 然而ad. 甚至
4986. borrow, vt. 借，借入；(思想、文字等)采用，抄袭
4987. boiling, adj.沸腾的
4988. slippery, a. 滑的，滑溜的
4989. fiery, adj.火的
4990. hysteria, n.歇斯底里，癔病
4991. manacle, n.手铐, 脚镣, 束缚。vt.给...上手铐, 束缚
4992. coherent, a. 一致的，协调的；(话语等)条理清楚的
4993. misunderstanding, n.误会，曲解
4994. guild, n.(中世纪的)行会, 同业公会, 协会, 行业协会
4995. disloyal, adj.不忠的
4996. doubt, n./v. 怀疑，疑虑
4997. ranch, n.(北美洲的)大牧场
4998. want, vt. 想要；希望；需要；缺，缺少n. 需要；短缺
4999. enzyme, n.[生化]酶
5000. superintendent, n.管理人，负责人,警长
5001. shorts, n.短裤
5002. entrenched, adj.确立的，不容易改的（风俗习惯
5003. Egypt, n.埃及
5004. clutch, v. 抓住,攫住;n. 抓,攫,控制;离合器
5005. understanding, n. 理解，理解力；谅解a. 了解的，通情达理的
5006. melancholy, n. 忧郁,悲哀;a. 忧郁的,令人伤感的
5007. little, a. 小，幼小；不多的ad./n. 不多，几乎没有
5008. cure, v. 治愈;加工处理;n. 治愈,疗法;对策
5009. chew, v./n. 嚼,咀嚼
5010. harmless, adj.无害的，无恶意的
5011. slump, n.暴跌，不景气,(个人的,球队的)低潮状态
5012. mosaic, n.镶嵌, 镶嵌图案, 镶嵌工艺。adj.嵌花式的, 拼成的。最 早出现的Internet上的WEB浏览器
5013. authentic, adj.可信的
5014. gay, a. 快乐的，愉快的，色彩鲜艳的n. 同性恋
5015. awful, a. 可怕的;糟糕的;极度的
5016. composer, n.作曲家；调停人
5017. helmet, n. 头盔，钢盔
5018. kindly, adv.仁慈地，好心地
5019. security, n. 安全(感)，防御(物)，保证(人)，(pl.)证券
5020. sir, n. 先生，长官；[S-用于姓名前
5021. imagination, n. 想象(力)；空想，幻觉；想象出来的事物
5022. insulate, vt. 使绝缘,使绝热,隔离
5023. complimentary, adj.称赞的
5024. responsive, adj.响应的, 作出响应的
5025. herself, pron.她自己；她亲自，她本人
5026. check-up, n.核对，检查
5027. driver, n. 驾驶员
5028. lateral, a. 侧面的,旁边的
5029. haggard, adj.消瘦的，憔悴的
5030. placid, adj.平静的
5031. arrange, v. 安排，筹划；整理，使有条理，排列，布置
5032. midnight, n.午夜，子夜，夜半
5033. thankful, adj.感谢的，欣慰的
5034. utilization, n.利用，效用
5035. dead, a. 死的；无生命的；死气沉沉的ad. 完全地
5036. faculty, n.才能, 本领, 能力, 全体教员, (大学的)系, 科, (授予
5037. traitor, n. 叛徒,卖国贼
5038. dreary, a. 沉闷的,阴沉的
5039. expertise, n. 专门知识,专门技能
5040. harassment, n.折磨
5041. blink, v./n. 眨眼睛,一瞥
5042. projection, n.射出，投射
5043. slip, n./v. 滑;失误
5044. shopkeeper, n. 店主
5045. utilize, vt. 利用
5046. trample, v. 踩,践踏;蔑视,粗暴对待
5047. refugee, n. 避难者,难民
5048. as, ad. 同样地conj. 由于；像…一样prep. 作为
5049. licence, n.执照, 许可证, 特许。vt.许可, 特许, 认可, 发给执照
5050. slide, n. 滑;幻灯片;v. 滑动
5051. method, n. 方法，办法
5052. lease, n. 租约;vt. 出租
5053. dump, n. 垃圾站,军需品堆集处 vt. 倒垃圾,随便抛弃,倾销
5054. frightful, a.可怕的；讨厌的
5055. creditworthiness, n.商誉
5056. compromise, n. 妥协,折衷;v. 妥协;使遭受危害
5057. contribution, n. 贡献；捐款，捐献物；投稿
5058. puppet, n. 木偶，傀儡
5059. fiber, n. 纤维；构造；纤维制品
5060. corrupt, a. 腐败的,贪污的;v. (使)腐败,贿赂
5061. jolt, v.摇晃。n.摇晃
5062. bleach, n. 漂白剂;v. 漂白
5063. barber, n. 理发员
5064. reinforce, vt. 加强;加固
5065. Indian, a.印度的 n.印度人
5066. illegal, a. 不合法的，非法的
5067. hair, n. 毛发，头发；绒毛，毛状物
5068. sprain, v. &n.扭伤
5069. attic, n.阁楼
5070. empirical, a. 经验主义的
5071. fruition, n.享用, 结果实, 成就, 实现
5072. communism, n. 共产主义
5073. fly, n. 飞行；苍蝇v飞行；飘杨a. 机敏的
5074. oath, n. 誓言,誓约;咒骂,诅咒语
5075. standing, n. 持续,期间;身分,地位,名望;a. 永存的,常务的
5076. decentralize, n.分散
5077. envelop, v.包，围绕
5078. luminous, a.发光的；光明的
5079. hereinafter, adv.以下
5080. plural, a. 复数的n. 复数
5081. premature, adj.早熟的,过早的,提前
5082. glitter, vi./n. 闪闪发光,闪光
5083. as yet, adv.至今
5084. communist, n.共产党员
5085. mutual, a. 彼此的;共同的
5086. hotel, n. 旅馆
5087. rose, n. 玫瑰，蔷薇
5088. purple, a. 紫的n. 紫色
5089. crow, n. 乌鸦v./n. 鸡啼，鸣叫
5090. pray, v. 请求，恳求；祈祷，祈求
5091. grown, adj.已长成的
5092. embroidery, n.绣花，刺绣；绣制品
5093. surgeon, n. 外科医生
5094. parody, n.模仿滑稽作品, 拙劣的模仿。vt.拙劣模仿
5095. overcharge, v. &n.多收(的)钱
5096. dedicated, adj.专注的, 献身的
5097. scotch, n.苏格兰
5098. costly, a. 昂贵的，价值高的，豪华的
5099. prestigious, adj.享有声望的, 声望很高的
5100. withhold, vt. 拒绝给某事物;抑制
5101. concentrated, adj.全神贯注的
5102. comparable, a. (with，to)可比较的，比得上的
5103. input, n./v. 输入
5104. inconsistent, adj.不一致的
5105. announcement, n.通知
5106. midday, n.正午，中午
5107. cooperate, vt. 协作,合作
5108. cause, n. 原因；事业，事件，奋斗目标v. 使产生，引起
5109. drive, v. 开(车)；驱；驱动，把(钉，桩)打入n. 驾驶
5110. compass, n. 指南针,圆规,界限
5111. villa, n.别墅；城郊小屋
5112. counterfeit, n.adj.赝品, 伪造品, 伪造的, 假冒的。vt.伪造, 假冒
5113. customary, a. 习惯的，惯例的
5114. dropout, n.中途退出者
5115. bomber, n.轰炸机
5116. revenge, vt. 报仇,报复
5117. drought, n. 干旱
5118. shrine, n.神殿，神龛，圣祠
5119. test, n./vt. 试验；检验；测验
5120. hurl, vt./n. 猛掷,猛投;大声叫骂
5121. string, n. 线,细绳;弦
5122. croissant, n. 新月形面包
5123. sculptor, n.雕塑家
5124. kind, a. 仁慈的，友好的，亲切的，和蔼的n. 种类
5125. day, n. 天，一昼夜；白昼，白天；时期，时代
5126. sneakers, n.旅游鞋
5127. pipeline, n.管道，管线
5128. territorial, adj.领土的
5129. lubricate, vt. 使润滑,使顺利
5130. quantitative, a. 量的,定量的
5131. trochanter, 解](股骨的)转子。 (昆虫腿上的)转节
5132. stroller, n.散步者
5133. sediment, n.沉淀物, 沉积
5134. winding, n.卷绕着的线a.卷曲的
5135. wherein, adv.在何处
5136. haggle, n.争论，讨价还价
5137. fond, a. (of)喜爱的，爱好的
5138. retort, v./n. 反驳,反击
5139. yoke, n. 牛轭;枷锁;纽带
5140. nominate, vt. 提名
5141. separation, n.分离，分开；分居
5142. backdate, v.回溯
5143. lodge, v. 临时住宿，寄宿，寄存，容纳n. 传达室，小旅馆
5144. network, n. 网状物；广播网，电视网；网络
5145. disillusion, n.觉醒vt.使觉醒
5146. undo, vt. 解开,拨开;败坏(名声,成果
5147. ransom, n.敲诈, 勒索。vt.赎回, 勒索赎金
5148. affluent, adj.丰富的, 富裕的
5149. echo, n./v. 反响,回声
5150. sharpen, vt.削尖，使敏锐
5151. saw, n. 锯子，锯床v. 锯，锯开
5152. enhancement, n.提高
5153. ivory, n. 象牙,象牙制品 a. 象牙色的
5154. prologue, n.序言
5155. look, vi./n. 看，注视v. 好像，显得n. 外表，脸色
5156. atom, n. 原子；微粒，微量
5157. criticism, n. 评论性的文章，评论；批评，指责，非难
5158. symbol, n. 符号，标志；象征
5159. repairmen, n.修理工
5160. manifest, a. 明白的,明显的;vt. 显示,出现
5161. affectionate, adj.充满感情的
5162. covering, adj.包括的
5163. perturb, vt. 使不安,烦扰
5164. betray, vt. 背叛,泄漏,暴露,表现
5165. navigation, n. 航海，航空；导航，领航
5166. hill, n. 小山，山岗，高地；[pl
5167. procurement, n.采购
5168. abandon, vt. 抛弃;放弃
5169. forehead, n. 前额；(任何事物的)前部
5170. innocence, n.清白，天真
5171. theory, n. 理论，原理；学说，见解，看法
5172. statistician, n.统计员, 统计学家
5173. adolescence, n. 青春,青春期
5174. lap, n. (跑道的)一圈;腰以下及大腿的前面部分;vt. (赛跑中) 比(某人)领先一圈;轻拍
5175. pressing, adj.急迫的,再三要求的,恳切要求的 n.同批的唱片,模压制
5176. thoroughly, adv.充分地，彻底地
5177. weep, v. 哭泣，流泪；滴下n. 哭泣
5178. frock, n.(女)上衣，罩衫
5179. inestimable, adj.无价的, 无法估计的
5180. stammer, vt.口吃地说n.口吃
5181. languid, adj.疲倦的, 无力的, 没精打采的
5182. workshop, n. 车间，工场，修理厂；研讨会，讲习班
5183. astray, adv.(信件)遗失、误传
5184. internationalize, v.使国际化
5185. observe, v. 观察，观测，注意到，监视，遵守，评述，说
5186. reputable, adj.声誉好的,值得尊敬的
5187. capitalism, n. 资本主义
5188. liberation, n.解放
5189. grope, v. 暗中摸索
5190. tape, n. 带(子)；录音带，磁带v. 录音；系，捆
5191. posthumous, adj.死后的, 身后的, 作者死后出版的, 遗腹的
5192. symmetric, adj.对称的，匀称的
5193. creek, n.小川，小湾
5194. suit, v. 合适，适合；相配，适应n. 一套西服；诉讼
5195. bugbear, n.怪物, 吓人的东西
5196. advise, vt. 忠告，劝告，建议；通知，告知
5197. tactics, n. 策略，战术
5198. tread, vi.&vt.踩，踏，践踏
5199. abrupt, a. 突然的;粗暴的
5200. gallery, n. 画廊,美术品陈列室,剧场顶层
5201. participate, vi. 参与;分享
5202. treason, n. 谋反，通敌，叛国
5203. fruitful, a. 多产的；果实累累的，富有成效的
5204. monotonous, a. 单调的,无变化的
5205. servant, n. 仆人
5206. creation, n. 创造,创作,创造物
5207. publisher, n.出版商
5208. consign, vt. 运送,交付
5209. exaggeration, n.夸张
5210. woods, n.树林
5211. disinfectant, n.消毒剂
5212. noise, n. 喧闹声，噪声，吵嚷声
5213. torrent, n. 激流,洪流,湍流
5214. applicable, a. 可应用(实施)的；适当的，合适的
5215. youth, n. 青年；年轻人
5216. incite, vt.激动, 煽动
5217. anxious, a. 焦虑的，担心的；急于(得到的)，渴望的
5218. postgraduate, n.研究所学生, 研究生。adj.毕业后的
5219. accompany, vt. 陪伴;伴奏
5220. sole, adj. 单独的,惟一的;独有的 n. 脚底,鞋底,袜底
5221. configuration, n.构造, 结构, 配置, 外形
5222. thoughtless, a.欠考虑的；自私的
5223. cautious, a. (of)小心的，谨慎的
5224. bow, v./n. 鞠躬，点头n. 弓(形)；蝴蝶结
5225. various, a. 各种各样的；不同的
5226. hole, n. 洞，孔
5227. waist, n. 腰，腰部
5228. convention, n. 会议,协定;惯例;习俗
5229. vault, n.拱顶；地下室，地窖
5230. presidential, adj.总统的
5231. periphery, n.外围
5232. lioness, n.母狮子
5233. instantaneous, adj.瞬间的, 即刻的, 即时的
5234. Turk, n.土耳其人
5235. voluptuous, adj.艳丽的, 奢侈逸乐的
5236. uproar, n. 骚动，喧嚣，鼎沸
5237. pyramid, n. 金字塔
5238. refine, v. 精炼,提纯;使文雅
5239. diminish, v. 减小,减少,缩小
5240. direct, a./ad. 径直的(地)v. 管理，指导；(at，to)指向
5241. incapable, a.无能力的；无资格的
5242. accumulate, v. 积累,积聚
5243. plan, n. 计划，规划；平面图，设计图v. 计划
5244. accordance, n. 一致，和谐，符合
5245. bearing, n. 举止;关系;方位
5246. monkey, n. 猴子
5247. countable, adj.可计算的
5248. physiological, adj.生理学的, 生理学上的
5249. learn, v. 学习，学，学会；(of，about)听到，获悉
5250. neighborhood, n. 邻居；四邻，街道
5251. grave, a. 严重的;严肃的,庄重的;n. 墓
5252. upside, n.上面，上部
5253. shortcut, n.近路，捷径
5254. mercurial, adj.墨丘利神的, 水星的, 雄辩机智的, 活泼善变的, 水银 的。n.水银剂, 汞剂
5255. prey, vi./n. 捕食;被捕食的动物
5256. classmate, n. 同班同学
5257. fathom, v.领会，推测
5258. outrageous, a. 残暴的,蛮横的
5259. documentation, n.提供文件
5260. softness, n.温和，柔和；软弱
5261. Scotsman, n.苏格兰人
5262. pollinate, vt.对...授粉
5263. mucous, adj.黏液的, 黏液似的
5264. nap, n. 小睡，打盹
5265. refrain, vi. 抑制
5266. smuggle, vt. 私运,走私
5267. sheer, a. 完全的,十足的;极薄的,透明的;陡峭的,垂直的
5268. steward, n. 乘务员,服务员;组织者
5269. bursar, n.(大学的)会计, (苏格兰大学)得奖学金的学生
5270. carving, n.雕塑
5271. vibrate, v. 摆动;振动
5272. instalment, n.分期付款, 就职, 装设
5273. assured, adj.感到放心的
5274. masquerade, n.化妆舞会。v.化装
5275. blind, a. 盲的，瞎的；盲目的vt. 使失明n. 百叶窗
5276. sympathize, v. (with)同情；共鸣，同感；赞成
5277. collective, n. 集体a. 集体的，共同的
5278. gust, n. 阵风;(感情的)迸发
5279. secondly, ad.第二(点)；其次
5280. clan, n.部落, 氏族, 宗族, 党派
5281. everybody, pron. (everyone)每人，人人
5282. any, a. (用于否定句、疑问句等)什么，一些；任何的
5283. help, v. 帮(援)助；有助于；[呼救
5284. mathematician, n.数字家
5285. conspicuous, a. 明显的,引人注目的
5286. directive, n.命令，指令
5287. picnic, n./vi. 野餐
5288. storage, n. 贮藏(量)，保管；库房
5289. heir, n. 继承人
5290. inflict, vt. 使遭受,强加
5291. preferable, a. (to)更可取的，更好的
5292. downwards, adv.向下，以下
5293. wedding, n. 婚礼
5294. my, pron. (I的所有格)我的
5295. surmount, vt.战胜, 超越, 克服, 在...顶上
5296. Saturday, n. 星期六
5297. decode, vt.解码, 译解
5298. signpost, n.路标，广告柱
5299. mosquito, n. 蚊子
5300. painting, n. 上油漆，着色；绘画；油画；画法
5301. purity, n. 纯净,纯洁
5302. cut, n./v. 切，割，削；削减，删节n. 切口，伤口
5303. deflate, v.收缩，紧缩
5304. death, n. 死，死亡；灭亡，毁灭，死因
5305. revolt, v./n. 反抗;厌恶
5306. unfit, a.不合适的；无能力的
5307. how, ad. 1. (表示方法、手段、状态)怎样；如何
5308. molecule, n. 分子
5309. skating, n.滑冰，溜冰
5310. disobey, v.不服从
5311. now, ad. 现在，如今，目前；当时，于是，然后
5312. succession, n. 连续,继续;一连串;继承权
5313. engraving, adj.雕刻
5314. dominate, vt. 在…中占首要地位;支配,统治;俯视 vi. 处于支配地位
5315. envisage, v.正视
5316. requirement, n. (for)需要，需要的东西，要求
5317. emancipation, n.解放
5318. dye, n. 染料v. 染，染色
5319. make-shift, adj.临时的n.权宜之计
5320. elbow, n. 肘,衣服肘部 vt. 用肘推、挤
5321. aquatic, adj.水的, 水上的, 水生的, 水栖的
5322. assurance, n. 保证，担保；确信，断言；信心，信念
5323. tank, n. 罐，槽，箱；坦克vt. 储于槽中
5324. visualize, vt.形象, 形象化, 想象。vi.显现
5325. minimal, adj.最小的, 最小限度的
5326. lay, v. 放,放置,安置,下蛋
5327. feasibility, n.可行性
5328. trench, n./v. (挖)沟，(挖)战壕
5329. array, n. 展示;一系列
5330. siege, n. 围困;围城
5331. theft, n. 偷盗
5332. peculiarity, n.特性，独特性；怪癖
5333. unfold, vt./vi. 展开,打开
5334. Japanese, a.日本的 n.日本人
5335. petty, a. 小的,次要的;心胸狭窄的
5336. piety, n.虔诚, 孝行
5337. hawk, n. 鹰,骗子,鹰派成员
5338. solicit, v.恳求
5339. flake, n./vi. 薄片;撒落
5340. tuberculosis, n.结核病，肺结核
5341. restless, a. 焦躁不安的
5342. dad, n.爸爸
5343. recite, v. 背诵,列举
5344. renovate, vt.革新, 刷新, 修复
5345. recommendation, n. 推荐,介绍,推荐信
5346. transmit, vt. 传输/导；转送；发射vi. 发射信号；发报
5347. humanity, n. 人类,仁慈,仁爱
5348. knock, v. 敲，敲打，碰撞n. 敲，击
5349. gown, n. 长袍,长外衣
5350. gross, a. 粗俗的;显著的;(草木)茂密的;(人)过胖的; 总的;毛 的;vt. 计得(毛收入
5351. vibration, n.颤动，振动；摆动
5352. energetic, a. 精力旺盛的,精力充沛的
5353. undeniable, adj.不可否认的
5354. ultraviolet, a. 紫外线的
5355. caustic, adj.腐蚀性的, 刻薄的
5356. wicked, a. 坏的;邪恶的
5357. decrepit, adj.衰老的
5358. shadow, n. 阴影，影子，荫；暗处，阴暗
5359. grid, n.格子, 栅格
5360. grind, vt. 磨,磨碎,碾碎;(down)折磨,压迫 vi. 摩擦得吱吱作响 n. 苦差事,苦活儿
5361. measure, n. 量度,分量,尺寸,量具,行动,步骤
5362. poverty, n. 贫困,贫穷
5363. acidity, n.酸度, 酸性, [医]酸过多, 胃酸过多
5364. shipbuilding, n.造船(业)，造船学
5365. void, n. 真空,空白;空虚感;空隙; a. 无效的;空的,没有的,缺乏
5366. couch, n. 长沙发 vt. 表达
5367. auditorium, n. 观众席，听众席；会堂，礼堂
5368. talented, adj.有才能的
5369. stony, a.多石的；冷酷的
5370. dressing, n.打扮，调味品
5371. deceit, n.欺骗，欺诈行为
5372. pioneer, n. 先驱，倡导者，开拓者
5373. polarity, n.极性；(思想等)归向
5374. envious, adj.嫉妒的
5375. tasteful, adj.有滋味的，好吃的,雅致的,高雅的
5376. castle, n. 城堡；(国际象棋中的)车
5377. squat, vi.&vt.(使)蹲下
5378. infinitely, ad.无限地，无边地
5379. verify, vt. 证实，查证；证明
5380. no, ad. 不是，不a. 没有的；不允许n. 不，拒绝
5381. racket, n. 吵闹声;球拍
5382. calf, n.小牛，腿肚子
5383. membrane, n.膜, 隔膜
5384. alike, a. 同样的，相像ad. 一样地；同程度地
5385. shop, n. 商店，店铺；工厂，车间v. 买东西
5386. found, vt. 建立；创立；创办；使有根据；铸造；熔制
5387. dinosaur, n.恐龙
5388. termination, n.终止，结束
5389. gland, n.[解剖]腺, [机械]密封管
5390. merely, adv. 仅仅，只不过
5391. humorous, a. 富于幽默感的，幽默的；滑稽的
5392. port, n. 港口,舱门,舱口,(船、飞机)左舷
5393. stainless, a.纯洁的；不锈的
5394. faithful, a. 守信的，忠实的，如实的，可靠的
5395. cartography, n.绘图法
5396. odour, n. 气味,臭气
5397. French, a.法国的 n.法国人
5398. leftover, n.剩余物
5399. rectify, vt. 纠正,矫正;[化
5400. aquarium, n.养鱼池, 玻璃缸, 水族馆
5401. rot, v./n. 腐烂
5402. unfair, a.不公平的，不公正的
5403. pessimist, n.悲观(主义
5404. mutter, v./n. 轻声低语;怨言
5405. lining, n.(衣服里的)衬里
5406. itinerary, n.路线
5407. gale, n. 大风;一阵喧闹
5408. blackboard, n. 黑板
5409. equality, n. 同等；平等；相等；等式；等同性
5410. managerial, adj.管理的
5411. interrogate, vt.审问, 询问。v.审问
5412. purify, v. 使纯净，提纯
5413. macaque, n.短尾猿
5414. thirsty, a. 口渴的；(for)渴望的，热望的
5415. militant, adj.好战的, 积极从事或支持使用武力的
5416. anxiety, n. 忧虑,渴望
5417. level, n. 水平，水准，等级v. 弄平，铺平a. 水平的
5418. poise, n.平衡, 均衡, 姿势, 镇静, 砝码。vt.使平衡, 使悬着, 保持...姿势。vi.平衡, 悬着, 准备好, 犹豫
5419. qualify, v. (使)具有资格，证明合格；限制，限定；修饰
5420. brew, v.酿造, 酝酿
5421. what, pron. 什么a. 多么，何等；什么；尽可能多的
5422. recipe, n. 烹饪法,食谱,配方
5423. report, n./v. 报告，汇报；传说，传阅
5424. lovely, a. 可爱的，好看的；令人愉快的，美好的
5425. tribe, n. 种族，部落；(植物，动物)族，类
5426. cooperative, a. 合作的，协作的n. 合作社
5427. puff, n. 一阵，一股(气味等)；喘息；吹嘘v. 喘息，鼓吹
5428. cart, n. 马车,手推车 vt. 用车装载
5429. aristocrat, n.贵族
5430. loudness, n.响亮
5431. moon, n. (加the)月球，月亮；卫星
5432. funeral, n. 丧葬,葬礼
5433. husky, adj.谷的, 像谷的, (声音)沙哑的, 嘶哑的
5434. insulation, n.隔离，绝缘
5435. peasantry, n.农民(总称
5436. republic, n. 共和国，共和政体
5437. sporadic, adj.零星的
5438. dreadful, a.可怕的；令人敬畏的
5439. phosphorus, n.磷
5440. entangle, vt.使缠上, 纠缠, 卷入, 连累, 使混乱
5441. heat, n. 热，热度；热烈，激烈v. (给)加热，(使)变热
5442. ape, n.猿猴
5443. replenish, v.补充
5444. talent, n. 才能，天资；人才
5445. endure, v. 忍受，持久，持续
5446. senior, a. 年长的；地位较高的n. (大学)四年级学生
5447. pathetic, a. 可怜的,悲惨的;不适当的
5448. yelp, v.狗吠, (因痛而)叫喊, 叫喊着说
5449. strength, n. 力，力量；实力；长处，优点；人力；兵力
5450. Mexican, n. &adj.墨西哥人(的
5451. dogma, n.教条
5452. mistake, n. 错误，过失，误解v. 弄错；(for)把…误认为
5453. rascal, n.流氓，恶棍，无赖
5454. affection, n. 喜爱;爱情
5455. manifestation, n.表明
5456. lever, n. 杆,杠杆;施加影响的手段;vt. 用杠杆移动
5457. visit, n. 访问，参观v. 访问，参观；视察；降临；闲谈
5458. steadfast, adj.坚定的
5459. impromptu, n.即席演出, 即兴曲。adj.即席的。adv.即席地, 未经准备
5460. trauma, n.[医] 外伤, 损伤
5461. slum, n. 陋巷,平民窟
5462. extensive, a. 广大的，广阔的
5463. press, v. 压；压榨；紧迫，催促n. 报刊，通讯社；压榨机
5464. October, n. 十月
5465. petal, n.花瓣
5466. astrology, n.占星术, 占星学(以观测天象来预卜人间事务的一种方术
5467. stipulation, n.规定
5468. politics, n. 政治，政治学；政纲，政见
5469. American, a.美洲的 n.美国人
5470. rough, a. 不平的;粗鲁的;粗略的;刺耳的
5471. realist, n.adj.现实主义者(的
5472. prosaic, adj.散文的, 散文体的, 平凡的
5473. inspiration, n. 灵感；鼓舞，激励
5474. conservation, n. 保存，保护，保守；守恒，不灭
5475. inconvenient, adj.不方便的
5476. faint, a. 微弱的;不清楚的;n./vi. 昏晕
5477. recline, v.放置
5478. respectable, a.可敬的；人格高尚的
5479. notwithstanding, prep./ad./conj. 尽管
5480. economize, v.节省
5481. useless, a.无用的，无价值的
5482. parliament, n. 国会,议会
5483. range, vt./vi. 排列
5484. die, vi. 死，死亡；(草木)枯萎，凋谢；渴望
5485. erase, vt. 擦掉,抹掉
5486. protract, v.延长
5487. worm, n. 虫，蠕虫
5488. collar, n. 衣领；环状物
5489. fret, v./n. 烦恼,侵蚀
5490. turnip, n.萝卜，芜菁
5491. withstand, vt. 顶住,挡住;经受,承受
5492. countless, adj.无数的
5493. grieve, v. (使)悲痛,(使)伤心
5494. twelfth, num.第十二
5495. laundry, n. 洗衣店,要洗的衣物
5496. supporter, n.支持者
5497. coverage, n. 承保险别;新闻报道(范围);保证金
5498. tentative, a. 试验性的;暂时的
5499. power, n. 力，精力；功率，电力；(数学)幂；权力，势力
5500. crude, a. 天然的;粗鲁的;粗制的
5501. undue, a. 过分的,过度的
5502. weird, adj.怪异的, 超自然的, 神秘的, 不可思议的, 超乎事理之 外的。n.<古><苏格兰>命运, 预言, 符咒
5503. greengrocer, n.蔬菜商
5504. request, n./vt. 要求,请求
5505. stability, n. 稳定，安定
5506. forty, num./a. 四十pron. 四十(个，只
5507. praise, v. 赞扬，歌颂；表扬n. 称赞，赞美；赞美的话
5508. crime, n. 罪行，犯罪
5509. excerpt, n.vt.摘录, 引用
5510. replace, vt. 取代，替换，代替，把…放回原处
5511. suburbia, n.郊区, 郊区居民
5512. realization, n.(理想等的)实现
5513. peanut, n. 花生
5514. bulge, n.凸出部分。v.凸出, 膨胀
5515. honorable, a. 可敬的；荣誉的，光荣的
5516. arrogant, a. 傲慢的,自负的
5517. fist, n. 拳头
5518. brighten, vt.使发光；使快活
5519. extensively, adv.广泛地
5520. nestle, v.安顿，建巢,依偎,温暖
5521. function, n. 职责,作用,正式社会集会 vi. 起作用,运行
5522. ramification, n.分枝, 分叉, 衍生物, 支流
5523. contrast, v. 使对比,形成对照;n. 明显的差别
5524. detrimental, a. 有害的,不利的
5525. inaugural, adj.开幕的
5526. snowman, n.雪人
5527. bristle, n.短而硬的毛；鬃毛
5528. trifle, n. 琐事,小事,无价值的东西;vi. (with)嘲笑,轻视
5529. bare, a. 赤裸的;光秃秃的;刚刚够的,勉强的; vt. 露出,暴露
5530. warehouse, n. 仓库
5531. larynx, n.[解] 喉
5532. bookstall, n.书报摊
5533. subjective, a. 主观(上)的，个人的
5534. discomfortable, adj.不舒服的
5535. uncle, n. 伯父，叔父，舅父，姑父，姨父
5536. snowstorm, n. 暴风雪
5537. microprocessor, n.微信息处理机
5538. thyroid, n.甲状腺, 甲状软骨
5539. borrowings, n.借款
5540. sincerity, n.真诚，诚意；真实
5541. lodging, n. 寄宿,住所,(大学生的)校外宿舍
5542. careless, a.粗心的，漫不经心的
5543. lotus, n.[植]莲属。 荷(花), 莲(花)。 睡莲。adj.贪图安乐的
5544. builder, n.建筑工人，建设者
5545. difficulty, n. 困难，困境，难题
5546. rotten, a. 腐烂的，腐朽的
5547. bacon, n. 咸肉
5548. pious, a.虔诚的；虔奉宗教的
5549. mole, n.[医]胎块, [动]鼹鼠, 防波堤, 筑有防波堤的海港
5550. glacier, n.冰河
5551. around, ad. 在…周围，到处prep. 在…四周(或附近
5552. slender, a. 细长的,苗条的,纤弱的;微小的,微薄的
5553. lovable, adj.可爱的
5554. maple, n.槭树，枫树
5555. banking, n.银行业务、金融业
5556. consciousness, n.意识，觉悟；知觉
5557. extension, n. 延长；扩大；范围；大小；尺寸；电话分机
5558. talk, n. 谈话；聊天；讲话；演讲v. 说话；交谈
5559. ventilation, n.通风
5560. legislation, n. 法律(规)；立法，法律的制定(或通过
5561. lathe, n.车床vt.用车床加工
5562. verge, n. 边缘,边界
5563. brash, adj.仓促的, 无礼的, 性急的, 傲慢的。n.胃灼热, 骤雨
5564. fairly, ad. 公正地，正当地；相当，还算
5565. hire, n./v. 雇用，租借
5566. compress, vt. 压缩;使语言精炼;n. (止血用)敷布
5567. untie, vt.解开，松开；解放
5568. discharge, v./n. 卸货;排出(液体,气体);开(炮等);释放;偿付
5569. strict, a. (with)严格的，严厉的；严谨的，精确的
5570. mobilize, vt./vi. 动员
5571. boil, v. 沸腾,(感情)激动,煮沸
5572. remorse, n.懊悔, 自责, 同情, 怜悯
5573. hurdle, n.篱笆, 栏, 障碍, 跨栏, 活动篱笆。v.用篱笆围住, 跳过 (栏栅), 克服(障碍
5574. propaganda, n. 宣传,宣传方法
5575. defy, v. (公然)违抗，反抗；蔑视
5576. playground, n. 运动场，游戏场
5577. rifle, n. 步枪
5578. slab, n.厚平板, 厚片, 混凝土路面, 板层。v.把...分成厚片
5579. fleeting, adj.飞逝的；短暂的
5580. sickness, n.疾病
5581. rigid, a. 僵硬的,不易弯的;严格的
5582. kilogram, n. 千克
5583. discard, vt. 抛弃,遗弃
5584. nephew, n. 侄子，外甥
5585. cylinder, n.圆筒, 圆柱体, 汽缸, 柱面
5586. refrigerator, n. 冰箱
5587. embody, vt. 体现,使具体化;包含,收录
5588. duke, n.公爵，君主；手
5589. bang, n./v. 猛击,猛敲,砰然作声
5590. away, ad. 在远处；离开；渐渐远去；一直；去掉
5591. nobility, n. 高贵,高尚;贵族
5592. people, n. 人们，人；[the
5593. allege, vt.宣称, 断言
5594. outdo, v.胜过
5595. constrict, v.压缩
5596. jelly, n.冻，果子冻；胶状物
5597. complement, n. 补足物,(船上的)定员;补语;vt. 补足,补充
5598. lord, n. (Lord)上帝，主；主人，长官，君主，贵族
5599. hindrance, n.障碍，妨碍
5600. lock, n. 锁v. 锁，锁上
5601. veto, n. 否决,禁止,否决权 vt. 否决,禁止
5602. carve, v. 雕刻;切(熟肉等
5603. standpoint, n. 立场，观点
5604. associate, vt. 把…联系在一起;使结合 vi. (with)交往 n. 伙伴
5605. submit, v. (使)服从;提交
5606. mystic, adj.神秘的
5607. candle, n. 蜡烛
5608. riotous, adj.骚乱的，喧扰的,狂暴的
5609. opera, n. 歌剧
5610. row, n. (一)排，(一)行；吵嚷v. 划(船等)，荡桨
5611. annually, ad.年年，每年
5612. concentrate, v. 集中,全神贯注于,浓缩 n. 浓缩物
5613. restorative, adj.有助于复元的。n.滋补剂
5614. commonplace, a. 普通的,平凡的
5615. delusion, n.错觉
5616. yell, vi. 大叫；呼喊vt. 叫着说n. 叫声；喊声
5617. place, n. 地方；名次；地位；寓所v. 安排；放置；投(资
5618. outlying, adj.无关的, 题外的, 边远的, 偏僻的
5619. river, n. 河流
5620. south, n. 南，南方，南部a. 南方的，南部的
5621. reporter, n. 报告人，通讯员；记者，报导者
5622. homogenous, adj.同质的，同类的
5623. nasty, adj.令人讨厌的;困难的;严重的,恶劣的;下流的
5624. light, a. 明亮的,轻的,不重要的 n. 光,光线,光源
5625. ensue, vi.跟着发生, 继起。vt.(基督教《圣经》用语)追求
5626. pricing, n.定价
5627. need, aux. v./v. 需要；必须n. 需要；贫困，困窘
5628. feast, n./v. 筵席,宴请,使享受
5629. surveyor, n.调查人，检验人
5630. dragon, n. 龙
5631. owing, a. 欠的，未付的
5632. annihilate, vt.消灭, 歼灭
5633. obsession, n.迷住, 困扰
5634. flavor, n. 情味；风味；滋味v. 给…调味
5635. vaccine, adj.疫苗的, 牛痘的。n.疫苗
5636. rocket, n. 火箭
5637. emigration, n.向国外移民
5638. malaria, n.疟疾
5639. frank, a. 坦白的，直率的
5640. playwright, n.剧作家
5641. thriller, n.惊险小说，电影
5642. heaven, n. 天，天空，天堂；(Heaven)上帝，神
5643. fame, n. 名声,名誉
5644. shallow, a. 浅的,肤浅的
5645. speculate, v. 推测,推断;投机,做投机买卖
5646. hypocrisy, n. 伪善，虚伪
5647. September, n. 九月
5648. female, n./a. 女性(的),[语
5649. Danish, adj. &n.丹麦人(的
5650. assure, vt. 断言;使确信;保(人寿)险
5651. doze, v./n. 瞌睡；假寐
5652. ms, n.(缩)女士
5653. fictional, adj.虚构的
5654. perceive, vt. 察觉,发觉;理解
5655. rumor, n. 传闻，谣言
5656. parallel, a. 平行的,相当的 n. 类似的人或事,比较 vt. 与…相似
5657. calculate, v. 计算，推算；计划，打算
5658. reply, v./n. (to)回答，答复，以…作答
5659. mission, n. 代表团;使命
5660. abolition, n.废除，取消
5661. reminiscence, n.回想，回忆，怀念
5662. pitfall, n.缺陷
5663. election, n.选举，选择权；当选
5664. glossary, n. 词汇表,术语汇编
5665. outstrip, v.超过
5666. bleed, v. 流血,悲痛,同情
5667. empire, n. 帝国
5668. quaint, adj.离奇有趣的, 奇怪的, 做得很精巧的
5669. fascinating, adj.迷人的, 醉人的, 着魔的
5670. salable, adj.有销路的，适销的
5671. stuffy, a.不透气的，闷热的
5672. economic, a. 经济学的,经济的,便宜的
5673. chord, n.弦, 和音, 情绪。n.[解]腱
5674. prolong, vt. 延长;拖延
5675. expel, vt. 开除;驱逐;排出
5676. Moslem, n.&a.穆斯林(的
5677. golden, a. 金黄色的；贵重的，极好的
5678. mustard, n.芥子，芥末
5679. blush, vi./n. 脸红,羞愧
5680. drain, n. 排水管,排水沟;消耗;v. 排水,耗尽
5681. express, v. 表达，表示a. 特快的，快速的n. 快车，快运
5682. perfume, n. 香水,香味
5683. village, n. 村，村庄
5684. persevere, vi. 锲而不舍
5685. closedown, n.倒闭
5686. qualitative, a. 质的,定性的
5687. graph, n. 图表，曲线图
5688. scenario, n.想定。游戏的关,或是某一特定情节
5689. pretense, n.借口
5690. allow, vt. 允许，准许；承认；给予；(for)考虑到
5691. navy, n. 海军
5692. embarrass, vt. 使为难,使尴尬
5693. explicitly, adv.清晰地
5694. crisis, n. 转折点
5695. barbecue, n.吃烤烧肉的野餐
5696. careful, a. 小心的，仔细的；细致的，精心的
5697. silence, n. 寂静，沉默v. 使沉默，使安静
5698. suburb, n. 市郊，郊区
5699. convene, v.召集, 集合
5700. stalk, n. 茎，梗vt. 悄悄地跟踪vi. 高视阔步地走
5701. premises, n.建筑物,房屋,契约,营业场所
5702. destructive, a. 破坏的,破坏性的
5703. dividend, n.被除数, 股息, 红利, 额外津贴, 奖金, 年息
5704. gulf, n. 海湾
5705. sharp, a. 锋利的；轮廓分明的；急转的ad. (指时刻)正
5706. exclamation, n.呼喊，惊叫；感叹
5707. successive, a. 接连的，连续的
5708. folk, n. 人们；民族；亲属a. 民间的
5709. opportune, adj.及时的，凑巧的
5710. chief, n. 领袖;部门主任;a. 主要的,首席的
5711. brisk, a. 轻快的;兴隆的;寒冷而清新的
5712. capability, n.能力，才能；性能
5713. doctor, n. 医生；博士vt. 授以博士学位；诊断；修改
5714. pier, n. 码头,桥墩
5715. imprisonment, n.监禁，徒刑
5716. inasmuch, ad.因为，由于
5717. central, a. 中心的，中央的，中枢的；主要的
5718. related, adj.与有关的
5719. unpleasant, a.令人不快的，讨厌的
5720. explain, v. 解释，说明
5721. hemisphere, n. 半球,(地球的)半球
5722. football, n. 足球
5723. pygmy, n.俾格米人(属一种矮小人种,身长不足5英尺), 矮人, 侏 儒, 小妖精。adj.微小的, 矮人的
5724. discomfort, n.不安，不舒服
5725. biography, n. 传记,传记文学
5726. bloody, a. 流血的，血腥的
5727. biscuit, n. 饼干，点心
5728. bore, v. 钻孔;厌烦;n. 孔;口径;惹人厌烦的人
5729. tremendous, a. 极大的,巨大的;非常的,极好的
5730. keep, v. 保持，保存，遵守，经营，看守，拘留，维持
5731. solemn, a. 严肃的;庄严的,隆重的
5732. safeguard, vt.维护, 保护, 捍卫。n.安全装置, 安全措施
5733. fake, n. 假货,骗子;vt. 伪造
5734. nozzle, n.管口, 喷嘴
5735. unlock, vt.开…的锁；开启
5736. Arabic, adj.阿拉伯的
5737. enterprise, n. 艰巨的事业,事业心;企业
5738. finish, n. 完成；结束；磨光v. 完成；结束；用完；毁掉
5739. northwest, n. 西北方，西北部a. 西北的ad. 向西北，在西北
5740. cherish, vt. 爱护,抱有(希望);怀有(情感
5741. gossip, n. 流言蜚语;爱传流言的人;vi. 闲聊,传播流言蜚语
5742. policy, n. 政策;保险单
5743. biodegradable, adj.生物所能分解的
5744. eloquence, n.雄辩；口才，修辞
5745. rare, a. 稀有的，难得的，珍奇的；稀薄的，稀疏的
5746. link, v. 连接，联系n. 环节，链环
5747. breadwinner, n.养家活口的人, 负担家计的人
5748. champagne, n.香槟酒, 香槟色
5749. ritual, n.典礼, (宗教)仪式, 礼节。adj.典礼的, (宗教)仪式的
5750. variegated, adj.杂色的, 斑驳的, 多样化的。v.成为杂色
5751. update, v.使现代化, 修正, 校正, 更新。n.现代化, 更新
5752. rack, n. 行李架
5753. benevolence, n.慈悲，捐助
5754. insufficient, a.不足的；不适当的
5755. herb, n. 草木植物,药草
5756. Scotland, n.苏格兰
5757. cavity, n. 洞
5758. pale, a. 苍白的，灰白的；浅的，暗淡的
5759. skim, vt. 浏览,略读,掠过,抹去
5760. suffice, vi. 足够, 有能力vt. (食物等)使(某人)满足
5761. oh, int.嗬，哦，唉呀
5762. normalize, v.使正常，使标准化
5763. reimburse, vt. 偿还,付还
5764. phenomenal, adj.显著的, 现象的, 能知觉的
5765. derelict, adj.被抛弃了的。n.遗弃物
5766. acquisition, n. 取得，学到，养成(习惯)；获得的东西
5767. annuity, n.年金, 养老金, 年金享受权
5768. arrangement, n.整理，排列；安排
5769. litre, n.公升
5770. considerably, adv.相当
5771. integrate, vt. 使一体化,取消种族隔离
5772. radioactive, a. 放射性，放射引起的
5773. nickname, n. 绰号，浑名vt. 给…起绰号
5774. nightmare, n. 恶梦；可怕的事物，无法摆脱的恐惧
5775. implore, vt.乞求，恳求，哀求
5776. temper, n. 脾气；韧度vt. 调和，使缓和；使回火
5777. fearless, a.无畏的，大胆的
5778. fume, n.(浓烈或难闻的)烟, 气体, 一阵愤怒(或不安)。v.用烟 熏, 冒烟, 发怒
5779. brittle, a. 易碎的,脆弱的
5780. choral, adj.合唱队的
5781. omen, n. 预兆,征兆
5782. avoid, vt. 避免,逃避
5783. assign, vt. 分配;确定时间或地点;指派
5784. fearful, a. 可怕的，吓人的；害怕，担心，惊恐
5785. FBI, 国际刑警
5786. hatred, n. 憎恨，憎恶，怨恨
5787. gymnast, n.体操运动员
5788. winner, n.获胜者，优胜者
5789. effectively, adv.有效地
5790. supplementary, adj.补充的,额外的
5791. jealousy, n.妒忌，嫉妒，猜忌
5792. designate, vt. 把…定名为,指派,标出
5793. burnt, adj.烧焦的，烧坏的
5794. better-off, adj.经济情况较好的
5795. defer, vt. 推迟,延期;听从
5796. adversary, adj.敌手，对手
5797. independence, n. 独立，自主
5798. porcelain, n. 瓷器
5799. especial, adj.特别的，专门的
5800. A.D, 缩)公元
5801. exporter, n.出口商
5802. perform, v. 履行，执行；表演，演出；完成(事业
5803. panda, n. 熊猫
5804. cancellation, n.删除，取消
5805. accusation, n.控告
5806. ripe, a. 熟的，成熟的；(for)时机成熟的
5807. projector, n. 放映机，幻灯机，投影仪
5808. extra, a./ad./n. 额外的(地),非常,另外,额外的人
5809. react, v. 反应，起作用；(against)反对，起反作用
5810. sun, n. 太阳；恒星
5811. courageous, a.勇敢的，无畏的
5812. sovereign, a. 主权的;有最高统治权的
5813. eccentricity, n.怪僻
5814. family, n. 家，家庭成员；氏族，家庭；族，科
5815. endorse, vt. 背书,签署(姓名);赞同
5816. tenor, n.(支票)限期,男高音歌唱家,进程,大意
5817. crossing, n.交叉，十字路口
5818. pet, n. 爱畜，宠儿a. 宠爱的，表示亲昵的
5819. cap, n. 便帽，军帽；盖，罩，套v. 覆盖于…顶端
5820. tourism, n. 旅游事业
5821. agreement, n. 同意;协议
5822. heal, v. 治愈;和解
5823. stocking, n. 长(统)袜
5824. version, n. 版本；译本，译文；说法
5825. tenth, num.第十；十分之一
5826. nationality, n. 国籍，民族
5827. unify, vt.统一, 使成一体
5828. haul, v./n. 用力拉,拖;捕获量;拖运的距离
5829. silicon, n. 硅
5830. chestnut, n.栗子；栗树；栗色
5831. throne, n. 御座，宝座；王位，王权
5832. housekeeper, n.看门人，保姆
5833. infrequent, adj.不经常的
5834. altitude, n. (海拔)高度
5835. grass, n. 草，草地
5836. fair, a. 公平的，合理的；相当的n. 集市，交易会
5837. geology, n. 地质学,地质
5838. businesslike, adj.事务式的
5839. exempt, vt./a. 免除,被豁免的
5840. ignorance, n. 无知,愚昧
5841. terrorism, n.恐怖主义
5842. galaxy, n.星系, 银河, 一群显赫的人, 一系列光彩夺目的东西
5843. hero, n. 英雄，勇士；男主角，男主人公
5844. potentiality, n.潜在性
5845. multiply, vt./vi. [数
5846. expert, n. 专家，能手a. 熟练的，有经验的；专门的
5847. culminate, v.达到顶点
5848. word, n. 词，词语；言语，话；谈话；消息，信息
5849. tent, n. 帐篷
5850. random, n./a. 随便,无目的的,任意的
5851. violence, n. 猛烈，强烈；暴力，暴行；强暴
5852. this, pron. 这(个)a. 这(个)；今ad. 这(样
5853. delta, n.三角州, 德耳塔(希腊字母的第四个字
5854. flag, n. 旗
5855. conductor, n. 管理者；(汽车)售票员；领队，指挥；导体
5856. reconsider, v.重新考虑, 重新审议
5857. immature, adj.不成熟的
5858. bounce, v./n. (球等)反跳,弹起,乱冲
5859. terminology, n.术语学，术语
5860. longitude, n. 经度
5861. foible, n.弱点, (性格上的)缺点, 自负的地方, 怪癖, 癖好, (刀 剑)自中部至尖端的部分
5862. breach, n. 缺口;违背
5863. fitting, a. 适合的,恰当的;n. 试衣;建筑物中的装置
5864. photo, n.照片
5865. front, a. 前面的，前部的n. 正面；前线，战线v. 面对
5866. bridegroom, n.新郎
5867. warning, n.警告，告诫，鉴诫
5868. coincidence, n. 巧合；同时发生，共同存在；符合，一致
5869. practicable, a. 可实行的,能用的,可行的
5870. analytic, adj.分析的, 解析的
5871. abortion, n.流产
5872. rather, ad. 相当，有一点儿；宁愿，宁可
5873. Canadian, a.加拿大的
5874. accomplish, vt. 完成,实现
5875. aching, adj.疼痛的
5876. indulge, v. 放纵,沉迷于
5877. Arabian, a.阿拉伯的
5878. abstraction, n.抽象，提取
5879. extreme, adj. 极度的,极端的;尽头的,末端的 n. 极端,过分
5880. dissimilar, adj.不同的
5881. occupational, adj.职业的, 占领的
5882. within, prep. 在…里面，在…以内ad. 在内
5883. hobby, n. 业余爱好
5884. pillow, n. 枕头
5885. depiction, n.描述
5886. stylist, n.时装设计师
5887. gist, n.要点, 要旨, 依据, [法律]诉讼主因
5888. crook, n.钩子
5889. unknown, a.不知道的；未知的
5890. ignition, n.点火, 点燃
5891. erroneous, adj.错误的, 不正确的
5892. ski, n. 雪橇v. 滑雪
5893. throw, vt. 扔；使突然陷入；使困惑n. 投掷(距离
5894. comprehend, vt. 理解，领会；包含，包括
5895. joyful, a.十分喜悦的，快乐的
5896. liquor, n. 酒,酒类
5897. broadcasting, n.广播节目
5898. supreme, a. 最高的,最大的;极度的
5899. nervous, a. 神经的；神经过敏的，紧张不安的
5900. surge, n. 急剧上升;洋溢,奔放;汹涌,奔腾;vi. 浪涛般汹涌 奔腾; 猛冲;(浪涛等)汹涌,奔腾;(人群等)蜂拥而出
5901. concoct, vt.调制, 调合, 编造
5902. impurity, n.不纯；杂质；不道德
5903. hubbub, n.吵闹声, 呐喊声, 叫嚷声
5904. handicap, n. 给予优者的不利条件以使竞赛机会相等,障碍,残废;vt
5905. dismal, adj.阴郁的，沉闷的
5906. brass, n. 黄铜，铜器
5907. bulb, n. 鳞茎,球茎,球状物
5908. entreat, vt.&vi.恳求
5909. apology, n. 道歉，认错，辩解，辩护
5910. off-grade, adj.等外的，质差的
5911. Mediterranean, n.地中海 a.地中海的
5912. invasion, n. 入侵，侵略，侵犯
5913. respiratory, adj.呼吸的
5914. optimize, v.最佳化
5915. deteriorate, v. 恶化,败坏
5916. appendix, n. 附录,阑尾
5917. mind, n. 精神，理智，意见，记忆力v. 注意，介意，反对
5918. firmly, adv.坚定地，坚固地
5919. weekly, a. 每星期的，一周的ad. 每周一次n. 周刊，周报
5920. oriental, a./n. 东方的,东方人
5921. assortment, n.花色品种
5922. l/c, n.(缩)信用证
5923. porous, adj.多孔渗水的
5924. associated, adj.联合的
5925. shady, a. 成荫的，多荫的；可疑的，靠不住的
5926. admittedly, adv.明白地
5927. leopard, n.豹
5928. bourgeois, a.资产阶级的；平庸的
5929. excellence, n.优秀，卓越
5930. charm, n./v. 吸引力,可爱之处,迷人,施魔法
5931. distinguished, adj.尊贵的，尊敬的
5932. universe, n. 宇宙，万物
5933. divert, vt. 使转向,使改道(或绕道);转移,转移…的注意力;使娱
5934. pair, n. 一对，一双；一副；夫妇v. 配对，成对
5935. willow, n.柳树，柳木
5936. instinctive, adj.本能的，天性的
5937. cook, n. 厨师v. 烹调，烧煮；纂改(账目)，捏造
5938. pronoun, n. 代词
5939. conceited, adj.自负的
5940. gymnasium, n. 体育馆
5941. entice, v.诱惑, 诱使
5942. peep, v. 偷看，窥视
5943. productivity, n. 生产率
5944. piece, n. (一)件/片/篇；碎片v. (together)拼合，拼凑
5945. Greece, n.希腊
5946. fuck, 浑蛋，辱
5947. notably, adj.尤其，值得注意地,明显地
5948. dare, v.敢，挑战，竟敢
5949. scorching, adj.灼热的
5950. retroactive, adj.可追溯的,反动的
5951. lock-up, n.锁，固定资本
5952. concert, n. 音乐会，演奏会；一齐，一致
5953. inferiority, n.劣势
5954. plenty, n. 丰富，大量
5955. arbitration, n.仲裁
5956. papers, n.文件，证书
5957. mandatory, adj.命令的, 强制的, 托管的
5958. ecstasy, n.狂喜
5959. seasonal, adj.季节性的
5960. asymmetry, n.不对称
5961. digit, n.数字
5962. consent, vi./n. 同意,允许
5963. allegation, n.主张，断言, 辩解
5964. pulley, n.滑轮，滑车，皮带轮
5965. cubic, a.立方形的；立方的
5966. prick, n./v. 刺伤，刺痛，刺孔
5967. harness, n. 挽具,降落伞背带;vt. 上挽具;治理(河流等);利用
5968. mediocre, adj.普普通通的。7mi:di5EukE
5969. wrapper, n.包装纸,封皮，包装用品
5970. listen, vi. 倾听(与介词to并用，方可置宾语
5971. principal, a. 主要的;n. 校长
5972. malignant, adj.恶性的
5973. slave, n. 奴隶，苦工v. 做苦工，拼命地干
5974. cheek, n. 面颊，脸
5975. resolve, v. 决心；(使)分解，溶解；决议n. 解决；决心
5976. demurrage, n.滞期费
5977. chilly, adj.凉的，冷淡的
5978. emperor, n. 皇帝
5979. wallet, n. 皮夹，钱包
5980. donkey, n. 驴子；蠢人；顽固的人
5981. insoluble, adj.不能溶解的, 不能解决的
5982. sight, n. 视力；望见，瞥见；视域；眼界；情景，奇观
5983. overwrought, adj.过度紧张的, 过劳的
5984. keeping, n.一致，协调
5985. scholarship, n. 学问;奖学金
5986. insistent, a.坚持的；逼人注意的
5987. finally, ad. 最后，最终；决定性地
5988. brandy, n. 白兰地酒
5989. victory, n. 胜利
5990. relate, v. 叙述，讲述；使互相关联
5991. vocational, adj.职业的
5992. revelation, n.显示, 揭露, 被揭露的事, 新发现, 启示, 揭示
5993. aggressor, n.侵略者
5994. molten, v.熔化。adj.熔铸的
5995. electronics, n.电子学
5996. ratify, v.批准，认可，追认
5997. waver, vi.摇摆；犹豫不决
5998. research, v. (into，on)研究，调查n.研究，调查
5999. enrolment, n. 登记,入学
6000. lawyer, n. 律师
6001. indefinitely, adv.不明确地
6002. barter, v./n. 货物交换,易货贸易
6003. homesick, n.思乡的
6004. Paris, n.巴黎
6005. serious, a. 严肃的；主要的；严重的，危急的；认真的
6006. specification, n. 载明,详述;规格,清单,说明书
6007. wrestle, vi. 摔跤,角斗;斗争,努力
6008. deserve, v. 应得,应受
6009. eclipse, n./vt. [天
6010. inspire, vt. 激励,鼓励;灌注以创造力
6011. typhoon, n. 台风,强热带风暴
6012. subjunctive, adj.虚拟的
6013. eve, n. (节日等的)前夜，前夕
6014. container, n. 容器；集装箱
6015. nibble, n.半位元组, 细咬, 轻咬, 啃。v.一点一点地咬, 细咬, 吹
6016. immediately, ad.立即；直接地
6017. automate, vt.使自动化
6018. slope, n. 斜线,斜度;倾斜面,斜坡
6019. troupe, n.剧团
6020. curse, n. 咒骂,祸因,骂人话;v. 咒骂
6021. arrow, n. 箭，矢，箭状物；箭头符号
6022. lonely, a. 孤独的，寂寞的；荒凉的，人迹稀少的
6023. comic, a. 滑稽的,喜剧的;n. 连环漫画杂志;喜剧演员
6024. faulty, a. 有错误的，有缺点的，不完善的
6025. cone, n.锥体，锥形
6026. progressive, a. 进步的，先进的；前进的
6027. whereabouts, n.下落,去向 adv.在什么地方,靠近什么地方
6028. seven, num. 七，七个(人或物
6029. crutch, n.拐杖
6030. pursuance, n.追求，实行
6031. posterity, n.子孙，后代
6032. score, n./v. 刻痕,记分,乐谱
6033. miller, n.磨坊主
6034. fancy, a. 颜色鲜艳的;奇特的;n./v. 想象力,设想,爱好,认为
6035. conceal, vt. 隐藏,隐蔽
6036. float, n. 浮子,浮标;(游行中的)彩车; v. 漂浮,筹资开办,使(币
6037. mermaid, n.美人鱼
6038. resign, vi. 辞职; vt. 放弃,辞去;(to)使顺从
6039. bill, n. 账单,招贴,议案,钞票,证明书 vt. 用招贴宣传
6040. edge, n. 边，棱；刀口，刃v. 侧身移动，挤进
6041. irrigation, n. 灌溉
6042. exponent, n.解释者, 说明者, 代表者, 典型, 指数
6043. mouthful, n.满口，一口，少量
6044. peaceful, a. 和平的，平静的，安宁的，爱好和平的
6045. half, n. 半，一半a. 一半的，不完全的ad. 一半地
6046. sanity, n.心智健全
6047. convey, vt. 运送;转达,传达
6048. ultimo, adj.上月的
6049. gleam, n./vi. 微光,闪光,短暂而微弱的闪现
6050. dramatist, n.戏剧家
6051. weld, v./n. 焊接
6052. disarm, vt.解除武装, 回复平常的编制, 缓和, 消除(敌意,疑虑
6053. masculine, a. 男性的;男子气概的
6054. medication, n.药物治疗, 药物处理, 药物
6055. custody, n.保管，监护
6056. role, n. 角色,任务
6057. matinee, n.日场演出
6058. overhaul, v.检查
6059. pathological, adj.病理的, 病态的
6060. perch, n.(禽鸟的)栖木
6061. layoff, n.临时解雇, 操作停止, 活动停止期间, 失业期
6062. gathering, n.集会，聚会，聚集
6063. athlete, n. 体育家,运动员
6064. incorporate, v. 结合,合并,组成公司
6065. effluent, adj.发出的, 流出的。n.流出物, 排水道, 污水, 排水渠
6066. abasement, n.身份低微；屈尊；降低
6067. robber, n.强盗，盗贼
6068. fulfil, vt. 完成,履行
6069. veterinary, n.兽医。adj.医牲畜的, 兽医的
6070. composite, a. 合成的,复合的
6071. mix, v. 使混合；混淆
6072. locate, v. 查出，探出，查找…地点，使…坐落于，位于
6073. tolerance, n. 容忍,宽恕;忍耐力
6074. capsule, n.(植物)蒴果, 胶囊, 瓶帽, 太空舱
6075. thermostat, n.自动调温器, 温度调节装置
6076. treat, v. 对待；治疗；论述；款待，请客n. 款待，请客
6077. curtail, vt. 截短,削减
6078. corpse, n.尸体
6079. selective, adj.选择的, 选择性的
6080. cultivation, n.耕作，培养
6081. neighbor, n. 邻居
6082. fidget, vi.坐立不安, 烦躁, 慌张, (不安地或心不在焉地)弄, 玩 弄 。vt.使烦乱, 使不安。n.坐立不安, 烦躁, 不安定
6083. conception, n. 概念，观念
6084. attend, vt. 出席，参加；照顾，护理vi. 注意；侍奉
6085. length, n. 长，长度；一段，一节，程度，范围
6086. cataract, n.大瀑布, 奔流, 白内障
6087. jungle, n. 丛林,密林
6088. fracture, n./v. 断裂,骨折
6089. eight, num. 八pron. 八(个，只
6090. circulation, n.循环；(货币等)流通
6091. earnest, a. 认真的,坚决的
6092. teens, n.十多岁,青少年们
6093. marital, adj.婚姻的
6094. emptiness, n.空虚，空白
6095. disc, n. 圆盘,圆面,磁盘,椎间盘
6096. impatient, a. 不耐烦的，急躁的
6097. sweater, n. 厚运动衫,毛线衫
6098. fractionally, adv 极少地；微小地
6099. density, n. 密集，密度，浓度
6100. raid, n./vt. (突然)袭击;(警察等)突入查抄,突入搜捕;劫掠,劫
6101. insipid, adj.没有味道的, 平淡的
6102. crisp, a. 脆的,易碎的;霜冻的;干脆的;n. 油炸马铃薯片;v. (使
6103. format, n. 格式,版式,形式,方式
6104. harbour, n.(=harbor) 海港
6105. wheel, n. 轮，车轮
6106. attributive, adj.定语的，属性的
6107. Buddhist, n.佛教徒
6108. tabulate, vt.把…制成表
6109. broad, a. 宽的，广阔的；广大的；宽宏的，豁达的
6110. fertilizer, n. 肥料
6111. pungent, adj.(指气味、味道)刺激性的, 辛辣的, 尖锐的, 苦痛的
6112. failure, n. 失败，不及格；失败者；故障，失灵；未能
6113. pollution, n. 污染
6114. cosmic, a. 宇宙的
6115. body, n. 身体，本体；主体；尸体；物体；(一)群，批，堆
6116. arbitrate, v.仲裁
6117. substitute, n. 代替人,代用品;vt. 代替
6118. telex, n. 用户电报,直通专用电传
6119. space, n. 间隔；空地，余地；空间v. 留间隔，隔开
6120. gloss, n.光泽的表面, 光彩, 欺人的表面, 假象, 注释。vt.使有 光彩, 掩饰, 上光于, 注释, 曲解。vi.发光, 作注释
6121. prone, a. 俯伏的;有…倾向
6122. e.g, 缩)例如
6123. shuffle, v.拖脚走,洗澡
6124. millennium, n.太平盛世, 一千年
6125. speaker, n. 说话者，发言者；说某种语言者；扬声器
6126. middle, n./a. 中间(的)，当中(的
6127. pest, n. 害虫
6128. newspaper, n. 报纸
6129. healthy, a. 健康的，健壮的；有益健康的，卫生的
6130. playmate, n.游伴
6131. inept, adj.不适当的, 无能的, 不称职的
6132. aspiration, n.热望, 渴望
6133. rhythm, n. 韵律,格律,有规律的反复(循环),周期性
6134. dock, n. 船坞,码头;刑事被告席;v. 引入船坞,削减薪金、供应等
6135. obstacle, n. 障碍
6136. optic, adj.眼的, 视觉的, 光学上的
6137. appropriate, a. 合适的;v. 挪用;拨款
6138. ellipsis, n.省略
6139. whiting, n.白粉, 白垩
6140. hay, n. 干草
6141. tiny, a. 极小的，微小的
6142. colossal, adj.巨大的, 庞大的
6143. multilateral, adj.多边的, 多国的
6144. justifiable, adj.有理由的
6145. announce, v. 正式宣布；发表；通告；广播(电台节目
6146. misgiving, n. 疑虑,怀疑
6147. upward, a. 向上的，上升的ad. 向上
6148. goodwill, n.商誉
6149. creditworthy, adj.有信誉的
6150. deck, n. 甲板,公共汽车一层的车厢,纸牌 vt. 装饰,打扮
6151. ale, n.淡啤酒
6152. migrant, adj.迁移的，候鸟的
6153. smother, v.窒息
6154. unrest, n.不安的状态, 动荡的局面
6155. brochure, n. 有插图的小册子
6156. paddock, n.(马厩或宅房的)小牧场, 围场
6157. fend, vt.保护, 谋生, 供养, 挡开。vi.<英>努力, 力争, 供养
6158. shelf, n. 架子，搁板
6159. recognize, v. 认出，承认，公认，赏识，表扬
6160. regardless, a. 不注意的,不顾的
6161. diverge, vi.分岔；分歧
6162. besides, ad. 此外；并且prep. 于…之外；除…以外
6163. horrify, v.使恐惧
6164. retail, n./v. 零售,零卖
6165. intelligible, adj.可理解的
6166. nil, n.零
6167. contract, n. 合同,契约;v. 缔结;负(债); 感染(疾病);使皱缩
6168. toothbrush, n.牙刷
6169. bleak, adj.寒冷的, 阴冷的, 荒凉的, 凄凉的, 黯淡的
6170. sheet, n. 被单,薄板
6171. alcohol, n. 酒精，乙醇；含酒精的饮料
6172. thesaurus, n.辞典
6173. Jew, n.犹太人
6174. finished, adj.制成的
6175. hardly, ad. 几乎不，简直不；仅仅
6176. honesty, n.诚实，正直
6177. vengeance, n. 报仇
6178. dog, n. 狗，雄兽vt. 尾随，跟踪
6179. omit, vt. 疏忽,忘记;遗漏,省略
6180. dismiss, vt. 解雇;解散;不考虑;消除
6181. upcreep, n.(价格)上涨
6182. needy, adj.贫穷的
6183. illustration, n. 说明；例证，插图；举例说明
6184. ranking, n.队
6185. flirt, vt.忽然弹出, 挥动。vi.调情, 摇晃的移动, 玩弄, 摇晃地 摆动, 摆动, 轻率地对待。n.卖弄风情的人, 调情的人
6186. prose, n. 散文a. 散文的
6187. vigorous, a. 强有力的,精力充沛的
6188. since, prep. 自从conj. 自从；因为，既然ad. 后来
6189. bugle, n.军号，喇叭
6190. sardine, n.沙丁鱼
6191. turbine, n. 汽轮机，涡轮机
6192. distinction, n. 区别，差别；级别；特性；声望；显赫
6193. paradise, n. 天国,乐园
6194. antagonism, n. 反对,不喜欢
6195. criticize, v. 批评，评论
6196. impossible, a. 不可能的；难以忍受的，很难对付的
6197. crooked, a. 弯曲的;欺诈的
6198. fridge, n.电冰箱
6199. arthritis, n.关节炎
6200. constrain, vt.强迫, 抑制, 拘束
6201. recently, ad.最近，新近
6202. scope, n. (活动)范围；机会，余地
6203. liqueur, n.利口酒
6204. interaction, n.相互作用；干扰
6205. acquaint, vt. 使熟悉;使认识,介绍
6206. toneless, adj.缺乏声调的, 单调的, 沉闷的, 无声的, 哑的
6207. sociologist, n.社会学家
6208. relationship, n. 关系，联系
6209. circulate, v. (使)循环,(使)流通;(使)流传,散布,传播
6210. terse, adj.简洁的, 扼要的
6211. topple, v.倾倒
6212. revoke, v.废除，取消，撤回
6213. statute, n. 法令,法规
6214. devise, vt. 设计,想出
6215. scroll, n.卷轴, 卷形物, 名册。v.(使)成卷形
6216. jot, v.匆匆记下
6217. bald, n. 秃头的,单调的
6218. vent, n.通风孔, 出烟孔, 出口, (感情等的)发泄。v.放出, 排
6219. farmer, n. 农民，农场主
6220. dynamite, n.炸药, <俚> 能产生不凡效果的人或物。vt.炸毁, 使失败
6221. congratulate, v. (on)祝贺，向…致贺词
6222. six, num. 六pron./a. 六(个，只
6223. catch, v. 捕捉，捕获；赶上；感染；理解，听到
6224. bonus, n. 奖金,额外津贴
6225. insolvent, a. 无偿债能力的
6226. rouse, vt./vi. 唤醒,唤起;激励;激起
6227. hurricane, n.飓风, 狂风
6228. virgin, n. 处女a. 处女的；纯洁的；原始的；未使用的
6229. compatible, a. 可和谐共存的;兼容的
6230. baseball, n. 棒球
6231. forum, n. 论坛
6232. pictorial, n.画报
6233. coolness, n.凉爽，冷淡
6234. lid, n. 盖
6235. unobtainable, adj.无法得到的
6236. anguish, n.痛苦, 苦恼。vt.使极苦闷, 使极痛苦。vi.感到痛苦
6237. indicator, n.指示器, [化]指示剂
6238. stigma, n.污名, (植物)柱头, [动物] 气门, 耻辱
6239. muddy, a.多泥的，泥泞的
6240. programer, n.项目，程序制定者
6241. patch, n. 补钉,眼罩;斑点;小块土地;vt. 补缀;修补,平息
6242. dissolve, v. 使液化,融化;使解散
6243. dim, a. 暗的,看不清楚的,迟钝的;v. 变模糊,变暗淡
6244. cocktail, n.鸡尾酒
6245. referendum, n.公民投票, (外交使节)请示书
6246. exonerate, v.昭雪，解除
6247. afternoon, n. 下午，午后
6248. consultation, n.咨询
6249. madam, n. 夫人，太太，女士
6250. hysteric, adj.亢奋的
6251. sixteen, num.十六，十六个
6252. ceremony, n. 典礼,仪式,礼节
6253. succumb, vi.屈服, 屈从, 死
6254. snail, n.蜗牛；行动缓慢的人
6255. disclaim, v.放弃，不承认
6256. centrifugal, adj.离心的
6257. debtor, n.债务人
6258. moan, n. 呻吟声，悲叹声v. 呻吟，抱怨，悲叹
6259. valve, n. 阀,活门
6260. countermeasure, n.对策
6261. amber, n.琥珀。adj.琥珀制的, 琥珀色(黄色)的
6262. parcel, n. 包裹，邮包，部分v. 打包，捆扎，分配
6263. impetuous, adj.冲动的, 猛烈的, 激烈的
6264. temple, n. 庙宇，神殿，寺；太阳穴
6265. miraculous, adj.奇迹(般)的
6266. retrial, n.复审
6267. oblique, adj.倾斜的, 间接的, 不坦率的, 无诚意的
6268. economical, a. 节约的，经济的
6269. bullion, n.金块，金条
6270. receiver, n.收受者，收件人
6271. cabin, n. 船舱,机舱,小木屋
6272. ring, n. 戒指；环；铃声；(打)电话v. 按(铃)，敲(钟
6273. mess, n. 凌乱状态,脏乱状态;混乱的局面,困境; v. 弄糟,弄脏
6274. scandal, n. 冒犯或引起反感的行动,流言,诽谤
6275. name, n. 名字(称/声/义)vt. 给…取名；列举；提名
6276. naval, a. 海军的,军舰的
6277. romantic, a. 浪漫的，传奇式的；不切实际的，好幻想的
6278. coupon, n.息票, 商家的优待券
6279. watt, n. 瓦，瓦特
6280. valued, adj.宝贵的
6281. dynasty, n. 王朝，朝代
6282. mourn, v.哀悼;(对…)感到痛心(或遗憾
6283. recede, vi. 后退;向后倾斜
6284. aggregate, n. 共计,合计
6285. relaxation, n.放松，松弛
6286. database, n.[计] 数据库, 资料库
6287. fifty, num. 五十，五十个
6288. guideline, n.方针
6289. popularity, n.通俗性；普及，流行
6290. relieve, v. 减轻，解除，援救，救济，换班
6291. inversely, ad.相反地
6292. headline, n. 大字标题，新闻标题
6293. baker, n.面包师
6294. history, n. 历史，历史学；来历，经历
6295. dignify, vt.使尊荣, 增威严, 使高贵, 故做显贵
6296. malicious, adj.恶意的
6297. merchant, n. 商人，零售商
6298. eastern, a. 东方的，东部的
6299. freedom, n. 自由，自主，免除，特权
6300. roller, n.滚柱，滚筒，滚轴
6301. fiction, n. 虚构，编造；小说
6302. living-room, n. 起居室
6303. exalted, adj.高贵的，得意的
6304. cunning, n./a. 狡猾(的);精巧(的
6305. practice, n. 练习，实践，实际，业务，惯例，习惯
6306. aggression, n.侵略
6307. immerse, vt. 沉浸,沉浸于;使陷入
6308. lint, n.（旧时作）绷带用软麻布
6309. blacksmith, n.铁匠，锻工
6310. dazzle, vt. 眩目,耀眼;使迷惑
6311. namely, ad. 即,也就是
6312. seep, v.渗出, 渗漏
6313. amid, amidst) prep. 在…当中
6314. aggravation, n.加重，恶化
6315. ambulance, n. 救护车
6316. disinclined, adj.不愿意的
6317. Chinese, a.中国的 n.中国人
6318. meadow, n. 草地
6319. page, n. 页，记录，事件，专栏vt. 给…标页码
6320. pilot, n./vt. 飞行员,试验
6321. superfluous, adj.多余的, 过剩的, 过量的
6322. vowel, n. 元音，元音字母
6323. innovation, n. 改革,革新
6324. kilowatt, n.千瓦(特
6325. diagnosis, n.诊断
6326. rental, adj.租借的，租金的
6327. crevice, n.(墙壁, 岩石等的)裂缝
6328. import, v. 进口，输入n. 进口，输入；(pl.)进口商品；要旨，含
6329. cloak, n. 斗蓬，披风；掩饰，幌子vt. 掩盖，掩饰
6330. grasp, v./n. 抓住，抓紧；掌握，领会
6331. transformer, n.变压器，转换器
6332. vigor, n.活动，精力，元气
6333. overnight, a. 通宵的，晚上的ad. 在昨夜，一夜工夫，突然
6334. tricky, adj.巧妙的，狡猾的
6335. durable, a. 耐用的;n. 耐用品
6336. politic, adj.策略性的
6337. motive, n. 动机，目的a. 发动的，运动的
6338. lunar, a. 月的,似月的
6339. plate, n. 金属板，片；盘子，盆子；板，钢板v. 镀，电镀
6340. adviser, n.顾问
6341. tram, n. 有轨电车
6342. punctuation, n.标点法,标点符号
6343. warranted, adj.担保的
6344. packet, n. 小包裹，小捆；盒；一捆，一扎；邮船，班轮
6345. dispel, v.驱散
6346. conform, v. 符合,遵从
6347. expedite, v.加快，急送
6348. repay, v. 偿还，报答
6349. myriad, n. 极大数量; a. 无数的
6350. sake, n. 缘故;目的
6351. booth, n. 有篷的售货摊,隔开的小间
6352. quandary, n.困惑, 窘境, 进退两难
6353. hearing, n. 听力,听力所及距离,被听到机会;(法律)审讯
6354. confess, v. 供认，承认，坦白，忏悔
6355. moonlighting, n.业余干活
6356. soap, n. 肥皂
6357. overdue, adj.迟到的
6358. enroute, adv.在途中
6359. exile, n./vt. 流放,离乡背井
6360. doggedly, adv.顽固地
6361. phobia, n.恐怖病, 恐怖症
6362. resonant, adj.引起共鸣的
6363. brazil, n.巴西
6364. stripe, n. 长条，条纹；军服上表示军阶的臂章条纹
6365. ratification, n.批准，认可
6366. missile, n. 导弹;飞射物
6367. punishment, n.罚，惩罚，处罚
6368. proximity, n.接近, 亲近
6369. locust, n.蝗虫；洋槐，刺槐
6370. queue, n. 行列，长队v. (up)排队，排队等待
6371. surroundings, n. 周围的事物，环境
6372. accomplishment, n.成就
6373. gardening, n.园艺
6374. pulse, n. 脉搏，脉冲
6375. toxic, adj.有毒的, 中毒的
6376. anecdote, n. 轶事,趣闻
6377. advisable, a. 可取的，适当的，明智的
6378. conscious, a. 清醒的;察觉到;故意的
6379. edit, vt. 编辑,剪辑
6380. plight, n. 困境,苦境
6381. varnish, n.清漆
6382. grocery, n.食品杂货店
6383. immaterial, adj.无形的，不重要的
6384. specialize, v. 专门研究
6385. kettle, n. 水壶
6386. ownership, n. 所有权
6387. ammunition, n. 弹药
6388. emotional, a.感情的，情绪的
6389. regular, a. 有规律的；整齐的，匀称的，正规的，正式的
6390. alliance, n. 联盟,同盟
6391. inextricable, adj.无法解脱的, 逃脱不掉的, 解不开的
6392. leap, v. 扑向,欣然接受;n. 跳,跃
6393. migration, n.迁移，移居海外
6394. situated, adj.位于,被置于境遇,处于...的立场
6395. hit, v. 打，击；碰撞n. 击中；成功而风行一时的事物
6396. pageant, n.盛会, 庆典, 游行, 虚饰, 露天表演
6397. duck, n. 鸭，鸭肉v. 迅速俯身；快速低头；躲避
6398. lemonade, n.柠檬汽水
6399. spill, vt./vi. (使)溢出,(使)溅出
6400. behindhand, adj.落后，事后
6401. needle, n. 针，指针，针状物
6402. solitude, n.寂寞，独居
6403. record, n. 记录；最高记录；履历；唱片v. 记录；录音
6404. fibre, n.纤维, 构造, 纤维制品, [植]须根
6405. reshuffle, n.改组。v.改组
6406. stereotype, n.[印]铅版, 陈腔滥调, 老套。vt.使用铅版, 套用老套
6407. distil, v.蒸馏, 提取....的精华
6408. gesture, n./vi. 姿势,手势,表示
6409. laudable, adj.值得赞美的, 值得称赞的
6410. proletarian, adj. &n.无产阶级
6411. can, aux./v. 能；可以n. 罐头；容器vt. 把…装罐
6412. probation, n.试用, 见习, 鉴定, 查验, 证明, 察看, 缓刑
6413. strike, n./vi. 罢工vt. 打，击；攻击；给…深刻印象
6414. gene, n.[遗传]因子, [遗传]基因
6415. depart, vi. 离开,启程
6416. turmoil, n.骚动, 混乱
6417. intentional, a.故意的，有意识的
6418. architecture, n. 建筑，建筑学；建筑式样或风格，建筑物
6419. evolution, n. 演变,进展,进化
6420. therefore, ad. 因此，所以conj. 因此
6421. colonnade, n.柱廊
6422. confide, v.委托，吐露秘密
6423. sandwich, n. 三明治，夹肉面包v. 夹入，挤进
6424. quotation, n.引用；引文；报价单
6425. society, n. 社会；社团，协会，社；社交界，上流社会
6426. hotdog, n.热狗(面包
6427. strenuous, adj.奋发的, 使劲的, 紧张的, 热烈的, 艰辛发奋的
6428. hatch, v. 孵出;策划
6429. feed, v. (on，with)喂养，饲养；(with)向…供给
6430. flu, n. 流感
6431. swear, vt./vi. 郑重地说;强调;发誓
6432. vividly, adv.生动地
6433. imaginative, adj.想象的, 虚构的
6434. preferential, adj.优惠的
6435. camping, n.野营
6436. thumbtack, n.按钉，图钉
6437. transverse, a.横切的n.横轴
6438. fitness, n.适当，恰当；健康
6439. patronage, n.赞助,资助,恩赐的态度,互惠互利
6440. roast, v./a. 烤(的),烘(的
6441. vessel, n. 容器,船
6442. nausea, n. 恶心,晕船;vt. 使恶心
6443. landed, adj.卸货的
6444. inclination, n. 倾向,意愿
6445. hearth, n.壁炉地面；炉边
6446. steamer, n. 蒸笼,汽锅,汽船,轮船
6447. upset, v. 使…心烦意乱；打翻，推翻a. 难过的；不安的
6448. augment, v.增加, 增大。n.增加
6449. straightforward, a. 正直的,坦率的,老实的, 简明易懂的
6450. confusion, n. 困惑，糊涂；混淆；混乱，骚乱
6451. horticulture, n.园艺
6452. operative, adj.有效的
6453. guidance, n. 引导，指导
6454. periscope, n.潜望镜, 展望镜
6455. conflict, n. 战斗,斗争;(意见)分歧;vi. 抵触,冲突
6456. sweet, a. 甜的；可爱的，美好的n. (常pl. )糖果；甜食
6457. deflect, v. 偏斜
6458. sociology, n. 社会学
6459. horse, n. 马；跳马，鞍马v. 骑马
6460. paw, n. 爪
6461. price, n. 价格，价钱；代价v. 标价
6462. matriculate, v.被录取入学。n.被录取者
6463. strengthen, v. 加强,巩固
6464. repel, vt. 击退,逐回,驱逐;排斥;使厌恶
6465. therein, ad.在那里，在那时
6466. skip, n./v. 跳,遗漏
6467. April, n. 四月
6468. few, a.有些，几个；[表否定
6469. magnet, n. 磁体，磁铁
6470. message, n. 消息，信息，通讯，启示，教训，广告词，预言
6471. instructor, n.指导者，教员
6472. fertile, a. 肥沃的;创造力丰富的;能结果实的
6473. messy, adj.肮脏的, 凌乱的, 杂乱
6474. neglect, vt. 忽视,忽略;疏忽,玩忽;n. (U)疏忽,玩忽
6475. humane, adj.人慈的
6476. tranquil, a.平静的；稳定的
6477. nuisance, n. 麻烦事,讨厌的人
6478. automobile, n. 汽车
6479. fowl, n.家禽；禽肉
6480. secular, adj.长期的
6481. seriously, ad.严肃地，认真地
6482. consumer, n.消费者，用户
6483. animation, n.生气，生机
6484. devotion, n.献身，热诚，专心
6485. notification, n.通知(书)，布告
6486. lounge, vi. 懒洋洋地倚、躺;闲逛;n. 懒洋洋的姿势;休息室
6487. wiggle, v.(使)踌躇, 摆动。n.踌躇, 摆动
6488. hungry, a. 饥饿的，渴望的
6489. granite, a.花岗岩，花岗石
6490. suck, n./v. 吸;舔
6491. tea, n. 茶(叶)；午后茶点
6492. conclusion, n. 结论，推论；结尾；缔结，议定
6493. prohibitive, adj.禁止的
6494. Wednesday, n. 星期三
6495. circular, a. 圆(形)的，环形的；循环的n. 传单，通报
6496. shed, n. 棚;车库vt. 脱落;发出
6497. morbid, adj.病的, 由病引起的, 病态的, 恐怖的
6498. misty, adj.雾蒙蒙的，有雾的
6499. corrosion, n.腐蚀，侵蚀；锈
6500. continual, a. 不断的，连续的，频繁的
6501. displace, vt. 转移,取代
6502. effort, n. 努力；成就；艰难的尝试
6503. spike, n.穗, 长钉, 钉鞋, 女高跟鞋, 道钉。v.用大钉钉, 用长而 尖之物刺, 阻止, 穿刺
6504. abortive, adj.无效果的，失败的
6505. ardent, a. 热情的,热心的
6506. rice, n. 稻，米
6507. herd, n. 兽群,牲口群,牧人;v. 把…赶到一起,成群
6508. metre, n.米，公尺
6509. month, n. 月，月份
6510. glorious, a. 辉煌的,壮丽的,光荣的
6511. sensitivity, n.敏感(性)；灵敏性
6512. player, n.游戏的人；比赛者
6513. dull, a. 阴暗的,迟钝的,沉闷的,钝的 v. 变钝
6514. somewhere, ad. 某地，在某处；在附近，前后，大约
6515. mercantile, a. 贸易的,商业的
6516. moderately, ad.适度地，适中
6517. solve, v. 解决，解答
6518. bandit, n.土匪，盗匪，歹徒
6519. part-time, adj.计时(干活)的
6520. repeatedly, ad. 重复地，再三地
6521. symbolize, v.象征
6522. entrepreneur, n.<法>企业家, 主办人
6523. suggest, v. 建议，提出；使联想，使想起…；暗示
6524. pilgrim, n. 香客,朝圣者
6525. ministry, n. (政府的)部；牧师
6526. B.C, 缩)公元前
6527. vehicle, n. 车辆交通工具,思想媒介
6528. automation, n. 自动，自动化，自动操作
6529. trot, vi.&n.(马)小跑，慢跑
6530. hazardous, adj.危险的, 冒险的, 碰运气的
6531. stretch, vt./vi. 伸长,扩大,拉长;滥用,曲解;n. 伸展;一段持续时
6532. along, ad. 向前；和…一起，一同prep. 沿着，顺着
6533. buckle, n.带扣。v.扣住, 变弯曲
6534. lightning, n. 闪电a. 闪电般的，快速的
6535. therefrom, adv.由此
6536. fee, n. 费,报名费,会费
6537. granule, n.小粒, 颗粒, 细粒
6538. ambiguity, n. 模棱两可;多义词句
6539. fill, v. (with)填满，充满
6540. earl, n.伯爵
6541. shopping, n.买东西，购物
6542. middling, n.中等的，第二流的
6543. doom, n. 毁灭,死亡;vt. 注定,判定
6544. perpetuate, vt.使永存, 使不朽
6545. peck, vt.&vi.啄，啄起
6546. hairy, adj.毛发的，多毛的
6547. personnel, n. 职员,人员,人事
6548. dominant, a. 支配的，统治的，占优势的
6549. carpenter, n. 木工,木匠
6550. brand, n./v. 商标;烙印;污辱
6551. workman, n.工人，劳动者，工匠
6552. abandonment, n.放弃
6553. sure, a. 肯定的；一定会…的；有信心的，有把握的
6554. lecturer, n.演讲者，讲师
6555. occurrence, n. 发生，出现；事件，事故，发生的事情
6556. devalue, v.贬值
6557. crease, n.折缝, 折痕。v.折, 弄皱
6558. indispensable, a. 必需的,必不可少的
6559. disappearance, n.消失，消散；失踪
6560. peninsular, n.半岛
6561. eyeball, n.眼球
6562. pain, n. 痛，痛苦；(pl.)努力，劳苦vt. 使痛苦
6563. successfully, ad.成功地
6564. anger, n. 愤怒，气愤vt. 使发怒，激怒vi. 发怒
6565. troop, n. (pl.)部队，军队；(一)群/队v. 群集，集合
6566. ponderous, adj.沉重的, 笨重的, 冗长的, 沉闷的, (指问题等)呆板的
6567. outturn, n.卸货情况
6568. overt, adj.明显的, 公然的
6569. twentieth, num.第二十
6570. ankle, n. 足踝，踝关节
6571. notice, n. 通知，通告，布告；注意，认识v. 注意到，注意
6572. capture, v./n. 捕获，俘虏；夺得，攻占
6573. mundane, adj.世界的, 世俗的, 平凡的
6574. bustle, v.匆匆忙忙
6575. congruent, adj.适合的
6576. repeal, vt.撤销；放弃n.撤销
6577. proprietorship, n.所有权
6578. majestic, adj.宏伟的, 庄严的
6579. wrap, vt./vi. 包裹
6580. realism, n.现实主义，写实主义
6581. surround, vt. 包围，环绕n. 环绕物
6582. messenger, n. 送信者，使者，传令兵
6583. hostess, n. 女主人，女主持人
6584. tulip, n.郁金香
6585. momentous, a. 重要的,重大的
6586. recruit, v./n. 招募,吸收
6587. sink, n. 洗涤槽
6588. sewing-machine, n.缝纫机
6589. occasion, n. (发生特殊事件)的时刻;机会,理由;需要;vt. 引起,导致
6590. aware, a. 知道的,意识的
6591. rarely, ad. 难得,非常地
6592. skillful, a. (in，at)灵巧的，娴熟的
6593. frail, a. 虚弱的,脆弱的
6594. European, a.欧洲的 n.欧洲人
6595. skew, adj.歪斜的
6596. heartily, adv.精神饱满的
6597. delicacy, n.精致
6598. payroll, n.薪水册
6599. translator, n.译音
6600. tract, n.广阔的地面, 土地, 地方, 地域, (解剖)管道, 小册子
6601. payment, n. 支付，付款额
6602. plug, n./v. 塞子,栓,插头,通电
6603. extinguisher, n.熄灭者, 灭火器
6604. shipyard, n.船坞
6605. foremost, a./ad. 最重要的(地),第一流的(地
6606. escort, n. 护卫者;护航舰;vt. 护送,护卫
6607. efficiency, n. 效率；功效
6608. windy, a.多风的，刮风的
6609. hammer, n. 铁锤，槌，榔头v. 锤击，敲打
6610. admission, n. 准许进(加)入;入场费,入场券;承认,供认
6611. conduction, n.传导，传热
6612. delcredere, n.保付
6613. drop, n. 滴；落下；微量v. 落下；下降；失落
6614. uranium, n.铀
6615. aboard, ad./prep. 在船(飞机、车)上ad. 上船(飞机
6616. malady, n.病
6617. dweller, n.居住者，住客
6618. glare, n./v. 眩目地照射,闪耀;瞪视
6619. quilt, n. 被子
6620. disappointment, n.失望
6621. coordinate, vt. 使协调;调整
6622. mob, n. 乌合之众(尤指暴力者)vi. 围攻，聚众闹事
6623. harass, v.烦恼
6624. crack, n. 裂缝;破裂声;(砰的)一击;v. 使破裂;噼啪作响; 声音变 哑;解开(难题、密码
6625. cycle, n. 自行车；周期，循环v. 骑自行车；循环
6626. archaic, adj.古老的, 古代的, 陈旧的
6627. highway, n. 公路，大路
6628. muscle, n. 肌肉，体力
6629. son-in-law, n.女婿
6630. pursue, v. 追赶，追踪；继续，从事
6631. commence, v. 开始
6632. three, num. 三pron./a. 三(个，只
6633. contention, n.争夺, 争论, 争辩, 论点
6634. persecution, n.迫害
6635. desolation, n.荒凉，凄凉
6636. indignation, n. 愤怒，愤慨
6637. collide, vi. 碰撞,互撞;冲突,抵触
6638. erasure, n.抹去
6639. myself, pron.我自己；我亲自
6640. easy, a. 容易的，不费力的，安逸的，宽裕的
6641. annual, a. 每年的,一年生的 n. 年刊,一年生植物
6642. dash, n./v. 撞击,冲,短跑;破折号;闯劲
6643. charter, n./v. 宪章;特许状;租赁;vt. 特许,发执照
6644. onus, n.责任, 负担
6645. homogeneous, adj.同类的, 相似的, 均一的, 均匀的
6646. settle, v. 安定，安顿；停息；定居；解决，调停
6647. diesel, n.柴油发动机，内燃机
6648. roar, n./v. 吼叫,怒吼,轰鸣
6649. transitive, adj.及物的。n.及物动词
6650. elusive, adj.躲闪的
6651. supplement, n. 补遗；增刊；附录v. 增刊，补充
6652. repatriate, v.遣返
6653. hesitate, v. 犹豫，踌躇；含糊，支吾
6654. British, a.不列颠的，英联邦的
6655. disdain, vt./n. 蔑视,轻视
6656. exploit, n. 英雄行为,辉煌功绩; vt. 开拓,开采;剥削;用以自肥
6657. native, a. 本地的，本国的；天生的n. 本地人，本国人
6658. natural, a. 正常的；自然界的，天然的，天赋的，固有的
6659. endures, n.最终用户
6660. spell, v. 拼写
6661. transportation, n.运输，运送，客运
6662. ultrasonic, a.超声的n.超声波
6663. task, n. 任务，作业，工作
6664. shameful, a.可耻的；不道德的
6665. talkative, adj.罗嗦的
6666. mute, a. 哑的，缄默的n. 哑巴；弱音器v. 减弱…的声音
6667. loaf, n. 一块面包,块,团 v. 消磨时间
6668. implementation, n.实行，执行
6669. virus, n. 病毒
6670. objection, n. (to)反对，异议，不喜欢，反对的理由
6671. noisy, a. 吵闹的，喧闹的
6672. ethereal, adj.轻的, 天上的, 象空气的
6673. agent, n. 代理人；代理商；产生作用的人或事物
6674. litter, n. 杂乱物;一胎生下的小动物;v. 使杂乱,乱丢东西
6675. mobile, a. 可动的，活动的，运动的
6676. robe, n. 长袍，上衣
6677. disappear, v. 不见，消失
6678. rear, n. 后部,后面;vt./vi. 培植,饲养
6679. detect, vt. 发现,发觉;侦察
6680. symphony, n. 交响乐，交响曲
6681. context, n. 背景,环境;上下文
6682. fall, v. 跌倒；下降；减弱；坠落；变成，陷于n. 秋季
6683. consolidation, n.团结
6684. maritime, adj.海上的, 海事的, 海运的, 海员的
6685. memento, n.纪念品
6686. dignity, n. 高贵,尊贵,高位
6687. nonsense, n. 胡说，废话
6688. foliage, n.叶子(总称
6689. appeal, vi./n. 呼吁;上诉;吸引(力
6690. breed, v. 繁殖,生育;教养;引起;n. 品种,类型
6691. calendar, n. 历书,日历,历法
6692. increase, v. 增加，增长，增进n. 增加，增长，增进
6693. bracket, n. (方)括号
6694. dose, n. (药)一剂,一服;vt. 给…服药
6695. lofty, a. 高耸的;崇高的;高傲的
6696. unique, a. 惟一的,独一无二的
6697. sustain, vt. 支撑;支持,维持
6698. penicillin, n.青霉素，盘尼西林
6699. bolt, n. 插销;螺栓;闪电;快跑;逃走; v. (马)等脱缰逃跑;囫囵
6700. setback, n.顿挫, 挫折, 退步, 逆流, (疾病的)复发
6701. starve, v. 挨饿
6702. prosecute, vt. 起诉,告发;实行,从事
6703. fester, n.脓疮。vi.溃烂, 化脓。vt.使烦恼, 使溃烂
6704. Jewish, a.犹太人的
6705. quality, n. 质量，品质，特性
6706. cordially, adv.亲切地
6707. pottery, n.陶器, 陶器场
6708. adolescent, n. 青少年a. 青春期的，青少年的
6709. grace, n. 优美，文雅；恩惠，恩泽；宽限，缓刑；感恩祷告
6710. tug, vt./vi. 用力拉,猛拉,拖拉
6711. motel, n. 汽车旅馆
6712. knife, n. 刀，餐刀v. 用刀切，用匕首刺
6713. courier, n.送快信的人, 旅行从仆
6714. we, pron．我们<主格
6715. silly, a. 傻的，糊涂的，愚蠢的
6716. pose, vt. 造成,引起(困难等);提出(问题等),陈述(论点等) ;vi. 摆姿势;假装,冒充,装腔作势;n. 样子,姿势
6717. stronghold, n.堡垒，要塞
6718. mumble, v.咕哝，嘟囔
6719. compound, n./a. 混合物(的),复合词(的) v. 使混合,使复杂
6720. sentimental, adj.多愁善感的
6721. delicious, a. 美味的,可口的
6722. kitchen, n. 厨房
6723. lip, n. 嘴唇
6724. remain, v. 剩下，余留；留待，尚须；仍然是，依旧是
6725. boutique, n.专卖流行衣服的小商店
6726. reading, n. 读书，读物，(仪表等的)读数，阅读
6727. spur, n./v. 刺激;鞭策
6728. widespread, a. 分布广泛的，普遍的
6729. shortcoming, n. 短处，缺点
6730. absent-minded, adj.心不在焉的
6731. preliminary, a. 初步的,开端的
6732. insertion, n.插入
6733. fire, n. 火；火灾，失火；炉火vi. 开火vt. 放(枪
6734. jack, n.起重器；传动装置
6735. table, n. 桌子；餐桌；工作台；表格vt. 搁置；提交讨论
6736. colony, n. 殖民地；侨民；聚居区；(动植物的)群体
6737. constable, adv.警官
6738. countersign, v.副署，会签
6739. space shuttle, n.航天飞机
6740. possession, n. 所有,拥有,财产
6741. microeconomics, n.微观经济学
6742. sleepy, a.想睡的；寂静的
6743. thirst, vi./n. 渴;渴望
6744. beset, v.困扰
6745. hysterical, a歇斯底里的, 异常兴奋的
6746. bookstore, n.书店
6747. himself, pron.他自己；他本人
6748. likely, a. 很可能的，有希望的ad. 大概，多半
6749. overestimate, vt.过高估计
6750. duration, n. 持久；期间；持续时间
6751. engross, vt.用大字体书写, 吸引, 占用, 使全神贯注, 独占
6752. assorted, a. 各式各样的
6753. regret, v./n. 遗憾，懊悔，抱歉
6754. savings, n.存款，储蓄额
6755. sketch, n. 草图,素描;短剧;简述;v. 草拟
6756. versus, prep. (诉讼或比赛中)对
6757. transcend, vt.超越, 胜过
6758. remit, v.汇款，汇出
6759. recollection, n.回忆
6760. justice, n. 公正，公平；审判，司法
6761. electricity, n. 电，电流；电学
6762. eagle, n. 鹰
6763. use, n. 使/应用；用法/途；益/用处vt. 用；消耗
6764. slice, n. 片;部分;v. 切片
6765. sultry, adj.闷热的,性感的
6766. fourth, num.第四，四分之一
6767. retrieve, v.重新得到。n.找回
6768. instantly, ad.立即，即刻
6769. filing, n.档案管理
6770. exposition, n.说明，解释；陈列
6771. classical, a. 经典的，古典(文学)的
6772. uncomfortable, a.不舒服的；不自在的
6773. mock, vt. 嘲笑;模仿;vi. 嘲笑,嘲弄; a. 仿制的,假装的;模拟
6774. harbor, n. 海港；避难所v. 隐匿，窝藏
6775. employee, n. 雇工，雇员
6776. conclude, v. 结束，终止；断定，下结论；缔结，议定
6777. immune, adj.免疫的
6778. dirty, a. 弄脏的；下流的v. 弄脏，玷污
6779. perplexity, n.困惑混乱
6780. centimeter, n. 厘米
6781. harsh, a. 粗糙的;严厉的
6782. undersigned, adj.在下面签名的
6783. diploma, n. 毕业证书,文凭
6784. dramatic, a.引人注目的,突然的;戏剧性的,激动人心的;戏剧的,剧本
6785. sales, n.销售adj.出售的
6786. disbursement, n.支付
6787. remote, a. 远的，遥远的，疏远的，偏僻的，细微的
6788. intermittent, adj.间歇的, 断断续续的
6789. graveyard, n.墓地
6790. continuously, adv.连续不断地
6791. from, prep. 从，自从；由于；离；根据，按；去除
6792. execute, vt. 实行,贯彻,实施;处死;演奏
6793. wall, n. 墙，壁，围墙vt. 筑墙围住，用墙隔开
6794. indignant, a. 愤慨的,义愤的
6795. oncoming, adj.即将来临的, 接近的。n.来临
6796. grunt, vi.作呼噜声；咕哝
6797. frontier, n. 国界;尖端;新领域
6798. dilemma, n.进退两难的局面, 困难的选择
6799. asset, n.资产, 有用的东西
6800. propriety, n.适当
6801. owl, n. 猫头鹰
6802. nightingale, n.夜莺
6803. tyrant, n.暴君；专制君主
6804. beforehand, ad. 预先,事先
6805. latitude, n. 纬度;地区;(言论,行动的)自由
6806. fashionable, a. 流行的，时髦的
6807. gimmick, n.暗机关。vt.使暗机关
6808. lieutenant, n.陆军中尉；副职官员
6809. ax, n. 斧子；削减vt. 用斧砍
6810. something, pron. 某事，某物；被视为有意义的事物
6811. referent, n.指示物
6812. uncommon, adj.罕见的，不常见的
6813. banish, vt.流放, 驱逐, 消除
6814. nose, n. 鼻子；(飞机，船等的)前端，突出部分
6815. agony, n. 极度痛苦
6816. neutron, n.中子
6817. edition, n. 版本,版次
6818. pharaoh, n.法老王（古埃及君主称号）, 暴君
6819. acrobatics, n.杂技
6820. seem, v. 好像，似乎
6821. piracy, n.海盗行为, 侵犯版权, 非法翻印。盗版
6822. aristocratic, adj.贵族的
6823. derrick, n.钻塔，井架
6824. disposition, n. 排列，部署；性格倾向；倾向，意向
6825. underwrite, vt.签在...下, 给...保险, 签名, 承诺支付。vi.经营保险
6826. meditation, n. 熟虑；(尤指宗教的)默想，沉思；(pl.)冥想录
6827. census, n.人口普查
6828. arrest, n. 逮捕，扣留vt. 逮捕，扣留；阻止；吸引
6829. eke, vt.补充, 增加
6830. kin, n.家属(集合称), 亲戚, 同族, 血缘关系, 家族。adj.有亲 属关系的, 性质类似的, 同类的
6831. disparity, n.不同，悬殊
6832. list, n. 表，目录，名单v. 把…编列成表，列入表内
6833. handy, a. 手边的，近便的；方便的
6834. conversion, n. 转变，转换；信仰的改变
6835. response, n. 回答，响应，反应
6836. tenant, n. 承租人；房客；佃户vt. 租借，承租
6837. mire, n.泥潭。v.陷入
6838. Scottish, adj.苏格兰的
6839. experienced, adj.有经验的
6840. lifetime, n. 一生，终生
6841. westerner, n.西方人，欧美人
6842. cope, v. (with)竞争，对抗；(with)对付，妥善处理
6843. illusion, n. 幻象,错觉
6844. charming, a.迷人的，可爱的
6845. attendant, n. 服务员;仆人
6846. gratifying, adj.可喜的
6847. political, a. 政治的
6848. saturation, n.饱和(状态)；浸透
6849. hunt, v./n. 打猎，猎取；(for)搜索；寻找
6850. Thursday, n. 星期四
6851. communal, adj.公共的, 公社的
6852. mainstream, n.主流
6853. enable, v. 使能够，使成为可能；授予权利或方法
6854. spark, n. 火花，火星v. 发火花，发电花
6855. overture, n.建议
6856. burglary, n.盗窃
6857. tuck, n. 缝褶 v. 打褶裥
6858. born, a. 出生的，产生的；天生的，十足的
6859. intake, n.(水管、煤气管等的)入口, 进口, 通风口, (在一定期间
6860. reverent, adj.尊敬的, 虔诚的
6861. hall, n. 礼堂，会堂，办公大楼，门厅
6862. engine, n. 发动机，引擎；火车头
6863. tube, n. 管，软管；电子管，显像管；地铁
6864. cousin, n.堂(或表)兄弟姐妹
6865. till, prep. 直到，直到…为止，与until意思相同
6866. thereon, adv.关于那
6867. censorship, n.审查
6868. sicken, vt.使患病, 使嫌恶, 使恶心或昏晕。vi.得病, 变厌腻
6869. indigestion, n.消化不良
6870. attachment, n.连接物，附件；爱慕
6871. artillery, n.炮的总称, 炮兵的总称
6872. continuity, n.连续性, 连贯性
6873. syllable, n.音节
6874. aesthetic, adj.美学的, 审美的, 有审美感的
6875. moth, n.蛾
6876. smash, vt./vi. 打碎,打破;击溃
6877. seldom, ad. 很少，不常
6878. ignite, v. 点燃;引发
6879. moor, vt.使停泊；使固定
6880. nine, num. 九pron./ad. 九(个，只
6881. bosom, n. 胸，胸部；胸怀；内心a. 亲密的
6882. earthly, adj.世俗的
6883. cyclist, n.自行车运动员
6884. resentment, n.不满，愤恨
6885. fabrication, n.制作，构成；捏造
6886. kidney, n. 肾,腰子
6887. birthplace, n.出生地
6888. beef, n. 牛肉
6889. cave, n. 洞，穴
6890. regionalize, v.使区域化
6891. solidarity, n. 团结一致
6892. festivity, n.欢宴, 欢庆
6893. pot, n. 罐，壶
6894. defile, v.染污。n.隘路
6895. prostitute, n.妓女
6896. behalf, n. 利益;方面;支持
6897. luncheon, n.午宴，午餐，便宴
6898. grip, v./n. 紧握,抓紧,握力;柄;吸引
6899. famous, a. 著名的
6900. panorama, n. 全景;全方位;整体效应
6901. rivet, n.铆钉。v.固定
6902. breakage, n.裂口
6903. scramble, vi. (快速地)爬，攀登；互相争夺，争先
6904. prohibition, n.禁止；禁令，禁律
6905. disabled, adj.残废的n.残疾人
6906. observer, n.观察员，观测者
6907. sham, n./a. 假冒(的)，虚伪(的
6908. vast, a. 巨大的，辽阔的，大量的；巨额的
6909. waive, v.放弃(要求、权利
6910. former, a. 以前的，在前的pron. 前者
6911. deal, v. 处理；做买卖，经营；分配；对待n. 交易
6912. cartoon, n. 漫画,动画片
6913. honeymoon, n.蜜月
6914. allocation, n.分配
6915. tamper, vi.干预, 玩弄, 贿赂, 损害, 削弱, 篡改。vt.篡改。n.捣 棒, 夯, 填塞者
6916. inundate, vt. 淹没,泛滥,压倒
6917. overseas, a. 外国的，海外的ad. 在海外
6918. image, n. 形象，声誉；印象；像；形象的描述，比喻
6919. rectangle, n.矩形，长方形
6920. frying-pan, n.煎锅
6921. serviceable, adj.有用的，耐用的
6922. serene, adj.宁静的,安详的
6923. type, n. 型式，类型；印刷字体；活/铅字v. 打字
6924. hardy, a. 勇敢的,果断的,吃苦的;耐寒的
6925. joke, n. 笑话，玩笑v. 说笑话，开玩笑
6926. sharply, ad.锐利地，敏锐地
6927. stowage, n.装载
6928. muffle, v.裹住，捂住
6929. keeper, n.看护人；饲养员
6930. coalition, n.合并, 接合, 联合
6931. good-bye, int.再见
6932. interplanetary, adj.行星间的, 太阳系内的
6933. butcher, n. 屠夫,残杀者;vt. 屠宰,屠杀
6934. engrave, vt. 刻上;铭记
6935. inclusion, n.包括在内
6936. arithmetic, n. 算术，四则运算adj. 算术的
6937. baby, n. 婴儿；年龄最小的人；小动物a. 婴儿似的
6938. occidental, adj.西方的，西洋的
6939. briefly, adv.简单地，简短地
6940. sometime, ad. 将来(或过去)某个时候a. 以前的
6941. meagre, adj.瘦的, 贫弱的
6942. impact, n. 影响;冲击,碰撞
6943. proceeds, n.收益
6944. maternal, adj.母亲的, 似母亲的, 母性的
6945. incline, n. 斜坡,斜面 v. (使)倾斜;(使)倾向于,赞同
6946. goodness, n. 善良，仁慈；(食物等)精华int. 天哪
6947. sunlight, n.日光，阳光
6948. deviate, vi. 偏离,背离
6949. beneficiary, n.受益者
6950. cynic, n.愤世嫉俗者
6951. reliance, n. 信任，信心，依靠，依靠的人或物
6952. imposing, adj.使人难忘的, 壮丽的
6953. terrific, a. 可怕的;非常的
6954. manuscript, n
6955. outermost, a.最外面的，最远的
6956. winery, n.酿酒厂
6957. socialist, a.社会主义的
6958. clientele, n.顾客(总称
6959. apprehension, n.理解, 忧惧, 拘捕
6960. relation, n. 关系，联系；亲属，亲戚
6961. secure, a. (from，against)安全的，放心的v. 得到；防护
6962. leeway, adj.活动余地
6963. validity, n.有效，效力；正确
6964. either, ad. 也(不)pron. 两者之一a. (两者中)任一的
6965. formulate, vt. 精确地表达;制定;用公式表示
6966. telling, adj.有效的, 明显的, 生动的
6967. amuse, vt. 逗…笑; 使娱乐
6968. homicide, n.杀人, 杀人者
6969. sheep, n. (绵)羊；易受人摆布的人
6970. elevation, n.高度；标高；隆肿
6971. revolutionary, a. 革命的，革新的n. 革命者
6972. buzz, v./n. 嗡嗡叫;匆忙行走;耳鸣
6973. anthology, n.诗选, 文选
6974. orthopedic, orthopaedic) adj.[医]整形外科的
6975. exemplify, vt. 举例说明,作为…的例证
6976. consult, v. 请教,咨询;查阅;商量
6977. country, n. 国家；农村，乡下
6978. bumper, n.缓冲器
6979. remark, n. (about，on)评语，意见v. (on)评论；注意到
6980. protein, n. 蛋白质
6981. fault, n. 缺点,毛病,过错,(地质)断层
6982. resent, v. 对…表示忿恨，怨恨
6983. helicopter, n. 直升机
6984. whitewash, vt.粉刷，涂白
6985. flourish, v./n. 繁荣;挥舞;茂盛
6986. tornado, n.旋风, 龙卷风, 大雷雨, 具有巨大破坏性的人(或事物)。 [军] (狂风) 英国、德国、意大利三国合作研制的双座双发
6987. cabbage, n. 洋白菜，卷心菜
6988. rely, vi. 依赖
6989. bypass, n. 迂回的旁道;旁路;vt. 加设旁道;回避;躲开
6990. purge, n.净化, 清除, 泻药。v.(使)净化, 清除, 肃清, (使)通便
6991. disastrous, a. 灾难性的
6992. restaurant, n. 餐馆，饭店
6993. piano, n. 钢琴
6994. prescription, n. 药方，处方
6995. tie-up, n.扎好的东西,牛棚,协作,联合,关联,关系
6996. contemporary, a. 同时代的,当代的 n. 同龄人,同时代的人
6997. resolute, a. 坚决的，果断的
6998. voting, adj.有投票权的
6999. subtract, vt. 减去;扣除
7000. soil, n. 泥土;v. 弄脏
7001. authorization, n.授权
7002. crew, n. 全体船员，全体乘务员
7003. intonation, n.语调，声调；发声
7004. shoal, n.浅滩, 沙洲, 鱼群, 大量。adj.水浅的。v.(使)变浅, 驶 入(浅水等), (鱼等)群集
7005. island, n. 岛，岛屿；(道路上的)交通安全岛
7006. wean, vt.使断奶, 使丢弃, 使断念。n.<苏格兰>幼儿, 小儿
7007. mediate, v.仲裁, 调停, 作为引起...的媒介, 居中调停
7008. overflow, v./n. 溢出;泛滥
7009. fussy, adj.爱大惊小怪的
7010. radish, n.小萝卜
7011. concurrence, n.合作，并发
7012. combustible, adj.易燃的
7013. curl, n. 卷毛,卷发;v. 使卷曲
7014. neck, n. 颈脖
7015. kidnaper, n.绑架者
7016. unduly, adv.过分地，不适当地
7017. hatchback, n. 有仓门式后背的汽车
7018. quarrel, v. 争吵，争论n. 争吵，争吵的原因
7019. penalty, n. 处罚;惩罚
7020. monsoon, n.季候风, (印度等地的)雨季, 季风
7021. pilchard, n.沙丁鱼
7022. cream, n. 乳脂，(鲜)奶油；奶油色
7023. both, prep. 两者(都)，双方(都)adj. 两个…(都
7024. brace, n. 用以夹住或支撑的东西;拉条;撑臂;背带;v. 支住;奋起
7025. illiteracy, n.文盲
7026. amicable, adj.友好的，和睦的
7027. isolation, n.隔离，孤立状态
7028. memorize, v.记住，记忆
7029. candy, n. 糖果
7030. suspend, vt. 吊,悬挂;悬浮;暂停
7031. each, a./pron. 各，各自的，每
7032. embargo, n./v. 禁止贸易
7033. paddle, n.短桨, 划桨, 明轮翼。vi.划桨, 戏水, 涉水。vt.用桨
7034. focus, n./v. 焦点,集中;(兴趣活动等的)中心;聚集
7035. award, vt. 授予，给予；判定n. 奖，奖金；仲裁
7036. direction, n. 方向，方位；指令，说明
7037. solid, a. 固体的；结实的，稳固的，可靠的n. 固体
7038. cheque, n.支票
7039. woman, n. 妇女，成年女子
7040. whence, n.来处, 根源。adv.从何处, 从哪里。conj.拒此。pron.何
7041. rinse, vt.涮，嗽；冲洗
7042. competence, n.能力
7043. extraordinary, a. 非常的；格外的；意外的；离奇的；临时的
7044. recipient, n. 接受者 a. 容易接受的
7045. mishap, n. 不幸的事,不幸,灾祸
7046. ass, n.驴；傻瓜，蠢笨的人
7047. single, a. 单人的；单一的，单个的；未婚的，独身的
7048. writer, n. 作者，作家，复写器
7049. reflect, v. 反射，反映，表现，反省，沉思
7050. assignment, n. 分配，指派；(指定的)作业，(分派的)任务
7051. commemoration, v.纪念
7052. banquet, n./vt. 宴会,设宴
7053. isle, n.小岛, 岛。vt.使成为岛屿。vi.住在岛屿上
7054. humdrum, adj.单调的
7055. crumple, v.弄皱, 压皱, 变皱, 崩溃, 垮台
7056. rendezvous, n.集合点。v.在指定地点集合
7057. experimentation, n.实验，试验；实验法
7058. clamp, n./v. 螺丝钳;用钳夹;取缔
7059. fractional, adj.零碎的，不足的
7060. later, ad. 后来，过后
7061. sympathetic, a. 同情的,有同情心的
7062. employment, n. 雇用,使用,职业
7063. religious, a. 宗教的，信教的，虔诚的
7064. inert, adj.无活动的, 惰性的, 迟钝的
7065. donate, vt. 捐赠,捐献
7066. scrap, n. 碎片,碎屑;少许,少量
7067. arbitrator, n.仲裁员
7068. despise, v. 轻视，蔑视
7069. framework, n. 构架,框架
7070. quarantine, n.检疫, 隔离, (政治或商业上的)封锁, 检疫期间。vt.检 疫, 使在政治或商业上孤立
7071. weak, a. 虚弱的，软弱的；不够标准的；淡薄的，稀的
7072. emancipate, v.解放
7073. assassinate, vt. 暗杀，行刺；中伤
7074. rattle, vt.发出格格声
7075. crouch, vi./n. 蹲伏
7076. immense, a. 广大的,巨大的
7077. reliability, n.可靠性
7078. forefather, n.祖先，先辈
7079. create, v. 创造，创作；引起，造成，建立
7080. propel, vt. 推进,推动;激励,驱使
7081. lagoon, n.泻湖。礁湖
7082. thesis, n. (学位)论文
7083. expansion, n. 扩张，膨胀；张开，伸展
7084. weaver, n.织布工，编织者
7085. delegation, n.代表团
7086. plead, v. 恳求，请求；为…辩护；提出…为理由
7087. radius, n. 半径,以半径度量的面积
7088. mannerism, n.(言语、写作中的)特殊习惯, 怪癖
7089. profound, a. 深的,极深的;渊博的;深奥的
7090. tangle, n./v. 缠结;混乱(交通
7091. distinct, a. 清楚的;不同的,独特的
7092. necessitate, vt. 使成为必需
7093. holder, n. 持有者，占有者；(台，架等)支持物
7094. dish, n. 碟子，盘子，菜肴
7095. sacred, a. 神圣的
7096. warehousing, n.仓储
7097. tact, n.机敏，圆滑，得体
7098. liner, n. 大客轮;衬里
7099. modulate, vt.调整，调节(声音
7100. undercharge, vt.索价低于常价, 未给...装足够的火药, 充电不足。n.低 的索价, 填不够量的火药, 充电不足
7101. unravel, v.拆开
7102. wrought, vbl.work的过去式和过去分词。adj.做成的, 形成的, 精炼 的, [冶](金属)锻造的
7103. mars, n.火星；战争
7104. outcome, n. 结果,后果
7105. stewardship, n.乘务员(服务员)的职位, 工作
7106. octagon, n.八边形, 八角形
7107. frankly, adv.坦率地
7108. nature, n. 自然界，大自然；性质，本性，天性
7109. thaw, n.解冻
7110. amalgamate, v.使与汞混合, 合并
7111. innards, n.<口>内脏
7112. credible, adj.可信的, 可靠的
7113. musician, n. 音乐家，乐师
7114. forte, n.长处
7115. unicorn, n.独角兽, 麒麟
7116. emphatic, adj.强调的，着重的
7117. wish, v. 希望；但愿；祝n. 愿望，希望；[pl
7118. merit, n. 价值,优点,功绩;vt. 应收,值得
7119. rift, n.裂缝, 裂口, 断裂, 长狭谷, 不和
7120. sector, n. 战区,防区;(工业等)部门,部分
7121. evoke, vt.唤起, 引起, 博得
7122. fascinate, vt. 使神魂颠倒,迷住
7123. shrimp, n.(小)虾，河虾，褐虾
7124. scorn, n. 轻蔑,蔑视
7125. denial, n. 拒绝,否认;拒绝给予
7126. ponder, vt./vi. 深思,考虑
7127. bulletin, n. 公报
7128. momentum, n.动力, 要素
7129. herbalist, n.草药医生。5h。:bElIst
7130. reel, n. 卷,轴;(胶片)一盘; vt. 卷; vi. 眩晕,摇晃
7131. fruit, n. 水果，果实；成果，效果
7132. organism, n. 生物,有机体,有机的组织
7133. smile, n. 微笑，笑容vi. 微笑，露出笑容
7134. cricket, n. 板球,蟋蟀
7135. elder, a. 年长的，资格老的n. 长辈
7136. subside, v.下沉, 沉淀, 平息, 减退, 衰减
7137. today, ad. 在今天；现今，在当代n. 今天；现在
7138. correction, n.改正，纠正，修改
7139. infertile, adj.不肥沃的, 贫瘠的, 不毛的, 不结果实的
7140. care, n. 小心；关怀，照料v. (about)关心，介意，计较
7141. slit, n. 狭长的切口;裂缝;vt. 切开;撕裂
7142. confinement, n.限制
7143. freight, n. 货运,货物;vt. 运输
7144. physician, n. 医生
7145. silky, adj.丝绸般的
7146. electric, a. 电的，导电的，电动的
7147. passionate, adj.多情的，热烈的
7148. individual, a. 个人的,个体的,个别的;n. 个人,个体
7149. escalate, vi.逐步升高, 逐步增强。vt.使逐步上升
7150. abrogation, n.取消，废除
7151. ripen, vt.使熟 vi.成熟
7152. mystify, v.迷惑
7153. boss, n. 老板，上司vt. 指挥，控制，发号施令
7154. flux, n. 流,流动;不断的变化
7155. namesake, n.同姓的人,同名的人,同名的事物
7156. bottle-neck, n.影响的环节
7157. brow, n. 眉(毛)；额
7158. own, a. (用在所有格后面，加强语气)自己的
7159. acquainted, adj.熟悉的
7160. sarcasm, n. 讽刺,挖苦,嘲笑
7161. law, n. 法律，法规，法学，规律，定律
7162. bronchitis, n.[医]支气管炎
7163. diverse, a. 多种多样的,各不相同的
7164. document, n. 公文，文献
7165. leisure, n. 空闲，闲暇；悠闲，安逸
7166. accumulative, adj.积累的
7167. petroleum, n. 石油
7168. airing, n.晾干, 兜风
7169. usefulness, n.用处，有效性
7170. dispense, v.分配，施予
7171. hook, n. 钩，吊钩，钩状物v. 钩住
7172. laser, n. 激光
7173. minus, a./n./prep. 负的,负号,减
7174. amazement, n.惊奇，诧异
7175. pamphlet, n. 小册子
7176. oblivious, adj.遗忘的, 忘却的, 健忘的
7177. gallop, v./n. 奔驰，飞奔
7178. picturesque, a. 似画的,生动的
7179. slim, a. 细长的;苗条的
7180. staid, adj.沉静的
7181. fabricate, v. 捏造，编造(谎言，借口等)；建造，制造
7182. valuation, n.估价, 评价, 计算
7183. lucid, adj.明晰的
7184. milky, a.牛奶的；乳白色的
7185. thumb, n. 大拇指
7186. shear, v. 剪，修剪
7187. scarcity, n.缺乏，不足，萧条
7188. grandchild, n.(外)孙儿、女
7189. norm, n. 标准;规范
7190. consultant, n. 会诊医师，顾问医生；顾问
7191. secretion, n.分泌, 分泌物(液
7192. laziness, n.懒惰
7193. genius, n. 天才,天才人物;才华
7194. calmly, adv.平静地，沉着地
7195. abeyance, n.缓办，中止
7196. displease, vt.使不愉快，使生气
7197. assist, vt. 协助，帮助，促进vi. 帮忙，参加
7198. piecemeal, v.粉碎
7199. wager, n.赌, 赌博, 赌注。vt.下赌注, 保证。vi.打赌
7200. scurry, vi.急赶, 急跑, 急转, 以轻快而交替的步子走动。n.急赶
7201. qualification, n. 资格;条件;限制
7202. dizzy, a. 眩晕的,使人头晕的
7203. lick, v./n. 舔;(火焰)卷过;(波浪)轻拍
7204. impair, v.削弱
7205. corn, n. 谷物，庄稼，玉米
7206. seductive, adj.诱人的
7207. incoterms, n.(缩)国际贸易术语
7208. pavement, n. 人行道
7209. group, n. 群，组v. 分组
7210. juice, n. (水果等)汁，液
7211. charge, v. 要价;控告,指控;冲锋;充电
7212. line, n. 线；路线，航线；排；线路；界线v. 排队；加衬
7213. silent, a. 寂静，沉默的
7214. crimson, adj. &n.深红色(的
7215. speak, v. 说话，讲话；演说，发言；(in)说某种语言
7216. quiz, n. 小型考试，测验，问答比赛
7217. eject, v. 喷射,排出;驱逐
7218. arm, n. 手臂，扶手，臂状物v. 武装；配备n. 武器
7219. profitable, a. 有利可图的，有益的
7220. fickle, adj.(在感情等方面)变幻无常的, 浮躁的, 薄情的
7221. involvement, n.卷入，涉足
7222. wasteful, a.浪费的；破坏性的
7223. volleyball, n. 排球
7224. firework, n.爆竹，花炮，烟火
7225. soot, n.油烟，煤烟
7226. bankrupt, adj. 破产的,彻底失败的;彻底缺乏的 n. 破产者 vt. 使破
7227. technical, a. 技术(性)的，工艺的；专门性的，专业性的
7228. elegant, a. 雅致的,优美的;简洁的
7229. synonym, n. 同义词
7230. mere, a. 纯粹的；仅仅，只不过
7231. commentate, vt.评论, 解说。vi.评论时事
7232. rainy, a.下雨的，多雨的
7233. shape, n. 形状，外形；情况，状态；种类v. 成型，塑造
7234. inspiring, adj.灌输的, 鼓舞的
7235. gnaw, vt.啃，咬断vi.啮
7236. rid, v. (of)使摆脱，使去掉
7237. angle, n. 角，角度v. 钓鱼；(采用各种方法)取得
7238. induce, vt
7239. protestant, n.清教徒，新教徒
7240. prayer, n. 祈祷，祷告，祷文
7241. mattress, n.床垫
7242. partial, a. 不完全的;偏袒的;偏爱的
7243. bench, n. 长凳，条凳；(工作)台，座
7244. liberty, n. 自由，自由权；特权
7245. arch, n. 拱 v. 拱起
7246. mosque, n.清真寺
7247. reassure, vt. 使放心,使消除疑虑
7248. dictatorship, n.独裁，专政
7249. cathedral, n. 总教堂,大教堂
7250. necessary, a. 必需的，必要的；必然的n. 必需品
7251. urgently, adv.紧急地
7252. unemployment, n.失业, 失业人数
7253. traction, n.牵引
7254. researcher, n.调查者；探究者
7255. snob, n.势利小人
7256. postscript, n.附言, 后记
7257. phoenix, n.凤凰, 长生鸟, 完人, 完美之物
7258. nuclear, a. 核心的，中心的；原子核的，核能的
7259. recycle, v.使再循环, 反复应用。n.再循环, 再生, 重复利用
7260. child, n. 小孩，儿童，儿女
7261. important, a. 重要的，重大的；有地位的，有权力的
7262. offering, n.报盘，提供的货物
7263. cellar, n. 地窖,酒窖
7264. cyanide, n.[化]氰化物
7265. tired, a. 疲劳的；厌倦的
7266. sag, v.下跌
7267. resolution, n. 坚决,坚定;决议,决定;决心,解决;分解
7268. plane, n. 飞机；平面，水平面
7269. imagine, v. 想象，设想，料想
7270. shorthand, n. 速记
7271. offshore, adj.向海面吹的, 离岸的, 海面上的
7272. eligible, adj.符合条件的, 合格的
7273. complexity, n.复杂(性
7274. zest, n.风味, 强烈的兴趣, 热情, 热心。vt.给...调味
7275. chimney, n. 烟囱
7276. quickly, ad.快，迅速
7277. ideal, a. 完美的,理想的,想象中的 n. 理想,理想的事物
7278. deepen, vt.加深 vi.深化
7279. descendant, n. 子孙，后代
7280. plaster, n./vt. 膏药;(涂)灰泥
7281. indicate, v. 指出，指示；表明，暗示
7282. nest, n. 窝，巢v. 筑巢
7283. scoop, n.铲子。v.掘, 挖
7284. Asian, a.亚洲的 n.亚洲人
7285. accuracy, n. 准确(性)；精确；准确度
7286. decidedly, ad.明确地，坚决地
7287. diver, n.潜水员，跳水运动员
7288. mankind, n. 人类
7289. unload, vi. 卸货；退子弹vt. 摆脱…之负担；倾销
7290. palm, n. 手掌,棕榈
7291. underestimate, vt. 低估
7292. simultaneous, a. 同时发生的
7293. partly, ad. 部分地，不完全地，在一定程度上
7294. evaluate, vt. 估…的价,定…的值
7295. similar, a. 类似的
7296. appointment, n. 约会;职位
7297. voluntary, a. 自愿的,志愿的;有意的
7298. frown, vi./n. 皱眉,不赞成
7299. evacuate, v.疏散, 撤出, 排泄
7300. bounty, n.慷慨, 宽大, 施舍, 奖励金
7301. fabulous, adj.寓言中的, 寓言般的, 神话般的, 传统上的, 惊人的
7302. crush, v. 压碎,压坏,弄皱,压垮;挤入
7303. ASEAN, n.(缩)东盟
7304. pump, n. 泵,抽水机 v. 抽取,盘问,追问,灌注
7305. obedience, n. 服从，顺从
7306. left-handed, adj.左手的，左侧的
7307. speciality, n.特性, 特质, 专业, 特殊性
7308. patron, n. 赞助人;资助人;老顾客,主顾
7309. superiority, n. 优越(性)，优势，优等；高傲，傲慢
7310. ambient, a.周围的，包围着的
7311. maneuver, v.机动。n.机动
7312. muffler, n.围巾，消音器
7313. constituent, a. 有选举权的;组成的;n. 选民;成分
7314. education, n. 教育，培养，训练
7315. magnetism, n.磁；魅力；催眠术
7316. established, adj.已建立的
7317. hearty, a.衷心的；丰盛的
7318. toothache, n.牙疼
7319. article, n. 物品,文章,条款,[语
7320. heterogeneous, adj.不同种类的。异类的
7321. at, prep.以，达；在…方面
7322. havoc, n.大破坏, 浩劫。vt.严重破坏
7323. devil, n. 魔鬼
7324. janitor, n.看门人
7325. beast, n. 兽，牲畜；凶残的人，举止粗鲁的人
7326. heretic, n.异教徒, 异端者
7327. radioactivity, n.放射性，放射(现象
7328. unconditional, adj.无条件的, 绝对的, 无限制的
7329. cue, n.暗示, 提示, 球杆
7330. associative, adj.联想的
7331. spade, n. 铁锹，铲子
7332. synchronize, v.同步
7333. arrival, n. 到达，到来；到达者，到达物
7334. agenda, n.议程
7335. happiness, n.幸福，幸运；快乐
7336. lean, v. 倾斜，屈身；倚，靠，依赖a. 瘦的，无脂肪的
7337. sanction, n.批准, 同意, 支持, 制裁, 认可。v.批准, 同意, 支持
7338. woe, n.悲哀，悲痛，苦恼
7339. oppress, vt. 压迫,压制;压抑
7340. roof, n. 屋顶，顶
7341. dustbin, n.簸箕
7342. behave, vi. 举动;表现;运转
7343. thinking, n.思想
7344. entail, vt. 使必需
7345. yolk, n.蛋黄，卵黄
7346. toddler, n.初学走路的孩子
7347. defiance, n. 挑战,挑衅;违抗;蔑视
7348. well-known, a. 有名的，著名的
7349. sick, a. 有病的，患病的；恶心的，想吐的
7350. remembrance, n.记得，记忆,纪念品
7351. incipient, adj.初始的
7352. planet, n. 行星
7353. toil, vi. 辛劳工作,艰难地行动;n. 苦工,难事
7354. boxing, n.拳击
7355. quartz, n. 石英
7356. distillation, n.蒸馏
7357. gratuity, n.赠物, 贺仪, 赏钱
7358. emphasize, vt. 强调,加强…的语气
7359. allotment, n.分配，份额
7360. punch, n. 冲压机，冲床；穿孔机v. 冲压，穿孔
7361. respectively, ad.各自地，分别地
7362. high, a. 高的，高度的，高级的，高尚的ad. 高高地
7363. wield, vt. 使用,行使
7364. compensation, n. 补偿(或赔偿)的款物；补偿，赔偿
7365. fetus, n.胎儿
7366. gravitation, n.地心吸力, 引力作用
7367. fleshy, adj.肉的
7368. precipice, n.悬崖
7369. animal, n. 动物，野兽，牲畜a. 动物的，野兽的
7370. dummy, n.傀儡
7371. person, n. 人，喜欢(或适应)…的人；人物；人称
7372. programing, n.程序编排
7373. peninsula, n.半岛
7374. pledge, n. 保证,誓言;信物;抵押品;vt. 保证,许诺
7375. exploration, n.考察；勘探；探查
7376. transshipment, n.转运
7377. frequency, n. 频率，周率
7378. sharpener, n.铅笔刀，磨石
7379. athletic, adj.田径的
7380. coward, n. 胆小者,懦夫
7381. ultimate, a. 最后的，最终的；根本的
7382. casting, n.铸件, 铸造
7383. sweetness, n.甜蜜；新鲜；温和
7384. batch, n.(面包等)一炉, 一批
7385. hereto, adv.对此
7386. primitive, a. 原始的,简单的
7387. obligatory, adj.义不容辞的, 必须的
7388. motionless, adj.不动的
7389. femur, n.[解]大腿骨, 腿节, [动](昆虫的)腿节, 股节
7390. duty, n. 义务，责任；职务；税
7391. monetary, a. 钱的,货币的
7392. perhaps, ad. 也许，大概，恐怕
7393. swarm, n. (昆虫等)一大群;vi. 成群飞舞;蜂拥而入
7394. penetrate, v. 穿过;透过;看穿,洞察;秘密潜入
7395. tumble, vi. 跌倒,摔下,滚下;翻滚;不由自主地卷入;(价格等)暴
7396. inch, n. 英寸
7397. daylight, n. 日光，白昼，黎明
7398. personal, a. 个人的，私人的；亲自的；身体的，人身的
7399. creamy, adj.奶油的，奶黄色的
7400. concern, vt. 影响;涉及;忙于;关心;n. 所关切的事;企业;关心
7401. formula, n. 公式；规则；分子式；药方
7402. enroll, v. 招收；登记；入学；参军；成为会员
7403. missing, a. 漏掉的，失去的，失踪的
7404. swamp, n./vt. 沼泽地;使淹没
7405. perimeter, n. 周边,周长,周界
7406. Canada, n.加拿大
7407. pigeon, n. 鸽
7408. effect, n. 结果；效果；影响；印象vt. 招致；实现；达到
7409. marketplace, n.市场，集市
7410. obvious, a. 明显的,清楚的
7411. contingency, n.事故，意外
7412. prevalent, a. 普遍的,流行的
7413. ironic, adj.说反话的, 讽刺的
7414. marrow, n.髓, 骨髓, 精华, 活力, <苏格兰>配偶
7415. shroud, n.遮蔽物
7416. bygone, n.已往的，过时的
7417. egalitarian, adj.平等主义的。n.平等主义
7418. agree, vi. 答应，赞同；适合，一致；商定，约定
7419. cheerful, a.快乐的，愉快的
7420. invincible, adj.不能征服的, 无敌的
7421. realm, n. 界,领域,范围;王国,国度
7422. firm, a. 坚固的；坚决的，坚定的n. 公司，商号
7423. written, adj.写作的，书面的
7424. inn, n. 小旅馆，客栈
7425. numerical, a. 数字的,用数字表示的
7426. style, n. 风格,文体,式样
7427. vanity, n. 自大,虚荣;无价值,空虚
7428. competition, n. 比赛,比赛会;竞争
7429. shut, v. 关，关闭
7430. proficiency, n. 熟练,进步
7431. fatigue, n./vt. 疲劳,(金属)疲劳,杂役
7432. shake, n./v. 摇动，摇；颤抖，震动
7433. quite, ad. 十分，完全；相当，颇；的确，真正
7434. annex, n.附录，附件
7435. legislate, vi.制定法律。vt.通过立法
7436. chairperson, n.主席(无性别之分
7437. comrade, n. 同志，同事，同伴，朋友
7438. shack, n.小室
7439. birth, n. 出生，诞生；出身，血统；起源；出现
7440. violin, n. 小提琴
7441. crash, n. 突然坠落;事故;倒闭;ad. 砰地一声; v. 坠毁,碰撞,冲
7442. jar, n. 罐坛，广口瓶
7443. awkwardly, adv.笨拙地
7444. broker, n.经纪人
7445. dairy, n.奶牛场，乳品商店
7446. bond, n. 契约;结合;债券
7447. descend, v. 下降,下来;遗传;袭击
7448. slam, vt. 砰地关上;猛力拉/扔,砰地放下;猛烈抨击; vi. (门、 窗等)砰地关上;n. 砰的一声
7449. well-to-do, adj.小康的, 富裕的
7450. wilderness, n. 荒地,废墟
7451. wrongly, adv.错误地，不正当地
7452. trivial, a. 不重要的,琐屑的;平常的,平凡的
7453. slot, n.缝, 狭槽, 位置, 水沟, 细长的孔, 硬币投币口, 狭通 道, 足迹。vt.开槽于, 跟踪
7454. limousine, n.豪华轿车
7455. influx, n.流入
7456. relax, v. (使)松驰，放松
7457. curriculum vitae, n.履历, 简历
7458. modesty, n.谦逊；端庄；羞怯
7459. fraught, adj.充满...的
7460. tombstone, n.墓碑
7461. reproduce, v. 生殖；翻版；繁殖；复制，仿造
7462. chorus, n./vt. 合唱;齐声说
7463. conducive, a. 有益于…的,有助于…的
7464. appliance, n. 用具;设备,装置
7465. convenience, n. 便利;便利的设施
7466. humanism, n.人道主义
7467. tedious, a. 沉闷的,乏味的
7468. audible, adj.听得见的
7469. anybody, pron. (否定句)任何人；(肯定句)随便哪个人
7470. week, n. 星期，周
7471. scar, n. 伤疤,伤痕;(喻)内心创伤
7472. frosty, adj.霜的
7473. heated, n.激烈的，热烈的
7474. rigidity, adj.僵硬，严厉，死板
7475. vat, n.(装液体的)大桶, 大缸(尤指染缸)。vt.装入大桶, 在大
7476. flip, vt.掷, 弹, 轻击, (用鞭等)抽打, 空翻。vi.用指轻弹, 抽 打, 翻动书页(或纸张), 蹦跳。n.抛, 弹, 筋斗。adj.无礼
7477. emotion, n. 激动,情绪,情感
7478. rebel, v. 反抗，反叛，起义n. 叛逆者，起义者
7479. humiliation, n.羞辱，耻辱
7480. bamboo-shoot, n.竹笋
7481. back-call, n.(推销员对顾客的)第二次访问
7482. obsolete, adj.荒废的, 陈旧的。n.废词, 陈腐的人
7483. prevalence, n.流行,普遍,广泛
7484. motif, n.主题, 主旨, 动机, 图形
7485. suburban, adj.郊区的
7486. us, pron. 我们(we的宾格形式
7487. suspense, n. (新闻、决定)不确定,悬而未决
7488. staircase, n. 楼梯
7489. ornamental, a.装饰的n.装饰品
7490. intractable, adj.难处理的
7491. postage, n. 邮费,邮资
7492. voiceless, adj.无声的
7493. rickety, adj.[医]患佝偻病的, 驼背的, 摇摆的
7494. integrity, n. 诚实,正直;完整,完整性
7495. evade, v.规避, 逃避, 躲避
7496. everyday, adj. 每日的，日常的
7497. adoptive, adj.收养关系的, 采用的
7498. medieval, a. 中世纪的，中古(时代)的，老式的，原始的
7499. seize, v. 抓住，逮住；夺取，占领；没收，查封
7500. intensity, n. 强烈，剧烈；强度
7501. hint, n./v. 暗示,提示
7502. incongruous, adj.不调和的, 不适宜的
7503. washing-machine, n.洗衣机
7504. graduation, n.毕业
7505. these, pron./a.这些；这些人(东西
7506. fulfillment, n.完成，成就
7507. pond, n. 池塘
7508. barricade, v.设路障。n.路障
7509. librarian, n. 图书管理员
7510. haphazard, a./ad. 杂乱的(地),任意的(地
7511. browse, v.n.浏览, 吃草, 放牧
7512. appreciative, adj.感激的
7513. colorful, adj.色彩丰富的
7514. variation, n. 变化，变动；变种，变异
7515. predictable, adj.可预言的
7516. prehistoric, adj.史前的, 陈旧的
7517. unsalable, adj.不好销售的
7518. inferior, a. 劣质的,差的;下级的;n. 地位低的人,能力低的人
7519. nurture, n.养育, 教育, 教养, 营养品。vt.养育, 给与营养物, 教
7520. unlawful, adj.不合法的，违法的
7521. collision, n. 碰撞；(利益，意见等的)冲突，抵触
7522. manhood, n.男子气
7523. junk, n.垃圾, 舢板
7524. aviation, n. 航空,航空学
7525. conscientious, a. 审慎正直的，认真的，本着良心的
7526. pepper, n. 胡椒粉，胡椒；辣椒
7527. endorsement, n.背书
7528. discount, n. 折扣 vt. 不全信,低估,漠视
7529. agreeably, adv.欣然，依照
7530. countersignature, n.副署，会签
7531. berry, n.浆果(如草莓等
7532. glide, vi./n. 滑动,滑翔
7533. temporary, a. 暂时的,临时的
7534. thinner, n.稀释剂
7535. foundation, n. 基础，根本，建立，创立；地基，基金，基金会
7536. proceeding, n. 行动，进行，(pl.)会议录，学报
7537. tolerant, a. 容忍的，宽容的；有耐药力的
7538. den, n.窝
7539. manly, a.男子气概的，果断的
7540. invisible, a. 看不见的,无形的
7541. court, n. 法院，法庭；宫廷，朝廷；院子；球场
7542. interpreter, n.译员，口译者
7543. molecular, a.分子的；克分子的
7544. vanish, vi. 消失
7545. inflation, n. 膨胀;通货膨胀
7546. intact, adj.完整无缺的, 尚未被人碰过的, (女子)保持童贞的, (家畜)未经阉割的
7547. aphorism, n.格言, 警语, 谚语
7548. linear, a. 线的,直线的,长度的
7549. necessity, n. 必要性，需要；必然性；(pl.)必需品
7550. powerful, a. 强大的，有力的，有权的
7551. perusal, n.细读
7552. cry, vi. 哭,流泪v. 叫,喊n. 哭泣,哭声,叫喊,喊声
7553. tendency, n. 趋向,趋势
7554. jettison, n.投弃货物v.抛弃
7555. commentary, n.注释, 解说词
7556. bakery, n.面包店
7557. really, ad. 确实，实在，真正地，果然
7558. plastics, n.塑料(制品
7559. volume, n. 容积，体积；卷，册；音量
7560. intuition, n.直觉, 直觉的知识
7561. dynamic, a. 动力的,精力充沛的;n. (pl.)力学,动力学
7562. mouth, n. 口，嘴
7563. absorption, n.吸收；专注
7564. through, prep./ad. 穿过；自始至终；由，以a. 直达的
7565. poetry, n. 诗歌，诗集
7566. jumble, v./n. 混杂,混乱,杂乱
7567. passive, a. 被动的
7568. stab, v./n. 刺，戳
7569. ruffle, v.滋扰
7570. coincident, adj. 一致的, 暗合的, 符合的
7571. precise, a. 精确的
7572. scholar, n. 学者
7573. psychologist, n.心理学家
7574. likeness, n.同样；类似，相似
7575. Santa Claus, n.圣诞老人
7576. relatively, ad.相对地，比较地
7577. wary, adj.机警的
7578. command, n./v. 命令，指挥，控制n. 掌握，运用能力
7579. represent, vt. 代表,声称
7580. streetcar, n.有轨电车
7581. subsequent, a. 接着的,然后的
7582. regionalization, n.区域化
7583. stake, n. 木桩;赌注;利害关系
7584. textbook, n. 课本，教科书
7585. bizarre, adj.奇异的(指态度,容貌,款式等
7586. algebra, n.代数学
7587. embark, v. 上船;从事;开始
7588. commercialize, v.使商业化, 使商品化
7589. fasten, v. 扎牢，使固定
7590. rein, n. 缰绳，统治，支配v. 驾驭，控制，统治
7591. racism, n.种族主义, 人种偏见, 种族歧视
7592. dating, n.约会
7593. facility, n. (pl.)设备,设施;灵巧,熟练
7594. periodical, a. 周期的;定期的;n. 期刊;杂志
7595. senseless, a.愚蠢的，无意义的
7596. conversely, ad. 相反地,逆地
7597. tiger, n．虎；老虎
7598. demography, n.人口统计学
7599. explorer, n.勘探者，探险家
7600. ferrous, a.铁的；亚铁的
7601. bride, n. 新娘
7602. sprout, vt./vi. 发芽,开始生长;发展
7603. figurative, adj.比喻的，修饰的
7604. notebook, n. 笔记本
7605. compel, vt. 强迫,迫使
7606. shrill, a.尖声的vt.尖声地叫
7607. orient, n. 东方，亚洲v. 使朝东，为…定位，使适应
7608. doorway, n. 门口
7609. manufactured, adj.制成的
7610. outland, n.偏僻地区
7611. forest, n. 森林
7612. trigger, n. (枪)扳机;引起反应的行动;vt. 触发,引起
7613. ozone, n.新鲜的空气, [化]臭氧
7614. thirty, num. 三十，三十个(人或物
7615. indeed, ad. 确实，实在；真正地，多么
7616. opaque, a. 不透光的,不透明的;难理解的
7617. cancer, n. 癌
7618. affirmation, n.确定，确认
7619. notation, n.符号
7620. do, aux./v./vt. 做，干，办，从事；引起vi. 行动
7621. automatic, a. 自动的,无意识的;n. 小型自动武器
7622. assault, n./vt. 袭击,攻击
7623. diary, n. 日记，日记簿
7624. detour, v.绕道，绕开
7625. fixture, n. 固定装置;体育项目;长期与某地(或某活动)相联系的人
7626. vapor, n. 汽，(水)蒸气
7627. obey, v. 服从，顺从
7628. center, n. 中心，中央，中间vt. 集中vi. 以…为中心
7629. violet, n. 紫罗兰，紫色a. 紫色的
7630. apparently, adj.显然，似乎
7631. concentration, n.集中；专注；浓缩
7632. bottle, n. 瓶(子)v. 装瓶
7633. receipt, n. 收到,收据
7634. sunny, a.阳光充足的；快活的
7635. counterbalance, vt.使平均, 使平衡, 弥补。n.平衡量, 平衡力, 势均力敌
7636. intermediate, a./n. 中间的,中间物
7637. accountant, n. 会计人员，会计师
7638. x-ray, n. X射线，X光
7639. premise, n.[逻][法]前提, (企业, 机构等使用的)房屋连地基。vt. 提论, 预述, 假定。vi.作出前提
7640. disposal, n. 处理，处置；布置，安排
7641. brook, n. 小溪vt.容忍
7642. novelette, n.中篇小说
7643. nor, conj./ad. 也不，也没有
7644. complication, n.复杂化, (使复杂的)因素。n.[医]并发症
7645. purchaser, n.买主
7646. serpent, n.蛇(尤指大蛇或毒蛇
7647. seller, n.卖者；行销货
7648. urgent, a. 急迫的，紧要的，紧急的
7649. race, n. 赛跑；人种，种族；属，种v. 赛跑
7650. engineering, n. 工程学
7651. compete, vi. 比赛；竞争；对抗
7652. bureaucratic, adj.官僚主义的
7653. woodpecker, n.啄木鸟
7654. onlooker, n.旁观者
7655. draft, n. 草稿;汇票;征兵;vt. 起草;征兵
7656. respectful, a.恭敬的，尊重的
7657. location, n. 位置，场所，定位，测位
7658. notify, vt. 报告;通知
7659. utensil, n.器皿，用具
7660. Arab, n.阿拉伯
7661. mutton, n. 羊肉
7662. quash, v.取消
7663. leader, n.领袖，领导人；首领
7664. arrogance, n.傲慢
7665. latter, a. 后者的；后一半的，接近终了的n. 后者
7666. perturbed, adj.烦躁不安的
7667. symposium, n. 讨论会，专题报告会；专题论文集
7668. turf, n.草根土, 草皮, 泥炭, 跑马场, 赛马。vt.覆草皮于
7669. lane, n. 小径,巷,行车道
7670. monastery, adj.修道院，寺院
7671. clinic, n. 诊所,门诊所
7672. railroad, n. 铁路v. 由铁道运输
7673. field, n. 田野；运动场；(电或磁)场；领域，范围
7674. last, a. 最后的，刚过去的ad. 最后n. 最后v. 持续
7675. protrude, v.突出
7676. registrar, n.登记员, 注册主任
7677. erupt, vi. 爆发;喷发
7678. fable, n. 寓言
7679. topmost, adj.最高的, 顶端的
7680. token, n. 代价券,礼券;(用作某种特殊用途的替代货币的)筹码;信 物,标志,纪念品;象征性的
7681. persist, vi. 坚持;持续
7682. beneficial, a. 有益的,有利的
7683. fisherman, n. 渔夫，捕鱼人
7684. substance, n. 物质；实质，本质；主旨；财产，资产
7685. date, n. 日期，年代v. 注明…的日期n./v. 约会
7686. viscous, a.粘滞的，粘性的
7687. ascertain, vt. 查明,探查
7688. unfortunately, ad. 不幸地
7689. differentiate, v.区别, 区分
7690. crawl, vi,爬行,缓慢地行进,爬满;起鸡皮疙瘩;n. 爬行;自由泳
7691. tutorial, n.指南
7692. soak, v. 浸泡;淋湿
7693. mould, n. 模子,模型;模制品
7694. deposition, n.免职，罢免；口供
7695. patient, a. 有耐心的，能忍耐的n. 病人，患者
7696. parlor, n.客厅,休息室,<美>店
7697. stupidity, n.愚蠢
7698. enlighten, vt. 启发,开导
7699. discontinue, v.中断
7700. sterilize, vt.杀菌, 消毒, 使成不毛
7701. interdependent, adj.相互依赖的, 互助的
7702. mineral, n. 矿物，矿石a. 矿物的，矿质的
7703. Russia, n.俄罗斯，俄语
7704. vicinity, n. 邻近,附近
7705. distance, n. 距离，间隔，远方，路程
7706. evidently, adv.明显地，显然
7707. scent, n. 气味,香味;香水;踪迹,臭迹,线索;vt. 嗅出,闻到,察觉
7708. pigment, n. 颜料,色素
7709. fascism, n.法西斯
7710. madman, n.疯子
7711. delegate, vt. 委派…为代表,授权;n. 代表
7712. period, n. 时期，时代；学时；周期，一段时间；句点
7713. auspice, n.赞助，主办
7714. door, n. 门；门口，出入口；门状物；家；通道
7715. comply, v. (with)遵照，照做，应允；顺从，服从
7716. retreat, vi./n. 撤退
7717. groan, v./n. 呻吟,呻吟着表示;承受重压发出的声音
7718. laboratory, n. 实验室
7719. silver, n. 银；银器；银币v. 镀银
7720. deduce, vt. 演绎,推论
7721. marsh, n.沼泽地，湿地
7722. ignore, v. 不理，不顾，忽视
7723. mug, n. (有柄的)大茶杯
7724. scapegoat, n.替罪羊
7725. detain, vt. 耽搁,延迟;拘留,扣押
7726. electrify, v.充电，电气化
7727. extort, v.敲诈, 逼取, 强取, 勒索
7728. rainfall, n.下雨，降雨量
7729. massage, n.按摩，推拿
7730. satellite, n. 卫星，人造卫星；附属物
7731. calculus, n.微积分；结石
7732. eel, n.鳝鱼
7733. grape, n. 葡萄
7734. federal, a. 联邦的；联邦制的；联合的；同盟的
7735. core, n. 果核；中心，核心
7736. ninety, num. 九十，九十个
7737. India, n.印度
7738. hare, n.野兔
7739. checkup, n.审查, 检查, 鉴定, 身体检查
7740. astound, v.使惊讶
7741. berth, n.停泊处, 卧铺(口语)职业。v.使停泊
7742. wardrobe, n. 衣柜,衣橱,全部服装,剧服,行头
7743. than, conj. (用于形容词，副词的比较级之后)比
7744. concerning, prep. 关于，论及
7745. extol, v.赞美
7746. literature, n. 文学,文学作品,文献,著作
7747. bony, adj.骨头的
7748. fur, n. 毛，毛皮
7749. bumpy, adj.颠簸不平的
7750. overtime, a. 超时的，加班的ad. 加班
7751. educational, adj.教育的
7752. motorist, n.摩托车手
7753. show, n. 节目，表演v. 上演(戏剧等)，放映(电影
7754. unemloyment, n.失业
7755. ridge, n. 脊,山脊,岭
7756. immortal, a.不朽的；永生的
7757. plethora, n.过剩, 过多, 多血症
7758. dingy, a. 脏的,邋遢的
7759. immigration, n.移居入境
7760. toast, n. 烤面包,烤火;vt. 为…祝酒,敬酒
7761. patriot, n.爱国者，爱国主义者
7762. neurotic, n.神经病患者。adj.神经质的, 神经病的
7763. dilate, vi.扩大, 详述, 膨胀。vt.使扩大, 使膨胀
7764. ceiling, n. 天花板；(规定价格、工资等的)最高限额
7765. positive, a. 确定的,明确的;(指人)确信的;实际的,有用的;[数
7766. wade, vt.趟(河)，跋涉
7767. benevolent, adj.乐善好施的
7768. gaunt, adj.憔悴的
7769. preparatory, adj.预备的
7770. omission, n.省略
7771. definitive, a. 可靠的,权威的;决定性的
7772. commandment, n.称赞
7773. surprising, a.惊人的；出人意外的
7774. whip, n. 鞭子,政党的组织秘书,发给议员要求辩论的命题 v. 鞭
7775. labor-intensive, adj.劳动密集型的
7776. hunger, n./v. 饥饿；渴望
7777. scoff, vt.&vi.嘲笑，嘲弄
7778. entertainment, n. 娱乐,招待,表演
7779. awfully, ad.令人畏惧的；很
7780. ripple, n. 涟漪,波纹;vt./vi. (使)泛起层层细浪
7781. vender, n.商贩
7782. imposition, n.强迫接受
7783. resistance, n. (to)抵抗，反抗；抵抗力，阻力；电阻
7784. slaughter, n./vt. 屠宰,屠杀
7785. lattice, n.格子；点阵，网络
7786. shampoo, n. 洗发膏，香波；洗发，洗头v. 洗发，洗头
7787. chime, n.一套发谐音的钟(尤指教堂内的), 和谐。vi.鸣, 打, 和 谐。vt.敲出和谐的声音, 打钟报时
7788. growl, v./n. 嗥叫;轰鸣;咆哮着说
7789. novelty, n. 新奇，新颖，新奇的事物
7790. miscarriage, n. 误判,误罚;流产;失败
7791. insubstantial, adj.无实质色, 无实体的, 非实在的, 幻想的, 不坚固的
7792. craft, n. 工艺,手工业;船;技巧;诡计
7793. reaction, n.反应；反作用
7794. Iceland, n.冰岛
7795. habitual, a.习惯性的，惯常的
7796. sexuality, n.性欲
7797. lucrative, adj.有利的
7798. exposure, n. 暴露，揭露；方向；陈列；遗弃；照射量
7799. apt, a. 聪明的;合适的;易于的
7800. misdeed, n.罪行, 犯罪
7801. afloat, adj.航行中的
7802. tractor, n. 拖拉机，牵引车
7803. thunderstorm, n.雷雨
7804. concentric, adj.同中心的
7805. democrat, n.民主党人
7806. thing, n. 物，东西；事，事情；所有物；局面，情况
7807. bicycle, n. 自行车vi. 骑自行车
7808. campus, n. 校园
7809. bishop, n.(基督教的)主教
7810. confidential, a. 秘(机)密的；表示信任的；担任机密工作的
7811. forgive, v. 原谅,宽恕
7812. pile, n. 堆，大量，大数目v. (up)堆，叠，堆积
7813. ineffectiveness, n.低效率
7814. pyre, n.火葬用的柴堆
7815. commonwealth, n. 全体国民,联邦
7816. dictator, n.独裁者，专政者
7817. privacy, n. 隐私;秘密
7818. vividness, n.生动(性
7819. avail, v. 有益于,有用;n. 用处,利益
7820. council, n. 政务会,理事会,委员会
7821. era, n. 时代，年代，阶段，纪元
7822. butchery, n.肉食店
7823. jeep, n.吉普车
7824. bitter, a. 有苦味的;辛酸的;怀恨的;n. 苦啤酒
7825. canned, adj.罐装的
7826. procession, n. 队伍，行列
7827. hygiene, n. 卫生
7828. irrelevant, adj.不相关的。adj.不相关的,不切题的
7829. vitamin, n. 维生素
7830. subsequently, ad.其后，其次，接着
7831. differential, adj.有差别的
7832. imaginary, a. 想象的，虚构的
7833. disunite, v.使分裂
7834. maize, n. 玉米
7835. terrorist, n.恐怖分子
7836. shall, aux. v. (我，我们)将要，会；必须，应该
7837. topsoil, n.上层土, 表层土
7838. cord, n. 绳，索
7839. reservation, n. 保留，保留意见；预定，预订
7840. breakfast, n. 早餐v. (给某人)吃早餐
7841. overcome, vt. 战胜,克服;(感情等)压倒,使受不了
7842. surplus, n. 余款,盈余,剩余,过剩
7843. demonstrative, adj.说明的, (语法)指示的
7844. enquiry, v.询问
7845. side, n. 旁边，侧面；坡，岸；一边/侧/方vi. 支持
7846. cosmetic, n.化妆品。adj.化妆用的
7847. viewer, n.观察者，电视观众
7848. cake, n. 饼，糕，蛋糕；扁平的块状物
7849. promising, a. 有希望的，有前途的
7850. drainage, n.排水；下水道
7851. resistant, a. (to)抵抗的，有抵抗力的
7852. cash, n. 现金，现款v. 兑现，付(或收)现款
7853. scenic, adj.风景如画的
7854. informative, adj.提供资料的
7855. natal, adj.出生的, 诞生的
7856. abrasion, n.磨损
7857. muddle, vt.混合, 使微醉, 使咬字不清晰, 鬼混。vi.胡乱对付。n. 困惑, 混浊状态, 糊涂
7858. just, ad. 正好地；刚才；只不过a. 公正的，公平的
7859. party, n. 聚会，政党，当事人v. 举行(参加)社交聚会
7860. pause, v./n. 中止，暂停
7861. blow, vi. 吹，吹气，打气；吹奏；爆炸n. 打，打击
7862. metabolism, n.新陈代谢, 变形
7863. excursion, n. 远足,短途旅行
7864. mental, a. 精神的，思想的，心理的，智力的，脑力的
7865. bug, n. 臭虫,病毒传染,窃听器 vt. 窃听
7866. preferably, adv.更好地,宁可
7867. beautician, n.美容师
7868. illustrate, vt. 举例或以图表说明,配以插图
7869. miner, n.矿工
7870. assessment, n.估定；查定；估计数
7871. cooker, n.厨具，厨灶
7872. saint, n. 圣人，基督教徒；(S-或St. 用于人，地名前)圣
7873. distributor, n.分销商
7874. scold, vt./vi. 责骂,申斥
7875. finalize, v.落实，定下来
7876. theoretical, a. 理论(上)的
7877. responsible, a. (for，to)应负责的；可靠的；责任重大的
7878. valid, a. 有效的；有根据的；正当的
7879. survive, v. 幸免于，幸存；比…长命
7880. beg, vt. 请求，乞求vi. 恳请，行乞
7881. memorial, a. 记忆的，纪念的n. 纪念物，纪念碑，纪念馆
7882. occupation, n. 占领，占据；占用；职业，工作
7883. partner, n. 合作者，合伙人，合股人，伙伴，舞伴，配偶
7884. admirable, adj.可钦佩的
7885. remoteness, n.遥远，疏远
7886. constabulary, adj.警察的, 警官的。n.警官队, 警察
7887. capitalize, v.大写，资本化
7888. excel, v. 杰出,胜过,优于
7889. sparse, adj.稀少的, 稀疏的
7890. workable, adj.可行的，起作用的
7891. bull, n. 公牛,雄性的鲸、象等大动物
7892. foreseeable, adj.可预知的, 能预测的, 能看透的
7893. oar, n. 桨;橹
7894. cradle, n. 摇篮;策源地;支船架;vt. 把…放在摇篮里
7895. informal, adj.非正式的
7896. handwriting, n. 笔迹，手迹，书法
7897. ludicrous, adj.可笑的, 滑稽的, 愚蠢的
7898. fauna, n.动物群, 动物区系, 动物志
7899. association, n. 联盟，协会，社团；交往，联合；联想
7900. awe, n. 敬畏，惊惧vt. 使敬畏，使惊惧
7901. news, n. 新闻，消息；新闻报道，新闻广播
7902. awesome, adj.可怕的
7903. chore, n.家务杂事
7904. survival, n. 幸存者,残存,幸存
7905. dysentery, n.[医] 痢疾
7906. codify, v.编码
7907. unusual, a. 不平常的，与众不同的
7908. nylon, n. 尼龙,尼龙长袜
7909. less, a./ad. 更少的(地)，更小的(地
7910. Buddhism, n.佛教，释教
7911. chess, n. 棋，国际象棋
7912. dancer, n.舞蹈者，舞蹈演员
7913. batter, vt. 连续猛击;炮击;打烂
7914. portrait, n. 肖像，画像
7915. ditto, n.同上
7916. punctuality, n.准时
7917. lewd, adj.淫荡的, 猥亵的, 下流的
7918. nominal, a. 名义上的,有名无实的;极微的;象征性的
7919. push, v. 推；催逼，逼迫n. 推，推力；促进，推进
7920. oversee, v.俯瞰, 监视, 检查, 视察
7921. falsify, v.伪造
7922. cumulative, adj.累积的
7923. postulate, vt.要求，假定，假设
7924. indemnity, n.保证物, 赔偿物, 赔款, 补偿, 保证
7925. apparel, n.衣服, 装饰
7926. paint, n. 油漆，颜料v. 油漆；涂，涂漆；画；描绘，描述
7927. shatter, vt./vi. 粉碎,毁损
7928. widower, n.鳏夫
7929. hypothetical, adj.假设的
7930. liaison, n.联络, (语音)连音
7931. self, n. 自我，自己
7932. parakeet, n.[鸟]长尾小鹦鹉
7933. moderate, a. 适度的,适中的;n. 稳健的人,政治上温 和派;vt./vi
7934. apart, ad. 分离，离开，隔开a. 分离的，分隔的
7935. submarine, n. 潜水艇a. 水底的，海底的
7936. approve, v. (of)赞成，赞许，同意；批准，审议，通过
7937. alas, int.唉，哎呀
7938. slander, n./vt. 诽谤,污蔑
7939. isolate, vt. 隔离,孤立
7940. canary, n.金丝雀
7941. politeness, n.礼貌，客气
7942. situate, v.位于，坐落在
7943. converge, v.聚合, 集中于一点。vt.会聚
7944. composed, adj.镇静的
7945. skin, n. 皮，皮肤；兽皮，皮毛；外皮，外壳v. 剥皮
7946. passable, adj.过得去的
7947. distribute, vt. 分发,分配,散布
7948. additive, adj.附加的n.添加剂
7949. relativity, n. 相关(性)；相对论
7950. slate, n.板岩, 石板, 石片, 蓝色。adj.暗蓝灰色的, 含板岩的
7951. ensemble, n.<法>全体, [音]合唱曲, 全体演出者
7952. attempt, vt./n. 尝试,企图
7953. regrettable, adj.可遗憾的
7954. bitumen, n.沥青
7955. fireplace, n. 壁炉
7956. abbreviate, v.缩写, 缩短, 简化, 简写成, 缩写为
7957. ingenious, a. 设计独特的;别致的,巧妙的;灵巧的
7958. increment, n. 增值,增额
7959. eccentric, n./a. 古怪(的),偏执(的);不同心(的
7960. zone, n. 地区，区域v. 分区，划分地带
7961. which, a./pron. 哪个，哪些；什么样的；那个，那些
7962. superficial, a.表面的,表皮的;肤浅的, 一知半解的
7963. seventh, num.第七；七分之一
7964. marriage, n. 结婚，婚姻；结婚仪式
7965. decisive, a. 决定性的
7966. spare, a. 空闲的;剩余的;n. 备用件
7967. aircraft, n. 飞机，飞船，飞行器
7968. fountain, n. 泉水,喷泉,源泉
7969. cover, v. 覆盖，包括，涉及n. 盖子，套子；(书的)封面
7970. depression, n.消沉；不景气萧条期
7971. cyclic, 轮转的, 循环的
7972. marking, n.唛头，标记
7973. confluence, n.汇合
7974. declining, adj.下降的，衰落的
7975. bark, n./v. 树皮,狗叫
7976. correlate, v. (使)相关联
7977. farm, n. 农场，饲养场v. 种田，经营农牧业
7978. stuff, n. 原料;材料;素质,本质;东西,物品;vt. 把…装满,塞进
7979. honey, n. 蜜，蜂蜜
7980. concrete, a. 有形的;具体的;n. 混凝土;vt. 浇混凝土于
7981. vacant, a. 空的,未被占用的;空虚的,无表情的
7982. shirt, n. 衬衫
7983. hoarse, a.(声音)嘶哑的
7984. virtual, a. 实际上的，事实上的
7985. expensive, a. 花费的，昂贵的
7986. brother, n. 兄弟；同胞；教友
7987. solicitor, n.律师
7988. enlarge, vt. 扩大，放大，增大
7989. highly, ad. 高度地，很，非常；赞许地
7990. night, n. 夜间；夜；晚(上
7991. obstinate, a. 顽固的,倔强的,不易屈服的,较难治愈的
7992. disallow, v.不允许
7993. desperation, n.绝望
7994. presently, ad. 一会儿，不久；现在，目前
7995. leadership, n. 领导
7996. reserve, n./v. 保存;预定
7997. exhaustive, adj.详尽的
7998. reduce, v. 减少，缩小；简化，还原
7999. skiing, n.滑雪
8000. explore, vt. 考察,勘察;探索
8001. review, v./n. 回顾,检查,评论
8002. freshman, n.新人，新生
8003. breath, n. 呼吸，气息
8004. bowel, n.肠。adj.内部, 同情心
8005. retain, vt. 保持;保有;聘请(律师
8006. ash, n. 灰，灰末；(pl.)骨灰；(pl.)废墟
8007. note, n. 笔记；按语，注释；钞票，纸币v. 记下，摘下
8008. permit, v. 许可，允许n. 许可证，执照
8009. another, a. 另一个，又，再pron. 另一个，类似的一个
8010. dream, n./v. 梦，梦想，幻想
8011. shadowy, a.有影的；幽暗的
8012. under, prep. 在…下面在…以下ad. 在下面；少于
8013. stuffing, n.填塞料
8014. patently, adv.明白地, 公然地
8015. gender, n.[语法] 性, <口>性别, 性, 性交
8016. denomination, n. 命名,取名,(度量衡、货币等的)单位
8017. nevertheless, ad. 然而,不过,仍然
8018. personality, n. 个性;(有名的)人物
8019. breakdown, n. 损坏;故障;垮下来;会谈破裂
8020. rib, n. 肋骨，肋状物
8021. slap, vt. 掌击,拍打
8022. pure, a. 纯的，纯洁的；纯理论的，抽象的；完全的
8023. snobbery, n.势利
8024. prepare, v. 准备，预备
8025. aeroplane, n.飞机
8026. tailor, n. 裁缝v. 缝制，剪裁
8027. dial, n. 表面,钟面,拨号盘 vt. 打电话
8028. demolition, n.拆除
8029. principally, ad.主要，大抵
8030. wound, n. 创伤，伤口v. 伤，伤害
8031. daughter-in-law, n.儿媳
8032. flexible, a. 易弯曲的,柔软的;灵活的
8033. smoothly, ad.光滑地；平稳地
8034. kite, n. 风筝
8035. aggravate, vt. 使恶化;使加剧;使气恼
8036. consistent, a. (in)前后一致的；(with)一致，符合
8037. notion, n. 概念、观念
8038. repetitive, adj.重复的，反复的
8039. sleet, n.雨加雪
8040. jagged, adj.锯齿状的，有凹口的，（外形）参差不齐的
8041. dual, adj.双的, 二重的, 双重
8042. haircut, n.理发
8043. clinging, adj.执着的, 有粘性的
8044. expressive, adj.有表现力的
8045. ubiquitous, adj.到处存在的, (同时)普遍存在的
8046. widen, vt.加宽 vi.变宽
8047. waiter, n. 侍者，服务员
8048. timely, a. 及时的,适时的
8049. mountainous, a.多山的；山一般的
8050. refuse, v. 拒绝，谢绝n. 废物，垃圾
8051. intricate, adj.复杂的, 错综的, 难以理解的
8052. petunia, n.[植]矮牵牛花
8053. tournament, n.比赛, 锦标赛, 联赛
8054. sensation, n. 感觉，知觉；激动，轰动，轰动一时的事情
8055. sociable, a. 友好的,喜好交际的
8056. territory, n. 领土；版图；领域，范围
8057. Irish, n. &adj.爱尔兰人(的
8058. expend, vt. 消费,用尽
8059. consolidated, adj.加固的，统一的
8060. meter, n. 米，公尺；仪表，计量器
8061. stoop, vt./vi. 弯腰,俯身;屈从,堕落,沦为
8062. linguistics, n.语言学
8063. curly, a.卷曲的；有卷毛的
8064. softly, ad.柔软地；温柔地
8065. rheumatic, adj.风湿的
8066. antenna, n.天线
8067. by-product, n.副产品
8068. lorry, n. 卡车，运货汽车
8069. yearly, a. 每年的，一年一度的ad. 每年，一年一次地
8070. northward, adj. &adv.向北(的
8071. alternate, a. 交替的,轮流的;v. 轮流交替,交替
8072. singular, a. 非凡的;卓越的
8073. wholly, ad. 完全地，全部，一概
8074. protocol, n. 礼仪,礼节,外交礼节
8075. blast, n. 一阵;爆炸气浪;巨响; vt. (用炸药)炸,摧毁
8076. homework, n. (学生的)家庭作业、课外人员
8077. onward, adv. &adj.向前(的
8078. reveal, v. 展现，显示，揭示，揭露，告诉，泄露
8079. tar, n. 柏油，焦油vt. 涂或浇柏油/焦油于
8080. culprit, n.犯人
8081. butterfly, n. 蝴蝶
8082. particularly, ad.特别，尤其，格外
8083. warship, n.军舰
8084. thorn, n. 刺，荆棘
8085. catalogue, n.目录
8086. fossil, n. 化石
8087. tremble, vi./n. 发抖,震颤
8088. web, n. 网
8089. bind, v. 捆;使结合;包扎;装钉;使受约束
8090. pupil, n. 瞳孔,瞳仁
8091. stationery, n. 文具
8092. paternity, n.父权, 父子关系
8093. stink, adj.臭的
8094. downtown, a./ad. 在城市的商业区
8095. buffalo, n.水牛；水陆坦克
8096. locality, n. 地区,地方
8097. real, a. 真的，真实的；实际的，现实的
8098. grate, n.壁炉, 炉
8099. housewife, n. 家庭主妇
8100. p.m, n.下午，午后
8101. triplicate, n.一式三份
8102. phenomenon, n. 现象，稀有现象，珍品，奇迹，杰出人才
8103. sixth, num.第六；六分之一
8104. papercutting, n.剪纸艺术
8105. practise, v. 练习，实习，实践，实行，使…练习，训练
8106. statistical, a. 统计的，统计学的
8107. foil, n.箔, 金属薄片, [建]叶形片, 烘托, 衬托。vt.衬托, 阻 止, 挡开, 挫败, 贴箔于
8108. remains, n. (pl.)剩余，残余，遗迹
8109. daybreak, n.破晓
8110. mule, n.骡子
8111. construct, v. 建设，建造，构造；创立
8112. myth, n. 神话,传说,虚构的人或物
8113. witness, n. 目击者,见证人;证据,证言 vt. 目击,注意到;为…作证
8114. mischief, n. 伤害,损害
8115. boiler, n.锅炉；热水贮槽
8116. song, n. 歌唱，(虫、鸟等)鸣声；歌曲，歌词
8117. attack, n./vt. 攻击,非难,疾病发作
8118. unconditionally, adv.无条件地
8119. five, num. 五pron./a. 五(个，只
8120. vulgar, a. 粗俗的,趣味不高的,通俗的,庸俗的
8121. pessimism, n.悲观, 悲观主义
8122. thereafter, ad. 此后，以后
8123. mature, vt. 使成熟,使成长;a. 成熟的,充分发展的
8124. stem, n. 茎;vi. (～from)起源于
8125. June, n. 六月
8126. crossroads, n.交叉路口，十字路
8127. substitution, n.代替
8128. zinc, n. 锌
8129. scan, v. 浏览,细看
8130. gravity, n. 重力，引力；严肃，庄重
8131. duly, ad. 适当地,按时地
8132. enlargement, n.扩大
8133. tarnish, v.失去光泽
8134. epidemic, a. (疾病)流行性的,传染的 n. 流行病
8135. stereo, n. 立体声录音机
8136. broom, n. 扫帚
8137. postponement, n.推迟
8138. sturdy, a. 强健的,坚实的
8139. breast, n. 胸膛，乳房
8140. velvet, n. 丝绒，天鹅绒a. 丝绒制的，柔软的
8141. affirmative, adj.肯定的
8142. distributorship, n.分销权
8143. conservatory, n.温室, 音乐学校
8144. fire-engine, n.消防车
8145. voltage, n. 电压
8146. logical, a. 逻辑的，符合逻辑的
8147. gloomy, a. 黑暗的;郁闷的
8148. abort, vi.异常中断, 中途失败, 夭折, 流产, 发育不全。n.中止
8149. deuterium, n.[化]氘
8150. millimetre, n.毫米
8151. tightly, ad.紧地，牢固地
8152. reasonable, a. 明智的;合理的;公平的
8153. generality, n.一般性
8154. backing, n.倒退，支持物
8155. Christianity, n.基督教(精神
8156. sphinx, Sphinx ][希神]斯芬克斯(有翼的狮身女怪, 传说她常叫过 路行人猜谜, 猜不出者即遭杀害
8157. immigrant, n. 移民,侨民
8158. simultaneously, adv.同时地
8159. up-to-date, a. 现代化的，最新的；跟上时代的
8160. speedy, adj.快速的
8161. watery, a.水的；湿的；乏味的
8162. hump, n.驼峰, 驼背, 小园丘, 峰丘。v.(使)隆起, 弓起
8163. congregate, v.聚集
8164. evolve, v. (使)发展；(使)进化；(使)进展
8165. aluminum, n. [美
8166. varied, adj.不同的
8167. garment, n. (一件)衣服(长袍、外套
8168. doll, n. 玩偶，玩具娃娃
8169. livelihood, n.生活
8170. pearl, n. 珍珠
8171. kid, n. 小孩，儿童v. 戏弄，取笑
8172. vigilant, adj.警惕着的, 警醒的
8173. sanitary, a. 有关卫生的;清洁的
8174. backbone, n.脊梁骨
8175. convince, vt. 使信服
8176. uneasy, a. 不自在的
8177. hopefully, adv.可以指望
8178. radio, n. 收音机；无线电报，无线电话v. 无线电通讯
8179. bungalow, n.(带走廊的)平房
8180. fan, n. 扇子，风扇；(影，球等)迷v. 扇，扇动，激起
8181. multiple, a. 多样的，多重的n. 倍数v. 成倍增加
8182. confidence, n. (in)信任；信心，自信；秘密，机密
8183. allied, a.联合的；联姻的
8184. unofficial, adj.非官方的, 非法定的, 非正式的
8185. sum, n. 总数，和；金额；算术题；要旨v. 合计，总计
8186. passage, n. 通过，经过；通路，走廊；(一)段落，(一)节
8187. tributary, adj.进贡的, 附庸的, 从属的, 辅助的, 支流的。n.进贡 国, 附庸国, 支流
8188. purely, ad.纯粹地，完全地
8189. happy, a. 快乐的，幸福的；乐意的；令人满意的
8190. data, n. 资料，数据
8191. sled, n.雪橇, 摘棉。v.乘雪橇, 用雪橇运, 用摘棉机摘
8192. mortgage, n.抵押。v.抵押
8193. observatory, adj.天文台, 气象台
8194. killer, n.杀人者，杀手
8195. bureau, n. 署，局，司，处
8196. hymn, n.赞美诗，圣歌；赞歌
8197. sieve, n. 细筛,过滤网
8198. childlike, adj.孩子似的，天真的
8199. hostage, n. 人质
8200. minimize, v. 使减少到最少，使降到最低
8201. ajar, adv.半开的
8202. bible, n. 圣经
8203. compile, vt. 编辑,编写
8204. ambassador, n. 大使,授权代表
8205. feather, n. 羽毛
8206. stillness, n.寂静，无声
8207. selection, n. 选择，挑选；选集，精选物
8208. weekday, n. 平常日，工作日
8209. botany, n.植物学
8210. hopeless, a.没有希望的，绝望的
8211. tuna, n.金枪鱼
8212. Africa, n.非洲
8213. hike, v./n. 徒步旅行;增加;抬起
8214. surpass, vt. 超越;超过,胜过
8215. packing, n.装箱，收拾行李
8216. gypsum, n.[矿]石膏, [农]石膏肥料。vt.施石膏肥料于, 用石膏处
8217. explosive, a. 爆炸(性)的，爆发(性)的n. 爆炸物，炸药
8218. equilibrium, n.平衡，均衡；均衡论
8219. eggplant, n.茄子
8220. drawback, n. 障碍,不利
8221. tax, n. 税(款)，负担v. 对…征税，使负重担
8222. intellect, n.理智，智力，才智
8223. mar, v.弄坏, 毁坏, 损害。n.损伤, 毁损, 障碍。n.(Mar) 三月
8224. itemize, v.分列
8225. expedience, n.便利，权宜之计
8226. autumn, n. 秋，秋季；成熟期，渐衰期
8227. nothing, n. 没有东西；什么也没有；无关紧要的人或事
8228. solely, ad.单独地，唯一地
8229. archives, n.档案, 公文, 档案室, 案卷保管处
8230. neutrality, n.中立
8231. outcry, n.大声疾呼
8232. year, n. 年，年度，学年a./ad. 每年，一年一次
8233. pessimistic, a. 悲观(主义)的
8234. study, vt. 学习；研究；细看vi. 读书n. 学习；研究
8235. applaud, v. 鼓掌欢迎;赞成
8236. equivocal, adj.意义不明确的, 模棱两可的, 可疑的
8237. Spanish, a.西班牙的n.西班牙人
8238. distant, a. 远的；遥远的；疏远的；不亲近的
8239. martyr, n. 烈士,殉难者;vt. 杀害,折磨,牺牲
8240. throughout, prep. 遍及
8241. cube, n. 立方体,立方
8242. smog, n. 烟雾
8243. barren, a. 贫瘠的;不结果实的;无益的;无兴趣的
8244. set, n. 一套，一副，装置，接受机v. 提出，调整，日落
8245. stout, a.矮胖的；坚固的
8246. card, n. 卡片，名片；纸牌；纸片
8247. accommodate, vt. 提供住宿;使适应;容纳
8248. mischance, n.不幸, 灾难
8249. whirl, vt./vi. 使旋转;眩晕
8250. overlap, v. 与…互搭,与…重叠;与…部分相同
8251. helium, n.氦（化学元素, 符号为He
8252. rhyme, n.韵，脚韵
8253. lessen, vt.减少，减轻；缩小
8254. approximate, a. 近似的,约略的 v. 接近,近似
8255. briefcase, n.(扁平的, 柔韧的, 装文件, 书报的)公文包
8256. inefficient, a.效率低的，无能的
8257. glut, n.供过于求v.狼吞虎咽
8258. syllabus, n.课程提纲
8259. immigrate, vt.(使)移居入境
8260. enough, a. (for)足够的n. 足够，充分ad. 足够地
8261. allocate, vt. 分配,配给
8262. strawberry, n. 草莓
8263. cottage, n. 村舍，小屋，别墅
8264. brick, n. 砖块，砖v. 用砖围砌，用砖填补
8265. creep, vi. 慢慢地、悄悄地移动;(时间、年纪)悄悄过去;蔓延
8266. representative, n. 代表，代理人a. (of)典型的，有代表性的
8267. zoo, n. 动物园
8268. stagnant, adj.停滞的, 迟钝的
8269. standardize, vt.使与标准比较
8270. methodical, adj.有方法的, 有系统的
8271. exercise-book, n.练习簿
8272. photography, n.摄影术
8273. contextual, adj.上下文的，环境的
8274. indelible, adj.去不掉的, 不能拭除的
8275. pretend, v. 假装，假托，借口，(在演戏中)装扮
8276. proclaim, vt. 宣告,声明;显示
8277. reciprocal, a. 相互的,互惠的
8278. alloy, n. 合金
8279. deletion, n.删除
8280. rheumatism, n.风湿病
8281. explanation, n. 解释，说明
8282. foam, n./v. 泡沫,起泡沫
8283. germ, n. 微生物,细菌,病菌;(某事的)发端,萌芽
8284. course, n.过程，路线，课程
8285. conditional, adj.有条件的
8286. misinterpret, v.误解
8287. intercourse, n. 交流，交往，交际，性交
8288. governess, n.女家庭教师
8289. humor, n. 幽默，诙谐
8290. conduct, n. 行为，品行v. 引导；管理；指挥(乐队)；传导
8291. zebra, n. 斑马
8292. condenser, n.冷凝器，聚光器
8293. discovery, n. 发现；被发现的事物
8294. feminine, a. 女性的；娇柔的
8295. endanger, vt.危及，危害
8296. fore, ad. 在前面a. 先前的；在前部的n. 前部
8297. cavalry, n.骑兵，马术
8298. compact, a./n. 紧密的,紧凑的;合同
8299. luck, n. 运气；好运，侥幸
8300. upright, a. 垂直的,直立的;正直的
8301. quantity, n. 量，数量；大量
8302. denounce, vt. 谴责,斥责
8303. Swede, n.瑞典人
8304. motor, n. 发动机，电动机
8305. January, n. 一月
8306. host, n. 许多,一大群;主人;旅店老板
8307. consensus, n.一致同意, 多数人的意见, 舆论
8308. student, n. (大中学校的)学生；研究者，学者
8309. accelerator, n.加速者, 加速器
8310. unit, n. 单位，单元；部件，元件；机组，装置
8311. love, n. 爱，爱情，喜欢vt. 爱，热爱；爱好，喜欢
8312. disintegration, n.分散，解体
8313. tinker, vi.做焊锅匠, 笨拙的修补。vt.修补。n.修补匠, 焊锅
8314. stagger, v./n. 摇晃;蹒跚;vt. 使吃惊;使错开,使交错
8315. that, a./ pron.那，那个； ad.那样，那么
8316. cucumber, n. 黄瓜
8317. kiss, n./v. 吻，接吻
8318. earmark, n.标记，特征
8319. here, ad. 在(到，向)这里；这时；在这一点上
8320. head, n. 头；顶部；领导，首脑v. 主管；位于…顶部
8321. eighteen, num. 十八，十八个
8322. memoir, n.回忆录
8323. net, n. 网，网状物v. 用网捕，使落网a. 纯净的
8324. scrub, n.&vt.擦洗，擦净
8325. shanty, n.简陋小屋, 棚屋
8326. motorcar, n.汽车
8327. sodium, n.钠
8328. tear, n. 眼泪 vi. 撕裂,撕碎,破坏…安宁
8329. Marxist, a. 马克思主义的n. 马克思主义者
8330. inshore, adj.近海岸的, 沿海岸的
8331. cynical, adj.愤世嫉俗的
8332. tribute, n. 贡品；颂词，称赞，(表示敬意的)礼物
8333. radiant, a. 发光的，辐射的，容光焕发的
8334. grocer, n. 食品商，杂货商
8335. mournful, adj.悲悼的，哀痛的
8336. rigor, n.严格，严肃
8337. wireless, a.不用电线的，无线的
8338. loyalty, n. 忠诚，忠心
8339. conduce, v.导致，有益于
8340. erosion, n. 腐蚀,侵蚀;削弱,丧失
8341. prescribed, adj.规定的
8342. naked, a. 裸体的,无遮蔽的
8343. sensitive, a. 敏感的;过敏的,容易生气的;(仪器)灵敏的
8344. enlightening, adj.给人启发的
8345. undermine, vt. (暗中)破坏;(逐渐)削弱
8346. yesterday, n./ad. 昨天；前不久
8347. dismissal, n.解散，开除
8348. agency, n. 代理商(社
8349. factor, n. 因素,要素
8350. advocate, n. 倡导者;辩护人;vt. 提倡,支持
8351. none, pron. 没有任何人(东西)；都不ad. 一点也不
8352. cuff, n.袖口, 裤子翻边, 护腕, 手铐。vt.给...上袖口(或翻
8353. eat, vt. 吃，喝vi. 吃饭，吃东西
8354. guilt, n. 罪过，内疚
8355. curious, adj.好奇的，爱打听的
8356. parade, vt./vi. 阅兵整队;列队行进,游行;夸耀;炫示
8357. meringue, 蛋白与糖的混合物
8358. chromosome, n.[生物]染色体
8359. fantastic, a. 极好的;极大的,难以相信的;奇异的;异想天开的
8360. shiny, adj.耀眼的
8361. tunnel, n. 隧道,地道
8362. should, aux./v. 应该；万一；可能，该；就；竟然会
8363. labor, n. 工作，劳动；劳力v. 劳动，苦干
8364. tweezers, n.镊子, 小钳
8365. Greek, a.希腊的 n.希腊人
8366. bury, v. 埋(葬)，安葬；埋藏，遮盖
8367. currency, n.通货，货币
8368. cat, n. 猫；猫科
8369. surgery, n. 外科,外科手术
8370. venerable, adj.庄严的, 值得尊敬的, 古老的
8371. windowsill, n.窗台
8372. pore, n.毛孔，气孔，细孔
8373. trickle, v./n. (使)滴流,(使)细流
8374. Friday, n. 星期五
8375. understand, v. 懂，理解；获悉，听说；揣测，认为
8376. rise, v. 升起；起立；上涨；起义n. 上涨，增高；起源
8377. specialized, adj.专业的，专门的
8378. construction, n. 建造，构造；建筑物，结构；释义，解释
8379. alkali, n.[化]碱。adj.碱性的
8380. dedicate, vt. 奉献,供奉;题献(著作
8381. rat, n. 鼠
8382. overhear, vt. 无意中听到,偷听到
8383. dwell, vi. 居住;详述
8384. axle, n.(轮)轴，车轴，心棒
8385. memory, n. 记忆，记忆力；回忆；存储(器
8386. alternation, n.改变，变更
8387. merchandise, n. 商品，货物
8388. inconvenience, n.不便，不利
8389. Swiss, a.瑞士的 n.瑞士人
8390. override, vt.制服, 践踏, 奔越过, 蹂躏, 不顾, 不考虑(某人的意 见,决定,愿望等)。n.代理佣金
8391. discourage, v. 使泄气，使失去信心
8392. sympathy, n. 同情，同情心；赞同，同感；慰问
8393. sponge, n. 海绵,海绵状物,松糕
8394. wrinkle, n. 皱纹v. 起皱，皱眉
8395. forefront, n.最前部, 最前线, 最活动的中心
8396. attorney, n. 律师
8397. Tuesday, n. 星期二
8398. prodigious, adj.巨大的
8399. preface, n./v. 序言;为…加序
8400. current, n. 电流，水流；潮流，趋势a. 当前的；流通的
8401. mother, n. 母亲
8402. concise, a. 简明的,简要的
8403. encounter, vt./n. 遭遇,意外地遇到
8404. dike, n.堤
8405. antibiotic, n./a. 抗生素;抗菌的
8406. legendary, adj.传说的，传奇的
8407. grin, v./n. 露齿而笑,咧嘴一笑
8408. sufficient, a. 足够的,充分的
8409. personally, adv.亲自，就个人而言
8410. thermal, adj.热的, 热量的
8411. pope, n. 罗马教皇，主教，大腿上要害部位
8412. receptionist, n.接待员
8413. elasticity, n.弹性
8414. practical, a. 实行的;注重实际的,实用的
8415. walker, n.步行者，散步者
8416. radiate, v. 辐射,(使)从中心发散,发出(光或热);流露,显示
8417. zip, v. (用拉链或像拉链那样)合上或打开
8418. secret, a. 秘密的，机密的n. 秘密
8419. broken, a.被打碎的，骨折的
8420. cruise, v. 巡航;以节省燃料的速度前进;n. 乘船巡游
8421. juicy, adj.多汁的
8422. peacock, n.孔雀
8423. encouragement, n.鼓舞，鼓励
8424. wholesome, a. 健康的,有益于健康的
8425. quote, v. 引用，援引
8426. pacify, vt.使平静, 安慰, 抚慰
8427. compels, v.强迫
8428. greedy, a. 贪吃的,贪婪的
8429. horrible, a. 可怕的,恐怖的;讨厌的
8430. avenue, n. 林荫路，大街；(比喻)途径，渠道，方法
8431. aside, ad. 在旁边，到一边n. 旁白；离题的话
8432. pitcher, n.水罐
8433. perishable, adj.容易腐烂的
8434. so, ad. 那么；非常；也；不错conj. 因此；以便
8435. maid, n. 少女，处女，女仆
8436. chamber, n. 房间;议院;贸易团体;弹膛
8437. wander, v. 漫游;迷路;离题
8438. miscellaneous, adj.各色各样混在一起, 混杂的, 多才多艺的
8439. predominant, a. 主要的,占优势的
8440. drum, n. 鼓；圆桶
8441. dishonor, n.耻辱v.凌辱
8442. hamburger, n. 汉堡包，牛肉饼
8443. western, a. 西方的，西部的
8444. normal, a. 正常的，普通的；正规的，标准的
8445. butter, n. 黄油，奶油v. 涂黄油于…上
8446. contradict, vt. 反驳,否认;同…矛盾
8447. win, vi. 获胜，赢vt. 赢得；在…中获胜n. 胜利
8448. honest, a. 诚实的，正直的，老实的
8449. sow, v. 播种
8450. flame, n./vi. 火焰,火舌
8451. poet, n. 诗人
8452. versed, adj.精通的
8453. revolve, vt./vi. 使旋转,使绕转
8454. boundary, n. 边界,分界线
8455. twin, a. 双的，成对的，孪生的n. 孪生子，双生子
8456. storey, n. 房屋的一层
8457. bid, n./v. 出价,喊价;命令;说
8458. tangible, adj.切实的
8459. eleven, num. 十一pron./a. 十一(个，只
8460. cowardly, adv.胆小地
8461. fairy, a. 幻想中的；虚构的；优雅的n. 仙女；精灵
8462. component, n. 组成部分,零件
8463. abbreviation, n. 缩略语
8464. journalism, n.新闻体
8465. successor, n. 接替的人或事物，继任者
8466. proof, n. 证据，证明；校样，样张
8467. interfere, v. (in)干涉，干预；(with)妨碍，打扰
8468. scout, n. 侦察员,侦察机,侦察舰
8469. mesh, n. 网,筛孔
8470. dialect, n. 方言,俚语
8471. wave, n. 波浪；(挥手)示意；飘扬v. (挥手)示意，致意
8472. atlas, n. 地图册,图表集
8473. saturate, v.使饱和, 浸透, 使充满
8474. habitable, adj.可居住的
8475. pencil, n. 铅笔vt. 用铅笔写
8476. testify, v. 作证，证明；(to)表明，说明
8477. exhale, v.呼气, 发出, 发散, <古>使蒸发
8478. inaugurate, vt. 为…举行就职典礼;为展览会揭幕;开创
8479. orchard, n. 果园，果园里的全部果树，<美俚>棒球场
8480. brotherhood, n.兄弟情谊
8481. le, adv.引导，领先，率领
8482. incorporated, adj.有限的
8483. renewable, adj.可续期的
8484. chap, n./v. (皮肤)变粗糙；发痛n. 小伙子
8485. headstrong, adj.不听命令的, 顽固的, 刚愎的, 任性的。5hedstrRN
8486. telegram, n. 电报
8487. part, n. 部分，角色，一方，零件，地区，部，篇v. 使分开
8488. moist, a. (表面)潮湿的,湿润的
8489. amends, n.赔偿
8490. lady, n. 女士，夫人
8491. dorsal, adj.背的, 脊的
8492. magnitude, n. 大小;重要性;量级
8493. productive, a. 能生产的;肥沃的
8494. elegance, n.优雅
8495. retirement, n.退休，引退；退隐
8496. generalize, v. 概括,归纳
8497. unfortunate, a.不幸的；可取的
8498. beyond, prep. 在(或向)…的那边，远于；超出
8499. directory, n. 名录
8500. staple, n. 订书钉,U形钉;主食;主要产品;vt. 用订书钉订;a. 主要 的;基本的;标准的
8501. sacrifice, n./v. 献祭;牺牲
8502. obstruct, v.阻隔, 阻塞, 遮断(道路、通道等)。n.阻碍物, 障碍物
8503. discrete, adj.不连续的, 离散的
8504. consequent, adj.作为结果的, 随之发生的
8505. decency, n.体面
8506. apparatus, n. 仪器,设备
8507. uninterested, adj.不感兴趣的
8508. charity, n. 赈济款、物,慈善团体,博爱
8509. left, n. 左面，左方a. 左边的，左面的；在左方的
8510. shaft, n. 矛;矿井;车辕;轴;光线
8511. retailer, n.零售商
8512. fierce, a. 凶猛的,凶狠的,愤怒的;强烈的
8513. disgust, n./vt. 厌恶,讨厌
8514. relative, a. 相对的，比较的，有关系的n. 亲戚，关系词
8515. civilize, v. 使文明，开化
8516. cargo, n. 船货，货物
8517. maltreat, vt.虐待, 滥用
8518. lending, n.贷款，借款
8519. synthesize, v.综合, 合成
8520. although, conj. 尽管，虽然…但是
8521. metallic, a.金属的n.金属粒子
8522. internationalizati, onn.国际化
8523. chaste, adj.贞洁的, (思想, 言论, 尤其是性的节操)有道德的, 朴
8524. sequence, n. (事件、观念等的)系列;顺序;关联
8525. weed, n. 杂草，野草v. 除草，锄草
8526. gigantic, a. 巨大的,庞大的
8527. deform, vt.损坏…的形状
8528. vineyard, n.葡萄园
8529. grow, v. 生长，成长；渐渐变成；栽培，种植；发展
8530. capitalization, n.资本化
8531. shipment, n. 装船，装运；装载的货物，装货量
8532. virtuous, adj.善良的, 有道德的, 贞洁的, 有效力的
8533. xerox, vt.&vi.用静电复印
8534. outdated, adj.过时的, 不流行的
8535. vase, n. 花瓶，瓶
8536. holy, a. 神圣的，圣洁的
8537. leakage, n.漏，泄漏；漏出物
8538. herewith, adv.与此一道
8539. different, a. 差异的，差异的，不同的
8540. victim, n. 牺牲品，受害者
8541. platitude, n.陈词滥调
8542. ethnic, adj.人种的, 种族的, 异教徒的
8543. seam, n./v. 线缝,接缝;煤层
8544. donation, n.捐献
8545. wait, v. (for)等待；(on)侍候n. 等候，等待时间
8546. plain, a. 明白的；朴素的；坦率；平凡n. 平原，旷野
8547. clay, n. 粘土，泥土
8548. mirror, n. 镜子；反映，反射v. 反映，反射
8549. arise, vi. 出现,发生,起来
8550. America, n.美洲；美国
8551. contribute, v. 贡献,捐献;促成;投稿
8552. monarchy, n.君主政体, 君主政治, 君主国
8553. world, n. 世界，地球；…界，领域；世间；全世界
8554. wit, n. 智力,才智
8555. awake, a. 醒着的vt. 唤醒，使觉醒vi. 醒来，醒悟到
8556. mythology, n. 神话学
8557. refinery, n.精炼厂，提炼厂
8558. adrenalin, n.[生化]肾上腺素
8559. bullet, n. 子弹，枪弹
8560. coerce, vt.强制, 强迫
8561. work, n. 工作(量)；作品；[pl
8562. formidable, a. 可怕的,难以对付的
8563. encourage, v. 鼓励，怂恿
8564. leaflet, n. 散页的印刷品,传单
8565. nowhere, ad. 什么地方都没有
8566. sprinkle, n. 洒，喷，淋
8567. tuition, n. 教学,学费
8568. transplant, n./v. 移植,移种;人工 移植(心,胃);迁移
8569. cable, n. 缆,索,电缆 v. 拍电报
8570. brave, a. 勇敢的v. 勇敢地面对(危险等
8571. constitution, n. 构成，构造，组成(方式)，成分；体格；宪法
8572. recovery, n. 痊愈，复元；重获，恢复
8573. handcuff, n.手拷。v.上手拷
8574. see, vt. 看见；会面；探望；知道，获悉；送行
8575. pseudonym, n.假名, 笔名
8576. flower, n. 花；精华，精粹，精英；盛时vi. 开花
8577. lowland, n.低地, 苏格兰低地。adj.低地的
8578. fail, v. 失败，不及格；衰退，减弱
8579. inevitably, ad.不可避免地
8580. pop, a. 流行的n. (发出)砰的一声v. 突然出现
8581. classify, vt. 把…分类,分等级
8582. desire, v./n. 愿望，欲望，要求
8583. script, n. 手迹,笔迹,手稿,剧本原稿
8584. levy, v./n. 征收,征税
8585. threaten, v. 恐吓，威胁；有…危险，快要来临
8586. ginger, n.姜，生姜
8587. among, prep. 在…之中；在一群(组)之中；于…之间
8588. particle, n. 粒子,微粒;[语
8589. ego, n.自我, 利已主义, 自负
8590. guide, n. 领路人；指南，导游v. 领路；指导；支配；管理
8591. forbidden, adj.禁止的
8592. bully, n.欺凌弱小者。vt.威吓, 威逼
8593. dependability, n.可依赖性
8594. notional, adj.概念的, 想象的, [语]表意的, 实义的
8595. impart, v. 给予;告知,透露;传授
8596. trustworthy, adj.可信赖的
8597. condensation, n.凝聚
8598. strip, vt./vi. 剥去,除去;剥夺财产;n. 狭长一片
8599. formal, a. 正式的；形式的
8600. dolphin, n.海豚
8601. modest, a. 谦虚的;适度的;羞怯的
8602. brutal, a. 野蛮的,残忍的
8603. wealth, n. 财富，财产；大量
8604. satire, n. 讽刺，讽刺文学，讽刺作品
8605. branch, n. (树)条，分支；分店；(学科)分科，部门；支流
8606. unilateral, adj.单方面, 单边的, 片面的, 单系, [植]单侧的, [语]单
8607. incompatibility, n.不兼容
8608. garrison, n.要塞，警备队
8609. phase, n. 阶段，状态，时期；相，相位
8610. negligible, a. 可忽略不计的，微不足道的
8611. studio, n. 画室；播音室；(电影)制片厂
8612. impetus, n.推动力, 促进
8613. mince, v.切碎，绞碎
8614. tolerate, vt. 容忍，默许；对(药物、毒品等)有耐力
8615. intimate, a. 亲密的,密切的;个人的,私下的; vt. 暗示,宣布,通知
8616. reckon, vt./vi. 计算
8617. fashion, n. 流行式样(或货品)，风尚，风气；样子，方式
8618. eyesight, n. 视力
8619. improper, a.不适当的；不合理的
8620. Thanksgiving Day, n.感恩节
8621. tramp, v. 徒步远行;长途跋涉
8622. teapot, n.茶壶
8623. handicapped, adj.有残疾的
8624. womb, n.子宫, 发源地。vt.(如子宫般的)包含, 容纳
`;
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

    createFolder(name, description = '', parentFolderId = null) {
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
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder-item';
        folderDiv.dataset.folderId = folder.id;
        
        // Count cards: if parent, include all child folders (new + legacy naming)
        let cardCount = 0;
        if (folder.parentFolderId) {
            // Child folder: own cards only
            cardCount = this.cards.filter(card => card.folderId === folder.id).length;
        } else {
            // Parent folder: include children by parentFolderId or legacy name pattern
            const legacyPrefix = `${folder.name} - List `;
            const childFolders = this.folders.filter(f => f.parentFolderId === folder.id || f.name.startsWith(legacyPrefix));
            const childIds = new Set(childFolders.map(f => f.id));
            this.cards.forEach(c => { if (childIds.has(c.folderId)) cardCount++; });
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
        this.updateListDropdownForHeader();
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
        
        const selectedFolder = this.folders.find(f => f.id === this.currentFolder);
        if (!selectedFolder) {
            return [];
        }
        
        // If parent folder selected, show cards from all child folders
        if (!selectedFolder.parentFolderId) {
            const childFolders = this.folders.filter(f => f.parentFolderId === this.currentFolder);
            const childFolderIds = childFolders.map(f => f.id);
            return this.cards.filter(card => childFolderIds.includes(card.folderId));
        }
        
        // If child folder selected, show only its cards
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

    // Populate the list-only dropdown in header with child folders
    updateListDropdownForHeader() {
        if (!this.listDropdown) return;
        const container = this.listDropdown;
        container.innerHTML = '';
        const currentFolderObj = this.folders.find(f => f.id === this.currentFolder);
        if (!currentFolderObj) {
            container.style.display = 'none';
            return;
        }
        
        // If current folder is a parent, show its child folders
        let childFolders = [];
        if (!currentFolderObj.parentFolderId) {
            // This is a parent folder - get all its children (new + legacy naming)
            const legacyPrefix = `${currentFolderObj.name} - List `;
            childFolders = this.folders
                .filter(f => f.parentFolderId === this.currentFolder || f.name.startsWith(legacyPrefix))
                .sort((a, b) => {
                    // Extract numbers for proper sorting (List 01, List 02, ... List 40)
                    const numA = parseInt(a.name.match(/List\s(\d+)/)?.[1] || '0');
                    const numB = parseInt(b.name.match(/List\s(\d+)/)?.[1] || '0');
                    return numA - numB;
                });
        } else {
            // This is a child folder - show siblings (same parent)
            const parentId = currentFolderObj.parentFolderId;
            const parentObj = this.folders.find(f => f.id === parentId);
            const legacyPrefix = parentObj ? `${parentObj.name} - List ` : '';
            childFolders = this.folders
                .filter(f => f.parentFolderId === parentId || (legacyPrefix && f.name.startsWith(legacyPrefix)))
                .sort((a, b) => {
                    const numA = parseInt(a.name.match(/List\s(\d+)/)?.[1] || '0');
                    const numB = parseInt(b.name.match(/List\s(\d+)/)?.[1] || '0');
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VocaBox();
});


