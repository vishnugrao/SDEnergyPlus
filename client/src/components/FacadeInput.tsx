import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { BuildingFormData } from '../types/building';
import { motion } from 'framer-motion';

interface FacadeInputProps {
  facade: 'north' | 'south' | 'east' | 'west';
  register: UseFormRegister<BuildingFormData>;
  errors: FieldErrors<BuildingFormData>;
  isSelected?: boolean;
  values?: {
    height: number;
    width: number;
    wwr: number;
    shgc: number;
  };
}

export function FacadeInput({ facade, register, errors, isSelected, values }: FacadeInputProps) {
  const facadePath = `facades.${facade}` as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`space-y-4 p-6 rounded-lg transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-50 border-2 border-blue-200 shadow-lg' 
          : 'bg-white border border-gray-200'
      }`}
    >
      <h3 className="font-medium capitalize text-lg flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-gray-400'}`} />
        {facade} Facade
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${facadePath}.height`}>Height (m)</Label>
          <Input
            id={`${facadePath}.height`}
            type="number"
            step="0.1"
            defaultValue={values?.height}
            {...register(`${facadePath}.height`, { valueAsNumber: true })}
            className={`${errors.facades?.[facade]?.height ? 'border-red-500' : ''} 
              ${isSelected ? 'border-blue-300 focus:border-blue-500' : ''}`}
          />
          {errors.facades?.[facade]?.height && (
            <p className="text-sm text-red-500 mt-1">{errors.facades[facade]?.height?.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor={`${facadePath}.width`}>Width (m)</Label>
          <Input
            id={`${facadePath}.width`}
            type="number"
            step="0.1"
            defaultValue={values?.width}
            {...register(`${facadePath}.width`, { valueAsNumber: true })}
            className={`${errors.facades?.[facade]?.width ? 'border-red-500' : ''} 
              ${isSelected ? 'border-blue-300 focus:border-blue-500' : ''}`}
          />
          {errors.facades?.[facade]?.width && (
            <p className="text-sm text-red-500 mt-1">{errors.facades[facade]?.width?.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor={`${facadePath}.wwr`}>Window-to-Wall Ratio</Label>
          <Input
            id={`${facadePath}.wwr`}
            type="number"
            step="0.01"
            min="0"
            max="1"
            defaultValue={values?.wwr}
            {...register(`${facadePath}.wwr`, { valueAsNumber: true })}
            className={`${errors.facades?.[facade]?.wwr ? 'border-red-500' : ''} 
              ${isSelected ? 'border-blue-300 focus:border-blue-500' : ''}`}
          />
          {errors.facades?.[facade]?.wwr && (
            <p className="text-sm text-red-500 mt-1">{errors.facades[facade]?.wwr?.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor={`${facadePath}.shgc`}>Solar Heat Gain Coefficient</Label>
          <Input
            id={`${facadePath}.shgc`}
            type="number"
            step="0.01"
            min="0"
            max="1"
            defaultValue={values?.shgc}
            {...register(`${facadePath}.shgc`, { valueAsNumber: true })}
            className={`${errors.facades?.[facade]?.shgc ? 'border-red-500' : ''} 
              ${isSelected ? 'border-blue-300 focus:border-blue-500' : ''}`}
          />
          {errors.facades?.[facade]?.shgc && (
            <p className="text-sm text-red-500 mt-1">{errors.facades[facade]?.shgc?.message}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
} 