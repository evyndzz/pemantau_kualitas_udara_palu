import React from 'react';
import { Flame, RefreshCw, Share2, Wind } from 'lucide-react';
import type { AirQualityResponse, ISPUInfo } from '../types';

interface NavbarProps {
  data: AirQualityResponse | null;
  ispuInfo: ISPUInfo | null;
  loading: boolean;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ data, ispuInfo, loading, onRefresh }) => {
  const handleShare = () => {
    if (!data || !ispuInfo) return;

    const text = `🚨 *PEMANTAU KUALITAS UDARA & KABUT ASAP SULTENG*
Wilayah: *${data.location.name}*
Indeks ISPU: *${ispuInfo.score}* (${ispuInfo.category})
PM2.5: *${data.current.pm2_5} µg/m³*
Status Karhutla: *${ispuInfo.hazeRisk}*
Suhu / Kelembapan: ${data.weather.temperature}°C / ${data.weather.humidity}%

*Rekomendasi:*
${ispuInfo.actionAdvice}
${ispuInfo.maskRecommendation}

Pantau kualitas udara langsung secara gratis:
${window.location.href}`;

    if (navigator.share) {
      navigator.share({
        title: `Kualitas Udara ${data.location.name}`,
        text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    }
  };

  const isEmergency = ispuInfo && (ispuInfo.category === 'TIDAK SEHAT' || ispuInfo.category === 'SANGAT TIDAK SEHAT' || ispuInfo.category === 'BERBAHAYA');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      {/* Top emergency warning bar if haze is bad */}
      {isEmergency && (
        <div className="bg-amber-600/90 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white flex items-center justify-center gap-2">
          <Flame className="h-4 w-4 shrink-0 animate-bounce" />
          <span>PERINGATAN KABUT ASAP: Indeks pencemaran udara di {data?.location.name} masuk kategori {ispuInfo?.category}. Disarankan memakai masker keluar rumah.</span>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-sky-500 to-indigo-600 p-2 shadow-lg shadow-sky-500/20">
            <Wind className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                Sulteng Udara Bersih
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                LIVE WITA
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sistem Pantau Karhutla & Kualitas Udara Sulawesi Tengah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Perbarui data"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={handleShare}
            disabled={!data}
            title="Bagikan info ke WhatsApp atau medsos"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bagikan Info</span>
          </button>
        </div>
      </div>
    </header>
  );
};
