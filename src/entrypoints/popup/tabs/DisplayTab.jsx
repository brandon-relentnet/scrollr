import { ComputerDesktopIcon } from "@heroicons/react/24/solid/index.js";
import { useState, useReducer, useEffect, useMemo, useCallback, useRef } from "react";
import { SPORTS_OPTIONS, STOCK_OPTIONS, STOCK_PRESETS, CRYPTO_PRESETS, CRYPTO_OPTIONS } from "./data.jsx";
import { useDispatch, useSelector } from 'react-redux';
import { setToggles } from '@/entrypoints/store/togglesSlice';
import { setFinance } from '@/entrypoints/store/financeSlice.js';

// Optimized finance reducer with better performance
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

        case 'TOGGLE_SELECTION': {
            const currentSelections = state[financeType].customSelections;
            const newSelections = {
                ...currentSelections,
                [action.key]: !currentSelections[action.key]
            };

            return {
                ...state,
                [financeType]: {
                    ...state[financeType],
                    customSelections: newSelections
                }
            };
        }

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
            const defaultSelections = {};
            for (const opt of options) {
                defaultSelections[opt.key] = opt.enabled;
            }

            return {
                ...state,
                [financeType]: {
                    ...state[financeType],
                    customSelections: defaultSelections
                }
            };
        }

        case 'TOGGLE_ALL_SELECTIONS': {
            const options = financeType === 'stocks' ? STOCK_OPTIONS : CRYPTO_OPTIONS;
            const newSelections = {};
            for (const opt of options) {
                newSelections[opt.key] = action.selectAll;
            }

            return {
                ...state,
                [financeType]: {
                    ...state[financeType],
                    customSelections: newSelections
                }
            };
        }

        case 'INIT_FROM_REDUX':
            return action.state;

        default:
            return state;
    }
}

// Default states
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

const getDefaultSportsState = () => ({
    NFL: false,
    NBA: false,
    MLB: false,
    NHL: false
});

// FIX: Deep comparison utility
function deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (let key of keys1) {
        if (!keys2.includes(key)) return false;

        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
            if (!deepEqual(obj1[key], obj2[key])) return false;
        } else if (obj1[key] !== obj2[key]) {
            return false;
        }
    }

    return true;
}

