'use client';

import { useState, useEffect, useRef } from 'react';
import { Barlow } from 'next/font/google';
import playersData from '../data/players.json';

const barlow = Barlow({
    weight: ['400', '700', '900'],
    subsets: ['latin'],
    display: 'swap',
});

const uniqueCountries = [...new Set(playersData.map(p => p.country))].sort();
const uniqueNames = [...new Set(playersData.map(p => p.name))].sort();

const countryFlags = {
    "Algeria": "🇩🇿", "Argentina": "🇦🇷", "Australia": "🇦🇺", "Austria": "🇦🇹",
    "Belgium": "🇧🇪", "Bosnia and Herzegovina": "🇧🇦", "Brazil": "🇧🇷", "Canada": "🇨🇦",
    "Côte d'Ivoire": "🇨🇮", "DR Congo": "🇨🇩", "Colombia": "🇨🇴", "Cabo Verde": "🇨🇻",
    "Croatia": "🇭🇷", "Curaçao": "🇨🇼", "Czechia": "🇨🇿", "Ecuador": "🇪🇨",
    "Egypt": "🇪🇬", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Spain": "🇪🇸", "France": "🇫🇷",
    "Germany": "🇩🇪", "Ghana": "🇬🇭", "Haiti": "🇭🇹", "Iran": "🇮🇷",
    "Iraq": "🇮🇶", "Jordan": "🇯🇴", "Japan": "🇯🇵", "South Korea": "🇰🇷",
    "Saudi Arabia": "🇸🇦", "Morocco": "🇲🇦", "Mexico": "🇲🇽", "Netherlands": "🇳🇱",
    "Norway": "🇳🇴", "New Zealand": "🇳🇿", "Panama": "🇵🇦", "Paraguay": "🇵🇾",
    "Portugal": "🇵🇹", "Qatar": "🇶🇦", "South Africa": "🇿🇦", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "Senegal": "🇸🇳", "Switzerland": "🇨🇭", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
    "Türkiye": "🇹🇷", "Uruguay": "🇺🇾", "United States": "🇺🇸", "Uzbekistan": "🇺🇿"
};

const normalizeText = (str) => {
    if (!str) return '';
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
};

const countryAliases = {
    "usa": "United States", "us": "United States", "united states of america": "United States",
    "ivory coast": "Côte d'Ivoire", "civ": "Côte d'Ivoire",
    "democratic republic of the congo": "DR Congo", "drc": "DR Congo", "congo": "DR Congo",
    "korea republic": "South Korea", "korea": "South Korea", "kor": "South Korea",
    "turkey": "Türkiye", "tur": "Türkiye",
    "cape verde": "Cabo Verde", "cpv": "Cabo Verde",
    "bosnia": "Bosnia and Herzegovina", "bosnia & herzegovina": "Bosnia and Herzegovina", "bih": "Bosnia and Herzegovina",
    "nz": "New Zealand", "nzl": "New Zealand",
    "rsa": "South Africa", "ksa": "Saudi Arabia",
    "czech republic": "Czechia", "cze": "Czechia",
    "holland": "Netherlands", "ned": "Netherlands",
    "swiss": "Switzerland", "sui": "Switzerland",
    "eng": "England", "aus": "Australia", "arg": "Argentina", "bra": "Brazil",
    "can": "Canada", "mex": "Mexico", "ger": "Germany", "fra": "France",
    "esp": "Spain", "por": "Portugal", "jpn": "Japan", "uru": "Uruguay",
    "mar": "Morocco", "cro": "Croatia", "sen": "Senegal", "bel": "Belgium",
    "col": "Colombia", "ecu": "Ecuador", "egy": "Egypt", "gha": "Ghana",
    "hai": "Haiti", "irn": "Iran", "irq": "Iraq", "jor": "Jordan",
    "nor": "Norway", "pan": "Panama", "par": "Paraguay", "qat": "Qatar",
    "sco": "Scotland", "swe": "Sweden", "tun": "Tunisia", "uzb": "Uzbekistan",
    "alg": "Algeria", "aut": "Austria", "cuw": "Curaçao"
};

