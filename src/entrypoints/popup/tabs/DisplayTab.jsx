import { ComputerDesktopIcon } from "@heroicons/react/24/solid/index.js";
import { useState, useReducer, useEffect } from "react";
import { SPORTS_OPTIONS, STOCK_OPTIONS, STOCK_PRESETS, CRYPTO_PRESETS, CRYPTO_OPTIONS } from "./data.jsx";
import { useDispatch, useSelector } from 'react-redux';
import { setToggles } from '@/entrypoints/store/togglesSlice';
import { setFinance } from '@/entrypoints/store/financeSlice.js';

// Finance reducer
function financeReducer(state, action) {
    const { financeType } = action;

    switch (action.type) {
        case 'TOGGLE_CATEGORY':
            return {
                ...state,
                [financeType]: {
                    ...state[financeType],
                    enabled: !state[financeType].enabled
                }
            };

        case 'SELECT_PRESET':
            return {
                ...state,
                [financeType]: {
                    ...state[financeType],
                    activePreset: action.preset
                }
            };

        case 'TOGGLE_SELECTION':
            return {
                ...state,
                [financeType]: {
                    ...state[financeType],
                    customSelections: {
                        ...state[financeType].customSelections,
                        [action.key]: !state[financeType].customSelections[action.key]
                    }
                }
            };

        case 'SET_SEARCH':
            return {
                ...state,
                [financeType]: {
                    ...state[financeType],
                    searchTerm: action.term
                }
            };

        case 'RESET_SELECTIONS': {
            const options = financeType === 'stocks' ? STOCK_OPTIONS : CRYPTO_OPTIONS;
            return {
                ...state,
                [financeType]: {
                    ...state[financeType],
                    customSelections: options.reduce((acc, opt) => ({ ...acc, [opt.key]: opt.enabled }), {})
                }
            };
        }

        case 'TOGGLE_ALL_SELECTIONS': {
            const options = financeType === 'stocks' ? STOCK_OPTIONS : CRYPTO_OPTIONS;
            return {
                ...state,
                [financeType]: {
                    ...state[financeType],
                    customSelections: options.reduce((acc, opt) => ({ ...acc, [opt.key]: action.selectAll }), {})
                }
            };
        }

        case 'INIT_FROM_REDUX':
            return action.state;

        default:
            return state;
    }
}

// Default finance state (fallback)
const getDefaultFinanceState = () => ({
    stocks: {
        enabled: false,
        activePreset: null,
        customSelections: STOCK_OPTIONS.reduce((acc, opt) => ({ ...acc, [opt.key]: opt.enabled }), {}),
        searchTerm: ''
    },
    crypto: {
        enabled: false,
        activePreset: null,
        customSelections: CRYPTO_OPTIONS.reduce((acc, opt) => ({ ...acc, [opt.key]: opt.enabled }), {}),
        searchTerm: ''
    }
});

// Default sports state (fallback)
const getDefaultSportsState = () => ({
    NFL: false,
    NBA: false,
    MLB: false,
    NHL: false
});

