import React from 'react';
import { PhoneCall } from 'lucide-react';

export const EmergencyContacts: React.FC = () => {
  const contacts = [
    {
      name: 'Call Center Darurat Bebas Pulsa',
      agency: 'Pemerintah Provinsi & Pemkot Sulteng',
      number: '112',
      desc: 'Layanan darurat terpadu bencana, medis, dan laporan kebakaran lahan wilayah Sulawesi Tengah (24 Jam).',
      badge: 'Bebas Pulsa',
      isPrimary: true,
    },
    {
      name: 'BPBD Sulawesi Tengah',
      agency: 'Badan Penanggulangan Bencana Daerah',
      number: '(0451) 482613',
      desc: 'Pusat Pengendalian Operasi (Pusdalops) penanggulangan bencana karhutla dan posko siaga darurat asap.',
      badge: 'Posko Siaga',
      isPrimary: false,
    },
    {
      name: 'Damkar Kota Palu & Rescue',
      agency: 'Dinas Pemadam Kebakaran',
      number: '(0451) 423113',
      desc: 'Penanganan cepat kebakaran hutan, lahan kering, permukiman, dan semak belukar.',
      badge: 'Damkar',
      isPrimary: false,
    },
    {
      name: 'Manggala Agni KLHK',
      agency: 'Brigade Pengendalian Karhutla',
      number: '1500 035',
      desc: 'Brigade khusus pemadaman kebakaran hutan & lahan serta pelaporan titik panas (hotspot) SIPONGI+.',
      badge: 'Karhutla KLHK',
      isPrimary: false,
    },
    {
      name: 'Ambulans & Darurat Medis',
      agency: 'Kemenkes / PSC 119',
      number: '119',
      desc: 'Pertolongan darurat warga yang mengalami sesak napas akut, serangan asma, dan ISPA berat akibat asap.',
      badge: 'Medis ISPA',
      isPrimary: true,
    },
    {
      name: 'RSUD Undata Palu',
      agency: 'Rumah Sakit Rujukan Provinsi',
      number: '(0451) 421270',
      desc: 'Instalasi Gawat Darurat (IGD) dan layanan oksigenasi medis 24 jam di Sulawesi Tengah.',
      badge: 'Rumah Sakit',
      isPrimary: false,
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0D1322] p-5 sm:p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] theme-transition">
      <div className="flex items-center gap-2 mb-1.5">
        <PhoneCall className="h-5 w-5 text-rose-500" />
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
          Kontak Darurat Karhutla & Bantuan Medis Sulawesi Tengah
        </h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        Hubungi segera apabila menemukan titik api kebakaran lahan baru atau membutuhkan pertolongan medis darurat
      </p>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {contacts.map((item, idx) => (
          <div
            key={idx}
            className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
              item.isPrimary
                ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 hover:border-rose-300'
                : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-slate-200 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    item.isPrimary
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {item.badge}
                </span>
                <span className="text-[10px] font-medium text-slate-400">{item.agency}</span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{item.name}</h4>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mb-3.5">
                {item.desc}
              </p>
            </div>

            <a
              href={`tel:${item.number.replace(/[^0-9]/g, '')}`}
              className={`flex items-center justify-center gap-2 rounded-full py-2 px-3 text-xs font-bold transition-all ${
                item.isPrimary
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700'
                  : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/15 hover:bg-indigo-700'
              }`}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Hubungi {item.number}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
