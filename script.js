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
        this.renderCards();
        this.updateCardCount();
        this.applyCustomColors();
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
        this.signInUsername = document.getElementById('signInUsername');
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
        this.forgotUsername = document.getElementById('forgotUsername');
        this.forgotPasswordError = document.getElementById('forgotPasswordError');
        
        // Verify code elements
        this.verifyCodeModal = document.getElementById('verifyCodeModal');
        this.closeVerifyCodeBtn = document.getElementById('closeVerifyCodeBtn');
        this.cancelVerifyCodeBtn = document.getElementById('cancelVerifyCodeBtn');
        this.verifyCodeForm = document.getElementById('verifyCodeForm');
        this.verificationCode = document.getElementById('verificationCode');
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
        this.testsContainer = document.getElementById('testsContainer');
        this.cardsEmptyState = document.getElementById('cardsEmptyState');
        this.testsEmptyState = document.getElementById('testsEmptyState');
        this.cardCount = document.getElementById('cardCount');
        this.testCount = document.getElementById('testCount');

        // Modal elements
        this.addCardModal = document.getElementById('addCardModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
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
        this.editPrevCardBtn = document.getElementById('editPrevCardBtn');
        this.editNextCardBtn = document.getElementById('editNextCardBtn');
        this.editCardNum = document.getElementById('editCardNum');
        this.colorPickerFront = document.getElementById('colorPickerFront');
        this.colorPickerBack = document.getElementById('colorPickerBack');

        // Create Test modal elements
        this.createTestBtn = document.getElementById('createTestBtn');
        this.createTestModal = document.getElementById('createTestModal');
        this.closeCreateTestBtn = document.getElementById('closeCreateTestBtn');
        this.cancelCreateTestBtn = document.getElementById('cancelCreateTestBtn');
        this.createTestForm = document.getElementById('createTestForm');
        this.testFrontText = document.getElementById('testFrontText');
        this.testBackText = document.getElementById('testBackText');
        this.colorPickerTestFront = document.getElementById('colorPickerTestFront');
        this.colorPickerTestBack = document.getElementById('colorPickerTestBack');

        // Delete confirmation modal elements
        this.deleteConfirmModal = document.getElementById('deleteConfirmModal');
        this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        // Test mode selection elements
        this.testModeSelectModal = document.getElementById('testModeSelectModal');
        this.closeTestSelectBtn = document.getElementById('closeTestSelectBtn');
        this.selectFlipMode = document.getElementById('selectFlipMode');
        this.selectTypingMode = document.getElementById('selectTypingMode');

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
        
        // Audio elements (Create Test Modal)
        this.testAudioFileInput = document.getElementById('testAudioFileInput');
        this.testUploadAudioBtn = document.getElementById('testUploadAudioBtn');
        this.testRemoveAudioBtn = document.getElementById('testRemoveAudioBtn');
        this.testCurrentAudio = document.getElementById('testCurrentAudio');
        this.testAudioUploadSection = document.getElementById('testAudioUploadSection');
        this.testAudioPlayer = document.getElementById('testAudioPlayer');
        this.pendingTestAudioId = null;
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

        // Create Test button
        this.createTestBtn.addEventListener('click', () => this.openCreateTestModal());

        // Modal close buttons
        this.closeModalBtn.addEventListener('click', () => this.closeAddCardModal());
        this.cancelBtn.addEventListener('click', () => this.closeAddCardModal());

        // Edit modal close buttons
        this.closeEditModalBtn.addEventListener('click', () => this.closeEditCardModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeEditCardModal());

        // Create Test modal close buttons
        this.closeCreateTestBtn.addEventListener('click', () => this.closeCreateTestModal());
        this.cancelCreateTestBtn.addEventListener('click', () => this.closeCreateTestModal());

        // Delete confirmation modal buttons
        this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteConfirmModal());
        this.confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());

        // Test mode selection modal
        this.closeTestSelectBtn.addEventListener('click', () => this.closeTestModeSelection());
        this.selectFlipMode.addEventListener('click', () => this.openCategorySelection());
        this.selectTypingMode.addEventListener('click', () => this.startTypingMode());

        // Category selection modal
        this.closeCategorySelectBtn.addEventListener('click', () => this.closeCategorySelection());
        this.backToCategoryBtn.addEventListener('click', () => this.backToTestModeSelection());
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

        // Close modal on outside click (disabled for Add Card and Create Test modals)
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

        this.deleteConfirmModal.addEventListener('click', (e) => {
            if (e.target === this.deleteConfirmModal) {
                this.closeDeleteConfirmModal();
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
        
        // Audio upload handlers (Create Test Modal)
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
        this.signInUsername.focus();
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
        const username = this.signInUsername.value.trim();
        const password = this.signInPassword.value;

        if (!username || !password) {
            this.showError(this.signInError, 'Please fill in all fields');
            return;
        }

        // Get users from localStorage
        const users = this.getUsers();
        const user = users.find(u => u.username === username);

        if (!user) {
            this.showError(this.signInError, 'Username not found');
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
        
        // Reload cards for this user
        this.cards = this.loadCards();
        this.renderCards();
        this.updateCardCount();
        
        this.showNotification(`Welcome back, ${username}! 👋`, 'success');
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
        this.forgotUsername.focus();
    }

    closeForgotPasswordModal() {
        this.forgotPasswordModal.classList.remove('active');
        this.forgotPasswordForm.reset();
        this.forgotPasswordError.style.display = 'none';
    }

    handleForgotPassword(e) {
        e.preventDefault();
        const username = this.forgotUsername.value.trim();

        if (!username) {
            this.showError(this.forgotPasswordError, 'Please enter your username');
            return;
        }

        // Get users from localStorage
        const users = this.getUsers();
        const user = users.find(u => u.username === username);

        if (!user) {
            this.showError(this.forgotPasswordError, 'Username not found');
            return;
        }

        if (!user.contact) {
            this.showError(this.forgotPasswordError, 'No recovery contact found for this account');
            return;
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store recovery data
        this.recoveryData = {
            username: username,
            code: code,
            contact: user.contact,
            timestamp: Date.now()
        };

        // In real app, send code via email/SMS here
        console.log(`Recovery code for ${username}: ${code}`);

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
        const newPassword = this.newPassword.value;
        const newPasswordConfirm = this.newPasswordConfirm.value;

        if (!code || !newPassword || !newPasswordConfirm) {
            this.showError(this.verifyCodeError, 'Please fill in all fields');
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

        // Update password
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.username === this.recoveryData.username);
        
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            this.saveUsers(users);
            
            this.closeVerifyCodeModal();
            this.showNotification('Password reset successfully! Please sign in with your new password.', 'success');
            
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

    // Create Test Audio Upload Methods
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
        if (!this.currentUser) {
            return [];
        }
        
        const userKey = `vocaBoxCards_${this.currentUser.username}`;
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
        if (!this.currentUser) {
            return;
        }
        const userKey = `vocaBoxCards_${this.currentUser.username}`;
        localStorage.setItem(userKey, JSON.stringify(this.cards));
    }

    addCard(front, back, category = 'card', audioId = null) {
        const card = {
            id: Date.now(),
            front: front,
            back: back,
            category: category, // 'card' or 'test'
            audioId: audioId || undefined,
            createdAt: new Date().toISOString()
        };
        this.cards.unshift(card);
        this.saveCards();
        this.renderCards();
        this.updateCardCount();
    }

    deleteCard(id) {
        this.pendingDeleteId = id;
        this.openDeleteConfirmModal();
    }

    openDeleteConfirmModal() {
        this.deleteConfirmModal.classList.add('active');
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
            
            this.cards = this.cards.filter(card => card.id !== this.pendingDeleteId);
            this.saveCards();
            this.renderCards();
            this.updateCardCount();
            this.closeDeleteConfirmModal();
        }
    }

    renderCards() {
        this.cardsContainer.innerHTML = '';
        this.testsContainer.innerHTML = '';

        // Separate cards by category
        const regularCards = this.cards.filter(card => card.category === 'card' || !card.category);
        const testCards = this.cards.filter(card => card.category === 'test');

        // Show/hide empty states and decoration cats
        if (regularCards.length === 0) {
            this.cardsEmptyState.classList.remove('hidden');
            // Hide decoration cat when no cards
            const cardsDecoration = document.querySelector('.cat-decoration');
            if (cardsDecoration) cardsDecoration.style.display = 'none';
        } else {
            this.cardsEmptyState.classList.add('hidden');
            // Show decoration cat when cards exist
            const cardsDecoration = document.querySelector('.cat-decoration');
            if (cardsDecoration) cardsDecoration.style.display = 'block';
            regularCards.forEach(card => {
                const cardElement = this.createCardElement(card);
                this.cardsContainer.appendChild(cardElement);
            });
        }

        if (testCards.length === 0) {
            this.testsEmptyState.classList.remove('hidden');
            // Hide decoration cat when no tests
            const testsDecoration = document.querySelectorAll('.cat-decoration')[1];
            if (testsDecoration) testsDecoration.style.display = 'none';
        } else {
            this.testsEmptyState.classList.add('hidden');
            // Show decoration cat when tests exist
            const testsDecoration = document.querySelectorAll('.cat-decoration')[1];
            if (testsDecoration) testsDecoration.style.display = 'block';
            testCards.forEach(card => {
                const cardElement = this.createCardElement(card);
                this.testsContainer.appendChild(cardElement);
            });
        }
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-item';
        
        const hasAudio = card.audioId ? true : false;
        const audioButton = hasAudio ? `<button class="play-audio-btn" data-audio-id="${card.audioId}" title="Play audio">🔊 Play</button>` : '';
        
        cardDiv.innerHTML = `
            <div class="card-front-preview">${card.front}</div>
            <div class="card-back-preview">${card.back}</div>
            <div class="card-actions">
                ${audioButton}
                <button class="edit-btn" data-id="${card.id}"><img src="pencil.png" alt="Edit" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 4px;"> Edit</button>
                <button class="delete-btn" data-id="${card.id}"><img src="trashbin.png" alt="Delete" style="width: 20px; height: 20px; vertical-align: middle; margin-right: 4px;"> Delete</button>
            </div>
        `;

        // Add event listeners
        const editBtn = cardDiv.querySelector('.edit-btn');
        const deleteBtn = cardDiv.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', () => this.openEditCardModal(card.id));
        deleteBtn.addEventListener('click', () => this.deleteCard(card.id));

        // Add audio play button listener
        if (hasAudio) {
            const playBtn = cardDiv.querySelector('.play-audio-btn');
            playBtn.addEventListener('click', () => this.playCardAudio(card.audioId));
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
        const regularCards = this.cards.filter(card => card.category === 'card' || !card.category);
        const testCards = this.cards.filter(card => card.category === 'test');
        
        this.cardCount.textContent = regularCards.length;
        this.testCount.textContent = testCards.length;
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

        if (front && back) {
            await this.addCard(front, back, 'card', this.pendingAddAudioId);
            this.pendingAddAudioId = null;
            this.closeAddCardModal();
        }
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

        if ((front && back && frontText && backText) || (front && back)) {
            const cardIndex = this.cards.findIndex(c => c.id === this.currentEditingCardId);
            if (cardIndex !== -1) {
                // Preserve existing category when editing
                const existingCategory = this.cards[cardIndex].category || 'card';
                const oldAudioId = this.cards[cardIndex].audioId;
                
                this.cards[cardIndex].front = front;
                this.cards[cardIndex].back = back;
                this.cards[cardIndex].category = existingCategory;
                this.cards[cardIndex].audioId = this.currentAudioId;
                
                // Delete old audio if it was replaced
                if (oldAudioId && oldAudioId !== this.currentAudioId) {
                    await this.deleteAudioFile(oldAudioId);
                }
                
                this.saveCards();
                
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

    // Create Test Modal Functions
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

        if (front && back) {
            await this.addCard(front, back, 'test', this.pendingTestAudioId); // Mark as 'test' category with audio
            this.pendingTestAudioId = null;
            this.closeCreateTestModal();
        }
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
                    
                    // Store the selected text before command
                    const selectedText = savedSelection ? savedSelection.toString() : '';
                    
                    // Execute command
                    document.execCommand(command, false, null);
                    
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
                if (selection.rangeCount > 0 && !selection.isCollapsed) {
                    const range = selection.getRangeAt(0);
                    const selectedText = range.toString();
                    
                    if (selectedText.trim()) {
                        const span = document.createElement('span');
                        span.className = 'hidden-content';
                        span.textContent = selectedText;
                        span.setAttribute('data-hidden', 'true');
                        
                        range.deleteContents();
                        range.insertNode(span);
                        
                        // Clear selection
                        selection.removeAllRanges();
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

    // Create Test Rich Text Editor Setup
    setupCreateTestEditor() {
        const toolbarButtons = document.querySelectorAll('.toolbar-btn[data-target="testfront"], .toolbar-btn[data-target="testback"]');
        const colorPickerButtons = document.querySelectorAll('.color-picker-btn[data-target="testfront"], .color-picker-btn[data-target="testback"]');
        const presetColorButtons = document.querySelectorAll('.preset-color-btn[data-target="testfront"], .preset-color-btn[data-target="testback"]');

        // Store selection
        let savedSelection = null;

        // Formatting buttons
        toolbarButtons.forEach(btn => {
            if (!btn.classList.contains('color-btn')) {
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
                    
                    // Store the selected text before command
                    const selectedText = savedSelection ? savedSelection.toString() : '';
                    
                    // Execute command
                    document.execCommand(command, false, null);
                    
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
                if (selection.rangeCount > 0 && !selection.isCollapsed) {
                    const range = selection.getRangeAt(0);
                    const selectedText = range.toString();
                    
                    if (selectedText.trim()) {
                        const span = document.createElement('span');
                        span.className = 'hidden-content';
                        span.textContent = selectedText;
                        span.setAttribute('data-hidden', 'true');
                        
                        range.deleteContents();
                        range.insertNode(span);
                        
                        // Clear selection
                        selection.removeAllRanges();
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

    // Rich Text Editor Setup
    setupRichTextEditor() {
        const toolbarButtons = document.querySelectorAll('.toolbar-btn:not(.color-btn)');
        const colorPickerButtons = document.querySelectorAll('.color-picker-btn');
        const presetColorButtons = document.querySelectorAll('.preset-color-btn');

        // Store selection
        let savedSelection = null;

        // Formatting buttons (Bold, Underline, Lists)
        toolbarButtons.forEach(btn => {
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
                
                // CRITICAL: Immediately restore and maintain selection after command
                setTimeout(() => {
                    const sel = window.getSelection();
                    if (savedSelection) {
                        try {
                            sel.removeAllRanges();
                            sel.addRange(savedSelection.cloneRange());
                            // Save the restored selection for next operation
                            savedSelection = sel.getRangeAt(0).cloneRange();
                        } catch (e) {
                            console.log('Selection restore failed:', e);
                            // If restore fails, try to get current selection
                            if (sel.rangeCount > 0) {
                                savedSelection = sel.getRangeAt(0).cloneRange();
                            }
                        }
                    }
                }, 0);
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
                if (selection.rangeCount > 0 && !selection.isCollapsed) {
                    const range = selection.getRangeAt(0);
                    const selectedText = range.toString();
                    
                    if (selectedText.trim()) {
                        const span = document.createElement('span');
                        span.className = 'hidden-content';
                        span.textContent = selectedText;
                        span.setAttribute('data-hidden', 'true');
                        
                        range.deleteContents();
                        range.insertNode(span);
                        
                        // Clear selection
                        selection.removeAllRanges();
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

    // Test Mode Selection
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

    // Category Selection
    openCategorySelection() {
        this.testModeSelectModal.classList.remove('active');
        this.categorySelectModal.classList.add('active');
    }

    closeCategorySelection() {
        this.categorySelectModal.classList.remove('active');
    }

    backToTestModeSelection() {
        this.categorySelectModal.classList.remove('active');
        this.testModeSelectModal.classList.add('active');
    }

    // Flip Mode Functions
    startFlipMode(category) {
        // Filter cards based on selected category
        // If a card has no category property, default it to 'card'
        this.flipTestCards = this.cards.filter(card => {
            const cardCategory = card.category || 'card';
            return cardCategory === category;
        });
        
        if (this.flipTestCards.length === 0) {
            const categoryName = category === 'card' ? 'Cards' : 'Tests';
            alert(`No ${categoryName} available! Please add some ${categoryName.toLowerCase()} first.`);
            this.closeCategorySelection();
            return;
        }

        this.closeCategorySelection();
        this.currentTestIndex = 0;
        this.isFlipped = false;
        this.testModeScreen.classList.add('active');
        this.totalCards.textContent = this.flipTestCards.length;
        this.loadTestCard();
    }

    exitTestMode() {
        this.testModeScreen.classList.remove('active');
        this.flashcardInner.classList.remove('flipped');
    }

    // Typing Mode Functions
    startTypingMode() {
        // Get only test category cards
        this.typingTestCards = this.cards.filter(card => card.category === 'test');
        
        if (this.typingTestCards.length === 0) {
            alert('Please create some test cards first using "Create Test" button!');
            this.closeTestModeSelection();
            return;
        }
        
        // Reset test results
        this.testResults = {
            answers: [],
            correctCount: 0,
            incorrectCount: 0,
            unansweredCount: 0
        };

        this.closeTestModeSelection();
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
        this.typingQuestion.innerHTML = card.front;
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
        const correctAnswer = this.typingTestCards[this.currentTypingIndex].back;
        
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

    async loadTestCard() {
        const card = this.flipTestCards[this.currentTestIndex];
        this.cardFront.innerHTML = card.front;
        this.cardBack.innerHTML = card.back;
        this.currentCardNum.textContent = this.currentTestIndex + 1;
        this.flashcardInner.classList.remove('flipped');
        this.isFlipped = false;
        this.updateProgress();
        
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VocaBox();
});


