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

const STOCK_OPTIONS = [
    { key: 'AAPL', label: 'Apple Inc.', enabled: true },
    { key: 'MSFT', label: 'Microsoft Corporation', enabled: true },
    { key: 'GOOGL', label: 'Alphabet Inc.', enabled: true },
    { key: 'AMZN', label: 'Amazon.com Inc.', enabled: false },
    { key: 'TSLA', label: 'Tesla Inc.', enabled: true },
    { key: 'META', label: 'Meta Platforms Inc.', enabled: false },
    { key: 'NVDA', label: 'NVIDIA Corporation', enabled: true },
    { key: 'NFLX', label: 'Netflix Inc.', enabled: false },
    { key: 'JPM', label: 'JPMorgan Chase & Co.', enabled: true },
    { key: 'JNJ', label: 'Johnson & Johnson', enabled: false },
    { key: 'V', label: 'Visa Inc.', enabled: true },
    { key: 'PG', label: 'Procter & Gamble Co.', enabled: false },
    { key: 'UNH', label: 'UnitedHealth Group Inc.', enabled: true },
    { key: 'HD', label: 'The Home Depot Inc.', enabled: false },
    { key: 'MA', label: 'Mastercard Inc.', enabled: true },
    { key: 'PYPL', label: 'PayPal Holdings Inc.', enabled: false },
    { key: 'DIS', label: 'The Walt Disney Company', enabled: true },
    { key: 'ADBE', label: 'Adobe Inc.', enabled: false },
    { key: 'CRM', label: 'Salesforce Inc.', enabled: true },
    { key: 'INTC', label: 'Intel Corporation', enabled: false },
    { key: 'AMD', label: 'Advanced Micro Devices Inc.', enabled: true },
    { key: 'CSCO', label: 'Cisco Systems Inc.', enabled: false },
    { key: 'PFE', label: 'Pfizer Inc.', enabled: true },
    { key: 'KO', label: 'The Coca-Cola Company', enabled: false },
    { key: 'WMT', label: 'Walmart Inc.', enabled: true }
];

type CustomStockSelections = Record<string, boolean>;