export default function DisplayTab() {
    const dispatch = useDispatch();

    // Get current state from Redux store
    const reduxToggles = useSelector((state) => state.toggles);
    const reduxFinance = useSelector((state) => state.finance);

    // Initialize sports state from Redux store or default
    const [selectedSports, setSelectedSports] = useState(() => {
        // If Redux store has toggles, use them, otherwise use defaults
        return reduxToggles && Object.keys(reduxToggles).length > 0
            ? reduxToggles
            : getDefaultSportsState();
    });

    // Initialize finance state from Redux store or default
    const [financeState, dispatchFinance] = useReducer(financeReducer,
        reduxFinance && Object.keys(reduxFinance).length > 0
            ? reduxFinance
            : getDefaultFinanceState()
    );

    // Sync with Redux store on mount if Redux has different values
    useEffect(() => {
        if (reduxToggles && Object.keys(reduxToggles).length > 0) {
            setSelectedSports(reduxToggles);
        }
        if (reduxFinance && Object.keys(reduxFinance).length > 0) {
            dispatchFinance({ type: 'INIT_FROM_REDUX', state: reduxFinance });
        }
    }, []); // Only run on mount

    // Sync finance state with Redux whenever it changes
    useEffect(() => {
        dispatch(setFinance(financeState));
    }, [financeState, dispatch]);

    // Sync sports state with Redux whenever it changes
    useEffect(() => {
        dispatch(setToggles(selectedSports));
    }, [selectedSports, dispatch]);

    // Simplified helper functions
    const getSelected = (type) =>
        Object.entries(financeState[type].customSelections)
            .filter(([, enabled]) => enabled)
            .map(([key]) => key);

    const getFilteredOptions = (type) => {
        const options = type === 'stocks' ? STOCK_OPTIONS : CRYPTO_OPTIONS;
        const term = financeState[type].searchTerm.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(term) || opt.key.toLowerCase().includes(term)
        );
    };

    const openModal = (type) => {
        dispatchFinance({ type: 'SELECT_PRESET', financeType: type, preset: 'custom' });
        const dialog = document.getElementById(`my_modal_${type}`);
        dialog?.showModal();
    };

    // Simplified sports toggle
    const toggleSport = (key) => {
        const newSelectedSports = { ...selectedSports, [key]: !selectedSports[key] };
        setSelectedSports(newSelectedSports);
    };

    // Render finance preset options
    const renderPresetOptions = (type) => {
        const presets = type === 'stocks' ? STOCK_PRESETS : CRYPTO_PRESETS;
        const icon = type === 'stocks' ? '📈' : '₿';
        const label = type === 'stocks' ? 'Stocks' : 'Crypto';
        const settings = financeState[type];

        return (
            <div>
                <label className={`${!settings.enabled ? 'text-base-content/50' : 'text-base-content'} .label btn btn-ghost justify-between flex items-center`}>
                    {icon} {label}
                    <input
                        type="checkbox"
                        className="toggle"
                        checked={settings.enabled}
                        onChange={() => dispatchFinance({ type: 'TOGGLE_CATEGORY', financeType: type })}
                    />
                </label>

                {settings.enabled && (
                    <div className="space-y-2 p-2 ml-2 border-l border-base-300/50">
                        {presets.map(preset => (
                            <label key={preset.key} className={`${settings.activePreset === preset.key ? 'text-base-content' : 'text-base-content/50'} label cursor-pointer justify-start gap-3`}>
                                <input
                                    type="radio"
                                    name={`${type}-preset`}
                                    className="radio radio-sm"
                                    checked={settings.activePreset === preset.key}
                                    onChange={() => dispatchFinance({ type: 'SELECT_PRESET', financeType: type, preset: preset.key })}
                                />
                                <span className="label-text">{preset.label}</span>
                            </label>
                        ))}
                        <label className={`${settings.activePreset === 'custom' ? 'text-base-content' : 'text-base-content/50'} label cursor-pointer justify-start gap-3`}>
                            <input
                                type="radio"
                                name={`${type}-preset`}
                                className="radio radio-sm"
                                checked={settings.activePreset === 'custom'}
                                onChange={() => openModal(type)}
                                onClick={() => openModal(type)}
                            />
                            <span className="label-text">{getSelected(type).length} selected</span>
                        </label>
                    </div>
                )}
            </div>
        );
    };

    // Render modal for custom selection
    const renderModal = (type) => {
        const options = type === 'stocks' ? STOCK_OPTIONS : CRYPTO_OPTIONS;
        const filtered = getFilteredOptions(type);
        const title = type === 'stocks' ? 'Stock' : 'Crypto';
        const placeholder = type === 'stocks' ? 'Search stocks by name or symbol...' : 'Search cryptocurrencies by name or symbol...';
        const settings = financeState[type];

        return (
            <dialog id={`my_modal_${type}`} className="modal">
                <div className="modal-box max-w-2xl">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                    </form>
                    <h3 className="font-bold text-lg">Custom {title} Selection</h3>

                    <div className="form-control w-full my-4">
                        <input
                            type="text"
                            placeholder={placeholder}
                            className="input input-bordered w-full"
                            value={settings.searchTerm}
                            onChange={(e) => dispatchFinance({ type: 'SET_SEARCH', financeType: type, term: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button className="btn btn-sm btn-outline" onClick={() => dispatchFinance({ type: 'TOGGLE_ALL_SELECTIONS', financeType: type, selectAll: true })}>Select All</button>
                        <button className="btn btn-sm btn-outline" onClick={() => dispatchFinance({ type: 'TOGGLE_ALL_SELECTIONS', financeType: type, selectAll: false })}>Deselect All</button>
                        <button className="btn btn-sm btn-ghost" onClick={() => dispatchFinance({ type: 'RESET_SELECTIONS', financeType: type })}>Reset to Default</button>
                        {settings.searchTerm && (
                            <button className="btn btn-sm btn-ghost" onClick={() => dispatchFinance({ type: 'SET_SEARCH', financeType: type, term: '' })}>Clear Search</button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="text-center text-base-content/50 py-4">
                                No {type} found matching "{settings.searchTerm}"
                            </div>
                        ) : (
                            filtered.map((option) => (
                                <label key={option.key} className={`${settings.customSelections[option.key] ? 'bg-base-200' : 'bg-base-200/50'} label cursor-pointer justify-start gap-3 btn btn-ghost text-left`}>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={settings.customSelections[option.key] || false}
                                        onChange={() => dispatchFinance({ type: 'TOGGLE_SELECTION', financeType: type, key: option.key })}
                                    />
                                    <div className="flex flex-col items-start">
                                        <span className="label-text font-semibold">{option.key}</span>
                                        <span className="label-text text-sm text-base-content/70">{option.label}</span>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>

                    <div className="text-sm text-base-content/70 mt-4 flex justify-between">
                        <span>{getSelected(type).length} of {options.length} {type} selected</span>
                        {settings.searchTerm && <span>Showing {filtered.length} results</span>}
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        );
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
                                <label key={sport.key} className={`${!selectedSports[sport.key] ? 'text-base-content/50' : 'text-base-content'} .label btn btn-ghost justify-between flex items-center`}>
                                    {sport.icon} {sport.label}
                                    <input
                                        type="checkbox"
                                        className="toggle"
                                        checked={selectedSports[sport.key] || false}
                                        onChange={() => toggleSport(sport.key)}
                                    />
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {/* Finance Section */}
                    <fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-full border p-4">
                        <legend className="fieldset-legend text-lg">Finance</legend>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {renderPresetOptions('stocks')}
                            {renderPresetOptions('crypto')}
                        </div>
                    </fieldset>

                    <fieldset className="fieldset bg-base-100 border-base-300 space-y-2 rounded-box w-full border p-4">
                        <legend className="fieldset-legend text-lg">Fantasy <span className="text-base-content/50 text-sm italic">*coming soon*</span></legend>
                        {['Yahoo', 'ESPN', 'Sleeper', 'CBS'].map(provider => (
                            <button key={provider} className="btn btn-sm">{provider}</button>
                        ))}
                    </fieldset>

                    <fieldset className="fieldset bg-base-100 border-base-300 space-y-2 rounded-box w-full border p-4">
                        <legend className="fieldset-legend text-lg">RSS <span className="text-base-content/50 text-sm italic">*coming soon*</span></legend>
                        {['Name', 'Link'].map(field => (
                            <label key={field} className="floating-label">
                                <input type="text" placeholder={field} className="input input-md"/>
                                <span>{field}</span>
                            </label>
                        ))}
                        <button className="btn btn-sm">Add to collection</button>
                    </fieldset>
                </div>
            </div>

            {renderModal('stocks')}
            {renderModal('crypto')}
        </>
    );
}