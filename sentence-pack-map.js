(() => {
    const sentenceCards = (entries) => entries.map(entry => ({
        front: entry.cn,
        back: entry.en
    }));

    const SENTENCE_PACK_MAP = {
        'sentences-nce1': {
            id: 'sentences-nce1',
            folderId: 'pack-sentences-nce1',
            folderName: 'New Concept English 1',
            description: 'Foundational dialogues and sentence drills.',
            cards: sentenceCards([
                { cn: '他经常去图书馆。', en: 'He goes to the library frequently.' },
                { cn: '请把窗户关上。', en: 'Please close the window.' },
                { cn: '我喜欢清晨散步。', en: 'I enjoy taking walks in the early morning.' },
                { cn: '这座城市非常安静。', en: 'This city is very quiet.' },
                { cn: '她正在学开车。', en: 'She is learning how to drive.' }
            ])
        },
        'sentences-nce2': {
            id: 'sentences-nce2',
            folderId: 'pack-sentences-nce2',
            folderName: 'New Concept English 2',
            description: 'Intermediate narratives and story-based sentences.',
            cards: sentenceCards([
                { cn: '老师让我们写一篇作文。', en: 'The teacher asked us to write an essay.' },
                { cn: '飞机因暴风雨延误了。', en: 'The flight was delayed because of the storm.' },
                { cn: '音乐会在今晚八点开始。', en: 'The concert starts at eight o’clock tonight.' },
                { cn: '她带我们参观了整个工厂。', en: 'She gave us a tour around the entire factory.' },
                { cn: '我们决定在湖边露营。', en: 'We decided to camp by the lake.' }
            ])
        },
        'sentences-daily': {
            id: 'sentences-daily',
            folderId: 'pack-sentences-daily',
            folderName: 'Daily Conversations',
            description: 'Practical, daily-life sentences for quick practice.',
            cards: sentenceCards([
                { cn: '这杯咖啡多少钱？', en: 'How much is this cup of coffee?' },
                { cn: '可以帮我拿一下行李吗？', en: 'Could you help me with the luggage?' },
                { cn: '附近有地铁站吗？', en: 'Is there a subway station nearby?' },
                { cn: '我们什么时候出发？', en: 'When are we leaving?' },
                { cn: '请给我一杯冰水。', en: 'Please get me a glass of iced water.' }
            ])
        },
        'sentences-economist': {
            id: 'sentences-economist',
            folderId: 'pack-sentences-economist',
            folderName: 'Economist Sentences',
            description: 'Challenging, news-style sentences for advanced learners.',
            cards: sentenceCards([
                { cn: '政策的突然转变让投资者措手不及。', en: 'The abrupt policy shift caught investors off guard.' },
                { cn: '随着经济放缓，企业正在重新评估支出。', en: 'As the economy cools, firms are reassessing their spending.' },
                { cn: '该报告强调了技术创新的重要性。', en: 'The report underscores the importance of technological innovation.' },
                { cn: '央行暗示可能进一步降息。', en: 'The central bank hinted at the possibility of further rate cuts.' },
                { cn: '全球化的步伐在疫情后变得更加审慎。', en: 'The pace of globalisation has grown more cautious post-pandemic.' }
            ])
        }
    };

    window.SENTENCE_PACK_MAP = SENTENCE_PACK_MAP;
})();

