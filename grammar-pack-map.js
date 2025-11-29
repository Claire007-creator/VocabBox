(() => {
    const grammarCards = (entries) => entries.map(entry => ({
        front: `
            <div class="grammar-card-front">
                <h2>${entry.title}</h2>
                ${entry.summary ? `<p class="grammar-summary">${entry.summary}</p>` : ''}
            </div>
        `,
        back: `
            <div class="grammar-card-back">
                <p class="grammar-explanation">${entry.explanation}</p>
                ${entry.examples && entry.examples.length
                    ? `<ul class="grammar-examples">${entry.examples.map(example => `<li>${example}</li>`).join('')}</ul>`
                    : ''
                }
            </div>
        `
    }));

    const GRAMMAR_PACK_MAP = {
        'grammar-tenses': {
            id: 'grammar-tenses',
            folderId: 'pack-grammar-tenses',
            folderName: 'Tenses',
            description: 'Timeline-focused explanations with targeted examples.',
            cards: grammarCards([
                {
                    title: 'Present Simple',
                    summary: 'Subject + base form',
                    explanation: 'Use for routines, facts, and general truths.',
                    examples: [
                        'She works at a bank.',
                        'Water boils at 100°C.'
                    ]
                },
                {
                    title: 'Present Continuous',
                    summary: 'be + verb-ing',
                    explanation: 'Actions happening now or temporary situations.',
                    examples: [
                        'I am meeting a client this afternoon.',
                        'They are staying with friends.'
                    ]
                },
                {
                    title: 'Present Perfect',
                    summary: 'have/has + past participle',
                    explanation: 'Experiences or actions with present relevance.',
                    examples: [
                        'We have finished the report.',
                        'He has lived here for ten years.'
                    ]
                }
            ])
        },
        'grammar-conditionals': {
            id: 'grammar-conditionals',
            folderId: 'pack-grammar-conditionals',
            folderName: 'Conditionals',
            description: 'Zero to mixed conditionals with sample transitions.',
            cards: grammarCards([
                {
                    title: 'Zero Conditional',
                    summary: 'If + present, present',
                    explanation: 'Use for general truths or scientific facts.',
                    examples: [
                        'If you heat ice, it melts.',
                        'If people exercise, they feel better.'
                    ]
                },
                {
                    title: 'First Conditional',
                    summary: 'If + present, will + base',
                    explanation: 'Real future possibilities or promises.',
                    examples: [
                        'If it rains tomorrow, we will stay inside.',
                        'If you study, you will pass.'
                    ]
                },
                {
                    title: 'Second Conditional',
                    summary: 'If + past, would + base',
                    explanation: 'Unreal or hypothetical situations now/future.',
                    examples: [
                        'If I had more time, I would travel more.',
                        'If she were here, she would know what to do.'
                    ]
                }
            ])
        },
        'grammar-passive': {
            id: 'grammar-passive',
            folderId: 'pack-grammar-passive',
            folderName: 'Passive Voice',
            description: 'Transform focus from doer to receiver of action.',
            cards: grammarCards([
                {
                    title: 'Basic Passive',
                    summary: 'be + past participle',
                    explanation: 'Use when the action matters more than the doer.',
                    examples: [
                        'The report was submitted yesterday.',
                        'These products are made in Spain.'
                    ]
                },
                {
                    title: 'Passive with by-phrase',
                    summary: 'passive + by + agent',
                    explanation: 'Mention the performer only when necessary.',
                    examples: [
                        'The play was directed by an award-winning artist.',
                        'The letter was delivered by courier.'
                    ]
                }
            ])
        },
        'grammar-clauses': {
            id: 'grammar-clauses',
            folderId: 'pack-grammar-clauses',
            folderName: 'Clauses',
            description: 'Adjective, noun, and adverb clauses in context.',
            cards: grammarCards([
                {
                    title: 'Adjective Clauses',
                    summary: 'who / that / which',
                    explanation: 'Modify nouns with relative pronouns.',
                    examples: [
                        'The engineer who designed this bridge won an award.',
                        'I like books that make me think.'
                    ]
                },
                {
                    title: 'Noun Clauses',
                    summary: 'that / if / whether',
                    explanation: 'Act as subjects or objects in sentences.',
                    examples: [
                        'What you said surprised me.',
                        'She asked whether we agreed.'
                    ]
                }
            ])
        },
        'grammar-subjunctive': {
            id: 'grammar-subjunctive',
            folderId: 'pack-grammar-subjunctive',
            folderName: 'Subjunctive',
            description: 'Formal expressions and recommendations.',
            cards: grammarCards([
                {
                    title: 'Mandative Subjunctive',
                    summary: 'demand / suggest + subject + base verb',
                    explanation: 'Used after verbs requiring actions or recommendations.',
                    examples: [
                        'They insisted that he stay until the end.',
                        'I suggest she arrive early.'
                    ]
                },
                {
                    title: 'Fixed Expressions',
                    summary: 'Long live / be it / if need be',
                    explanation: 'Subjunctive survives in set phrases.',
                    examples: [
                        'Long live the king!',
                        'If need be, we can delay the launch.'
                    ]
                }
            ])
        }
    };

    window.GRAMMAR_PACK_MAP = GRAMMAR_PACK_MAP;
})();

