import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface CompassProps {
  onDirectionClick: (direction: 'north' | 'south' | 'east' | 'west') => void;
  selectedDirection: 'north' | 'south' | 'east' | 'west';
  size?: number;
}

const directions = [
  { id: 'north', label: 'N', angle: 270, tooltip: 'North Facade' },
  { id: 'east', label: 'E', angle: 0, tooltip: 'East Facade' },
  { id: 'south', label: 'S', angle: 90, tooltip: 'South Facade' },
  { id: 'west', label: 'W', angle: 180, tooltip: 'West Facade' },
];

export function Compass({ onDirectionClick, selectedDirection, size = 600 }: CompassProps) {
  return (
    <TooltipProvider>
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <div className="w-full h-full relative">
          {/* Outer compass ring */}
          <div className="absolute inset-0 rounded-full border-8 border-gray-300 bg-white shadow-2xl" />
          
          {/* Inner compass ring */}
          <div className="absolute inset-8 rounded-full border-4 border-gray-200 bg-white/50" />

          {/* Direction markers */}
          {directions.map(({ id, label, angle, tooltip }) => {
            const isSelected = id === selectedDirection;
            const rotation = `rotate(${angle}deg)`;
            const transform = `translate(-50%, -50%) ${rotation}`;
            
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onDirectionClick(id as 'north' | 'south' | 'east' | 'west')}
                    className={`absolute left-1/2 top-1/2 w-16 h-16 -ml-8 -mt-8 flex items-center justify-center rounded-full transition-all duration-200
                      ${isSelected 
                        ? 'bg-blue-500 text-white shadow-lg scale-110' 
                        : 'bg-white text-gray-700 hover:bg-blue-100 hover:scale-105'
                      }`}
                    style={{ 
                      transform: `rotate(${angle}deg) translate(calc(${size/2 - 32}px)) rotate(-${angle}deg)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <span className="text-xl font-bold">{label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
} 