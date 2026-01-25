'use client';

export default function FichasTecnicasPage() {
    const urlFichasTecnicas = "https://www.liqui-moly.com/es/fichas-tecnicas.html";
  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold mb-4">Fichas Técnicas Liqui Moly</h1>
       <div className="flex-grow">
         <iframe
          src={urlFichasTecnicas}
          className="w-full h-full border-0 rounded-md"
          title="Fichas Técnicas Liqui Moly"
          style={{ height: 'calc(100vh - 10rem)' }}
        ></iframe>
       </div>
    </div>
  );
}