export default function SettingsTab() {
    const [selectedSports, setSelectedSports] = useState({
        nfl: true,
        nba: false,
        mlb: true,
        nhl: false
    });

    const [financeSettings, setFinanceSettings] = useState({
        stocks: {
            enabled: false,
            activePreset: null as string | null
        },
        crypto: {
            enabled: false,
            activePreset: null as string | null
        }
    });

    const [customStockSelections, setCustomStockSelections] = useState<CustomStockSelections>(
        STOCK_OPTIONS.reduce((acc, option) => ({
            ...acc,
            [option.key]: option.enabled
        }), {})
    );

    const [stockSearchTerm, setStockSearchTerm] = useState('');

    const toggleStockSelection = (stockKey: string) => {
        setCustomStockSelections(prev => ({
            ...prev,
            [stockKey]: !prev[stockKey]
        }));
    };

    // Function to get selected stocks for display/API calls
    const getSelectedStocks = () => {
        return Object.entries(customStockSelections)
            .filter(([, enabled]) => enabled)
            .map(([key]) => key);
    };

    // Function to reset selections to defaults
    const resetStockSelections = () => {
        setCustomStockSelections(
            STOCK_OPTIONS.reduce((acc, option) => ({
                ...acc,
                [option.key]: option.enabled
            }), {})
        );
    };

    // Function to select/deselect all
    const toggleAllStocks = (selectAll: boolean) => {
        setCustomStockSelections(
            STOCK_OPTIONS.reduce((acc, option) => ({
                ...acc,
                [option.key]: selectAll
            }), {})
        );
    };

    // Filter stocks based on search term
    const filteredStocks = STOCK_OPTIONS.filter(stock =>
        stock.label.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
        stock.key.toLowerCase().includes(stockSearchTerm.toLowerCase())
    );

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

    return (
        <>
            <label className="tab">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 2"/>
                <ComputerDesktopIcon className="size-8"/>
            </label>
            <div className="tab-content bg-base-100 border-base-300 p-2 space-y-6 overflow-hidden max-h-120">
                <div className="overflow-y-auto p-2 h-110">
                    {/* Sports Section */}
                    <fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-full border p-4">
                        <legend className="fieldset-legend text-lg">Sports</legend>
                        <div className="grid grid-cols-2 gap-4">
                            {SPORTS_OPTIONS.map(sport => (
                                <label key={sport.key}
                                       className={`${!selectedSports[sport.key] ? 'text-base-content/50' : 'text-base-content'} .label btn btn-ghost justify-between flex items-center`}>
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
                                <label
                                    className={`${!financeSettings.stocks.enabled ? 'text-base-content/50' : 'text-base-content'} .label btn btn-ghost justify-between flex items-center`}>
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
                                            <label key={preset.key}
                                                   className={`${financeSettings.stocks.activePreset === preset.key ? 'text-base-content' : 'text-base-content/50'} label cursor-pointer justify-start gap-3`}>
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
                                                className="btn btn-outline"
                                                onClick={() => {
                                                    const dialog = document.getElementById('my_modal_stocks') as HTMLDialogElement | null;
                                                    dialog?.showModal();
                                                }}
                                            >
                                                {getSelectedStocks().length} selected
                                            </button>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Crypto Options */}
                            <div>
                                <label
                                    className={`${!financeSettings.crypto.enabled ? 'text-base-content/50' : 'text-base-content'} .label btn btn-ghost justify-between flex items-center`}>
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
                                            <label key={preset.key}
                                                   className={`${financeSettings.crypto.activePreset === preset.key ? 'text-base-content' : 'text-base-content/50'} label cursor-pointer justify-start gap-3`}>
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
                                                className="btn"
                                                onClick={() => {
                                                    const dialog = document.getElementById('my_modal_crypto') as HTMLDialogElement | null;
                                                    dialog?.showModal();
                                                }}
                                            >
                                                Custom
                                            </button>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="fieldset bg-base-100 border-base-300 space-y-2 rounded-box w-full border p-4">
                        <legend className="fieldset-legend text-lg">Fantasy <span
                            className="text-base-content/50 text-sm italic">*coming soon*</span></legend>
                        <label className="floating-label">
                            <input type="text" placeholder="Name" className="input input-md"/>
                            <span>Name</span>
                        </label>
                        <label className="floating-label">
                            <input type="text" placeholder="Link" className="input input-md"/>
                            <span>Link</span>
                        </label>
                        <button className="btn btn-sm">Add to collection</button>
                    </fieldset>

                    <fieldset className="fieldset bg-base-100 border-base-300 space-y-2 rounded-box w-full border p-4">
                        <legend className="fieldset-legend text-lg">RSS <span
                            className="text-base-content/50 text-sm italic">*coming soon*</span></legend>
                        <label className="floating-label">
                            <input type="text" placeholder="Name" className="input input-md"/>
                            <span>Name</span>
                        </label>
                        <label className="floating-label">
                            <input type="text" placeholder="Link" className="input input-md"/>
                            <span>Link</span>
                        </label>
                        <button className="btn btn-sm">Add to collection</button>
                    </fieldset>
                </div>
            </div>

            <dialog id="my_modal_stocks" className="modal">
                <div className="modal-box max-w-2xl">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <h3 className="font-bold text-lg">Custom Stock Selection</h3>

                    {/* Search Input */}
                    <div className="form-control w-full my-4">
                        <input
                            type="text"
                            placeholder="Search stocks by name or symbol..."
                            className="input input-bordered w-full"
                            value={stockSearchTerm}
                            onChange={(e) => setStockSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 mb-4">
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => toggleAllStocks(true)}
                        >
                            Select All
                        </button>
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => toggleAllStocks(false)}
                        >
                            Deselect All
                        </button>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={resetStockSelections}
                        >
                            Reset to Default
                        </button>
                        {stockSearchTerm && (
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => setStockSearchTerm('')}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {filteredStocks.length === 0 ? (
                            <div className="text-center text-base-content/50 py-4">
                                No stocks found matching "{stockSearchTerm}"
                            </div>
                        ) : (
                            filteredStocks.map((option) => (
                                <label
                                    key={option.key}
                                    className={`${customStockSelections[option.key] ? 'bg-base-200' : 'bg-base-200/50'} label cursor-pointer justify-start gap-3 btn btn-ghost text-left`}
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={customStockSelections[option.key] || false}
                                        onChange={() => toggleStockSelection(option.key)}
                                    />
                                    <div className="flex flex-col items-start">
                                        <span className="label-text font-semibold">{option.key}</span>
                                        <span className="label-text text-sm text-base-content/70">{option.label}</span>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>

                    {/* Show selected count */}
                    <div className="text-sm text-base-content/70 mt-4 flex justify-between">
                        <span>{getSelectedStocks().length} of {STOCK_OPTIONS.length} stocks selected</span>
                        {stockSearchTerm && (
                            <span>Showing {filteredStocks.length} results</span>
                        )}
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            <dialog id="my_modal_crypto" className="modal">
                <div className="modal-box">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <h3 className="font-bold text-lg">Hello!</h3>
                    <p className="py-4">Press ESC key or click outside to close CRYPTO</p>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
}