export default function DashboardPage() {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Panel de Control
        </h2>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Clientes"
            description="Gestiona la información de tus clientes."
          />
          <DashboardCard
            title="Pedidos"
            description="Administra los pedidos de tus clientes."
          />
          <DashboardCard
            title="Productos"
            description="Consulta y gestiona tu catálogo."
          />
          <DashboardCard
            title="Facturas"
            description="Controla facturación y cobros."
          />
          <DashboardCard
            title="Mapa de Clientes"
            description="Visualiza clientes por ubicación."
          />
          <DashboardCard
            title="Guías Liqui Moly"
            description="Aceites y aditivos recomendados."
          />
          <DashboardCard
            title="Soporte IA"
             description="Chatea con un experto en productos Liqui Moly."
          />
          <DashboardCard
            title="Calculadora de Productos"
             description="Obtén recomendaciones de productos por IA."
          />
        </div>
      </div>
    );
  }
  function DashboardCard({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {description}
        </p>
  
        <button className="text-sm font-medium text-[#004E9A] hover:underline">
          Ir a la sección →
        </button>
      </div>
    );
  }