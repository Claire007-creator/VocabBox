(() => {
    const READING_PACK_MAP = {
        'reading-economist': {
            id: 'reading-economist',
            folderName: 'Economist Pack',
            description: 'Short Economist-style paragraphs for upper-intermediate learners.',
            cards: [
                {
                    id: 'econ-1',
                    title: 'Central Banks and Inflation',
                    summary: 'On how central banks respond to rising prices.',
                    text: 'Central banks across the world are confronting the sharpest burst of inflation in decades. Officials are raising interest rates faster than expected, hoping to tame demand before price expectations spiral out of control.'
                },
                {
                    id: 'econ-2',
                    title: 'Remote Work Geography',
                    summary: 'Hybrid offices change the real-estate map.',
                    text: 'As hybrid work becomes entrenched, companies are rethinking their office footprints. Once-coveted downtown towers now compete with smaller hubs in residential districts, where shorter commutes keep employees happier and attrition lower.'
                }
            ]
        },
        'reading-graded': {
            id: 'reading-graded',
            folderName: 'Graded Readers',
            description: 'Level-based passages for extensive reading habits.',
            cards: [
                {
                    id: 'graded-1',
                    title: 'The Mountain Trip',
                    summary: 'Elementary narrative with descriptive language.',
                    text: 'Lena packed her backpack carefully: a thermos, a map, and a small notebook. The path up the mountain was steep but silent, broken only by the sound of birds surfacing from the pines.'
                },
                {
                    id: 'graded-2',
                    title: 'A Concert Memory',
                    text: 'The crowd dimmed to a hush as the pianist walked on stage. Every note shimmered through the hall, and Julian felt the wooden floor vibrate softly under his seat.'
                }
            ]
        },
        'reading-ielts': {
            id: 'reading-ielts',
            folderName: 'IELTS Reading',
            description: 'Academic passages with exam-style density.',
            cards: [
                {
                    id: 'ielts-1',
                    title: 'Urban Planning',
                    summary: 'Task 2 style paragraph.',
                    text: 'Modern cities are experimenting with “15-minute neighbourhoods,” where daily essentials can be reached on foot or by bike. Advocates argue the model reduces congestion, but critics warn it may push up rents in already desirable districts.'
                }
            ]
        },
        'reading-daily': {
            id: 'reading-daily',
            folderName: 'One Paragraph a Day',
            description: 'A micro-reading habit builder with lifestyle themes.',
            cards: [
                {
                    id: 'daily-1',
                    title: 'Mindful Breaks',
                    text: 'A mindful break can be as short as five deep breaths taken next to an open window. The goal is not to empty the mind but to notice the small details that usually slip past a busy schedule.'
                }
            ]
        }
    };

    window.READING_PACK_MAP = READING_PACK_MAP;
})();

