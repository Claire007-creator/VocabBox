(() => {
    const CATEGORY_KEYS = {
        WORDS: 'words',
        SENTENCES: 'sentences',
        GRAMMAR: 'grammar',
        LISTENING: 'listening',
        READING: 'reading'
    };

    const CARD_TYPES = {
        WORD_CARD: 'WordCard',
        SENTENCE_CARD: 'SentenceCard',
        CONCEPT_CARD: 'ConceptCard',
        AUDIO_CARD: 'AudioCard',
        PARAGRAPH_CARD: 'ParagraphCard'
    };

    const STUDY_MODES = {
        FLASH: 'Flash',
        TYPING: 'Typing',
        AUDIO: 'Audio',
        MULTIPLE_CHOICE: 'MultipleChoice',
        QUIZ: 'Quiz',
        HIGHLIGHT: 'Highlight'
    };

    const BEHAVIORS = {
        AUTO_SPACED_REPETITION: 'Auto-spaced repetition',
        REVEALS_ENGLISH: 'Reveals English',
        STRUCTURED: 'Structured presentation',
        TRANSCRIPT_ON_BACK: 'Transcript on back',
        VOCAB_EXTRACTION: 'Vocab extraction'
    };

    const CATEGORY_CONFIG = {
        [CATEGORY_KEYS.WORDS]: {
            label: 'Words',
            cardType: CARD_TYPES.WORD_CARD,
            studyModes: [
                STUDY_MODES.FLASH,
                STUDY_MODES.TYPING,
                STUDY_MODES.AUDIO,
                STUDY_MODES.MULTIPLE_CHOICE
            ],
            defaultStudyMode: STUDY_MODES.FLASH,
            behavior: BEHAVIORS.AUTO_SPACED_REPETITION
        },
        [CATEGORY_KEYS.SENTENCES]: {
            label: 'Sentences',
            cardType: CARD_TYPES.SENTENCE_CARD,
            studyModes: [
                STUDY_MODES.FLASH,
                STUDY_MODES.TYPING,
                STUDY_MODES.AUDIO
            ],
            defaultStudyMode: STUDY_MODES.FLASH,
            behavior: BEHAVIORS.REVEALS_ENGLISH
        },
        [CATEGORY_KEYS.GRAMMAR]: {
            label: 'Grammar',
            cardType: CARD_TYPES.CONCEPT_CARD,
            studyModes: [
                STUDY_MODES.FLASH,
                STUDY_MODES.QUIZ,
                STUDY_MODES.AUDIO
            ],
            defaultStudyMode: STUDY_MODES.FLASH,
            behavior: BEHAVIORS.STRUCTURED
        },
        [CATEGORY_KEYS.LISTENING]: {
            label: 'Listening',
            cardType: CARD_TYPES.AUDIO_CARD,
            studyModes: [
                STUDY_MODES.AUDIO,
                STUDY_MODES.FLASH,
                STUDY_MODES.TYPING
            ],
            defaultStudyMode: STUDY_MODES.AUDIO,
            behavior: BEHAVIORS.TRANSCRIPT_ON_BACK
        },
        [CATEGORY_KEYS.READING]: {
            label: 'Reading',
            cardType: CARD_TYPES.PARAGRAPH_CARD,
            studyModes: [
                STUDY_MODES.HIGHLIGHT,
                STUDY_MODES.FLASH,
                STUDY_MODES.MULTIPLE_CHOICE,
                STUDY_MODES.TYPING
            ],
            defaultStudyMode: STUDY_MODES.HIGHLIGHT,
            behavior: BEHAVIORS.VOCAB_EXTRACTION
        }
    };

    window.CATEGORY_KEYS = CATEGORY_KEYS;
    window.CARD_TYPES = CARD_TYPES;
    window.STUDY_MODES = STUDY_MODES;
    window.BEHAVIORS = BEHAVIORS;
    window.CATEGORY_CONFIG = CATEGORY_CONFIG;
})();

