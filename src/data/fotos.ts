/**
 * Fotografías de muestra de Unsplash (licencia Unsplash: uso libre).
 * Reemplazar por fotografías propias del fotógrafo antes de publicar.
 */
export interface Foto {
  /** Identificador de Unsplash (parte posterior a "photo-"). */
  id: string
  alt: string
  /** Proporción de recorte, ancho / alto. */
  proporcion: [number, number]
}

const ANCHOS = [480, 768, 1080, 1440, 1920]

export function urlFoto(foto: Foto, ancho: number): string {
  const [w, h] = foto.proporcion
  return `https://images.unsplash.com/photo-${foto.id}?auto=format&fit=crop&q=75&w=${ancho}&ar=${w}:${h}`
}

export function srcSetFoto(foto: Foto, anchoMaximo = 1920): string {
  return ANCHOS.filter((a) => a <= anchoMaximo)
    .map((a) => `${urlFoto(foto, a)} ${a}w`)
    .join(', ')
}

export const FOTOS = {
  hero: {
    id: '1460364157752-926555421a7e',
    alt: 'Pareja de recién casados sentada sobre el pasto, abrazada frente a un lago al atardecer',
    proporcion: [16, 9],
  },
  presentacion: {
    id: '1542038784456-1ea8e935640e',
    alt: 'Fotógrafo sosteniendo una cámara en un bosque otoñal',
    proporcion: [4, 5],
  },
  cta: {
    id: '1532712938310-34cb3982ef74',
    alt: 'Pareja de novios caminando de la mano por un paisaje abierto',
    proporcion: [16, 7],
  },
  contacto: {
    id: '1520390138845-fd2d229dd553',
    alt: 'Manos sosteniendo una cámara réflex',
    proporcion: [4, 3],
  },
  servicioBodas: {
    id: '1591604466107-ec97de577aff',
    alt: 'Novios abrazados junto a un lago rodeado de árboles otoñales',
    proporcion: [4, 5],
  },
  servicioRetratos: {
    id: '1524504388940-b1c1722653e1',
    alt: 'Retrato de estudio de una mujer joven con fondo oscuro',
    proporcion: [4, 5],
  },
  servicioFamilia: {
    id: '1531983412531-1f49a365ffed',
    alt: 'Madre abrazando a su hijo en la orilla del mar al atardecer',
    proporcion: [4, 5],
  },
  servicioEventos: {
    id: '1527529482837-4698179dc6ce',
    alt: 'Invitados brindando en una cena con luces cálidas',
    proporcion: [4, 5],
  },
} satisfies Record<string, Foto>

export type CategoriaGaleria = 'bodas' | 'retratos' | 'familias' | 'eventos'

export const CATEGORIAS_GALERIA: { id: CategoriaGaleria; nombre: string }[] = [
  { id: 'bodas', nombre: 'Bodas' },
  { id: 'retratos', nombre: 'Retratos' },
  { id: 'familias', nombre: 'Familias' },
  { id: 'eventos', nombre: 'Eventos' },
]

export const GALERIA: (Foto & { categoria: CategoriaGaleria })[] = [
  { categoria: 'bodas', id: '1519741497674-611481863552', alt: 'Novia sosteniendo el ramo junto al novio', proporcion: [3, 2] },
  { categoria: 'retratos', id: '1531746020798-e6953c6e8e04', alt: 'Retrato de una mujer sobre fondo rosado', proporcion: [4, 5] },
  { categoria: 'bodas', id: '1583939003579-730e3918a45a', alt: 'Novios besándose entre una lluvia de pétalos y sus invitados', proporcion: [2, 3] },
  { categoria: 'familias', id: '1609220136736-443140cffec6', alt: 'Padre sonriente con sus dos hijos en brazos', proporcion: [3, 2] },
  { categoria: 'eventos', id: '1519225421980-715cb0215aed', alt: 'Mesa larga decorada con flores para una celebración', proporcion: [4, 5] },
  { categoria: 'bodas', id: '1537633552985-df8429e8048b', alt: 'Novios en la playa con el velo al viento', proporcion: [2, 3] },
  { categoria: 'retratos', id: '1500648767791-00dcc994a43e', alt: 'Retrato de un hombre sonriendo con suéter gris', proporcion: [4, 5] },
  { categoria: 'bodas', id: '1465495976277-4387d4b0b4c6', alt: 'Manos de los novios con anillos sobre el ramo', proporcion: [3, 2] },
  { categoria: 'familias', id: '1544126592-807ade215a0b', alt: 'Bebé durmiendo envuelto en una manta blanca', proporcion: [3, 2] },
  { categoria: 'eventos', id: '1544531586-fde5298cdd40', alt: 'Orador frente a un auditorio en un evento corporativo', proporcion: [3, 2] },
  { categoria: 'bodas', id: '1546032996-6dfacbacbf3f', alt: 'Pareja abrazada envuelta en el velo en un campo', proporcion: [4, 5] },
  { categoria: 'retratos', id: '1544005313-94ddf0286df2', alt: 'Retrato de una mujer al atardecer', proporcion: [4, 5] },
  { categoria: 'bodas', id: '1606216794074-735e91aa2c92', alt: 'Pareja de novios caminando bajo las palmeras', proporcion: [2, 3] },
  { categoria: 'bodas', id: '1460978812857-470ed1c77af0', alt: 'Novios besándose junto al mar, en blanco y negro', proporcion: [3, 2] },
  { categoria: 'eventos', id: '1528605248644-14dd04022da1', alt: 'Grupo de amigos compartiendo una comida', proporcion: [3, 2] },
]
