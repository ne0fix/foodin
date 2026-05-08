'use client';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  labelPosition?: 'left' | 'right';
}

export default function Toggle({
  label, 
  checked, 
  onChange, 
  disabled = false,
  labelPosition = 'right'
}: ToggleProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const switchButton = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-green-600' : 'bg-gray-200'}`}
    >
      <span className="sr-only">{label}</span>
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="flex items-center">
      {labelPosition === 'left' && <span className="mr-3 text-sm font-medium text-gray-700">{label}</span>}
      {switchButton}
      {labelPosition === 'right' && <span className="ml-3 text-sm font-medium text-gray-700">{label}</span>}
    </div>
  );
}
