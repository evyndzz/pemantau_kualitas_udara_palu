import React from 'react';
import { Activity, AlertCircle, Droplets, Eye, Flame, Layers, Wind } from 'lucide-react';
import type { CurrentPollutants } from '../types';

interface PollutantGridProps {
  pollutants: CurrentPollutants;
}

interface PollutantItem {
  id: string;
  name: string;
  chemical: string;
  value: number;
  unit: string;
  threshold: number; // reference safe/moderate value
  severity: 'good' | 'moderate' | 'unhealthy' | 'hazardous';
  relevanceToHaze: string;
  icon: React.ReactNode;
}

export const PollutantGrid: React.FC<PollutantGridProps> = ({ pollutants }) => {
  const items: PollutantItem[] = [
    {
      id: 'pm25',
      name: 'Partikel Halus',
      chemical: 'PM2.5',
      value: pollutants.pm2_5,
      unit: 'µg/m³',
      threshold: 15.5,
      severity:
        pollutants.pm2_5 <= 15.5
          ? 'good'
          : pollutants.pm2_5 <= 55.4
          ? 'moderate'
          : pollutants.pm2_5 <= 150
          ? 'unhealthy'
          : 'hazardous',
      relevanceToHaze: 'Indikator nomor 1 kabut asap karhutla. Mampu menembus alveolus paru-paru dan pembuluh darah.',
      icon: <Flame className="h-4 w-4 text-amber-400" />,
    },
    {
      id: 'pm10',
      name: 'Partikel Kasar / Abu',
      chemical: 'PM10',
      value: pollutants.pm10,
      unit: 'µg/m³',
      threshold: 50,
      severity:
        pollutants.pm10 <= 50
          ? 'good'
          : pollutants.pm10 <= 150
          ? 'moderate'
          : pollutants.pm10 <= 350
          ? 'unhealthy'
          : 'hazardous',
      relevanceToHaze: 'Abu dan jelaga sisa pembakaran hutan/lahan. Menyebabkan iritasi mata, batuk, dan mata merah.',
      icon: <Layers className="h-4 w-4 text-sky-400" />,
    },
    {
      id: 'co',
      name: 'Karbon Monoksida',
      chemical: 'CO',
      value: pollutants.carbon_monoxide,
      unit: 'µg/m³',
      threshold: 4000,
      severity:
        pollutants.carbon_monoxide <= 4000
          ? 'good'
          : pollutants.carbon_monoxide <= 8000
          ? 'moderate'
          : 'unhealthy',
      relevanceToHaze: 'Gas beracun tidak berbau dari pembakaran biomassa tak sempurna pada lahan gambut dan semak.',
      icon: <Activity className="h-4 w-4 text-rose-400" />,
    },
    {
      id: 'dust',
      name: 'Debu & Partikel Udara',
      chemical: 'Dust',
      value: pollutants.dust ?? 0,
      unit: 'µg/m³',
      threshold: 25,
      severity: (pollutants.dust ?? 0) <= 25 ? 'good' : (pollutants.dust ?? 0) <= 60 ? 'moderate' : 'unhealthy',
      relevanceToHaze: 'Konsentrasi debu dan aerosol tersuspensi yang memperkeruh jarak pandang di Sulteng.',
      icon: <Wind className="h-4 w-4 text-teal-400" />,
    },
    {
      id: 'aod',
      name: 'Ketebalan Asap (AOD)',
      chemical: 'Aerosol Optical Depth',
      value: pollutants.aerosol_optical_depth ?? 0,
      unit: 'index',
      threshold: 0.3,
      severity:
        (pollutants.aerosol_optical_depth ?? 0) <= 0.2
          ? 'good'
          : (pollutants.aerosol_optical_depth ?? 0) <= 0.5
          ? 'moderate'
          : 'unhealthy',
      relevanceToHaze: 'Mengukur seberapa pekat kolom asap menghalangi cahaya matahari. Nilai >0.5 menandakan kabut tebal.',
      icon: <Eye className="h-4 w-4 text-purple-400" />,
    },
    {
      id: 'o3',
      name: 'Ozon Permukaan',
      chemical: 'O₃',
      value: pollutants.ozone,
      unit: 'µg/m³',
      threshold: 100,
      severity: pollutants.ozone <= 100 ? 'good' : pollutants.ozone <= 160 ? 'moderate' : 'unhealthy',
      relevanceToHaze: 'Terbentuk saat sinar matahari bereaksi dengan asap pembakaran, memperparah rasa perih di dada.',
      icon: <Droplets className="h-4 w-4 text-emerald-400" />,
    },
    {
      id: 'no2',
      name: 'Nitrogen Dioksida',
      chemical: 'NO₂',
      value: pollutants.nitrogen_dioxide,
      unit: 'µg/m³',
      threshold: 40,
      severity: pollutants.nitrogen_dioxide <= 40 ? 'good' : pollutants.nitrogen_dioxide <= 90 ? 'moderate' : 'unhealthy',
      relevanceToHaze: 'Gas dari pembakaran bersuhu tinggi dan emisi kendaraan, memperburuk gejala radang pernapasan.',
      icon: <AlertCircle className="h-4 w-4 text-cyan-400" />,
    },
    {
      id: 'so2',
      name: 'Sulfur Dioksida',
      chemical: 'SO₂',
      value: pollutants.sulphur_dioxide,
      unit: 'µg/m³',
      threshold: 20,
      severity: pollutants.sulphur_dioxide <= 20 ? 'good' : pollutants.sulphur_dioxide <= 80 ? 'moderate' : 'unhealthy',
      relevanceToHaze: 'Gas iritan yang menyebabkan batuk kering dan memperburuk asma.',
      icon: <Activity className="h-4 w-4 text-yellow-400" />,
    },
  ];

  const getBadge = (severity: PollutantItem['severity']) => {
    switch (severity) {
      case 'good':
        return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">Baik</span>;
      case 'moderate':
        return <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">Sedang</span>;
      case 'unhealthy':
        return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">Waspada</span>;
      case 'hazardous':
        return <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">Bahaya</span>;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white sm:text-lg">
            Rincian Polutan & Gas Pembakaran
          </h3>
          <p className="text-xs text-slate-400">
            Parameter kritis pemantauan kabut asap kebakaran hutan dan lahan (Karhutla)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-800/50"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-slate-800 p-1.5">{item.icon}</div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{item.chemical}</span>
                    <span className="text-[11px] text-slate-400 block -mt-0.5">{item.name}</span>
                  </div>
                </div>
                {getBadge(item.severity)}
              </div>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white">{item.value}</span>
                <span className="text-xs text-slate-400">{item.unit}</span>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-400 border-t border-slate-800/80 pt-2.5">
              {item.relevanceToHaze}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
