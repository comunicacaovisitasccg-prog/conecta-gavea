import sharp from 'sharp'
import fs from 'fs'

const ORIGEM = 'public/images/mascote-capivara-crop.png'
const COR_FUNDO = '#f6f9f0'

const TAMANHOS = [
  { nome: 'icon-192.png', tamanho: 192 },
  { nome: 'icon-512.png', tamanho: 512 },
  { nome: 'apple-touch-icon.png', tamanho: 180 },
  { nome: 'icon-maskable-512.png', tamanho: 512, maskable: true },
]

async function gerar() {
  if (!fs.existsSync(ORIGEM)) {
    console.error(`Arquivo não encontrado: ${ORIGEM}`)
    process.exit(1)
  }

  for (const { nome, tamanho, maskable } of TAMANHOS) {
    const destino = `public/icons/${nome}`

    if (maskable) {
      const miolo = Math.round(tamanho * 0.8)
      const mascoteRedimensionada = await sharp(ORIGEM)
        .resize(miolo, miolo, { fit: 'cover', position: 'top' })
        .toBuffer()

      await sharp({
        create: { width: tamanho, height: tamanho, channels: 4, background: COR_FUNDO },
      })
        .composite([
          {
            input: mascoteRedimensionada,
            left: Math.round((tamanho - miolo) / 2),
            top: Math.round((tamanho - miolo) / 2),
          },
        ])
        .png()
        .toFile(destino)
    } else {
      await sharp(ORIGEM)
        .resize(tamanho, tamanho, { fit: 'cover', position: 'top' })
        .flatten({ background: COR_FUNDO })
        .png()
        .toFile(destino)
    }

    console.log(`Gerado: ${destino}`)
  }

  console.log('Pronto! Ícones gerados em public/icons/')
}

gerar()
