(() => {
    const sampleCards = (entries) => entries.map(entry => ({
        front: entry.front,
        back: entry.back
    }));

    const WORD_PACK_MAP = {
        'words-cet4': {
            id: 'words-cet4',
            folderId: 'pack-words-cet4',
            folderName: 'CET-4 Word Book',
            description: 'High-frequency vocabulary curated for CET-4 learners.',
            cards: sampleCards([
                { front: 'abandon', back: 'v. to give up completely; to leave behind without intent to return.' },
                { front: 'benefit', back: 'n. an advantage or profit gained from something; v. to receive an advantage.' },
                { front: 'campaign', back: 'n. a series of planned activities to reach a goal.' },
                { front: 'derive', back: 'v. to obtain something from a specified source.' },
                { front: 'efficient', back: 'adj. achieving maximum productivity with minimum wasted effort.' }
            ])
        },
        'words-cet6': {
            id: 'words-cet6',
            folderId: 'pack-words-cet6',
            folderName: 'CET-6 Word Book',
            description: 'Advanced vocabulary to prepare for CET-6.',
            cards: sampleCards([
                { front: 'ambiguous', back: 'adj. open to more than one interpretation.' },
                { front: 'coherent', back: 'adj. logical and consistent.' },
                { front: 'disparity', back: 'n. a great difference between things.' },
                { front: 'meticulous', back: 'adj. showing great attention to detail.' },
                { front: 'prevalent', back: 'adj. widespread in a particular area or time.' }
            ])
        },
        'words-ielts': {
            id: 'words-ielts',
            folderId: 'pack-words-ielts',
            folderName: 'IELTS Vocabulary',
            description: 'Core IELTS words with academic-friendly definitions.',
            cards: sampleCards([
                { front: 'alleviate', back: 'v. to make suffering, deficiency, or a problem less severe.' },
                { front: 'coincide', back: 'v. to occur at the same time or place.' },
                { front: 'elaborate', back: 'adj. involving many carefully arranged parts; v. to explain in detail.' },
                { front: 'facilitate', back: 'v. to make an action or process easier.' },
                { front: 'notion', back: 'n. a conception of or belief about something.' }
            ])
        },
        'words-toefl': {
            id: 'words-toefl',
            folderId: 'pack-words-toefl',
            folderName: 'TOEFL Vocabulary',
            description: 'TOEFL-ready vocabulary for academic contexts.',
            cards: sampleCards([
                { front: 'abate', back: 'v. to become less intense or widespread.' },
                { front: 'bolster', back: 'v. to support or strengthen.' },
                { front: 'candid', back: 'adj. truthful and straightforward.' },
                { front: 'diligent', back: 'adj. showing care in one’s work or duties.' },
                { front: 'eloquent', back: 'adj. fluent or persuasive in speaking or writing.' }
            ])
        },
        'words-custom': {
            id: 'words-custom',
            folderId: 'default',
            folderName: 'My Word Lists',
            description: 'Your personal decks and imported lists.',
            requiresUserCards: true,
            cards: []
        }
    };

    window.WORD_PACK_MAP = WORD_PACK_MAP;
})();

