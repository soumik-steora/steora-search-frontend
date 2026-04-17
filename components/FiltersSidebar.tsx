'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function FiltersSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleToggle = (key: string) => {
    const params = new URLSearchParams(searchParams);
    const currentValue = params.get(key);
    
    if (currentValue === 'true') {
      params.delete(key);
    } else {
      params.set(key, 'true');
    }
    
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const BooleanFilter = ({ id, label }: { id: string, label: string }) => (
    <label className="flex items-center space-x-3 cursor-pointer mb-3">
      <input
        type="checkbox"
        checked={searchParams.get(id) === 'true'}
        onChange={() => handleToggle(id)}
        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-gray-700 font-medium">{label}</span>
    </label>
  );

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
      
      <div className="space-y-1 border-b border-gray-200 pb-6 mb-6">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Publication Bans</h4>
        <BooleanFilter id="banYcja" label="YCJA Ban" />
        <BooleanFilter id="banSealedRecording" label="Sealed Recording" />
        <BooleanFilter id="banPublication" label="Publication Ban" />
        <BooleanFilter id="banNoPublication" label="No Publication" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Verification</h4>
        <label className="flex items-center space-x-3 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={searchParams.get('verified') === '1'}
            onChange={() => {
              const params = new URLSearchParams(searchParams);
              params.get('verified') === '1' ? params.delete('verified') : params.set('verified', '1');
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            }}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-700 font-medium">Verified Only</span>
        </label>
      </div>
    </div>
  );
}