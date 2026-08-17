import React, { useRef } from 'react';
import {
  CanvasAspectRatio,
  CanvasBackgroundConfig,
} from '../types';
import {
  Layout,
  Palette,
  Image as ImageIcon,
  Upload,
  Trash2,
  Check,
  RotateCcw,
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Smartphone,
  FileText,
  Maximize2,
} from 'lucide-react';

interface CanvasSettingsPanelProps {
  canvasConfig: CanvasBackgroundConfig;
  onUpdateCanvasConfig: (updates: Partial<CanvasBackgroundConfig>) => void;
  onClose?: () => void;
}

export const CANVAS_RATIO_OPTIONS: {
  id: CanvasAspectRatio;
  labelKashmiri: string;
  labelEnglish: string;
  icon: React.ReactNode;
}[] = [
  { id: 'auto', labelKashmiri: 'طبعی (Auto)', labelEnglish: 'Full Doc', icon: <Maximize2 size={13} /> },
  { id: '1:1', labelKashmiri: 'مورَبَع (1:1)', labelEnglish: 'Square Post', icon: <Square size={13} /> },
  { id: '4:5', labelKashmiri: 'پوسٹ (4:5)', labelEnglish: 'Portrait Feed', icon: <RectangleVertical size={13} /> },
  { id: '9:16', labelKashmiri: 'سٹوری (9:16)', labelEnglish: 'Story/Status', icon: <Smartphone size={13} /> },
  { id: '16:9', labelKashmiri: 'بینر (16:9)', labelEnglish: 'Landscape', icon: <RectangleHorizontal size={13} /> },
  { id: '3:4', labelKashmiri: 'فریم (3:4)', labelEnglish: 'Classic 3:4', icon: <RectangleVertical size={13} /> },
  { id: 'a4', labelKashmiri: 'اے فور (A4)', labelEnglish: 'A4 Notice', icon: <FileText size={13} /> },
];

export const CANVAS_COLOR_SWATCHES = [
  { color: '#ffffff', name: 'سفید (White)' },
  { color: '#fbf8ee', name: 'قدیم کاغذ (Parchment)' },
  { color: '#f5f5f4', name: 'نرم پتھر (Stone)' },
  { color: '#fef3c7', name: 'زعفران (Saffron Glow)' },
  { color: '#f0fdf4', name: 'چنار سبز (Mint Sage)' },
  { color: '#f0f9ff', name: 'ہمالیہ نیلا (Sky Mist)' },
  { color: '#fdf2f8', name: 'گلابِ کشمیر (Rose)' },
  { color: '#1c1917', name: 'مشکی سیاہ (Obsidian)' },
  { color: '#0f172a', name: 'ڈل رات (Twilight Navy)' },
  { color: '#064e3b', name: 'شاہی زمرد (Emerald)' },
  { color: '#450a0a', name: 'کشمیری روبی (Ruby)' },
];

export const CANVAS_TEXTURE_PRESETS = [
  {
    id: 'gradient-saffron',
    name: 'زعفرانی شفق (Saffron Dawn)',
    value: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fecaca 100%)',
    preview: 'from-amber-100 to-rose-200',
  },
  {
    id: 'gradient-twilight',
    name: 'ڈل جھیل رات (Dal Twilight)',
    value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
    preview: 'from-slate-900 to-indigo-900',
  },
  {
    id: 'gradient-chinar',
    name: 'چنار خزاں (Chinar Autumn)',
    value: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)',
    preview: 'from-amber-900 to-amber-600',
  },
  {
    id: 'gradient-emerald',
    name: 'دیودار سبز (Emerald Pine)',
    value: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)',
    preview: 'from-emerald-950 to-emerald-700',
  },
  {
    id: 'gradient-slate',
    name: 'پتھر سرمئی (Slate Velvet)',
    value: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
    preview: 'from-zinc-900 to-zinc-700',
  },
  {
    id: 'gradient-parchment',
    name: 'شاہی مکتوب (Royal Letter)',
    value: 'linear-gradient(135deg, #fdfbf7 0%, #f7f3e8 50%, #ede5d0 100%)',
    preview: 'from-stone-50 to-amber-100',
  },
];

