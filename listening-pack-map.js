(() => {
    const listeningCards = (entries) => entries.map(entry => ({
        front: `
            <div class="listening-card-front">
                <p class="listening-title">${entry.title || 'Listening Clip'}</p>
                <audio controls preload="none" class="listening-audio">
                    <source src="${entry.audioUrl}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                <p class="listening-hint">Tap to reveal transcript</p>
            </div>
        `,
        back: `
            <div class="listening-card-back">
                <p class="listening-transcript">${entry.transcript}</p>
                ${entry.translation ? `<p class="listening-translation">${entry.translation}</p>` : ''}
            </div>
        `
    }));

    const LISTENING_PACK_MAP = {
        'listening-clips': {
            id: 'listening-clips',
            folderId: 'pack-listening-clips',
            folderName: 'Short Clips',
            description: 'Quick listening bites for warm-ups.',
            cards: listeningCards([
                {
                    title: 'Morning Routine',
                    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_fa0a8705a6.mp3?filename=morning-routine-20393.mp3',
                    transcript: 'Every morning I wake up at dawn, brew a cup of coffee, and read the news before heading to work.',
                    translation: '每天清晨我黎明即起，煮好咖啡，读一会儿新闻，然后出门上班。'
                },
                {
                    title: 'City Sounds',
                    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/09/27/audio_3c2f2b77d6.mp3?filename=street-city-ambient-10273.mp3',
                    transcript: 'The city never truly sleeps; even at midnight, you can hear distant conversations and taxis rushing by.',
                    translation: '城市从未真正入睡；即使在午夜，你仍能听到远处的交谈声和疾驰而过的出租车。'
                }
            ])
        },
        'listening-ielts': {
            id: 'listening-ielts',
            folderId: 'pack-listening-ielts',
            folderName: 'IELTS Listening',
            description: 'Section-based IELTS practice tracks.',
            cards: listeningCards([
                {
                    title: 'Library Orientation',
                    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_d92f9d19bb.mp3?filename=announcement-6673.mp3',
                    transcript: 'Welcome to the university library. Today I will explain how to locate reference books and reserve study rooms.',
                    translation: '欢迎来到大学图书馆。今天我将介绍如何查找参考书以及预订自习室。'
                },
                {
                    title: 'Student Survey',
                    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/18/audio_8d7d7cbdc0.mp3?filename=survey-call-20611.mp3',
                    transcript: 'We are conducting a short survey about campus transport. Do you usually walk, bike, or take the shuttle?',
                    translation: '我们正在进行一项关于校园交通的简短调查。你通常步行、骑车还是乘坐校车？'
                }
            ])
        },
        'listening-toefl': {
            id: 'listening-toefl',
            folderId: 'pack-listening-toefl',
            folderName: 'TOEFL Listening',
            description: 'Lecture-style audio for TOEFL practice.',
            cards: listeningCards([
                {
                    title: 'Arctic Ecosystems',
                    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/20/audio_efb972d4b8.mp3?filename=lecture-snippet-112233.mp3',
                    transcript: 'In the Arctic, species survival depends on layers of ice that form stable hunting grounds for polar bears and seals.',
                    translation: '在北极，物种生存依赖于形成稳定猎场的冰层，北极熊和海豹都在其上觅食。'
                },
                {
                    title: 'Art History Seminar',
                    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/11/15/audio_dfdff5f847.mp3?filename=lecture-snippet-7744.mp3',
                    transcript: 'During the Renaissance, artists rediscovered perspective, allowing paintings to gain depth and realism.',
                    translation: '在文艺复兴时期，艺术家重新发现了透视法，使绘画具有更强的深度和写实感。'
                }
            ])
        },
        'listening-daily': {
            id: 'listening-daily',
            folderId: 'pack-listening-daily',
            folderName: 'Daily Listening Practice',
            description: 'News clips and lifestyle content.',
            cards: listeningCards([
                {
                    title: 'Weather Update',
                    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/11/23/audio_665fbf6c84.mp3?filename=weather-briefing-8989.mp3',
                    transcript: 'Expect scattered showers this afternoon but clear skies by evening, with temperatures dropping to 12 degrees.',
                    translation: '预计今天下午有零星阵雨，傍晚放晴，气温下降到12摄氏度。'
                },
                {
                    title: 'Healthy Eating Tip',
                    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/04/19/audio_61c86342d6.mp3?filename=health-tip-14976.mp3',
                    transcript: 'Add leafy greens to your breakfast smoothies to boost fiber intake without sacrificing taste.',
                    translation: '在早餐奶昔中加入绿叶蔬菜，可以在不牺牲口感的情况下提高膳食纤维摄入。'
                }
            ])
        }
    };

    window.LISTENING_PACK_MAP = LISTENING_PACK_MAP;
})();

