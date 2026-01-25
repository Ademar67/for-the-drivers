
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic'; // Ensure it's re-evaluated on each request

interface FichaTecnica {
  id: string;
  name: string;
  category: 'Aceite' | 'Mantenimiento' | 'Tratamientos' | 'Desconocido';
  url: string;
}

// Helper to format names from file names
function formatName(fileName: string): string {
  return fileName
    .replace(/\.pdf$/i, '') // Remove .pdf extension case-insensitively
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper to determine category from directory name
function getCategory(dirName: string): FichaTecnica['category'] {
    if (dirName.includes('Aceite')) return 'Aceite';
    if (dirName.includes('Mantenimiento')) return 'Mantenimiento';
    if (dirName.includes('Tratamientos')) return 'Tratamientos';
    return 'Desconocido';
}

export async function GET() {
  try {
    const fichasDir = path.join(process.cwd(), 'public', 'fichas');
    const categoriesDirs = await fs.readdir(fichasDir, { withFileTypes: true });

    let allFichas: FichaTecnica[] = [];
    let idCounter = 1;

    for (const categoryDir of categoriesDirs) {
      if (categoryDir.isDirectory()) {
        const categoryPath = path.join(fichasDir, categoryDir.name);
        const files = await fs.readdir(categoryPath);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
        const category = getCategory(categoryDir.name);

        const fichasInCategory = pdfFiles.map(file => {
          return {
            id: String(idCounter++),
            name: formatName(file),
            category: category,
            url: `/fichas/${categoryDir.name}/${file}`
          };
        });

        allFichas = allFichas.concat(fichasInCategory);
      }
    }

    return NextResponse.json(allFichas);
  } catch (error) {
    console.error('Failed to list technical sheets:', error);
    return NextResponse.json({ error: 'Failed to list technical sheets from public/fichas directory.' }, { status: 500 });
  }
}
