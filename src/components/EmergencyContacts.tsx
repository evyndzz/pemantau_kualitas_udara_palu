import React from 'react';
import { PhoneCall } from 'lucide-react';

export const EmergencyContacts: React.FC = () => {
  const contacts = [
    {
      name: 'Call Center Darurat Bebas Pulsa',
      agency: 'Pemerintah Provinsi & Pemkot',
      number: '112',
      desc: 'Layanan darurat terpadu bencana, medis, dan kebakaran wilayah Sulawesi Tengah (24 Jam).',
      badge: 'Bebas Pulsa',
      isPrimary: true,
    },
    {
      name: 'BPBD Sulawesi Tengah',
      agency: 'Badan Penanggulangan Bencana Daerah',
      number: '(0451) 482613',
      desc: 'Pusat Pengendalian Operasi (Pusdalops) penanggulangan karhutla dan distribusi logistik masker.',
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
      name: 'Manggala Agni Sulteng',
      agency: 'Brigade Pengendalian Karhutla KLHK',
      number: '1500 035',
      desc: 'Brigade khusus pemadaman kebakaran hutan & lahan gambut, pelaporan titik panas (hotspot).',
      badge: 'Karhutla KLHK',
      isPrimary: false,
    },
    {
      name: 'Layanan Ambulans & Darurat Medis',
      agency: 'Kemenkes / PSC 119',
      number: '119',
      desc: 'Pertolongan darurat penderita sesak napas akut, asma kambuh, dan pasien kelompok rentan.',
      badge: 'Medis ISPA',
      isPrimary: true,
    },
    {
      name: 'RSUD Undata Palu',
      agency: 'Rumah Sakit Rujukan Provinsi',
      number: '(0451) 421270',
      desc: 'Instalasi Gawat Darurat (IGD) dan fasilitas oksigen medis 24 jam.',
      badge: 'Rumah Sakit',
      isPrimary: false,
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md sm:p-6">
      <div className="flex items-center gap-2 mb-2">
        <PhoneCall className="h-5 w-5 text-rose-400" />
        <h3 className="text-base font-bold text-white sm:text-lg">
          Kontak Darurat Karhutla & Bantuan Medis Sulteng
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-5">
        Nomor penting untuk pelaporan kebakaran lahan, bantuan pemadaman, dan penanganan medis sesak napas
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {contacts.map((item, idx) => (
          <div
            key={idx}
            className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
              item.isPrimary
                ? 'border-rose-500/40 bg-rose-500/5 hover:border-rose-400 hover:bg-rose-500/10'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  {item.badge}
                </span>
                <span className="text-[11px] text-slate-400">{item.agency}</span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1">{item.name}</h4>
              <p className="text-xs leading-relaxed text-slate-400 mb-3">{item.desc}</p>
            </div>

            <a
              href={`tel:${item.number.replace(/[^0-9]/g, '')}`}
              className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-extrabold transition-all ${
                item.isPrimary
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 hover:bg-rose-500'
                  : 'bg-slate-800 text-sky-300 hover:bg-slate-700 hover:text-white'
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
