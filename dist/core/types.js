"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_OPTIONS = void 0;
exports.getPlatformBadge = getPlatformBadge;
exports.getPlatformFullName = getPlatformFullName;
exports.PLATFORM_OPTIONS = [
    { id: 'PC_STEAM', category: 'PC', name: 'PC – Steam', badge: 'Steam', placeholder: 'Steam Profilname' },
    { id: 'PC_EA', category: 'PC', name: 'PC – EA App', badge: 'EA App', placeholder: 'EA App Name' },
    { id: 'PC_XBOX', category: 'PC', name: 'PC – Xbox App', badge: 'Xbox PC', placeholder: 'Xbox Gamertag' },
    { id: 'PC_EPIC', category: 'PC', name: 'PC – Epic Games', badge: 'Epic', placeholder: 'Epic Games Name' },
    { id: 'PLAYSTATION', category: 'CONSOLE', name: 'PlayStation (PSN)', badge: 'PSN', placeholder: 'PSN Online-ID' },
    { id: 'XBOX', category: 'CONSOLE', name: 'Xbox Series X/S / One', badge: 'Xbox', placeholder: 'Xbox Gamertag' },
];
function getPlatformBadge(platform) {
    switch (platform) {
        case 'PC_STEAM': return 'Steam';
        case 'PC_EA': return 'EA App';
        case 'PC_XBOX': return 'Xbox PC';
        case 'PC_EPIC': return 'Epic';
        case 'PLAYSTATION':
        case 'PS5': return 'PSN';
        case 'XBOX': return 'Xbox';
        default: return platform || 'PC';
    }
}
function getPlatformFullName(platform) {
    const match = exports.PLATFORM_OPTIONS.find((p) => p.id === platform);
    return match ? match.name : (platform || 'PC');
}
