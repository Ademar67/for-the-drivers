export async function geocodificarDireccion(direccion: string) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
    if (!apiKey) {
      throw new Error('Falta configurar NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    }
  
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      direccion
    )}&key=${apiKey}`;
  
    const res = await fetch(url);
    const data = await res.json();
  
    if (!data.results || data.results.length === 0) {
      return null;
    }
  
    const location = data.results[0].geometry.location;
  
    return {
      lat: location.lat,
      lng: location.lng,
    };
  }