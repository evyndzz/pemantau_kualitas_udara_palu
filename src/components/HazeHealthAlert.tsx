import React from 'react';
import { AlertCircle, Ban, Droplet, Home, ShieldCheck, Stethoscope } from 'lucide-react';
import type { ISPUInfo } from '../types';
import { NavHealthShieldIcon, StatusShieldBadgeIcon } from './CustomIcons';

interface HazeHealthAlertProps {
  ispuInfo?: ISPUInfo | null;
}

const HazeHealthAlertComponent: React.FC<HazeHealthAlertProps> = ({ ispuInfo }) => {
  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] theme-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <NavHealthShieldIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
              Panduan Medis & Perlindungan Kabut Asap
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Protokol kesehatan Kemenkes RI dan WHO menghadapi paparan partikel halus PM2.5 karhutla di Sulawesi Tengah
          </p>
        </div>

        {ispuInfo && (
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold ${ispuInfo.pillClass}`}>
            <StatusShieldBadgeIcon color={ispuInfo.colorHex} className="h-3.5 w-3.5" />
            <span>Status Saat Ini: {ispuInfo.hazeRisk}</span>
          </div>
        )}
      </div>

      {/* Personalized Advice Banner */}
      {ispuInfo && (
        <div className="mb-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/60 dark:from-indigo-950/40 dark:via-slate-900 dark:to-emerald-950/30 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-xs">
            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                Rekomendasi Masker
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {ispuInfo.maskRecommendation}
              </p>
            </div>
            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                Aktivitas Luar Ruangan
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {ispuInfo.outdoorAdvice}
              </p>
            </div>
            <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 p-3 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
                Kelompok Rentan (Anak/Lansia)
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {ispuInfo.vulnerableGroupAdvice}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 mb-2">
            <ShieldCheck className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Gunakan Respirator N95 / KF94
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Masker kain biasa tidak mampu menyaring partikel asap PM2.5 (&lt;2.5 mikron). Gunakan respirator standar <strong>N95, KN95, atau KF94</strong> yang menutup rapat area hidung dan dagu saat indeks udara memburuk.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 mb-2">
            <Home className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Jaga Udara Bersih Dalam Rumah
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Tutup jendela dan ventilasi saat bau asap mulai tercium (terutama pukul 05.00–08.00 pagi dan sore hari). Letakkan <strong>kain lembap</strong> pada celah pintu untuk menahan debu halus.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4">
          <div className="flex items-center gap-2.5 text-sky-600 dark:text-sky-400 mb-2">
            <Droplet className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Hidrasi & Bilas Saluran Napas
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Perbanyak minum air putih hangat minimal <strong>2,5 liter/hari</strong> agar mukosa tenggorokan tetap lembap. Cuci wajah dan gunakan tetes mata steril setelah beraktivitas di luar.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 mb-2">
            <Ban className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Stop Pembakaran Lahan & Sampah
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            <strong>Hindari membuka lahan dengan cara membakar</strong> atau membakar sampah pekarangan di musim kemarau. Asap lokal memperparah akumulasi polutan di lembah Palu, Sigi, Poso, dan Morowali.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4">
          <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 mb-2">
            <AlertCircle className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Prioritaskan Bayi, Ibu Hamil & Lansia
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Kapasitas paru-paru balita, lansia, dan ibu hamil sangat rentan terhadap hipoksia ringan akibat Karbon Monoksida (CO) asap. Pastikan mereka berada di ruangan berventilasi bersih.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4">
          <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 mb-2">
            <Stethoscope className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Deteksi Dini Gejala ISPA Akut
            </h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Segera hubungi Puskesmas, PSC 119, atau RSUD terdekat bila mengalami <strong>sesak napas, napas berbunyi (mengi), batuk tidak berhenti</strong>, atau nyeri dada.
          </p>
        </div>
      </div>
    </div>
  );
};

export const HazeHealthAlert = React.memo(HazeHealthAlertComponent);