export const CanvasSettingsPanel: React.FC<CanvasSettingsPanelProps> = ({
  canvasConfig,
  onUpdateCanvasConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentRatio = canvasConfig.aspectRatio || 'auto';
  const currentColor = canvasConfig.color || '#ffffff';
  const currentImage = canvasConfig.image;
  const currentOpacity = canvasConfig.imageOpacity ?? 1;
  const currentOverlayOpacity = canvasConfig.overlayOpacity ?? 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          onUpdateCanvasConfig({
            image: dataUrl,
            imageOpacity: 1,
            overlayOpacity: 0.15,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetCanvas = () => {
    onUpdateCanvasConfig({
      aspectRatio: 'auto',
      color: '#ffffff',
      image: undefined,
      imageOpacity: 1,
      overlayOpacity: 0,
      overlayColor: '#000000',
    });
  };

  return (
    <div
      className="p-3 sm:p-4 bg-white border-t border-stone-200 flex flex-col gap-3.5 animate-in slide-in-from-top-2 text-right max-h-[60vh] overflow-y-auto custom-scrollbar"
      dir="rtl"
    >
      {/* 1. Size & Ratio Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-nastaliq font-bold text-stone-900 flex items-center gap-1.5">
            <Layout size={13} className="text-emerald-700" />
            <span>کینوس سائز و تناسب (Aspect Ratio)</span>
          </span>

          <button
            type="button"
            onClick={handleResetCanvas}
            className="text-[10px] font-nastaliq text-stone-500 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset Canvas"
          >
            <RotateCcw size={10} />
            <span>طبعی حالت (Reset)</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
          {CANVAS_RATIO_OPTIONS.map((opt) => {
            const isActive = currentRatio === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateCanvasConfig({ aspectRatio: opt.id })}
                className={`p-2 rounded-lg border text-right flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                    : 'bg-white border-stone-200 text-stone-800 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-1">
                  {opt.icon}
                  <span className="font-nastaliq text-xs">{opt.labelKashmiri}</span>
                </div>
                <span className="text-[9px] font-sans opacity-75">{opt.labelEnglish}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Background Color Section */}
      <div className="pt-2 border-t border-stone-100">
        <span className="text-xs font-nastaliq font-bold text-stone-900 mb-1.5 flex items-center gap-1.5">
          <Palette size={13} className="text-emerald-700" />
          <span>کینوس رنگ (Canvas Background Color)</span>
        </span>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CANVAS_COLOR_SWATCHES.map((swatch, idx) => {
            const isSelected = currentColor.toLowerCase() === swatch.color.toLowerCase() && !currentImage;
            return (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  onUpdateCanvasConfig({
                    color: swatch.color,
                    image: undefined,
                  })
                }
                className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center shrink-0 transition-transform active:scale-90 shadow-2xs cursor-pointer"
                style={{ backgroundColor: swatch.color }}
                title={swatch.name}
              >
                {isSelected && (
                  <Check
                    size={14}
                    className={
                      swatch.color === '#ffffff' ||
                      swatch.color === '#fbf8ee' ||
                      swatch.color === '#f5f5f4' ||
                      swatch.color === '#fef3c7' ||
                      swatch.color === '#f0fdf4' ||
                      swatch.color === '#f0f9ff' ||
                      swatch.color === '#fdf2f8'
                        ? 'text-black'
                        : 'text-white'
                    }
                  />
                )}
              </button>
            );
          })}

          {/* Native Color Picker */}
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            <input
              type="color"
              value={currentColor.startsWith('#') ? currentColor : '#ffffff'}
              onChange={(e) =>
                onUpdateCanvasConfig({
                  color: e.target.value,
                  image: undefined,
                })
              }
              className="w-7 h-7 rounded-full cursor-pointer border border-stone-300 shrink-0"
              title="Custom Color (اپنی پسند کا رنگ)"
            />
            <span className="text-[10px] font-sans text-stone-500">Custom</span>
          </div>
        </div>
      </div>

      {/* 3. Background Image & Textures Section */}
      <div className="pt-2 border-t border-stone-100">
        <span className="text-xs font-nastaliq font-bold text-stone-900 mb-1.5 flex items-center gap-1.5">
          <ImageIcon size={13} className="text-emerald-700" />
          <span>پس منظر تصویر و بناوٹ (Background Image & Texture)</span>
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {/* Custom Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-stone-800 hover:text-emerald-800 border border-stone-200 hover:border-emerald-200 rounded-lg text-xs font-nastaliq flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Upload size={13} />
            <span>تصویر اَپلوڈ کٔرِو</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Texture Presets */}
          {CANVAS_TEXTURE_PRESETS.map((tex) => {
            const isActive = currentImage === tex.value;
            return (
              <button
                key={tex.id}
                type="button"
                onClick={() =>
                  onUpdateCanvasConfig({
                    image: tex.value,
                    imageOpacity: 1,
                    overlayOpacity: 0,
                  })
                }
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-nastaliq flex items-center gap-1.5 cursor-pointer transition-all ${
                  isActive
                    ? 'border-emerald-600 ring-1 ring-emerald-600 font-bold bg-emerald-50 text-emerald-900'
                    : 'border-stone-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 text-stone-800'
                }`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                  style={{ background: tex.value }}
                />
                <span>{tex.name}</span>
              </button>
            );
          })}

          {/* Remove Image Button */}
          {currentImage && (
            <button
              type="button"
              onClick={() => onUpdateCanvasConfig({ image: undefined })}
              className="px-2.5 py-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-nastaliq flex items-center gap-1 cursor-pointer transition-colors"
              title="Remove Background Image"
            >
              <Trash2 size={12} />
              <span>تصویر ہٹاوِو</span>
            </button>
          )}
        </div>

        {/* Sliders for Image Opacity and Darkening Overlay (if image/texture selected) */}
        {currentImage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-nastaliq text-stone-700">
                <span>تصویرٕچ شفافیت (Opacity)</span>
                <span className="font-sans">{Math.round(currentOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={currentOpacity}
                onChange={(e) => onUpdateCanvasConfig({ imageOpacity: parseFloat(e.target.value) })}
                className="accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-nastaliq text-stone-700">
                <span>پس منظر سیاہی (Text Readability Overlay)</span>
                <span className="font-sans">{Math.round(currentOverlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.85"
                step="0.05"
                value={currentOverlayOpacity}
                onChange={(e) =>
                  onUpdateCanvasConfig({
                    overlayOpacity: parseFloat(e.target.value),
                    overlayColor: '#000000',
                  })
                }
                className="accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