export default function GameBoard() {
    const [countryScore, setCountryScore] = useState({ correct: 0, total: 0 });
    const [nameScore, setNameScore] = useState({ correct: 0, total: 0 });

    const [countryUnseen, setCountryUnseen] = useState([]);
    const [nameUnseen, setNameUnseen] = useState([]);

    const [countryCurrent, setCountryCurrent] = useState(null);
    const [nameCurrent, setNameCurrent] = useState(null);

    const [dailyData, setDailyData] = useState({ date: '', players: [], currentIndex: 0, results: [], completed: false });
    const [shareText, setShareText] = useState("SHARE RESULTS");

    const [gameMode, setGameMode] = useState('daily');

    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [feedback, setFeedback] = useState(null);
    const [showInfo, setShowInfo] = useState(true);

    const inputRef = useRef(null);
    const ulRef = useRef(null);

    useEffect(() => {
        const initialPool = [...playersData];
        pullNext('country', initialPool);
        pullNext('name', initialPool);

        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const initDaily = () => {
            const pool = [...playersData].sort((a, b) => a.name.localeCompare(b.name));
            let hash = 0;
            for (let i = 0; i < dateStr.length; i++) hash = Math.imul(31, hash) + dateStr.charCodeAt(i) | 0;
            let seed = hash + 123456789;

            const random = () => {
                let t = seed += 0x6D2B79F5;
                t = Math.imul(t ^ t >>> 15, t | 1);
                t ^= t + Math.imul(t ^ t >>> 7, t | 61);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            };

            const selected = [];
            for (let i = 0; i < 10; i++) {
                const idx = Math.floor(random() * pool.length);
                selected.push(pool[idx]);
                pool.splice(idx, 1);
            }

            const newData = { date: dateStr, players: selected, currentIndex: 0, results: [], completed: false };
            setDailyData(newData);
            localStorage.setItem('whpf_daily', JSON.stringify(newData));
        };

        const stored = localStorage.getItem('whpf_daily');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.date === dateStr) {
                setDailyData(parsed);
            } else {
                initDaily();
            }
        } else {
            initDaily();
        }
    }, []);

    // Preload next image for Daily Mode
    useEffect(() => {
        if (gameMode === 'daily' && dailyData.players.length > 0 && dailyData.currentIndex < dailyData.players.length - 1) {
            const nextPlayer = dailyData.players[dailyData.currentIndex + 1];
            if (nextPlayer) {
                const img = new Image();
                img.src = `/headshots/person_${nextPlayer.image_number}.jpg`;
            }
        }
    }, [dailyData.currentIndex, dailyData.players, gameMode]);

    useEffect(() => {
        if (focusedIndex >= 0 && ulRef.current) {
            const li = ulRef.current.children[focusedIndex];
            if (li) li.scrollIntoView({ block: 'nearest' });
        }
    }, [focusedIndex]);

    const pullNext = (mode, overridePool = null) => {
        if (mode === 'country') {
            setCountryScore(prev => prev);
            setCountryUnseen(prevPool => {
                let pool = overridePool || prevPool;
                if (pool.length === 0) pool = [...playersData];
                const randomIndex = Math.floor(Math.random() * pool.length);
                setCountryCurrent(pool[randomIndex]);
                return pool.filter((_, idx) => idx !== randomIndex);
            });
        } else if (mode === 'name') {
            setNameUnseen(prevPool => {
                let pool = overridePool || prevPool;
                if (pool.length === 0) pool = [...playersData];
                const randomIndex = Math.floor(Math.random() * pool.length);
                setNameCurrent(pool[randomIndex]);
                return pool.filter((_, idx) => idx !== randomIndex);
            });
        }
    };

    const executeNextTurn = () => {
        if (gameMode === 'daily') {
            const nextIndex = dailyData.currentIndex + 1;
            const isDone = nextIndex >= 10;
            const updated = {
                ...dailyData,
                currentIndex: isDone ? dailyData.currentIndex : nextIndex,
                completed: isDone
            };
            setDailyData(updated);
            localStorage.setItem('whpf_daily', JSON.stringify(updated));
            setInputValue('');
            setShowDropdown(false);
            setFocusedIndex(-1);
            setFeedback(null);
            setTimeout(() => {
                if (inputRef.current && !showInfo && !isDone) inputRef.current.focus();
            }, 10);
            return;
        }

        pullNext(gameMode);
        setInputValue('');
        setShowDropdown(false);
        setFocusedIndex(-1);
        setFeedback(null);
        setTimeout(() => {
            if (inputRef.current && !showInfo) inputRef.current.focus();
        }, 10);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showInfo) {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    setShowInfo(false);
                }
                return;
            }

            if (e.key === 'Enter' && feedback !== null) {
                e.preventDefault();
                executeNextTurn();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [feedback, gameMode, showInfo, dailyData]);

    const handleModeChange = (mode) => {
        if (mode === gameMode) return;

        if (feedback !== null) {
            if (gameMode === 'daily') {
                executeNextTurn();
            } else {
                pullNext(gameMode);
            }
        }

        setGameMode(mode);
        setInputValue('');
        setShowDropdown(false);
        setFocusedIndex(-1);
        setFeedback(null);
        setTimeout(() => {
            if (inputRef.current && !showInfo) inputRef.current.focus();
        }, 10);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        setFocusedIndex(-1);

        if (value.length > 0) {
            const normalizedInput = normalizeText(value);
            const sourceList = (gameMode === 'country' || gameMode === 'daily') ? uniqueCountries : uniqueNames;

            const matches = sourceList.filter(item => {
                const normalizedItem = normalizeText(item);
                if (normalizedItem.includes(normalizedInput)) return true;

                if (gameMode === 'country' || gameMode === 'daily') {
                    for (const [aliasKey, officialName] of Object.entries(countryAliases)) {
                        if (officialName === item && aliasKey.includes(normalizedInput)) {
                            return true;
                        }
                    }
                }

                return false;
            });

            setFilteredOptions(matches);
            setShowDropdown(true);
        } else {
            setShowDropdown(false);
        }
    };

    const handleInputKeyDown = (e) => {
        if (!showDropdown || filteredOptions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
    };

    const submitGuess = (guess) => {
        if (!guess) return;

        const activeCurrent = gameMode === 'daily' ? dailyData.players[dailyData.currentIndex] : (gameMode === 'country' ? countryCurrent : nameCurrent);
        const normalizedGuess = normalizeText(guess);
        const actualValue = (gameMode === 'country' || gameMode === 'daily') ? activeCurrent.country : activeCurrent.name;
        const normalizedActual = normalizeText(actualValue);

        let resolvedGuess = normalizedGuess;
        if ((gameMode === 'country' || gameMode === 'daily') && countryAliases[normalizedGuess]) {
            resolvedGuess = normalizeText(countryAliases[normalizedGuess]);
        }

        const isCorrect = resolvedGuess === normalizedActual;

        if (gameMode === 'daily') {
            const updatedResults = [...dailyData.results, { correct: isCorrect }];
            const updated = { ...dailyData, results: updatedResults };
            setDailyData(updated);
            localStorage.setItem('whpf_daily', JSON.stringify(updated));

            const officialMatch = uniqueCountries.find(c => normalizeText(c) === resolvedGuess);
            const displayCountry = isCorrect ? activeCurrent.country : (officialMatch || guess);
            let uppercaseDisplay = displayCountry.toUpperCase();
            if (displayCountry === "Türkiye") uppercaseDisplay = "TÜRKİYE";
            const flag = countryFlags[displayCountry] ? `${countryFlags[displayCountry]} ` : '';
            setInputValue(`${flag}${uppercaseDisplay}`);

        } else if (gameMode === 'country') {
            setCountryScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));

            const officialMatch = uniqueCountries.find(c => normalizeText(c) === resolvedGuess);
            const displayCountry = isCorrect ? activeCurrent.country : (officialMatch || guess);
            let uppercaseDisplay = displayCountry.toUpperCase();
            if (displayCountry === "Türkiye") uppercaseDisplay = "TÜRKİYE";
            const flag = countryFlags[displayCountry] ? `${countryFlags[displayCountry]} ` : '';
            setInputValue(`${flag}${uppercaseDisplay}`);

        } else {
            setNameScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }));

            const officialMatch = uniqueNames.find(n => normalizeText(n) === resolvedGuess);
            setInputValue(isCorrect ? activeCurrent.name.toUpperCase() : (officialMatch || guess).toUpperCase());
        }

        setShowDropdown(false);
        setFocusedIndex(-1);
        setFeedback(isCorrect ? 'correct' : 'incorrect');
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (!inputValue.trim()) return;

        const normInput = normalizeText(inputValue);
        let exactMatch = null;

        if (gameMode === 'country' || gameMode === 'daily') {
            if (countryAliases[normInput]) {
                exactMatch = countryAliases[normInput];
            } else {
                exactMatch = uniqueCountries.find(c => normalizeText(c) === normInput);
            }
        } else {
            exactMatch = uniqueNames.find(n => normalizeText(n) === normInput);
        }

        let guessToSubmit = exactMatch;

        if (!guessToSubmit && showDropdown && filteredOptions.length > 0) {
            guessToSubmit = focusedIndex >= 0 ? filteredOptions[focusedIndex] : filteredOptions[0];
        }

        if (!guessToSubmit) return;

        submitGuess(guessToSubmit);
    };

    const handleShare = () => {
        const emojis = dailyData.results.map(r => (r.correct ? '🟩' : '🟥'));
        const squares = `${emojis.slice(0, 5).join('')}\n${emojis.slice(5, 10).join('')}`;
        const score = dailyData.results.filter(r => r.correct).length;
        const text = `who he play for? world cup edition\nwhoheplayfor.pranayvarada.com\n${dailyData.date}\n${score}/10\n\n${squares}`;
        navigator.clipboard.writeText(text);
        setShareText("COPIED!");
        setTimeout(() => setShareText("SHARE RESULTS"), 2000);
    };

    if (!countryCurrent || !nameCurrent || (gameMode === 'daily' && dailyData.players.length === 0)) {
        return <div className={`h-screen flex items-center justify-center bg-[#F8F9FA] text-[#0A192F] font-black text-2xl ${barlow.className}`}>LOADING...</div>;
    }

    const activeCurrent = gameMode === 'daily' ? dailyData.players[dailyData.currentIndex] : (gameMode === 'country' ? countryCurrent : nameCurrent);
    const activeScore = gameMode === 'country' ? countryScore : nameScore;

    return (
        <div className={`min-h-[100dvh] w-full bg-[#F8F9FA] text-[#0A192F] overflow-x-hidden flex flex-col items-center select-none ${barlow.className}`}>

            {showInfo && (
                <div className="absolute inset-0 z-50 bg-[#F8F9FA]/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-[#0A192F] p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative max-h-[95vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">

                        <div className="text-center shrink-0 mb-4 border-b-2 border-gray-100 pb-4">
                            <h1 className="text-3xl font-black italic leading-none flex flex-col items-center">
                                <div className="flex justify-center items-baseline lowercase text-[#0A192F]">
                                    <span>who he play for<span className="text-[#E63946] font-sans">?</span></span>
                                </div>
                                <div className="text-[#E63946] font-black tracking-widest text-xs lowercase mt-1">
                                    world cup edition
                                </div>
                            </h1>
                        </div>

                        <p className="text-sm font-bold text-[#0A192F]/80 mb-6 leading-relaxed px-2">
                            Do you know your 2026 FIFA World Cup players? Test your knowledge in this game inspired by the popular <i className="font-black">Inside the NBA</i> segment.
                        </p>

                        <h2 className="text-xl font-black italic mb-4 text-[#0A192F]">HOW TO PLAY</h2>
                        <div className="text-sm sm:text-base font-bold space-y-3 mb-6 text-left px-2 text-[#0A192F]">
                            <p>1. Look at the player's headshot.</p>
                            <p>2. Depending on the mode, guess which country they represent OR guess their name.</p>
                            <p>3. Type your answer and select from the dropdown, or hit Enter.</p>
                        </div>

                        <button
                            onClick={() => {
                                setShowInfo(false);
                                if (inputRef.current && !feedback && !(gameMode === 'daily' && dailyData.completed)) inputRef.current.focus();
                            }}
                            className="w-full bg-[#0A192F] text-white font-black uppercase tracking-widest px-6 py-4 hover:bg-[#E63946] transition-colors border-2 border-[#0A192F] focus:outline-none"
                        >
                            Let's Go
                        </button>

                        <div className="mt-8 pt-4 border-t-2 border-gray-100 text-[10px] sm:text-xs text-[#0A192F]/70 font-bold space-y-1">
                            <p>A game by <a href="https://www.pranayvarada.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#E63946]">Pranay Varada</a></p>
                            <p>Player data from <a href="https://www.kaggle.com/datasets/swaptr/fifa-wc-2026-players?resource=download" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#E63946]">Kaggle</a> and <a href="https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-English.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#E63946]">FIFA</a></p>
                            <p>Player headshots from <a href="https://www.youtube.com/watch?v=9uYdjmNwcMg" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#E63946]">SBS Sport on YouTube</a></p>
                        </div>

                    </div>
                </div>
            )}

            <div className="w-full max-w-md px-4 h-full flex flex-col pt-6 pb-6 md:pt-16 md:pb-16 relative z-10 flex-1">

                <div className="text-center shrink-0 mb-4">
                    <h1 className="text-4xl md:text-5xl font-black italic leading-none flex flex-col items-center">
                        <div className="flex justify-center items-baseline lowercase text-[#0A192F]">
                            <span>who he play for<span className="text-[#E63946] font-sans">?</span></span>
                        </div>
                        <div className="flex justify-center items-center gap-2 mt-1">
                            <div className="text-[#E63946] font-black tracking-widest text-sm md:text-base lowercase">
                                world cup edition
                            </div>
                            <button
                                onClick={() => setShowInfo(true)}
                                className="w-5 h-5 bg-white border-2 border-[#0A192F] text-[#0A192F] font-black not-italic text-xs flex items-center justify-center rounded-full hover:bg-[#E2E8F0] transition-colors leading-none pb-[1px] focus:outline-none"
                                aria-label="How to play"
                            >
                                i
                            </button>
                        </div>
                    </h1>
                </div>

                <div className="w-max mx-auto mb-6 rounded-full bg-[#0A192F] p-[2px] shrink-0">
                    <div className="flex bg-[#E2E8F0] p-1 rounded-full relative">
                        <button
                            onClick={() => handleModeChange('daily')}
                            className={`px-4 py-1.5 !rounded-full text-xs font-black uppercase tracking-wider transition-colors appearance-none outline-none focus:outline-none ${gameMode === 'daily' ? 'bg-[#0A192F] text-white' : 'bg-transparent hover:bg-transparent text-[#64748B] hover:text-[#0A192F]'}`}
                        >
                            Daily 10
                        </button>
                        <button
                            onClick={() => handleModeChange('country')}
                            className={`px-4 py-1.5 !rounded-full text-xs font-black uppercase tracking-wider transition-colors appearance-none outline-none focus:outline-none ${gameMode === 'country' ? 'bg-[#0A192F] text-white' : 'bg-transparent hover:bg-transparent text-[#64748B] hover:text-[#0A192F]'}`}
                        >
                            Country
                        </button>
                        <button
                            onClick={() => handleModeChange('name')}
                            className={`px-4 py-1.5 !rounded-full text-xs font-black uppercase tracking-wider transition-colors appearance-none outline-none focus:outline-none ${gameMode === 'name' ? 'bg-[#0A192F] text-white' : 'bg-transparent hover:bg-transparent text-[#64748B] hover:text-[#0A192F]'}`}
                        >
                            Name
                        </button>
                    </div>
                </div>

                {gameMode === 'daily' && dailyData.completed ? (

                    <div className="flex-1 flex flex-col items-center justify-center w-full bg-white border-4 border-[#0A192F] p-4 sm:p-6 mt-4 shadow-xl mb-6">
                        <h2 className="text-3xl md:text-4xl font-black italic mb-1 text-[#0A192F] tracking-tight">RESULTS</h2>
                        <p className="text-sm font-bold text-[#64748B] mb-4 uppercase tracking-widest">{dailyData.date}</p>

                        <div className="text-6xl font-black text-[#0A192F] mb-6 leading-none">
                            {dailyData.results.filter(r => r.correct).length} <span className="text-3xl text-[#64748B]">/ 10</span>
                        </div>

                        <div className="w-full max-h-[30vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 border-2 border-[#E2E8F0] p-2 mb-6">
                            {dailyData.players.map((p, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 py-2.5 px-2 last:border-0 gap-1">
                                    <span className="font-bold text-[#0A192F] text-sm uppercase leading-tight line-clamp-1">{i + 1}. {p.name}</span>
                                    <span className="font-bold text-[#64748B] text-xs uppercase shrink-0">
                                        {dailyData.results[i]?.correct ? '✅' : '❌'} {countryFlags[p.country]} {p.country}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleShare}
                            className="w-full bg-[#0A192F] text-white font-black uppercase tracking-widest px-6 py-4 hover:bg-[#3B82F6] transition-colors border-2 border-[#0A192F] focus:outline-none"
                        >
                            {shareText}
                        </button>
                    </div>

                ) : (

                    <>
                        <div className="flex flex-col items-center shrink-0 mb-6">
                            <img
                                src={`/headshots/person_${activeCurrent.image_number}.jpg`}
                                alt="Player Headshot"
                                className="w-[22vh] h-[28vh] max-w-[200px] max-h-[260px] min-w-[130px] min-h-[170px] object-cover border-4 border-[#0A192F]"
                            />

                            <h2 className="text-3xl md:text-4xl font-black mt-4 text-[#0A192F] tracking-wide uppercase text-center leading-tight px-2">
                                {gameMode === 'country' || gameMode === 'daily' || feedback !== null ? activeCurrent.name : "???"}
                            </h2>

                            {gameMode === 'name' && feedback !== null && (
                                <p className="text-lg font-bold text-[#64748B] uppercase tracking-widest mt-1">
                                    {countryFlags[activeCurrent.country] || ''} {activeCurrent.country === "Türkiye" ? "TÜRKİYE" : activeCurrent.country.toUpperCase()}
                                </p>
                            )}

                        </div>

                        <div className="relative shrink-0 w-full z-20">
                            {!feedback ? (
                                <div className="relative w-full h-[72px]">
                                    <form onSubmit={handleFormSubmit} className="h-full w-full absolute top-0 left-0">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onKeyDown={handleInputKeyDown}
                                            placeholder={`TYPE ${gameMode === 'country' || gameMode === 'daily' ? 'COUNTRY' : 'NAME'}...`}
                                            className="bg-white border-4 border-[#0A192F] p-4 h-full w-full block text-[#0A192F] font-bold text-lg uppercase placeholder-gray-400 focus:outline-none focus:border-[#3B82F6] transition-colors"
                                            disabled={feedback !== null || showInfo}
                                            autoComplete="off"
                                        />
                                    </form>

                                    {showDropdown && !showInfo && (
                                        <ul
                                            ref={ulRef}
                                            className="absolute left-0 right-0 top-full w-full bg-white border-4 border-[#0A192F] border-t-0 shadow-xl max-h-[25vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-white"
                                        >
                                            {filteredOptions.length > 0 ? (
                                                filteredOptions.map((item, index) => (
                                                    <li
                                                        key={item}
                                                        onClick={() => submitGuess(item)}
                                                        className={`px-4 py-3 cursor-pointer font-bold border-b border-gray-200 last:border-b-0 transition-colors uppercase ${index === focusedIndex
                                                                ? 'bg-[#0A192F] text-white'
                                                                : 'hover:bg-[#0A192F] hover:text-white text-[#0A192F]'
                                                            }`}
                                                    >
                                                        {gameMode === 'country' || gameMode === 'daily'
                                                            ? `${countryFlags[item] || ""} ${item === "Türkiye" ? "TÜRKİYE" : item.toUpperCase()}`
                                                            : item.toUpperCase()
                                                        }
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-4 py-3 text-gray-400 font-bold italic uppercase">NO DATA...</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <div className={`min-h-[72px] py-2 w-full border-4 flex items-center justify-between px-4 ${feedback === 'correct' ? 'bg-[#2A9D8F] border-[#0A192F] text-white' : 'bg-[#E63946] border-[#0A192F] text-white'}`}>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="font-black text-lg sm:text-xl uppercase tracking-wider leading-tight">
                                            {feedback === 'correct'
                                                ? 'CORRECT'
                                                : ((gameMode === 'country' || gameMode === 'daily')
                                                    ? `${countryFlags[activeCurrent.country] || ''} ${activeCurrent.country === "Türkiye" ? "TÜRKİYE" : activeCurrent.country.toUpperCase()}`
                                                    : 'INCORRECT'
                                                )
                                            }
                                        </p>
                                    </div>
                                    <button
                                        onClick={executeNextTurn}
                                        className="shrink-0 font-black uppercase tracking-widest px-4 py-2 transition-colors flex items-center gap-2 text-sm sm:text-base border-2 bg-[#0A192F] text-white hover:bg-white hover:text-[#0A192F] border-[#0A192F] focus:outline-none"
                                    >
                                        NEXT <span className="hidden sm:inline opacity-75 ml-1">⏎</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto shrink-0 pt-10 pb-4 md:pt-4 border-t-4 border-transparent z-10 w-full">
                            {gameMode === 'daily' ? (
                                <div className="flex justify-center items-center gap-1.5 sm:gap-2 pt-4 border-t-4 border-[#0A192F] w-full mt-4">
                                    {[...Array(10)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-6 h-6 sm:w-7 sm:h-7 border-2 border-[#0A192F] ${i < dailyData.results.length
                                                    ? (dailyData.results[i].correct ? 'bg-[#2A9D8F]' : 'bg-[#E63946]')
                                                    : (i === dailyData.currentIndex ? 'bg-[#3B82F6] animate-pulse' : 'bg-transparent')
                                                }`}
                                        ></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex justify-center items-center gap-10 pb-2 border-t-4 border-[#0A192F] pt-4">
                                    <div className="text-center">
                                        <p className="text-sm text-[#E63946] font-black uppercase tracking-widest mb-0.5">Score</p>
                                        <p className="text-5xl font-black text-[#0A192F] leading-none">{activeScore.correct}</p>
                                    </div>
                                    <div className="text-5xl font-black text-[#64748B] leading-none">-</div>
                                    <div className="text-center">
                                        <p className="text-sm text-[#0A192F] font-black uppercase tracking-widest mb-0.5">Played</p>
                                        <p className="text-5xl font-black text-[#0A192F] leading-none">{activeScore.total}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}