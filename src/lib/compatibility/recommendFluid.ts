import { findVehicleRule } from '../vehicles/findVehicleRule';
import { checkCompatibility } from './checkCompatibility';

export type RecommendFluidInput = {
    brand: string;
    model: string;
    year: number;
};

export type RecommendFluidResult = {
    success: boolean;
    vehicle?: any;
    compatibility?: any;
    message: string;
};

export function recommendFluid(input: RecommendFluidInput): RecommendFluidResult {
    // 1. Buscar vehículo usando la regla de negocio
    const vehicle = findVehicleRule({
        brand: input.brand,
        model: input.model,
        year: input.year,
    });

    // 2. Si no se encuentra el vehículo, retornamos error temprano
    if (!vehicle) {
        return {
            success: false,
            message: 'No se encontró configuración compatible para el vehículo.',
        };
    }

    // 3. Tomar la primera especificación OEM disponible
    const oem = vehicle.oemSpecs[0];

    // 4. Validar compatibilidad del fluido
    const compatibility = checkCompatibility({
        oem,
        transmissionType: vehicle.transmissionType,
    });

    // 5. Respuesta final estructurada
    return {
        success: compatibility.compatible,
        vehicle,
        compatibility,
        message: compatibility.compatible
            ? 'Compatibilidad validada correctamente.'
            : 'Se encontraron incompatibilidades.',
    };
}