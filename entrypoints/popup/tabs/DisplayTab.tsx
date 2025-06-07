import { ComputerDesktopIcon } from "@heroicons/react/24/solid/index.js";
import { useState } from "react";
import { SPORTS_OPTIONS, STOCK_OPTIONS, STOCK_PRESETS, CRYPTO_PRESETS, CRYPTO_OPTIONS } from "@/entrypoints/popup/tabs/data.tsx";

type CustomStockSelections = Record<string, boolean>;
type CustomCryptoSelections = Record<string, boolean>;

export default function DisplayTab() {
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

    const [customCryptoSelections, setCustomCryptoSelections] = useState<CustomCryptoSelections>(
        CRYPTO_OPTIONS.reduce((acc, option) => ({
            ...acc,
            [option.key]: option.enabled
        }), {})
    );

    const [stockSearchTerm, setStockSearchTerm] = useState('');
    const [cryptoSearchTerm, setCryptoSearchTerm] = useState('');

    const toggleStockSelection = (stockKey: string) => {
        setCustomStockSelections(prev => ({
            ...prev,
            [stockKey]: !prev[stockKey]
        }));
    };

    const toggleCryptoSelection = (cryptoKey: string) => {
        setCustomCryptoSelections(prev => ({
            ...prev,
            [cryptoKey]: !prev[cryptoKey]
        }));
    };

    // Function to get selected stocks for display/API calls
    const getSelectedStocks = () => {
        return Object.entries(customStockSelections)
            .filter(([, enabled]) => enabled)
            .map(([key]) => key);
    };

    // Function to get selected cryptos for display/API calls
    const getSelectedCryptos = () => {
        return Object.entries(customCryptoSelections)
            .filter(([, enabled]) => enabled)
            .map(([key]) => key);
    };

    // Function to reset stock selections to defaults
    const resetStockSelections = () => {
        setCustomStockSelections(
            STOCK_OPTIONS.reduce((acc, option) => ({
                ...acc,
                [option.key]: option.enabled
            }), {})
        );
    };

    // Function to reset crypto selections to defaults
    const resetCryptoSelections = () => {
        setCustomCryptoSelections(
            CRYPTO_OPTIONS.reduce((acc, option) => ({
                ...acc,
                [option.key]: option.enabled
            }), {})
        );
    };

    // Function to select/deselect all stocks
    const toggleAllStocks = (selectAll: boolean) => {
        setCustomStockSelections(
            STOCK_OPTIONS.reduce((acc, option) => ({
                ...acc,
                [option.key]: selectAll
            }), {})
        );
    };

    // Function to select/deselect all cryptos
    const toggleAllCryptos = (selectAll: boolean) => {
        setCustomCryptoSelections(
            CRYPTO_OPTIONS.reduce((acc, option) => ({
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

    // Filter cryptos based on search term
    const filteredCryptos = CRYPTO_OPTIONS.filter(crypto =>
        crypto.label.toLowerCase().includes(cryptoSearchTerm.toLowerCase()) ||
        crypto.key.toLowerCase().includes(cryptoSearchTerm.toLowerCase())
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
                                    <div className="space-y-2 p-2 ml-2 border-l border-base-300/50">
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
                                                onChange={() => {
                                                    const dialog = document.getElementById('my_modal_stocks') as HTMLDialogElement | null;
                                                    dialog?.showModal();
                                                    selectPreset('stocks', 'custom')}
                                                }
                                            />
                                            <span className="label-text">{getSelectedStocks().length} selected</span>
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
                                    <div className="space-y-2 p-2 ml-2 border-l border-base-300/50">
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
                                        <label className={`${financeSettings.crypto.activePreset === 'custom' ? 'text-base-content' : 'text-base-content/50'} label cursor-pointer justify-start gap-3`}>
                                            <input
                                                type="radio"
                                                name="crypto-preset"
                                                className="radio radio-sm"
                                                checked={financeSettings.crypto.activePreset === 'custom'}
                                                onChange={() => {
                                                    const dialog = document.getElementById('my_modal_crypto') as HTMLDialogElement | null;
                                                    dialog?.showModal();
                                                    selectPreset('crypto', 'custom');
                                                }}
                                            />
                                            <span className="label-text">{getSelectedCryptos().length} selected</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="fieldset bg-base-100 border-base-300 space-y-2 rounded-box w-full border p-4">
                        <legend className="fieldset-legend text-lg">Fantasy <span
                            className="text-base-content/50 text-sm italic">*coming soon*</span></legend>
                        <button className="btn btn-sm">Yahoo</button>
                        <button className="btn btn-sm">ESPN</button>
                        <button className="btn btn-sm">Sleeper</button>
                        <button className="btn btn-sm">CBS</button>
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
                <div className="modal-box max-w-2xl">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <h3 className="font-bold text-lg">Custom Crypto Selection</h3>

                    {/* Search Input */}
                    <div className="form-control w-full my-4">
                        <input
                            type="text"
                            placeholder="Search cryptocurrencies by name or symbol..."
                            className="input input-bordered w-full"
                            value={cryptoSearchTerm}
                            onChange={(e) => setCryptoSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 mb-4">
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => toggleAllCryptos(true)}
                        >
                            Select All
                        </button>
                        <button
                            className="btn btn-sm btn-outline"
                            onClick={() => toggleAllCryptos(false)}
                        >
                            Deselect All
                        </button>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={resetCryptoSelections}
                        >
                            Reset to Default
                        </button>
                        {cryptoSearchTerm && (
                            <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => setCryptoSearchTerm('')}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {filteredCryptos.length === 0 ? (
                            <div className="text-center text-base-content/50 py-4">
                                No cryptocurrencies found matching "{cryptoSearchTerm}"
                            </div>
                        ) : (
                            filteredCryptos.map((option) => (
                                <label
                                    key={option.key}
                                    className={`${customCryptoSelections[option.key] ? 'bg-base-200' : 'bg-base-200/50'} label cursor-pointer justify-start gap-3 btn btn-ghost text-left`}
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={customCryptoSelections[option.key] || false}
                                        onChange={() => toggleCryptoSelection(option.key)}
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
                        <span>{getSelectedCryptos().length} of {CRYPTO_OPTIONS.length} cryptocurrencies selected</span>
                        {cryptoSearchTerm && (
                            <span>Showing {filteredCryptos.length} results</span>
                        )}
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
}