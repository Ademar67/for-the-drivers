import ClienteDetailClient from './ClienteDetailClient';

export default function ClienteDetailPage({ params }: { params: { id: string } }) {
  return <ClienteDetailClient id={params.id} />;
}