import React from 'react';
import { AlertCircle, Ban, Droplet, Home, LifeBuoy, ShieldCheck, Stethoscope } from 'lucide-react';

export const HazeHealthAlert: React.FC = () => {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md sm:p-6">
      <div className="flex items-center gap-2 mb-2">
        <LifeBuoy className="h-5 w-5 text-emerald-400" />
        <h3 className="text-base font-bold text-white sm:text-lg">
          Panduan Tanggap Darurat Kabut Asap & Perlindungan Diri
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-5">
        Protokol standar Kemenkes RI dan WHO menghadapi paparan polusi asap karhutla di Sulawesi Tengah
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2.5 text-sky-400 mb-2">
            <ShieldCheck className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-200">Gunakan Masker yang Tepat</h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Masker kain biasa <strong>tidak mampu</strong> menyaring partikel mikroskopis PM2.5. Gunakan respirator minimal berstandar <strong>N95, KN95, atau KF94</strong> dengan posisi rapat menempel hidung dan pipi saat berada di luar.
          </p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2.5 text-amber-400 mb-2">
            <Home className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-200">Cegah Asap Masuk Rumah</h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Tutup rapat jendela dan pintu terutama di pagi dan sore hari saat asap menumpuk di permukaan tanah. Pasang <strong>kain atau handuk basah</strong> di celah bawah pintu/jendela untuk menyerap partikel debu halus.
          </p>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2.5 text-cyan-400 mb-2">
            <Droplet className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-200">Hidrasi & Cuci Muka Berkala</h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Minum air putih minimal <strong>2,5 liter sehari</strong> untuk menjaga saluran pernapasan tetap lembap dan membantu tubuh mengeluarkan toksin. Bilas mata dan cuci hidung/mulut setelah pulang dari luar.
          </p>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2.5 text-rose-400 mb-2">
            <Ban className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-200">Stop Pembakaran Terbuka</h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            <strong>Dilarang keras membakar sampah pekarangan</strong>, jerami padi, sisa kebun, atau daun kering. Partikel dari sampah plastik dan dedaunan menambah beban racun udara lingkungan sekitar.
          </p>
        </div>

        {/* Card 5 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2.5 text-indigo-400 mb-2">
            <AlertCircle className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-200">Lindungi Anak & Lansia</h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Paru-paru bayi, balita, ibu hamil, serta lansia memiliki kapasitas filter yang rentan. Jangan biarkan anak bermain di luar saat udara tampak berkabut putih-kecokelatan atau tercium bau sangit.
          </p>
        </div>

        {/* Card 6 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2.5 text-emerald-400 mb-2">
            <Stethoscope className="h-5 w-5" />
            <h4 className="text-sm font-bold text-slate-200">Waspada Gejala Akut ISPA</h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Segera kunjungi Puskesmas atau RSUD terdekat bila mengalami: <strong>sesak napas berat, nyeri dada menusuk, batuk berlendir pekat, pusing mual berulang</strong>, atau iritasi mata perih berkepanjangan.
          </p>
        </div>
      </div>
    </div>
  );
};
