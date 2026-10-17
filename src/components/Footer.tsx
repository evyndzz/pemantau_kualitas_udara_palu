import React from 'react';
import { Wind } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/80 py-8 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Col 1 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Wind className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-200">Sulteng Udara Bersih</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Inisiatif platform pemantauan kualitas udara terbuka dan siaga kabut asap karhutla khusus untuk masyarakat di seluruh 13 Kabupaten/Kota Sulawesi Tengah.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-bold text-slate-200 mb-2">Sumber Data & Metodologi</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <span className="text-slate-300">Data Kualitas Udara:</span> Open-Meteo & Copernicus Atmosphere Monitoring Service (CAMS)
              </li>
              <li>
                <span className="text-slate-300">Standar Indeks:</span> Permen LHK RI No. 14 Tahun 2020 (ISPU) & US EPA AQI
              </li>
              <li>
                <span className="text-slate-300">Data Peta:</span> OpenStreetMap & CartoDB Dark Matter
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-bold text-slate-200 mb-2">Akses & Hosting Bebas Biaya</h4>
            <p className="text-xs leading-relaxed text-slate-400 mb-2">
              Web ini 100% statis & ringan, siap di-deploy secara gratis ke <strong>Vercel</strong> atau <strong>Netlify</strong> tanpa perlu API key berbayar.
            </p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              Dibuat untuk solidaritas warga terdampak karhutla di Sulawesi Tengah.
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-900 pt-6 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} Sulteng Udara Bersih • Siaga Asap & Kualitas Udara Realtime
        </div>
      </div>
    </footer>
  );
};
