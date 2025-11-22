// VocaBox Configuration
// IMPORTANT: Replace these values with your actual Supabase credentials after setting up your account

const CONFIG = {
    // Supabase Configuration
    // Get these from: https://app.supabase.com -> Your Project -> Settings -> API
    supabase: {
        url: '', // e.g., 'https://your-project.supabase.co'
        anonKey: '', // e.g., 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        // Note: anonKey is safe to expose in client-side code
    },
    
    // Feature Flags
    features: {
        useSupabase: false, // Set to true after configuring Supabase
        enableCloudSync: false, // Enable cloud sync when Supabase is configured
        enableOfflineMode: true, // Always keep localStorage as fallback
        enableAudioPronunciation: true, // Enable Web Speech API for word pronunciation
    },
    
    // Audio Configuration
    audio: {
        language: 'en-US', // Language for speech synthesis
    },
    
    // Storage Configuration
    storage: {
        maxLocalStorageSize: 5 * 1024 * 1024, // 5MB warning threshold
        enableQuotaWarning: true,
    },
    
    // Subscription Tiers & Limits
    subscription: {
        tiers: {
            free: {
                name: 'Free',
                maxCards: 100,
                maxFolders: 3,
                features: {
                    basicTestModes: true,
                    exportData: true,
                    importData: true,
                    customColors: false,
                    advancedStats: false,
                    spacedRepetition: false,
                    audioPronunciation: false,
                    pdfExport: false,
                    prioritySupport: false
                }
            },
            premium: {
                name: 'Premium',
                maxCards: -1, // -1 means unlimited
                maxFolders: -1,
                price: {
                    monthly: 4.99,
                    yearly: 39.99
                },
                features: {
                    basicTestModes: true,
                    exportData: true,
                    importData: true,
                    customColors: true,
                    advancedStats: true,
                    spacedRepetition: true,
                    audioPronunciation: true,
                    pdfExport: true,
                    prioritySupport: true
                }
            },
            pro: {
                name: 'Pro',
                maxCards: -1,
                maxFolders: -1,
                price: {
                    monthly: 9.99,
                    yearly: 79.99
                },
                features: {
                    basicTestModes: true,
                    exportData: true,
                    importData: true,
                    customColors: true,
                    advancedStats: true,
                    spacedRepetition: true,
                    audioPronunciation: true,
                    pdfExport: true,
                    prioritySupport: true,
                    aiCardGeneration: true,
                    collaborativeDecks: true,
                    apiAccess: true
                }
            }
        },
        // Default tier for new users
        defaultTier: 'free'
    },
    
    // Access Code / Whitelist System
    whitelist: {
        accessCodes: [
            // Founder and test codes – I will edit these later if I want
            { code: "FOUNDER-UNLIMITED", tier: "premium", label: "Founder unlimited access" },
            { code: "STUDENT-2025-A", tier: "premium", label: "Student cohort A" }
        ]
    },
    
    // App Version
    version: '1.0.0'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

