'use client';

export default function AceitesPage() {
  const urlGuiaAceites = "https://www.liqui-moly.com/es/servicios/guia-de-aceites.html?srsltid=AfmBOoo9qh7XzK_MyDD0oNdxOO77zaB4k_cNZGzNDeXA1zO6-ypI-TLU#oww:/api/v2/oww/103/MEX/SPA/1/";
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Guía de Aceites</h1>
       <div className="flex-grow">
         <iframe
          src={urlGuiaAceites}
          className="w-full h-full border-0 rounded-md"
          title="Guía de Aceites Liqui Moly"
          style={{ height: 'calc(100vh - 10rem)' }}
        ></iframe>
       </div>
    </div>
  );
}