export default function DisplayTab() {
    const dispatch = useDispatch();
    const reduxToggles = useSelector((state) => state.toggles);
    const reduxFinance = useSelector((state) => state.finance);

    const [isInitialized, setIsInitialized] = useState(false);

    // FIX: Initialize state more reliably
    const [selectedSports, setSelectedSports] = useState(() => {
        const initial = (reduxToggles && Object.keys(reduxToggles).length > 0)
            ? reduxToggles
            : getDefaultSportsState();
        console.log('Initial sports state:', initial);
        return initial;
    });

    const [financeState, dispatchFinance] = useReducer(financeReducer,
        (reduxFinance && Object.keys(reduxFinance).length > 0)
            ? reduxFinance
            : getDefaultFinanceState()
    );

    // Track last synced state
    const lastSyncedRef = useRef({ sports: null, finance: null });
    const syncTimeoutRef = useRef(null);

    // FIX: Better initialization effect that runs once
    useEffect(() => {
        if (!isInitialized) {
            console.log('Initializing DisplayTab with Redux state:', { reduxFinance, reduxToggles });

            // Initialize sports from Redux if available
            if (reduxToggles && Object.keys(reduxToggles).length > 0) {
                setSelectedSports(reduxToggles);
                lastSyncedRef.current.sports = reduxToggles;
            } else {
                // If no Redux state, sync default state to Redux
                const defaultSports = getDefaultSportsState();
                dispatch(setToggles(defaultSports));
                lastSyncedRef.current.sports = defaultSports;
            }

            // Initialize finance from Redux if available
            if (reduxFinance && Object.keys(reduxFinance).length > 0) {
                dispatchFinance({ type: 'INIT_FROM_REDUX', state: reduxFinance });
                lastSyncedRef.current.finance = reduxFinance;
            } else {
                // If no Redux state, sync default state to Redux
                const defaultFinance = getDefaultFinanceState();
                dispatch(setFinance(defaultFinance));
                lastSyncedRef.current.finance = defaultFinance;
            }

            setIsInitialized(true);
        }
    }, [dispatch, reduxToggles, reduxFinance, isInitialized]);

    // Improved debounced Redux sync
    const debouncedSyncToRedux = useCallback((type, data) => {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            if (type === 'sports') {
                if (!deepEqual(data, lastSyncedRef.current.sports)) {
                    console.log('Syncing sports to Redux:', data);
                    dispatch(setToggles(data));
                    lastSyncedRef.current.sports = data;
                }
            } else if (type === 'finance') {
                if (!deepEqual(data, lastSyncedRef.current.finance)) {
                    console.log('Syncing finance to Redux:', data);
                    dispatch(setFinance(data));
                    lastSyncedRef.current.finance = data;
                }
            }
        }, 200); // Reduced debounce time for better responsiveness
    }, [dispatch]);

    // Memoized computations
    const getSelected = useCallback((type) =>
        Object.entries(financeState[type].customSelections)
            .filter(([, enabled]) => enabled)
            .map(([key]) => key), [financeState]);

    const getFilteredOptions = useMemo(() => {
        const filterOptions = (type) => {
            const options = type === 'stocks' ? STOCK_OPTIONS : CRYPTO_OPTIONS;
            const term = financeState[type].searchTerm.toLowerCase();
            if (!term) return options;

            return options.filter(opt =>
                opt.label.toLowerCase().includes(term) || opt.key.toLowerCase().includes(term)
            );
        };

        return {
            stocks: filterOptions('stocks'),
            crypto: filterOptions('crypto')
        };
    }, [financeState.stocks.searchTerm, financeState.crypto.searchTerm]);

    // Debounced search input
    const searchTimeoutRef = useRef(null);
    const handleSearchChange = useCallback((type, value) => {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            dispatchFinance({ type: 'SET_SEARCH', financeType: type, term: value });
        }, 150);
    }, []);

    const openModal = useCallback((type) => {
        dispatchFinance({ type: 'SELECT_PRESET', financeType: type, preset: 'custom' });
        const dialog = document.getElementById(`my_modal_${type}`);
        dialog?.showModal();
    }, []);

    const toggleSport = useCallback((key) => {
        setSelectedSports(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    // FIX: Only sync when there are meaningful changes and component is initialized
    useEffect(() => {
        if (isInitialized && financeState) {
            const shouldSync = !deepEqual(financeState, lastSyncedRef.current.finance);

            if (shouldSync) {
                console.log('Finance state changed, syncing to Redux');
                debouncedSyncToRedux('finance', financeState);
            }
        }
    }, [financeState, debouncedSyncToRedux, isInitialized]);

    useEffect(() => {
        if (isInitialized && selectedSports) {
            const shouldSync = !deepEqual(selectedSports, lastSyncedRef.current.sports);

            if (shouldSync) {
                console.log('Sports state changed, syncing to Redux');
                debouncedSyncToRedux('sports', selectedSports);
            }
        }
    }, [selectedSports, debouncedSyncToRedux, isInitialized]);

    // FIX: Add debug logging for state tracking
    useEffect(() => {
        console.log('DisplayTab render state:', {
            isInitialized,
            stocksEnabled: financeState.stocks?.enabled,
            stocksPreset: financeState.stocks?.activePreset,
            cryptoEnabled: financeState.crypto?.enabled,
            cryptoPreset: financeState.crypto?.activePreset,
            hasReduxFinance: !!(reduxFinance && Object.keys(reduxFinance).length > 0),
            stocksSelectionCount: Object.values(financeState.stocks?.customSelections || {}).filter(Boolean).length
        });
    }, [isInitialized, financeState, reduxFinance]);

    // Memoized components to prevent unnecessary re-renders
    const renderPresetOptions = useCallback((type) => {
        const presets = type === 'stocks' ? STOCK_PRESETS : CRYPTO_PRESETS;
        const icon = type === 'stocks' ? '📈' : '₿';
        const label = type === 'stocks' ? 'Stocks' : 'Crypto';
        const settings = financeState[type];
        const selectedCount = getSelected(type).length;

        return (
            <div>
                <label className={`${!settings.enabled ? 'text-base-content/50' : 'text-base-content'} .label btn btn-ghost justify-between flex items-center`}>
                    {icon} {label}
                    <input
                        type="checkbox"
                        className="toggle"
                        checked={settings.enabled}
                        onChange={() => {
                            console.log(`Toggling ${type}:`, !settings.enabled);
                            dispatchFinance({ type: 'TOGGLE_CATEGORY', financeType: type });
                        }}
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
                                    onChange={() => {
                                        console.log(`Selecting ${type} preset:`, preset.key);
                                        dispatchFinance({ type: 'SELECT_PRESET', financeType: type, preset: preset.key });
                                    }}
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
                            <span className="label-text">{selectedCount} selected</span>
                        </label>
                    </div>
                )}
            </div>
        );
    }, [financeState, getSelected, openModal]);

    // Only render modals when needed
    const renderModal = useCallback((type) => {
        const options = type === 'stocks' ? STOCK_OPTIONS : CRYPTO_OPTIONS;
        const filtered = getFilteredOptions[type];
        const title = type === 'stocks' ? 'Stock' : 'Crypto';
        const placeholder = type === 'stocks' ? 'Search stocks by name or symbol...' : 'Search cryptocurrencies by name or symbol...';
        const settings = financeState[type];
        const selectedCount = getSelected(type).length;

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
                            defaultValue={settings.searchTerm}
                            onChange={(e) => handleSearchChange(type, e.target.value)}
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
                                No {type} found matching your search
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
                        <span>{selectedCount} of {options.length} {type} selected</span>
                        {settings.searchTerm && <span>Showing {filtered.length} results</span>}
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        );
    }, [financeState, getFilteredOptions, getSelected, handleSearchChange]);

    // Memoized sports section
    const sportsSection = useMemo(() => (
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
    ), [selectedSports, toggleSport]);

    // FIX: Don't render the main content until initialized
    if (!isInitialized) {
        return (
            <>
                <label className="tab">
                    <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 2"/>
                    <ComputerDesktopIcon className="size-8"/>
                </label>
                <div className="tab-content bg-base-100 border-base-300 p-2 flex items-center justify-center">
                    <div className="loading loading-spinner loading-lg"></div>
                    <span className="ml-2">Initializing...</span>
                </div>
            </>
        );
    }

    return (
        <>
            <label className="tab">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 2"/>
                <ComputerDesktopIcon className="size-8"/>
            </label>
            <div className="tab-content bg-base-100 border-base-300 p-2 space-y-6 overflow-hidden max-h-120">
                <div className="overflow-y-auto p-2 h-110">
                    {/* Sports Section */}
                    {sportsSection}

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