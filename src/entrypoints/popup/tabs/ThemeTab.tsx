import {SwatchIcon} from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from 'react-redux';
import { setTheme } from '@/entrypoints/store/themeSlice';
import { useAuth } from '@/entrypoints/popup/hooks/useAuth';

export default function ThemeTab() {
    const dispatch = useDispatch();
    const currentTheme = useSelector((state: any) => state.theme);
    const { saveSettingsImmediately } = useAuth();
    const themes = [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
        { label: "Cupcake", value: "cupcake" },
        { label: "Bumblebee", value: "bumblebee" },
        { label: "Emerald", value: "emerald" },
        { label: "Corporate", value: "corporate" },
        { label: "Synthwave", value: "synthwave" },
        { label: "Retro", value: "retro" },
        { label: "Cyberpunk", value: "cyberpunk" },
        { label: "Valentine", value: "valentine" },
        { label: "Halloween", value: "halloween" },
        { label: "Garden", value: "garden" },
        { label: "Forest", value: "forest" },
        { label: "Aqua", value: "aqua" },
        { label: "Lofi", value: "lofi" },
        { label: "Pastel", value: "pastel" },
        { label: "Fantasy", value: "fantasy" },
        { label: "Wireframe", value: "wireframe" },
        { label: "Black", value: "black" },
        { label: "Luxury", value: "luxury" },
        { label: "Dracula", value: "dracula" },
        { label: "CMYK", value: "cmyk" },
        { label: "Autumn", value: "autumn" },
        { label: "Business", value: "business" },
        { label: "Acid", value: "acid" },
        { label: "Lemonade", value: "lemonade" },
        { label: "Night", value: "night" },
        { label: "Coffee", value: "coffee" },
        { label: "Winter", value: "winter" },
        { label: "Dim", value: "dim" },
        { label: "Nord", value: "nord" },
        { label: "Sunset", value: "sunset" },
        { label: "Caramellatte", value: "caramellatte" },
        { label: "Abyss", value: "abyss" },
        { label: "Silk", value: "silk" },
    ];

    // Get the current theme value (handle both string and object formats)
    const getCurrentTheme = () => {
        if (typeof currentTheme === 'string') {
            return currentTheme;
        } else if (currentTheme && currentTheme.mode) {
            return currentTheme.mode;
        }
        return 'dark'; // default
    };

    function themeChange(theme: string) {
        console.log('Selected theme:', theme)
        dispatch(setTheme(theme));
        // Also apply immediately to DOM
        document.documentElement.setAttribute('data-theme', theme);
        // Save settings immediately since theme changes are critical
        setTimeout(() => saveSettingsImmediately(), 100);
    }

    return (
        <>
            <label className="tab">
                <input type="radio" name="my_tabs_3" className="tab" aria-label="Tab 1"/>
                <SwatchIcon className="size-8"/>
            </label>
            <div className="tab-content bg-base-100 border-base-300 p-2 overflow-hidden max-h-120">
                <div className="overflow-y-auto p-2 h-110">
                    <div className="flex-none w-full join join-vertical">
                        {themes.map(({label, value}, index) => (
                            <input
                                key={index}
                                type="radio"
                                name="theme-buttons"
                                className="btn theme-controller join-item"
                                aria-label={label}
                                value={value}
                                data-set-theme={value}
                                checked={getCurrentTheme() === value}
                                onChange={() => {themeChange(value)}}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}