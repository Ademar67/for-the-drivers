'use client';

export default function TratamientosPage() {
    const urlGuiaTratamientos = "https://www.liqui-moly.com/es/productos/guia-de-aditivos.html?srsltid=AfmBOooHeEzp21kS9IegDvO0IBVyGlsrQwFQfLEkCcY6lDnpDxJVeAUS";
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Guía de Tratamientos</h1>
       <div className="flex-grow">
         <iframe
          src={urlGuiaTratamientos}
          className="w-full h-full border-0 rounded-md"
          title="Guía de Tratamientos Liqui Moly"
          style={{ height: 'calc(100vh - 10rem)' }}
        ></iframe>
       </div>
    </div>
  );
}
