import { ComputerDesktopIcon } from "@heroicons/react/24/solid/index.js";
import { useState } from "react";

const SPORTS_OPTIONS = [
    { key: 'nfl' as const, label: 'NFL', icon: "🏈" },
    { key: 'nba' as const, label: 'NBA', icon: "🏀" },
    { key: 'mlb' as const, label: 'MLB', icon: "⚾" },
    { key: 'nhl' as const, label: 'NHL', icon: "🏒" }
];

const STOCK_PRESETS = [
    { key: 'sp500', label: 'S&P 500' },
    { key: 'nasdaq', label: 'NASDAQ' },
    { key: 'dow', label: 'Dow Jones' }
];

const CRYPTO_PRESETS = [
    { key: 'top10', label: 'Top 10' },
    { key: 'defi', label: 'DeFi Coins' },
    { key: 'meme', label: 'Meme Coins' }
];

export default function DisplayTab() {
    const [selectedSports, setSelectedSports] = useState({
        nfl: true,
        nba: false,
        mlb: true,
        nhl: false
    });

    const [financeSettings, setFinanceSettings] = useState({
        stocks: {
            enabled: true,
            activePreset: 'sp500'
        },
        crypto: {
            enabled: false,
            activePreset: null
        }
    });

    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customModalType, setCustomModalType] = useState('');

    const toggleSport = (sport: keyof typeof selectedSports) => {
        setSelectedSports(prev => ({
            ...prev,
            [sport]: !prev[sport]
        }));
    };

    const toggleFinanceCategory = (category: 'stocks' | 'crypto') => {
        setFinanceSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                enabled: !prev[category].enabled
            }
        }));
    };

    const selectPreset = (category: 'stocks' | 'crypto', preset: string) => {
        setFinanceSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                activePreset: preset
            }
        }));
    };

    const openCustomModal = (type: string) => {
        setCustomModalType(type);
        setShowCustomModal(true);
    };

    return (
        <>
            <label className="tab">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 2"/>
                <ComputerDesktopIcon className="size-8"/>
            </label>
            <div className="tab-content bg-base-100 border-base-300 p-6 space-y-6">
                {/* Sports Section */}
                <fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-full border p-4">
                    <legend className="fieldset-legend text-lg">Sports</legend>
                    <div className="grid grid-cols-2 gap-4">
                        {SPORTS_OPTIONS.map(sport => (
                            <label key={sport.key} className={`${!selectedSports[sport.key] ? 'text-base-content/50' : 'text-base-content'} .label btn btn-ghost justify-between flex items-center`}>
                                {sport.icon} {sport.label}
                                <input
                                    type="checkbox"
                                    className="toggle"
                                    checked={selectedSports[sport.key]}
                                    onChange={() => toggleSport(sport.key)}
                                />
                            </label>
                        ))}
                    </div>
                </fieldset>

                {/* Finance Section */}
                <fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-full border p-4">
                    <legend className="fieldset-legend text-lg">Finance</legend>

                    {/* Main toggles */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Stock Options */}
                        <div className="">
                            <label className={`${!financeSettings.stocks.enabled ? 'text-base-content/50' : 'text-base-content'} .label btn btn-ghost justify-between flex items-center`}>
                                📈 Stocks
                                <input
                                    type="checkbox"
                                    className="toggle"
                                    checked={financeSettings.stocks.enabled}
                                    onChange={() => toggleFinanceCategory('stocks')}
                                />
                            </label>
                            {financeSettings.stocks.enabled && (
                                    <div className="space-y-2 p-4">
                                        {STOCK_PRESETS.map(preset => (
                                            <label key={preset.key} className={`${financeSettings.stocks.activePreset === preset.key ? 'text-base-content' : 'text-base-content/50'} label cursor-pointer justify-start gap-3`}>
                                                <input
                                                    type="radio"
                                                    name="stock-preset"
                                                    className="radio radio-sm"
                                                    checked={financeSettings.stocks.activePreset === preset.key}
                                                    onChange={() => selectPreset('stocks', preset.key)}
                                                />
                                                <span className="label-text">{preset.label}</span>
                                            </label>
                                        ))}
                                        <label className="label cursor-pointer justify-start gap-3">
                                            <input
                                                type="radio"
                                                name="stock-preset"
                                                className="radio radio-sm"
                                                checked={financeSettings.stocks.activePreset === 'custom'}
                                                onChange={() => selectPreset('stocks', 'custom')}
                                            />
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={() => openCustomModal('stocks')}
                                            >
                                                Custom
                                            </button>
                                        </label>
                                </div>
                            )}
                        </div>

                        {/* Crypto Options */}
                        <div>
                            <label className={`${!financeSettings.crypto.enabled ? 'text-base-content/50' : 'text-base-content'} .label btn btn-ghost justify-between flex items-center`}>
                                ₿ Crypto
                                <input
                                    type="checkbox"
                                    className="toggle"
                                    checked={financeSettings.crypto.enabled}
                                    onChange={() => toggleFinanceCategory('crypto')}
                                />
                            </label>

                        {financeSettings.crypto.enabled && (
                                <div className="space-y-2 p-4">
                                    {CRYPTO_PRESETS.map(preset => (
                                        <label key={preset.key} className={`${financeSettings.crypto.activePreset === preset.key ? 'text-base-content' : 'text-base-content/50'} label cursor-pointer justify-start gap-3`}>
                                            <input
                                                type="radio"
                                                name="crypto-preset"
                                                className="radio radio-sm"
                                                checked={financeSettings.crypto.activePreset === preset.key}
                                                onChange={() => selectPreset('crypto', preset.key)}
                                            />
                                            <span className="label-text">{preset.label}</span>
                                        </label>
                                    ))}
                                    <label className="label cursor-pointer justify-start gap-3">
                                        <input
                                            type="radio"
                                            name="crypto-preset"
                                            className="radio radio-sm"
                                            checked={financeSettings.crypto.activePreset === 'custom'}
                                            onChange={() => selectPreset('crypto', 'custom')}
                                        />
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => openCustomModal('crypto')}
                                        >
                                            Custom
                                        </button>
                                    </label>
                                </div>
                        )}
                        </div>
                    </div>
                </fieldset>

                {/* Simple Custom Modal */}
                <dialog className={`modal ${showCustomModal ? 'modal-open' : ''}`}>
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Select Custom {customModalType}</h3>
                        <p className="py-4">Custom selection for {customModalType} will go here...</p>
                        <div className="modal-action">
                            <button className="btn" onClick={() => setShowCustomModal(false)}>Close</button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowCustomModal(false)}></div>
                </dialog>
            </div>
        </>
    );
}